import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { UpgradeGate } from "@/components/upgrade-gate";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GAMES, HABITS, HOUSEHOLD } from "@/lib/family";
import { usePeople } from "@/lib/people";
import { moneybagsPhase, phaseCopy } from "@/lib/companions";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/points")({ component: PointsPage });

function PointsPage() {
  const points = useGuardian((s) => s.points);
  const spent = useGuardian((s) => s.budgetSpent) ?? HOUSEHOLD.budgetSpent;
  const claimed = useGuardian((s) => s.claimedHabits);
  const claim = useGuardian((s) => s.claimHabit);
  const best = useGuardian((s) => s.gameBest);
  const { people } = usePeople();
  const phase = moneybagsPhase(points, spent);
  const unlocked = phase === "unlocked";
  const copy = phaseCopy(phase);
  const pct = Math.min(100, Math.round((points / HOUSEHOLD.pointsGoal) * 100));

  return (
    <UpgradeGate need="plus" companion="stan" headline="Family points for the shop run, not a score against anyone.">
    <div className="mx-auto max-w-5xl py-5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Family points</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Positive habits, one household score</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Reward what you already want to practise. Seasonal games add to the same score — opt-in, no pay-to-win.
      </p>

      <section className="mt-6 rounded-xl bg-panel p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wider text-muted uppercase">This week</p>
            <p className="tabular mt-1 text-4xl font-semibold text-gold">{points}</p>
            <p className="text-sm text-muted">Goal {HOUSEHOLD.pointsGoal}</p>
          </div>
          {unlocked ? (
            <Badge tone="gold">Moneybags unlocked</Badge>
          ) : (
            <Badge tone="muted">{copy.badge}</Badge>
          )}
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-ink-2">
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex -space-x-2">
          {people.map((m) => (
            <MemberAvatar key={m.id} member={m} size={32} />
          ))}
        </div>
      </section>

      <section className="mt-4 flex items-center gap-4 overflow-hidden rounded-xl bg-panel shadow-[var(--shadow-border)]">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-navy">
          <img
            src="/companions/moneybags.jpg"
            alt=""
            className={unlocked ? "h-full w-full object-cover object-top" : "h-full w-full object-cover object-top grayscale brightness-50"}
          />
          {unlocked ? null : (
            <div className="absolute inset-0 grid place-items-center bg-navy/30">
              <Lock className="size-5 text-paper" />
            </div>
          )}
        </div>
        <div className="pr-4">
          <h2 className="font-semibold">{unlocked ? "Moneybags is in" : "Moneybags is locked"}</h2>
          <p className="mt-1 text-sm text-muted">{copy.body}</p>
          <Link to="/companions/$id" params={{ id: "moneybags" }} className="mt-2 inline-block text-xs font-medium text-blue">
            Official lore
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Habits</h2>
        <ul className="mt-3 space-y-2">
          {HABITS.map((h) => {
            const on = claimed.includes(h.id);
            return (
              <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
                <div>
                  <p className="text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted">{h.who} · +{h.points}</p>
                </div>
                <Button size="sm" variant={on ? "subtle" : "primary"} disabled={on} onClick={() => claim(h.id, h.points)}>
                  {on ? "Logged" : "Log"}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Seasonal games</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {GAMES.map((g) => (
            <Link key={g.id} to="/games/$id" params={{ id: g.id }} className="rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
              <p className="text-[11px] font-medium tracking-wider text-muted uppercase">{g.season}</p>
              <h3 className="mt-1 font-semibold">{g.title}</h3>
              <p className="mt-2 text-sm text-muted">{g.blurb}</p>
              <p className="mt-3 text-xs text-gold">Best {best[g.id] ?? 0}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
    </UpgradeGate>
  );
}
