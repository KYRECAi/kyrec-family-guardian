import { Link, createFileRoute } from "@tanstack/react-router";
import { Bell, Menu, Shield, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FamilyMap } from "@/components/family-map";
import { GoogleFamilyMap } from "@/components/google-family-map";
import { MemberAvatar } from "@/components/member-avatar";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { MEMBERS } from "@/lib/family";
import { useHousehold } from "@/lib/household-context";
import { usePeople } from "@/lib/people";
import {
  familyProviderConfig,
  readFamilyLocations,
  shareOwnLocation,
} from "@/lib/shared-household";

export const Route = createFileRoute("/map")({ component: MapPage });

const HOUSE_SHARING = Object.fromEntries(MEMBERS.map((m) => [m.id, true]));

function MapPage() {
  const { snapshot } = useHousehold();
  const { people, familyName } = usePeople();
  const { user } = useCurrentUserState();
  const [config, setConfig] = useState({ mapsKey: "", mapsId: "" });
  const [positions, setPositions] = useState<Record<string, [number, number]>>({});
  const [sharing, setSharing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [selected, setSelected] = useState("kelly");
  const watcher = useRef<number | null>(null);
  const sharingEpoch = useRef(0);
  const household = snapshot?.household_id;
  const pins = people.filter((p) => !p.guest);
  const shown = pins.length ? pins : MEMBERS;
  const member = shown.find((p) => p.id === selected) ?? shown[0];
  const live = member ? Boolean(positions[member.id]) : false;

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
        if (active) setNote("Live locations are unavailable.");
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
        setNote("Sharing has stopped on this device. The last shared location expires within five minutes.");
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
              setNote("Your current position is shared for up to five minutes. You can stop at any time.");
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

  const googleReady = Boolean(config.mapsKey && config.mapsId);

  return (
    <div className="relative h-dvh overflow-hidden">
      {googleReady ? (
        <GoogleFamilyMap
          apiKey={config.mapsKey}
          mapId={config.mapsId}
          members={people}
          positions={positions}
        />
      ) : (
        <FamilyMap
          paused={false}
          sharing={HOUSE_SHARING}
          selectedId={selected}
          onSelect={setSelected}
          positions={positions}
        />
      )}

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 lg:left-24">
        <div className="flex items-center gap-2">
          <Link to="/family" className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white/92 text-navy shadow-[0_8px_24px_rgb(18_26_43/0.12)]">
            <Menu className="size-5" />
          </Link>
          <Link to="/family" className="pointer-events-auto min-w-0 flex-1 rounded-full bg-white/92 px-3 py-1.5 shadow-[0_8px_24px_rgb(18_26_43/0.12)]">
            <span className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-blue/15 text-blue">
                <Shield className="size-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-navy">{familyName || snapshot?.name || "Family"}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-blue">
                  <Shield className="size-3" />
                  {sharing ? "You are sharing" : "Everyone is safe"}
                </span>
              </span>
            </span>
          </Link>
          <Link to="/alerts" className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white/92 text-navy shadow-[0_8px_24px_rgb(18_26_43/0.12)]">
            <Bell className="size-5" />
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-[5.4rem] z-10 lg:bottom-4 lg:left-24">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-[28px] bg-white/94 px-4 py-3 shadow-[0_10px_30px_rgb(18_26_43/0.16)]">
          <div className="flex items-center gap-3 overflow-x-auto">
            {shown.map((m) => (
              <button key={m.id} type="button" onClick={() => setSelected(m.id)} className="shrink-0">
                <MemberAvatar
                  member={m}
                  size={52}
                  className={selected === m.id ? "ring-2 ring-violet ring-offset-2" : ""}
                />
              </button>
            ))}
            <Link to="/points" className="grid size-[52px] shrink-0 place-items-center rounded-full bg-gold text-navy shadow-[0_0_16px_rgba(245,185,66,0.55)]">
              <Star className="size-5" />
            </Link>
          </div>
          {member ? (
            <p className="mt-2 text-center text-xs font-medium text-navy">
              {member.short}
              {live ? " · Sharing now" : member.place === "Home" ? " · 361 Wright Road" : ` · ${member.place}`}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-3 min-h-11 w-full rounded-full bg-violet px-4 text-sm font-semibold text-paper disabled:opacity-50"
            disabled={!sharing && snapshot?.member_role !== "adult"}
            onClick={() => (sharing ? void stop() : void start())}
          >
            {sharing ? "Stop sharing my location" : "Share my current location"}
          </button>
          {note ? <p role="status" className="mt-2 text-center text-[11px] text-muted">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}
