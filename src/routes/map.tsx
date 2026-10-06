import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FamilyMap } from "@/components/family-map";
import { GoogleFamilyMap } from "@/components/google-family-map";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { type MemberId } from "@/lib/family";
import { entitlements } from "@/lib/plans";
import { usePeople } from "@/lib/people";
import { useHouseholdMotion } from "@/lib/presence";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/map")({ component: MapPage });

function MapPage() {
  const paused = useGuardian((s) => s.locationPaused);
  const sharing = useGuardian((s) => s.sharing);
  const setSharing = useGuardian((s) => s.setSharing);
  const togglePaused = useGuardian((s) => s.togglePaused);
  const mapsKey = useGuardian((s) => s.mapsKey);
  const plan = useGuardian((s) => s.plan);
  const historyDays = entitlements(plan).historyDays;
  const zoneCap = entitlements(plan).zones;
  const [selected, setSelected] = useState<MemberId>("kelly");
  const motion = useHouseholdMotion();
  const { people } = usePeople();
  const pins = people.filter((p) => !p.guest);
  const member = pins.find((p) => p.id === selected) ?? pins[0]!;
  const visible = !paused && sharing[selected];

  return (
    <div className="relative h-dvh overflow-hidden">
      {mapsKey ? (
        <GoogleFamilyMap
          apiKey={mapsKey}
          paused={paused}
          sharing={sharing}
          selectedId={selected}
          onSelect={setSelected}
          positions={motion.positions}
        />
      ) : (
        <FamilyMap
          paused={paused}
          sharing={sharing}
          selectedId={selected}
          onSelect={setSelected}
          positions={motion.positions}
        />
      )}

      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-wrap gap-2 lg:left-24">
        <div className="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium text-muted glass">
          Shared family map · Perth
        </div>
        <Link
          to="/plan"
          className="pointer-events-auto rounded-full px-3 py-1.5 text-xs font-medium glass"
        >
          {historyDays ? `${historyDays}-day history` : "No tracking history"}
          {" · "}
          {zoneCap === Infinity ? "Unlimited zones" : `${zoneCap} safe zones`}
        </Link>
        {paused ? (
          <div className="pointer-events-auto rounded-full bg-gold/20 px-3 py-1.5 text-xs font-medium text-gold">
            Sharing paused
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 pb-[5.5rem] lg:pb-4 lg:pl-24">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl p-4 glass">
          <div className="flex gap-3 overflow-x-auto pb-3">
            {pins.map((m) => (
              <button key={m.id} type="button" onClick={() => setSelected(m.id as MemberId)} className="flex flex-col items-center gap-1">
                <MemberAvatar
                  member={m}
                  size={44}
                  paused={paused || !sharing[m.id]}
                  className={selected === m.id ? "ring-2 ring-fg" : ""}
                />
                <span className="text-[11px] text-muted">{m.short}</span>
              </button>
            ))}
          </div>
          <div className="flex items-start gap-3 border-t border-line pt-3">
            <MemberAvatar member={member} size={52} paused={!visible} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">{member.name}</h2>
                {member.status === "moving" && visible ? <Badge tone="blue">Live</Badge> : null}
              </div>
              <p className="text-sm text-muted">
                {visible ? `${member.place} · ${member.placeDetail}` : "Location hidden by choice"}
              </p>
              {visible && member.speedKmh ? (
                <p className="mt-0.5 tabular text-xs text-subtle">
                  {member.speedKmh} km/h · {member.lastUpdated}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-subtle">
                  {member.role} · battery {member.battery}%
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Switch checked={sharing[member.id]} onCheckedChange={(v) => setSharing(member.id, v)} />
              <span className="text-[11px] text-subtle">Share</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={togglePaused}>
            {paused ? "Resume household sharing" : "Pause household sharing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
