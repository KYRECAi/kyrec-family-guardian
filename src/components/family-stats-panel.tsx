import { Link } from "@tanstack/react-router";
import { Car, Droplet, Shield, Smartphone, ThumbsUp, TriangleAlert, Trophy } from "lucide-react";
import { FAMILY_STATS, HOUSEHOLD, memberById } from "@/lib/family";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

const TILE_ICONS = {
  drives: Car,
  phone: Smartphone,
  brake: TriangleAlert,
  checkin: ThumbsUp,
  zones: Droplet,
  challenges: Trophy,
} as const;

const BAR: Record<string, string> = {
  michael: "bg-violet",
  kelly: "bg-orange",
  paige: "bg-pink",
  chelsea: "bg-blue",
  madison: "bg-green",
};

const CHIP: Record<string, string> = {
  michael: "bg-violet text-paper",
  kelly: "bg-orange text-paper",
  paige: "bg-pink text-paper",
  chelsea: "bg-blue text-paper",
  madison: "bg-green text-paper",
};

export function FamilyStatsPanel() {
  const insights = useGuardian((s) => s.driveInsights);
  const score = FAMILY_STATS.score;
  const maxBar = Math.max(...FAMILY_STATS.week, 1);
  const maxCmp = Math.max(...FAMILY_STATS.comparison.map((c) => c.points));
  const ring = insights.score ? HOUSEHOLD.driveScore : 0;

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-lg font-semibold">This week</h2>
        <p className="flex items-center gap-1 text-xs text-violet">
          <Shield className="size-3.5" /> Looks steady
        </p>
      </div>

      <section className="mt-3 rounded-[28px] bg-panel p-5 shadow-[var(--shadow-border)]">
        <p className="text-sm text-muted">Family score</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight">{score.toLocaleString("en-AU")}</p>
        <p className="mt-1 text-sm font-medium text-violet">+{FAMILY_STATS.today} today</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {FAMILY_STATS.tiles.map((t) => {
            const Icon = TILE_ICONS[t.id as keyof typeof TILE_ICONS];
            return (
              <div key={t.id} className="rounded-2xl bg-ink-2 px-3 py-3">
                <Icon className="size-4 text-violet" />
                <p className="mt-2 text-lg font-semibold leading-none">
                  {t.points} <span className="text-xs font-medium text-muted">pts</span>
                </p>
                <p className="mt-1 text-[11px] leading-tight text-muted">{t.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <section className="rounded-[28px] bg-panel p-4 shadow-[var(--shadow-border)]">
          <h3 className="text-sm font-semibold">Weekly points</h3>
          <div className="mt-6 flex h-28 items-end gap-1.5">
            {FAMILY_STATS.week.map((n, i) => (
              <div key={`${FAMILY_STATS.weekDays[i]}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                <span className="w-full rounded-full bg-violet/80" style={{ height: `${Math.max(6, (n / maxBar) * 100)}%` }} />
                <span className="text-[10px] text-subtle">{FAMILY_STATS.weekDays[i]}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[28px] bg-panel p-4 shadow-[var(--shadow-border)]">
          <h3 className="text-sm font-semibold">Driving</h3>
          <div className="relative mx-auto mt-2 size-28">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
              <circle cx="60" cy="60" r="46" fill="none" stroke="var(--color-ink-2)" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke="var(--color-violet)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - ring / 100)}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <p className="text-xl font-semibold">{insights.score ? `${ring}%` : "—"}</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-[28px] bg-panel p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Side by side</h3>
          <Link to="/drive" className="text-xs font-medium text-violet">
            Drives
          </Link>
        </div>
        <ul className="mt-3 space-y-3">
          {FAMILY_STATS.comparison.map((row) => {
            const m = memberById(row.id);
            return (
              <li key={row.id} className="flex items-center gap-3">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold", CHIP[row.id])}>
                  {m.initial ?? m.short[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{m.short}</span>
                    <span className="text-muted"> · {row.note}</span>
                  </p>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-ink-2">
                    <span className={cn("block h-full rounded-full", BAR[row.id])} style={{ width: `${(row.points / maxCmp) * 100}%` }} />
                  </span>
                </div>
                <span className="w-10 text-right text-sm font-semibold">{row.points}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">What this household chose to share. Not a rank.</p>
      </section>
    </div>
  );
}
