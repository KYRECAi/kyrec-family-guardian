import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GoogleFamilyMap } from "@/components/google-family-map";
import { useHousehold } from "@/lib/household-context";
import { usePeople } from "@/lib/people";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  familyProviderConfig,
  readFamilyLocations,
  shareOwnLocation,
} from "@/lib/shared-household";

export const Route = createFileRoute("/map")({ component: MapPage });
function MapPage() {
  const { snapshot } = useHousehold();
  const { people } = usePeople();
  const { user } = useCurrentUserState();
  const [config, setConfig] = useState({ mapsKey: "", mapsId: "" });
  const [positions, setPositions] = useState<Record<string, [number, number]>>({});
  const [sharing, setSharing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const watcher = useRef<number | null>(null);
  const sharingEpoch = useRef(0);
  const household = snapshot?.household_id;
  useEffect(() => {
    void familyProviderConfig()
      .then(setConfig)
      .catch(() => setNote("Map configuration is unavailable."));
  }, []);
  useEffect(() => {
    if (!household) return;
    let active = true;
    const refresh = async () => {
      try {
        const result = await readFamilyLocations({ data: { household } });
        if (!active) return;
        const now = Date.now();
        setPositions(
          Object.fromEntries(
            result.positions
              .filter((point) => Date.parse(point.expires_at) > now)
              .map((point) => [point.user_id, [point.latitude, point.longitude]]),
          ),
        );
      } catch {
        if (active) {
          setPositions({});
          setNote("Live locations are unavailable.");
        }
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
      sharingEpoch.current += 1;
      if (watcher.current !== null) navigator.geolocation.clearWatch(watcher.current);
      watcher.current = null;
      void shareOwnLocation({ data: { household, enabled: false } }).catch(() => undefined);
    };
  }, [household]);
  async function stop() {
    sharingEpoch.current += 1;
    if (watcher.current !== null) navigator.geolocation.clearWatch(watcher.current);
    watcher.current = null;
    setSharing(false);
    if (user)
      setPositions((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => id !== user.id)),
      );
    if (household) {
      try {
        await shareOwnLocation({ data: { household, enabled: false } });
        setNote("Your location sharing is off.");
      } catch {
        setNote(
          "Sharing has stopped on this device. The last shared location expires within five minutes.",
        );
      }
    }
  }
  async function start() {
    if (!household || !navigator.geolocation || snapshot?.member_role !== "adult") return;
    const generation = ++sharingEpoch.current;
    setSharing(true);
    setNote("Waiting for your device's current position…");
    let lease: Awaited<ReturnType<typeof shareOwnLocation>>;
    try {
      lease = await shareOwnLocation({ data: { household, enabled: true } });
    } catch {
      setSharing(false);
      setNote("Your sharing choice could not be saved.");
      return;
    }
    if (generation !== sharingEpoch.current || !lease.lease_id) {
      await shareOwnLocation({ data: { household, enabled: false } }).catch(() => undefined);
      return;
    }
    watcher.current = navigator.geolocation.watchPosition(
      (position) => {
        if (generation !== sharingEpoch.current) return;
        void shareOwnLocation({
          data: {
            household,
            enabled: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            lease_id: lease.lease_id,
          },
        })
          .then(() => {
            if (generation === sharingEpoch.current)
              setNote(
                "Your current position is shared for up to five minutes. You can stop at any time.",
              );
          })
          .catch(() => {
            if (generation === sharingEpoch.current) {
              void stop();
              setNote("Your position could not be shared.");
            }
          });
      },
      () => {
        void stop();
        setNote("Location permission was denied or a current position is unavailable.");
      },
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 15_000 },
    );
  }
  return (
    <div className="relative h-dvh overflow-hidden">
      {config.mapsKey && config.mapsId ? (
        <GoogleFamilyMap
          apiKey={config.mapsKey}
          mapId={config.mapsId}
          members={people}
          positions={positions}
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-panel px-8 text-center text-muted">
          Google Maps is awaiting the app's shared key and map ID. No family locations are shown.
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 lg:left-24">
        <p className="inline-block rounded-full px-3 py-2 text-sm glass">
          {snapshot?.name} · shared by choice
        </p>
      </div>
      <div className="absolute inset-x-4 bottom-24 z-10 mx-auto max-w-lg rounded-2xl p-4 glass lg:left-24 lg:bottom-6">
        <h1 className="font-semibold">Family map</h1>
        <p className="mt-2 text-xs text-muted">
          Only current, explicitly shared positions appear. No demonstration pins or location
          history. Location is sent to KYREC and shown on Google Maps to this household.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {people.map((person) => (
            <li key={person.id}>
              {person.name} ·{" "}
              {positions[person.id] ? "Recently shared" : "Not sharing a current location"}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 min-h-12 w-full rounded-full bg-violet px-4 font-semibold text-paper disabled:opacity-50"
          disabled={!sharing && snapshot?.member_role !== "adult"}
          onClick={() => (sharing ? void stop() : void start())}
        >
          {sharing ? "Stop sharing my location" : "Share my current location with this household"}
        </button>
        {note ? (
          <p role="status" className="mt-3 text-xs text-muted">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
