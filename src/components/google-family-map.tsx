import { useEffect, useRef, useState } from "react";
import type { Person } from "@/lib/people";

type Marker = { map: unknown | null; position: { lat: number; lng: number } };
type Maps = {
  Map: new (element: HTMLElement, options: object) => unknown;
  importLibrary: (
    name: string,
  ) => Promise<{ AdvancedMarkerElement: new (options: object) => Marker }>;
};
let loading: Promise<Maps> | null = null;
function loadMaps(key: string): Promise<Maps> {
  const host = window as Window & { google?: { maps: Maps }; __kyrecMapsReady?: () => void };
  if (host.google?.maps) return Promise.resolve(host.google.maps);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const fail = () => {
      window.clearTimeout(timer);
      delete host.__kyrecMapsReady;
      script.remove();
      loading = null;
      reject(new Error("Google Maps did not load. Check the app's shared Maps configuration."));
    };
    const timer = window.setTimeout(fail, 15000);
    host.__kyrecMapsReady = () => {
      window.clearTimeout(timer);
      if (host.google?.maps) resolve(host.google.maps);
      else fail();
      delete host.__kyrecMapsReady;
    };
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__kyrecMapsReady`;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}

export function GoogleFamilyMap({
  apiKey,
  mapId,
  members,
  positions,
}: {
  apiKey: string;
  mapId: string;
  members: Person[];
  positions: Record<string, [number, number]>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<unknown>(null);
  const markerClass = useRef<(new (options: object) => Marker) | null>(null);
  const markers = useRef<Record<string, Marker>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setError(null);
    void loadMaps(apiKey)
      .then(async (maps) => {
        const library = await maps.importLibrary("marker");
        if (!active || !root.current) return;
        map.current = new maps.Map(root.current, {
          center: { lat: -31.95, lng: 115.84 },
          zoom: 12,
          mapId,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });
        markerClass.current = library.AdvancedMarkerElement;
        setReady(true);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Maps is unavailable.");
      });
    return () => {
      active = false;
      Object.values(markers.current).forEach((pin) => {
        pin.map = null;
      });
      markers.current = {};
      markerClass.current = null;
      map.current = null;
      setReady(false);
    };
  }, [apiKey, mapId]);
  useEffect(() => {
    const Constructor = markerClass.current;
    if (!ready || !Constructor || !map.current) return;
    for (const [id, pin] of Object.entries(markers.current)) {
      if (!positions[id] || !members.some((member) => member.id === id)) {
        pin.map = null;
        delete markers.current[id];
      }
    }
    for (const member of members) {
      const position = positions[member.id];
      if (!position) continue;
      const point = { lat: position[0], lng: position[1] };
      if (markers.current[member.id]) {
        markers.current[member.id]!.position = point;
        continue;
      }
      const node = document.createElement("div");
      node.className = "member-pin";
      const initial = document.createElement("div");
      initial.className = "pin-initial";
      initial.textContent = member.initial ?? member.name.slice(0, 1);
      node.appendChild(initial);
      markers.current[member.id] = new Constructor({
        map: map.current,
        position: point,
        content: node,
        title: member.name,
      });
    }
  }, [positions, members, ready]);
  return (
    <div className="relative h-full min-h-dvh w-full">
      <div ref={root} className="h-full min-h-dvh w-full" />
      {error ? (
        <p role="alert" className="absolute top-20 inset-x-4 rounded-2xl bg-panel p-4 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
