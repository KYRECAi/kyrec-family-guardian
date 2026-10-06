import { useEffect, useRef, useState } from "react";
import { MEMBERS, SAM_ROUTE, ZONES, type MemberId } from "@/lib/family";
import { routeLine } from "@/lib/geo";
import { avatarSrc } from "@/lib/avatars";
import { useGuardian } from "@/lib/store";
import { tokenColor } from "@/lib/utils";

type Positions = Partial<Record<MemberId, [number, number]>>;

function loadMaps(key: string) {
  const w = window as Window & { google?: { maps: unknown } };
  if (w.google?.maps) return Promise.resolve(w.google.maps);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-kyrec-maps]");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as Window & { google?: { maps: unknown } }).google?.maps));
      existing.addEventListener("error", () => reject(new Error("Google Maps did not load.")));
      return;
    }
    const script = document.createElement("script");
    script.dataset.kyrecMaps = "1";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.onload = () => resolve((window as Window & { google?: { maps: unknown } }).google?.maps);
    script.onerror = () => reject(new Error("Google Maps did not load. Check the key and that Maps JavaScript API is on."));
    document.head.appendChild(script);
  });
}

function pinNode(member: (typeof MEMBERS)[number], photo: string) {
  const wrap = document.createElement("div");
  wrap.className = "member-pin";
  wrap.style.setProperty("--pin-accent", tokenColor(member.accent));
  if (photo) {
    const img = document.createElement("img");
    img.src = photo;
    img.alt = "";
    img.width = 44;
    img.height = 44;
    wrap.appendChild(img);
  } else {
    const letter = document.createElement("div");
    letter.className = "pin-initial";
    letter.textContent = member.initial ?? member.short.slice(0, 1);
    wrap.appendChild(letter);
  }
  return wrap;
}

export function GoogleFamilyMap({
  apiKey,
  paused,
  sharing,
  selectedId,
  onSelect,
  positions,
}: {
  apiKey: string;
  paused: boolean;
  sharing: Record<MemberId, boolean>;
  selectedId: MemberId | null;
  onSelect: (id: MemberId) => void;
  positions: Positions;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const [error, setError] = useState<string | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const pins = useRef<Partial<Record<MemberId, { el: HTMLDivElement; set: (lat: number, lng: number) => void }>>>({});

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !apiKey) return;
    let cancelled = false;
    const overlays: { setMap: (m: null) => void }[] = [];

    (async () => {
      try {
        const maps = (await loadMaps(apiKey)) as {
          Map: new (el: HTMLElement, opts: object) => {
            fitBounds: (b: object, p?: number) => void;
            panTo: (p: object) => void;
          };
          LatLngBounds: new () => { extend: (p: object) => void };
          Circle: new (opts: object) => { setMap: (m: null) => void };
          Polyline: new (opts: object) => { setMap: (m: null) => void };
          OverlayView: new () => {
            setMap: (m: object | null) => void;
            getPanes: () => { overlayMouseTarget: HTMLElement } | null;
            getProjection: () => { fromLatLngToDivPixel: (p: object) => { x: number; y: number } | null };
            onAdd: () => void;
            draw: () => void;
            onRemove: () => void;
          };
        };
        if (cancelled || !el) return;
        const map = new maps.Map(el, {
          center: { lat: -31.95, lng: 115.84 },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        const bounds = new maps.LatLngBounds();
        for (const zone of ZONES) {
          overlays.push(
            new maps.Circle({
              map,
              center: { lat: zone.lat, lng: zone.lng },
              radius: zone.radiusM,
              strokeColor: tokenColor(zone.accent),
              strokeOpacity: 0.8,
              strokeWeight: 1,
              fillColor: tokenColor(zone.accent),
              fillOpacity: 0.12,
            }),
          );
          bounds.extend({ lat: zone.lat, lng: zone.lng });
        }
        const line = routeLine(SAM_ROUTE).map(([lng, lat]) => ({ lat, lng }));
        overlays.push(
          new maps.Polyline({
            map,
            path: line,
            strokeColor: "#6d4aff",
            strokeOpacity: 0.85,
            strokeWeight: 4,
          }),
        );

        for (const member of MEMBERS) {
          const photo =
            member.id === "michael"
              ? youPhoto || (avatarId ? avatarSrc(avatarId) : member.avatar)
              : member.avatar;
          const node = pinNode(member, photo);
          node.addEventListener("click", (e) => {
            e.stopPropagation();
            onSelectRef.current(member.id);
          });
          const pos = { lat: member.lat, lng: member.lng };
          const overlay = new maps.OverlayView();
          overlay.onAdd = () => {
            overlay.getPanes()?.overlayMouseTarget.appendChild(node);
          };
          overlay.draw = () => {
            const point = overlay.getProjection()?.fromLatLngToDivPixel(pos);
            if (!point) return;
            node.style.position = "absolute";
            node.style.left = `${point.x}px`;
            node.style.top = `${point.y}px`;
            node.style.transform = "translate(-50%, -50%)";
          };
          overlay.onRemove = () => node.remove();
          overlay.setMap(map);
          overlays.push(overlay);
          pins.current[member.id] = {
            el: node,
            set: (lat, lng) => {
              pos.lat = lat;
              pos.lng = lng;
              overlay.draw();
            },
          };
          bounds.extend({ lat: member.lat, lng: member.lng });
        }
        map.fitBounds(bounds, 48);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Google Maps did not start.");
      }
    })();

    return () => {
      cancelled = true;
      for (const item of overlays) item.setMap(null);
      pins.current = {};
    };
  }, [apiKey, avatarId, youPhoto]);

  useEffect(() => {
    for (const member of MEMBERS) {
      const pin = pins.current[member.id];
      if (!pin) continue;
      const visible = !paused && sharing[member.id];
      const pos = positions[member.id] ?? [member.lat, member.lng];
      pin.el.style.display = visible ? "" : "none";
      pin.el.classList.toggle("is-selected", selectedId === member.id);
      pin.set(pos[0], pos[1]);
    }
  }, [paused, sharing, positions, selectedId]);

  return (
    <div className="relative h-full min-h-dvh w-full">
      <div ref={rootRef} className="h-full min-h-dvh w-full" />
      {error ? (
        <p className="absolute inset-x-4 bottom-36 z-20 rounded-2xl bg-panel px-4 py-3 text-sm text-danger shadow-[var(--shadow-lift)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
