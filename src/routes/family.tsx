import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Share2, Users } from "lucide-react";
import { FamilyStatsPanel } from "@/components/family-stats-panel";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { usePeople } from "@/lib/people";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/family")({ component: FamilyPage });

function FamilyPage() {
  const sharing = useGuardian((s) => s.sharing);
  const setSharing = useGuardian((s) => s.setSharing);
  const checkIns = useGuardian((s) => s.checkIns);
  const request = useGuardian((s) => s.requestCheckIn);
  const confirmed = checkIns.filter((c) => c.status === "confirmed");
  const { people, familyName } = usePeople();

  return (
    <div className="mx-auto max-w-lg py-5">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-full bg-panel shadow-[var(--shadow-border)]">
          <Users className="size-5 text-violet" />
        </div>
        <div className="min-w-0 flex-1 rounded-2xl bg-panel px-4 py-3 text-center shadow-[var(--shadow-border)]">
          <h1 className="text-lg font-semibold">{familyName}</h1>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-violet">
            <span className="size-1.5 rounded-full bg-green" />
            Waiting for current check-ins
          </p>
        </div>
        <Link to="/alerts" className="relative grid size-11 place-items-center rounded-full bg-panel shadow-[var(--shadow-border)]">
          <Bell className="size-5 text-fg" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-violet" />
        </Link>
      </div>

      <ul className="mt-5 space-y-2">
        <li>
          <button type="button" onClick={() => request("michael")} className="flex w-full items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 text-left shadow-[var(--shadow-border)]">
            <span className="grid size-10 place-items-center rounded-2xl bg-mint/15 text-mint"><Users className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Check in</span>
              <span className="block text-xs text-muted">You send it. Nobody is scored.</span>
            </span>
          </button>
        </li>
        <li>
          <Link to="/permissions" className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)]">
            <span className="grid size-10 place-items-center rounded-2xl bg-orange/15 text-orange"><Share2 className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Sharing</span>
              <span className="block text-xs text-muted">{people.filter((m) => sharing[m.id]).length} of {people.length} chosen on</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/planner" className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)]">
            <span className="grid size-10 place-items-center rounded-2xl bg-violet/15 text-violet"><CalendarDays className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">This week</span>
              <span className="block text-xs text-muted">What Pulse is already holding</span>
            </span>
          </Link>
        </li>
      </ul>

      <div className="mt-6 flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold">Your family</h2>
        <p className="text-xs text-subtle">Individual sharing controls</p>
      </div>

      <ul className="mt-3 space-y-2">
        {people.map((m) => (
          <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-panel px-3 py-3 shadow-[var(--shadow-border)]">
            <MemberAvatar member={m} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.name}</p>
              <p className="text-xs text-muted">
                Current check-in waiting for KYREC Core · sharing by choice
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSharing(m.id, !sharing[m.id])}
              className="shrink-0"
            >
              <Badge tone="orange">{sharing[m.id] ? "Waiting" : "Hidden"}</Badge>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold">Recent check-ins</h2>
        <p className="text-xs text-subtle">Verified events appear here</p>
      </div>
      {confirmed.length === 0 ? (
        <div className="mt-3 rounded-3xl border border-dashed border-line bg-panel px-6 py-10 text-center">
          <p className="text-lg font-semibold">No confirmed check-ins yet</p>
          <p className="mt-2 text-sm text-muted">
            Chosen family check-ins will appear here only after KYREC Core confirms them.
          </p>
          {checkIns.length ? (
            <p className="mt-3 text-xs text-violet">{checkIns.length} waiting on Core</p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {confirmed.map((c) => (
            <li key={c.id} className="rounded-2xl bg-panel px-4 py-3 text-sm shadow-[var(--shadow-border)]">
              {people.find((m) => m.id === c.memberId)?.name} · confirmed
            </li>
          ))}
        </ul>
      )}
      <FamilyStatsPanel />
    </div>
  );
}
