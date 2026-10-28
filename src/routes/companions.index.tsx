import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarDays, Compass, Shield, ShoppingBag, Wallet } from "lucide-react";
import { COMPANION_LORE, COMPANION_ORDER, type CompanionId } from "@/lib/companions";
import { HOUSEHOLD } from "@/lib/family";
import { useGuardian } from "@/lib/store";
import { CompanionMemoryPanel } from "@/components/companion-memory-panel";

export const Route = createFileRoute("/companions/")({ component: CharactersPage });

const CARDS: Record<
  CompanionId,
  { job: string; hint: string; wash: string; ink: string; chip: string; ring: string }
> = {
  stan: {
    job: "A decision",
    hint: "He lays it out. You choose.",
    wash: "from-[#d5e4ff] via-white to-white",
    ink: "text-[#2450b5]",
    chip: "bg-[#2450b5]",
    ring: "shadow-[0_0_0_3px_#2450b5]",
  },
  nova: {
    job: "Shop and meals",
    hint: "Snatch one item. Meals for the people at home.",
    wash: "from-[#ffd0e4] via-white to-white",
    ink: "text-[#c23b78]",
    chip: "bg-[#c23b78]",
    ring: "shadow-[0_0_0_3px_#c23b78]",
  },
  pulse: {
    job: "The day",
    hint: "Sport, pickup, dinner, and the goal.",
    wash: "from-[#c8f6e6] via-white to-white",
    ink: "text-[#0f8f72]",
    chip: "bg-[#0f8f72]",
    ring: "shadow-[0_0_0_3px_#0f8f72]",
  },
  scout: {
    job: "Destination",
    hint: "Maps, then it lands on Pulse.",
    wash: "from-[#d4e9ff] via-white to-white",
    ink: "text-[#1d6fbf]",
    chip: "bg-[#1d6fbf]",
    ring: "shadow-[0_0_0_3px_#1d6fbf]",
  },
  moneybags: {
    job: "The week",
    hint: "Your numbers. AUD. Private.",
    wash: "from-[#ffe7a3] via-white to-white",
    ink: "text-[#a16207]",
    chip: "bg-[#d4a017]",
    ring: "shadow-[0_0_0_3px_#d4a017]",
  },
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
  const paused = useGuardian((s) => s.locationPaused);
  const groceries = useGuardian((s) => s.groceries) ?? [];
  const mood = useGuardian((s) => s.novaMoods?.[0]?.mood);
  const events = useGuardian((s) => s.events) ?? [];
  const place = useGuardian((s) => s.scoutLogs?.[0]?.place);
  const spent = useGuardian((s) => s.budgetSpent);
  const goal = HOUSEHOLD.pointsGoal;
  const pct = Math.max(0, Math.min(100, Math.round((points / goal) * 100)));
  const openShop = groceries.filter((item) => !item.by);
  const next = events[0];
  const left = Math.max(0, HOUSEHOLD.budgetTarget - spent);

  const now: Record<CompanionId, string> = {
    stan: paused ? "Sharing is paused" : "Map is on · 361 Wright Road",
    nova: openShop.length
      ? `${openShop.length} still on the shared list`
      : mood
        ? `Last check-in · ${mood[0]!.toUpperCase()}${mood.slice(1)}`
        : "List is clear",
    pulse: next ? `${next.start} · ${next.title}` : "Dinner is still open",
    scout: place ? `${place} is with Pulse` : "No place picked yet",
    moneybags: `$${spent} of $${HOUSEHOLD.budgetTarget} · $${left} left`,
  };

  const lead: CompanionId = openShop.length ? "nova" : next ? "pulse" : place ? "scout" : "stan";
  const rest = COMPANION_ORDER.filter((id) => id !== lead);
  const leadLore = COMPANION_LORE[lead];
  const leadCard = CARDS[lead];
  const LeadIcon = ICONS[lead];

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <div className="flex items-center gap-2 pt-2">
        <div className="min-w-0 flex-1 rounded-[22px] bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">Characters</p>
              <p className="text-xs text-muted">
                {points.toLocaleString("en-AU")} family points · {(goal - points).toLocaleString("en-AU")} to the goal
              </p>
            </div>
            <p className="text-sm font-semibold text-violet">{pct}%</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-violet/15">
            <div className="h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link to="/alerts" className="grid size-12 place-items-center rounded-full bg-panel shadow-[var(--shadow-border)]">
          <Bell className="size-5" />
        </Link>
      </div>

      <div className="mt-4 grid items-start gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <Link
          to="/companions/$id"
          params={{ id: lead }}
          className={`flex items-stretch gap-4 overflow-hidden rounded-[28px] bg-gradient-to-br ${leadCard.wash} p-3 shadow-[var(--shadow-border)] lg:min-h-[320px] lg:p-4`}
        >
          <img
            src={leadLore.portrait}
            alt=""
            className={`h-44 w-32 shrink-0 rounded-[22px] object-cover object-[center_12%] lg:h-72 lg:w-52 ${leadCard.ring}`}
          />
          <span className="flex min-w-0 flex-1 flex-col py-1">
            <span className={`inline-flex w-fit items-center gap-1 rounded-full ${leadCard.chip} px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase`}>
              <LeadIcon className="size-3" />
              Open this
            </span>
            <span className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">{leadLore.name}</span>
            <span className="text-sm font-medium text-muted">{leadCard.job}</span>
            <span className="mt-2 line-clamp-3 text-sm leading-snug lg:text-base">{leadLore.quote}</span>
            <span className={`mt-auto inline-flex w-fit max-w-full truncate rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium ${leadCard.ink}`}>
              {now[lead]}
            </span>
          </span>
        </Link>

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          {rest.map((id) => {
            const c = COMPANION_LORE[id];
            const card = CARDS[id];
            const Icon = ICONS[id];
            return (
              <li key={id}>
                <Link
                  to="/companions/$id"
                  params={{ id }}
                  className={`flex h-full flex-col rounded-[26px] bg-gradient-to-br ${card.wash} p-3 shadow-[var(--shadow-border)] lg:flex-row lg:items-center lg:gap-3`}
                >
                  <img
                    src={c.portrait}
                    alt=""
                    className="size-14 shrink-0 rounded-2xl object-cover object-[center_12%] lg:size-16"
                  />
                  <span className="mt-2 min-w-0 flex-1 lg:mt-0">
                    <span className="block text-[15px] font-semibold leading-tight tracking-tight">{c.name}</span>
                    <span className={`mt-0.5 flex items-center gap-1 text-[11px] font-semibold leading-tight ${card.ink}`}>
                      <Icon className="size-3 shrink-0" />
                      <span>{card.job}</span>
                    </span>
                    <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted lg:line-clamp-1">{now[id]}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="mt-4 rounded-[28px] bg-panel p-4 shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">The house right now</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Link to="/companions/$id" params={{ id: "nova" }} className="rounded-2xl bg-[#fff0f6] px-3 py-3">
            <p className="text-[11px] font-semibold text-[#c23b78]">Nova · shared list</p>
            <p className="mt-1 text-sm font-semibold">{openShop.length ? `${openShop.length} still to get` : "List is clear"}</p>
            <p className="mt-0.5 text-[11px] text-muted">Milk, bread, eggs, coffee — or add your own.</p>
          </Link>
          <Link to="/companions/$id" params={{ id: "pulse" }} className="rounded-2xl bg-[#e7faf3] px-3 py-3">
            <p className="text-[11px] font-semibold text-[#0f8f72]">Pulse · the day</p>
            <p className="mt-1 text-sm font-semibold">{next ? next.title : "Dinner is still open"}</p>
            <p className="mt-0.5 text-[11px] text-muted">{next ? `${next.start} · ${next.who}` : "Sport, pickup, then who is eating."}</p>
          </Link>
          <Link to="/companions/$id" params={{ id: "moneybags" }} className="rounded-2xl bg-[#fff6d8] px-3 py-3">
            <p className="text-[11px] font-semibold text-[#a16207]">Moneybags · the week</p>
            <p className="mt-1 text-sm font-semibold">${left} left</p>
            <p className="mt-0.5 text-[11px] text-muted">${spent} of ${HOUSEHOLD.budgetTarget}. AUD. Private.</p>
          </Link>
        </div>
      </section>

      <CompanionMemoryPanel />

      <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-muted">
        Five jobs. They stay in their lane. Privacy by design — you choose what each one sees.
      </p>
    </div>
  );
}
