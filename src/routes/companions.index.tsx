import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Compass, Shield, ShoppingBag, Wallet } from "lucide-react";
import { COMPANION_LORE, COMPANION_ORDER, type CompanionId } from "@/lib/companions";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/companions/")({ component: CharactersPage });

const JOBS: Record<CompanionId, { label: string; hint: string; tone: string }> = {
  stan: { label: "A decision", hint: "He lays it out. You choose.", tone: "bg-violet/15 text-violet" },
  nova: { label: "Shop and meals", hint: "Snatch one item. Meals for the people at home.", tone: "bg-pink/15 text-pink" },
  pulse: { label: "The day", hint: "Sport, pickup, dinner, and the goal.", tone: "bg-mint/15 text-mint" },
  scout: { label: "A destination", hint: "Maps, then it lands on Pulse.", tone: "bg-blue/15 text-blue" },
  moneybags: { label: "The week", hint: "Your numbers. AUD. Private.", tone: "bg-gold/25 text-orange" },
};

const ICONS = {
  stan: Shield,
  nova: ShoppingBag,
  pulse: CalendarDays,
  scout: Compass,
  moneybags: Wallet,
} as const;

function CharactersPage() {
  const points = useGuardian((s) => s.points);

  return (
    <div className="mx-auto max-w-lg pb-8">
      <div className="flex items-center gap-2 pt-2">
        <div className="min-w-0 flex-1 rounded-[22px] bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="text-lg font-semibold">Characters</p>
          <p className="text-xs text-muted">{points.toLocaleString("en-AU")} family points</p>
        </div>
        <Link to="/alerts" className="grid size-12 place-items-center rounded-full bg-panel shadow-[var(--shadow-border)]">
          <Bell className="size-5" />
        </Link>
      </div>

      <ul className="mt-4 space-y-2">
        {COMPANION_ORDER.map((id) => {
          const c = COMPANION_LORE[id];
          const job = JOBS[id];
          const Icon = ICONS[id];
          return (
            <li key={id}>
              <Link
                to="/companions/$id"
                params={{ id }}
                className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)]"
              >
                <img src={c.portrait} alt="" className="size-12 rounded-2xl object-cover object-[center_12%]" />
                <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${job.tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{c.name} · {job.label}</span>
                  <span className="block truncate text-xs text-muted">{job.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}