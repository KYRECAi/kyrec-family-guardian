import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  Car,
  Crown,
  Gamepad2,
  Heart,
  MapPinned,
  Shield,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CompanionBoard } from "@/components/companion-board";
import { CompanionChat } from "@/components/companion-chat";
import { GroceryList } from "@/components/grocery-list";
import { MovieGap } from "@/components/movie-gap";
import { PulseDay } from "@/components/pulse-day";
import { PulseGoals } from "@/components/pulse-goals";
import { ScoutDestination } from "@/components/scout-destination";
import { COMPANION_LORE, COMPANION_ORDER, type CompanionId } from "@/lib/companions";
import { HOUSEHOLD } from "@/lib/family";
import { useGuardian, type Mood } from "@/lib/store";

const IDS = Object.keys(COMPANION_LORE) as CompanionId[];

export const Route = createFileRoute("/companions/$id")({
  component: CompanionPage,
  loader: ({ params }) => {
    const id = params.id as CompanionId;
    if (!IDS.includes(id)) throw notFound();
    return COMPANION_LORE[id];
  },
});

const FEELS: { id: Mood; label: string }[] = [
  { id: "bright", label: "Bright" },
  { id: "steady", label: "Steady" },
  { id: "light", label: "Light" },
  { id: "low", label: "Low" },
];

type Action = { label: string; body: string; icon: LucideIcon; to: string; params?: { id: string } };

const ACTIONS: Record<CompanionId, Action[]> = {
  stan: [
    { label: "Safety", body: "Map, zones, who is sharing", icon: Shield, to: "/map" },
    { label: "Drive", body: "A trip summary, not a score", icon: Car, to: "/drive" },
    { label: "Family", body: "Check-ins you chose to send", icon: Heart, to: "/family" },
  ],
  nova: [
    { label: "Check-in", body: "One feeling. Not required", icon: Heart, to: "/family" },
    { label: "Calm", body: "No score. No share.", icon: Sparkles, to: "/family" },
    { label: "Family", body: "Support stays optional", icon: Heart, to: "/family" },
  ],
  pulse: [
    { label: "Planner", body: "What is already on today", icon: CalendarDays, to: "/planner" },
    { label: "Rhythm", body: "Shared, not scored", icon: Sparkles, to: "/routines" },
    { label: "Family", body: "Who the plan is for", icon: Heart, to: "/family" },
  ],
  scout: [
    { label: "Drive", body: "Useful trip summaries", icon: Car, to: "/drive" },
    { label: "Map", body: "The route in view", icon: MapPinned, to: "/map" },
    { label: "Protection", body: "Not available yet.", icon: Shield, to: "/protection" },
  ],
  moneybags: [
    { label: "Game", body: "Moneybags Bonus", icon: Gamepad2, to: "/games/$id", params: { id: "moneybags" } },
    { label: "Budget", body: "Real figures. AUD. Private.", icon: Wallet, to: "/budget" },
    { label: "Family", body: "Shared, not singled out", icon: Heart, to: "/family" },
  ],
};

function CompanionPage() {
  const c = Route.useLoaderData();
  const points = useGuardian((s) => s.points);
  const addMood = useGuardian((s) => s.addMood);
  const current = useGuardian((s) => s.novaMoods?.[0]?.mood);
  const others = COMPANION_ORDER.filter((id) => id !== c.id).slice(0, 3);
  const goal = HOUSEHOLD.pointsGoal;
  const [fullChat, setFullChat] = useState(false);
  const scoutLogs = useGuardian((s) => s.scoutLogs) ?? [];
  const latestTrip = scoutLogs[0];
  const paused = useGuardian((s) => s.locationPaused);
  const events = useGuardian((s) => s.events) ?? [];
  const spent = useGuardian((s) => s.budgetSpent);

  return (
    <div className="mx-auto max-w-lg pb-8">
      <Link to="/companions" className="text-sm text-violet">
        ‹ Characters
      </Link>

      <div className="mt-3 flex items-end gap-3">
        <img
          src={c.portrait}
          alt=""
          className="h-40 w-32 shrink-0 rounded-[28px] object-cover object-[center_12%] shadow-[var(--shadow-lift)]"
        />
        <div className="min-w-0 pb-1">
          <h1 className="text-4xl font-semibold tracking-tight">{c.name}</h1>
          <p className="text-sm font-medium text-violet">{c.role}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{c.tagline}</p>
        </div>
      </div>

      <CompanionBoard id={c.id} />

      <div className="mt-3">
        <CompanionChat id={c.id} onFull={() => setFullChat(true)} />
      </div>
      {fullChat ? <CompanionChat id={c.id} full onClose={() => setFullChat(false)} /> : null}

      <PurpleBox
        spec={purpleSpec({
          id: c.id,
          points,
          goal,
          paused,
          events: events.length,
          place: latestTrip?.place,
          spent,
          budget: HOUSEHOLD.budgetTarget,
        })}
      />

      {c.id === "nova" ? (
        <>
          <GroceryList />
          <MovieGap />
        </>
      ) : null}

      {c.id === "pulse" ? <PulseGoals /> : null}

      {c.id === "pulse" && latestTrip ? (
        <section className="mt-4 rounded-[24px] bg-navy p-4 text-paper">
          <p className="font-semibold">Scout passed a destination</p>
          <p className="mt-1 text-sm text-paper/75">
            {latestTrip.place} is on the plan. Pulse can use it for pickup and the rest of the evening. The route itself stays in Maps.
          </p>
          <Link to="/planner" className="mt-3 inline-block text-sm font-semibold text-gold">
            Open the plan
          </Link>
        </section>
      ) : null}

      {c.id === "moneybags" ? (
        <Link to="/games/$id" params={{ id: "moneybags" }} className="mt-4 block overflow-hidden rounded-[24px] shadow-[var(--shadow-lift)]">
          <img src="/companions/moneybags-bonus.jpg" alt="Moneybags Bonus" className="aspect-[16/10] w-full object-cover object-[center_30%]" />
          <span className="flex items-center justify-between bg-navy px-4 py-3 text-paper">
            <span>
              <span className="block text-sm font-semibold">Moneybags is here</span>
              <span className="text-xs opacity-70">Front cover · tap to play</span>
            </span>
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy">Play</span>
          </span>
        </Link>
      ) : c.id === "scout" ? (
        <ScoutDestination />
      ) : c.id === "pulse" ? (
        <PulseDay />
      ) : c.id === "nova" ? null : (
        <section className="mt-4 flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)]">
          <span className="grid size-10 place-items-center rounded-2xl bg-gold/25 text-orange">
            <Sparkles className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">Family points</span>
            <span className="block text-xs text-muted">
              {points.toLocaleString("en-AU")} of {goal.toLocaleString("en-AU")}
            </span>
          </span>
        </section>
      )}

      <ul className="mt-3 space-y-2">
        {ACTIONS[c.id].map((action, i) => {
          const Icon = action.icon;
          const tone = ["bg-violet/15 text-violet", "bg-mint/15 text-mint", "bg-orange/15 text-orange", "bg-pink/15 text-pink", "bg-blue/15 text-blue"][i] ?? "bg-violet/15 text-violet";
          return (
            <li key={action.label}>
              <Link
                to={action.to}
                params={action.params}
                className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)]"
              >
                <span className={`grid size-10 place-items-center rounded-2xl ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{action.label}</span>
                  <span className="block text-xs text-muted">{action.body}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">How are you</h2>
        <p className="mt-1 text-xs text-muted">Optional. On this device. Not a score.</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {FEELS.map((feel) => {
            const on = current === feel.id;
            return (
              <button
                key={feel.id}
                type="button"
                onClick={() => addMood(feel.id, c.name)}
                className={`rounded-full py-3 text-xs font-semibold ${on ? "bg-violet text-paper" : "bg-panel text-fg shadow-[var(--shadow-border)]"}`}
              >
                {feel.label}
              </button>
            );
          })}
        </div>
        {current ? (
          <p className="mt-2 text-xs text-muted">
            Noted as {FEELS.find((f) => f.id === current)?.label}. {c.name} can see it. It stays on this phone.
          </p>
        ) : null}
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">Also in the household</h2>
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {others.map((id) => {
            const other = COMPANION_LORE[id];
            return (
              <li key={id}>
                <Link to="/companions/$id" params={{ id }} className="block rounded-2xl bg-panel p-2 shadow-[var(--shadow-border)]">
                  <img src={other.portrait} alt="" className="aspect-square w-full rounded-xl object-cover object-[center_12%]" />
                  <p className="mt-1 truncate text-xs font-semibold">{other.name}</p>
                  <p className="truncate text-[10px] text-muted">{other.role}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-4 text-center text-xs text-subtle">{c.limit}</p>
    </div>
  );
}

function purpleSpec(input: {
  id: CompanionId;
  points: number;
  goal: number;
  paused: boolean;
  events: number;
  place?: string;
  spent: number;
  budget: number;
}) {
  const pointsPct = input.goal > 0 ? Math.min(100, Math.round((input.points / input.goal) * 100)) : 0;
  const left = Math.max(0, input.budget - input.spent);
  const moneyPct = input.budget > 0 ? Math.max(0, Math.min(100, Math.round((left / input.budget) * 100))) : 0;
  if (input.id === "stan") {
    return {
      icon: Shield,
      title: "The call",
      kicker: "Right now",
      value: input.paused ? "Paused" : "On",
      line: "You decide. Stan does not.",
      pct: input.paused ? 40 : 100,
      ring: "sharing",
      side: "Choice",
      sideValue: "Yours",
      foot: input.paused ? "Hidden" : "In view",
    };
  }
  if (input.id === "pulse") {
    const pct = input.events ? Math.min(100, 40 + input.events * 15) : 36;
    return {
      icon: CalendarDays,
      title: "The day",
      kicker: "Today",
      value: String(input.events),
      line: "Sport, pickup, dinner. One plan.",
      pct,
      ring: "on the day",
      side: "Plan",
      sideValue: input.events ? "Set" : "Open",
      foot: `${input.events} on it`,
    };
  }
  if (input.id === "scout") {
    return {
      icon: MapPinned,
      title: "The trip",
      kicker: "Logged",
      value: input.place ? "Set" : "Open",
      line: input.place ?? "Name a place. Maps keeps the route.",
      pct: input.place ? 84 : 36,
      ring: "of the trip",
      side: "Maps",
      sideValue: "Ready",
      foot: input.place ? "Handed on" : "Waiting",
    };
  }
  if (input.id === "moneybags") {
    return {
      icon: Wallet,
      title: "The week",
      kicker: "AUD · private",
      value: `$${left}`,
      line: "Left in the week. Nobody is singled out.",
      pct: moneyPct,
      ring: "still left",
      side: "Plan",
      sideValue: `$${input.budget}`,
      foot: `$${input.spent} spent`,
    };
  }
  return {
    icon: Users,
    title: "Family Points",
    kicker: "This week",
    value: input.points.toLocaleString("en-AU"),
    line: "Keep lifting each other up!",
    pct: pointsPct,
    ring: "of weekly goal",
    side: "Goal",
    sideValue: input.goal.toLocaleString("en-AU"),
    foot: `${input.points.toLocaleString("en-AU")} / ${input.goal.toLocaleString("en-AU")}`,
  };
}

function PurpleBox({
  spec,
}: {
  spec: {
    icon: LucideIcon;
    title: string;
    kicker: string;
    value: string;
    line: string;
    pct: number;
    ring: string;
    side: string;
    sideValue: string;
    foot: string;
  };
}) {
  const Icon = spec.icon;
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = (spec.pct / 100) * circ;

  return (
    <section
      className="relative mt-4 overflow-hidden rounded-[28px] px-3 py-4 text-white shadow-[0_0_32px_rgba(124,58,237,0.45)]"
      style={{
        background:
          "radial-gradient(circle at 18% 30%, rgba(167,139,250,0.55), transparent 42%), radial-gradient(circle at 88% 70%, rgba(99,102,241,0.45), transparent 40%), linear-gradient(135deg, #1a1038 0%, #2d1468 48%, #120826 100%)",
      }}
    >
      <span className="pointer-events-none absolute top-3 right-10 size-1 rounded-full bg-white/80" />
      <span className="pointer-events-none absolute bottom-3 left-16 size-1 rounded-full bg-gold" />
      <div className="flex items-center gap-2">
        <div className="relative w-16 shrink-0">
          <Crown className="absolute -top-3 left-1/2 size-5 -translate-x-1/2 text-gold" />
          <div
            className="mx-auto grid size-14 place-items-center shadow-[0_0_18px_rgba(167,139,250,0.85)]"
            style={{
              clipPath: "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
              background: "linear-gradient(160deg, #ddd6fe 0%, #7c3aed 42%, #4c1d95 100%)",
            }}
          >
            <Icon className="size-6" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[13px] font-semibold">
            {spec.title} <Sparkles className="size-3 text-gold" />
          </p>
          <p className="text-[10px] text-white/70">{spec.kicker}</p>
          <p className="flex items-center gap-1 text-[28px] leading-none font-bold tracking-tight">
            {spec.value}
            <Sparkles className="size-3.5 text-gold" />
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] text-white/80">{spec.line}</p>
        </div>
        <div className="h-16 w-px shrink-0 bg-white/20" />
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="relative grid size-[72px] place-items-center">
            <svg viewBox="0 0 80 80" className="size-[72px] -rotate-90">
              <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r={r}
                fill="none"
                stroke="#c4b5fd"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-base leading-none font-bold">{spec.pct}%</p>
              <p className="mt-0.5 text-[7px] leading-tight text-white/70">{spec.ring}</p>
            </div>
          </div>
          <div className="w-[68px]">
            <p className="text-[10px] text-white/70">{spec.side}</p>
            <p className="text-base leading-none font-bold">{spec.sideValue}</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-[#c4b5fd]" style={{ width: `${spec.pct}%` }} />
            </div>
            <p className="mt-1 text-[8px] text-white/70">{spec.foot}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
