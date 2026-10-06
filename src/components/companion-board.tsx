import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Droplets,
  HandHeart,
  Heart,
  Info,
  MapPinned,
  MessageCircleHeart,
  Shield,
  Smile,
  Sparkles,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { CompanionId } from "@/lib/companions";
import { HOUSEHOLD } from "@/lib/family";
import { useGuardian, type Mood } from "@/lib/store";

type Stat = { icon: LucideIcon; wash: string; ink: string; label: string; value: string; dot: string };
type Row = { icon: LucideIcon; wash: string; ink: string; title: string; body: string; to: string };
type Tile = { icon: LucideIcon; label: string; to: string };

function Gauge({ pct, caption }: { pct: number; caption: string }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.72;
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * arc;
  return (
    <div className="relative grid size-[92px] shrink-0 place-items-center">
      <svg viewBox="0 0 88 88" className="size-[92px] -rotate-[130deg]">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#ede9fe" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${arc} ${circ}`} />
        <circle cx="44" cy="44" r={r} fill="none" stroke="#7c3aed" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute text-center">
        <p className="text-[22px] leading-none font-bold text-[#5b35d5]">{pct}%</p>
        <p className="mt-0.5 text-[9px] text-muted">{caption}</p>
      </div>
    </div>
  );
}

function novaRead(mood: Mood | undefined) {
  if (mood === "low") return { pct: 46, caption: "Quiet is fine", mood: "Low", energy: "Low", support: "Close" };
  if (mood === "light") return { pct: 64, caption: "More room", mood: "Light", energy: "Steady", support: "Here" };
  if (mood === "bright") return { pct: 90, caption: "Doing great!", mood: "Bright", energy: "High", support: "Strong" };
  return { pct: 82, caption: "Doing great!", mood: "Good", energy: "High", support: "Strong" };
}

export function CompanionBoard({ id }: { id: CompanionId }) {
  const moods = useGuardian((s) => s.novaMoods) ?? [];
  const paused = useGuardian((s) => s.locationPaused);
  const events = useGuardian((s) => s.events) ?? [];
  const scoutLogs = useGuardian((s) => s.scoutLogs) ?? [];
  const spent = useGuardian((s) => s.budgetSpent);
  const points = useGuardian((s) => s.points);
  const [open, setOpen] = useState<number | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const read = novaRead(moods[0]?.mood);
  const place = scoutLogs[0]?.place;
  const left = Math.max(0, HOUSEHOLD.budgetTarget - spent);
  const weekPct = Math.max(0, Math.min(100, Math.round((left / HOUSEHOLD.budgetTarget) * 100)));
  const next = events[0];

  const copy: Record<
    CompanionId,
    { title: string; icon: LucideIcon; pct: number; caption: string; hint: string; stats: Stat[]; listTitle: string; rows: Row[]; note: string; sign: string; ask: string; tiles: Tile[]; wash: string }
  > = {
    nova: {
      title: "Wellbeing",
      icon: Heart,
      pct: read.pct,
      caption: read.caption,
      hint: "This is how today was marked. It is not a medical score.",
      stats: [
        { icon: Smile, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", label: "Mood", value: read.mood, dot: "bg-[#7c3aed]" },
        { icon: Zap, wash: "bg-[#e5fbf4]", ink: "text-[#14b8a6]", label: "Energy", value: read.energy, dot: "bg-[#14b8a6]" },
        { icon: Users, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", label: "Support", value: read.support, dot: "bg-[#7c3aed]" },
      ],
      listTitle: "Today’s Support",
      rows: [
        { icon: Users, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", title: "Everyone shared a win", body: "Joy builds connection.", to: "/family" },
        { icon: Droplets, wash: "bg-[#e8f3ff]", ink: "text-[#3b82f6]", title: "Take a calm break", body: "A few deep breaths help.", to: "/family" },
        { icon: Star, wash: "bg-[#fff6e0]", ink: "text-[#f5b942]", title: "Send kind words", body: "Encourage someone today.", to: "/family" },
      ],
      note: "You don’t have to be perfect to be amazing. Just keep showing up, one kind moment at a time.",
      sign: "Nova",
      ask: "What support do we need today?",
      tiles: [
        { icon: MessageCircleHeart, label: "Check-in", to: "/family" },
        { icon: HandHeart, label: "Support", to: "/family" },
        { icon: Sparkles, label: "Calm", to: "/family" },
        { icon: Star, label: "Motivate", to: "/points" },
      ],
      wash: "from-[#f3e8ff] via-[#efe7ff] to-[#f7f2ff]",
    },
    stan: {
      title: "The call",
      icon: Shield,
      pct: paused ? 40 : 100,
      caption: paused ? "Sharing paused" : "In view",
      hint: "Stan lays the choice out. He does not make it.",
      stats: [
        { icon: MapPinned, wash: "bg-[#e8f3ff]", ink: "text-[#2563eb]", label: "Map", value: paused ? "Hidden" : "On", dot: "bg-[#2563eb]" },
        { icon: Shield, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", label: "Choice", value: "Yours", dot: "bg-[#7c3aed]" },
        { icon: Users, wash: "bg-[#e5fbf4]", ink: "text-[#14b8a6]", label: "Safety", value: "Said", dot: "bg-[#14b8a6]" },
      ],
      listTitle: "Before you decide",
      rows: [
        { icon: MapPinned, wash: "bg-[#e8f3ff]", ink: "text-[#2563eb]", title: "Look at who’s home", body: "One map. Sharing is a choice.", to: "/map" },
        { icon: Shield, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", title: "Name the options", body: "He does not pick for you.", to: "/companions/stan" },
        { icon: Heart, wash: "bg-[#fff6e0]", ink: "text-[#f5b942]", title: "You decide", body: "Then tell the house if you want.", to: "/family" },
      ],
      note: "A decision gets clearer when the facts are in view. The choice still belongs to you.",
      sign: "Stan",
      ask: "What does this decision need?",
      tiles: [
        { icon: MapPinned, label: "Look", to: "/map" },
        { icon: Shield, label: "Choose", to: "/family" },
        { icon: Car, label: "Drive", to: "/drive" },
        { icon: Heart, label: "Hold", to: "/family" },
      ],
      wash: "from-[#e8f0ff] via-[#eef2ff] to-[#f4f7ff]",
    },
    pulse: {
      title: "The rhythm",
      icon: CalendarDays,
      pct: next ? 78 : 62,
      caption: next ? "On the day" : "Room in it",
      hint: "Sport, pickup and dinner. Pulse does not decide how anyone feels.",
      stats: [
        { icon: Zap, wash: "bg-[#e5fbf4]", ink: "text-[#14b8a6]", label: "Sport", value: "4:00", dot: "bg-[#14b8a6]" },
        { icon: Car, wash: "bg-[#e8f3ff]", ink: "text-[#2563eb]", label: "Pickup", value: place ? "Set" : "Open", dot: "bg-[#2563eb]" },
        { icon: Heart, wash: "bg-[#ffe4f1]", ink: "text-[#db2777]", label: "Dinner", value: "6:30", dot: "bg-[#db2777]" },
      ],
      listTitle: "On today",
      rows: [
        { icon: Zap, wash: "bg-[#e5fbf4]", ink: "text-[#14b8a6]", title: next?.title ?? "Kids’ sport", body: next ? `${next.start} · ${next.who}` : "16:00 · Pulse and Scout", to: "/planner" },
        { icon: Car, wash: "bg-[#e8f3ff]", ink: "text-[#2563eb]", title: place ? `Pickup · ${place}` : "Pickup is still open", body: "Scout can hand a place to Pulse.", to: "/planner" },
        { icon: Heart, wash: "bg-[#ffe4f1]", ink: "text-[#db2777]", title: "Family dinner", body: "18:30 · everyone at home.", to: "/planner" },
      ],
      note: "The day holds together when sport, pickup and dinner are on the same page.",
      sign: "Pulse",
      ask: "What does today need?",
      tiles: [
        { icon: Zap, label: "Sport", to: "/planner" },
        { icon: Car, label: "Pickup", to: "/planner" },
        { icon: Heart, label: "Dinner", to: "/planner" },
        { icon: Sparkles, label: "Rest", to: "/routines" },
      ],
      wash: "from-[#e7fff6] via-[#f3e8ff] to-[#fff]",
    },
    scout: {
      title: "The trip",
      icon: MapPinned,
      pct: place ? 84 : 36,
      caption: place ? "Logged" : "No place yet",
      hint: "Scout opens Maps. She logs the place. She does not drive.",
      stats: [
        { icon: MapPinned, wash: "bg-[#fff6e0]", ink: "text-[#d97706]", label: "Place", value: place ? "Named" : "Waiting", dot: "bg-[#d97706]" },
        { icon: Car, wash: "bg-[#e8f3ff]", ink: "text-[#2563eb]", label: "Maps", value: "Ready", dot: "bg-[#2563eb]" },
        { icon: Heart, wash: "bg-[#e5fbf4]", ink: "text-[#14b8a6]", label: "Home", value: "After", dot: "bg-[#14b8a6]" },
      ],
      listTitle: "This journey",
      rows: [
        { icon: MapPinned, wash: "bg-[#fff6e0]", ink: "text-[#d97706]", title: place ?? "Name a destination", body: "Google or Apple Maps. Your choice.", to: "/companions/scout" },
        { icon: Car, wash: "bg-[#e8f3ff]", ink: "text-[#2563eb]", title: "Scout logs it", body: "The route stays in Maps.", to: "/drive" },
        { icon: CalendarDays, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", title: "Hand it to Pulse", body: "Pickup can sit on the day.", to: "/planner" },
      ],
      note: "A destination is only useful once the house can see it, and Pulse can use it.",
      sign: "Scout",
      ask: "What does this trip need?",
      tiles: [
        { icon: MapPinned, label: "Go", to: "/companions/scout" },
        { icon: Car, label: "Log", to: "/drive" },
        { icon: CalendarDays, label: "Hand off", to: "/planner" },
        { icon: Heart, label: "Home", to: "/map" },
      ],
      wash: "from-[#fff6e8] via-[#eef6ff] to-[#fff]",
    },
    moneybags: {
      title: "The week",
      icon: Wallet,
      pct: weekPct,
      caption: left > 0 ? "Room left" : "At the line",
      hint: "Real dollars for this house. Not advice. Not a score against anyone.",
      stats: [
        { icon: Wallet, wash: "bg-[#fff6e0]", ink: "text-[#d97706]", label: "Spent", value: `$${spent}`, dot: "bg-[#d97706]" },
        { icon: Sparkles, wash: "bg-[#e5fbf4]", ink: "text-[#14b8a6]", label: "Left", value: `$${left}`, dot: "bg-[#14b8a6]" },
        { icon: Star, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", label: "Points", value: points.toLocaleString("en-AU"), dot: "bg-[#7c3aed]" },
      ],
      listTitle: "This week’s money",
      rows: [
        { icon: Wallet, wash: "bg-[#fff6e0]", ink: "text-[#d97706]", title: "Look at the week", body: `$${spent} of $${HOUSEHOLD.budgetTarget}. AUD. Private.`, to: "/budget" },
        { icon: Shield, wash: "bg-[#efe7ff]", ink: "text-[#7c3aed]", title: "Stay inside the plan", body: "No one gets singled out.", to: "/budget" },
        { icon: Star, wash: "bg-[#fff6e0]", ink: "text-[#f5b942]", title: "The bonus waits", body: "It shows when the week is earned.", to: "/games/moneybags" },
      ],
      note: "The week is shared. The bonus shows up when the house has earned it, not before.",
      sign: "Moneybags",
      ask: "What does the week need?",
      tiles: [
        { icon: Wallet, label: "Look", to: "/budget" },
        { icon: Shield, label: "Plan", to: "/budget" },
        { icon: Star, label: "Play", to: "/games/moneybags" },
        { icon: Heart, label: "Hold", to: "/family" },
      ],
      wash: "from-[#fff6e0] via-[#fff] to-[#efe7ff]",
    },
  };

  const board = copy[id];
  const HeadIcon = board.icon;

  return (
    <div className="mt-4 space-y-3">
      <section className="rounded-[28px] bg-white px-3 py-3 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-7 place-items-center rounded-full bg-[#efe7ff] text-[#7c3aed]">
              <HeadIcon className="size-3.5" />
            </span>
            {board.title}
          </p>
          <button type="button" onClick={() => setOpen(open === -1 ? null : -1)} className="grid size-7 place-items-center rounded-full text-muted" aria-label="About this card">
            <Info className="size-4" />
          </button>
        </div>
        {open === -1 ? <p className="mt-2 text-xs text-muted">{board.hint}</p> : null}
        <div className="mt-2 flex items-center gap-1">
          <Gauge pct={board.pct} caption={board.caption} />
          <div className="grid min-w-0 flex-1 grid-cols-3">
            {board.stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`px-1 text-center ${i ? "border-l border-black/5" : ""}`}>
                  <span className={`mx-auto grid size-9 place-items-center rounded-full ${stat.wash} ${stat.ink}`}>
                    <Icon className="size-4" />
                  </span>
                  <p className="mt-1 text-[10px] text-muted">{stat.label}</p>
                  <p className="flex items-center justify-center gap-1 text-xs font-semibold">
                    {stat.value}
                    <span className={`size-1.5 rounded-full ${stat.dot}`} />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-[28px] bg-white p-3 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-[#efe7ff] text-[#7c3aed]">
                <Heart className="size-3.5" />
              </span>
              {board.listTitle}
            </p>
            <Link to="/family" className="text-xs font-medium text-[#7c3aed]">
              View all
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {board.rows.map((row, i) => {
              const Icon = row.icon;
              const key = `${id}-${i}`;
              const ticked = done[key] ?? i < 2;
              return (
                <li key={row.title}>
                  <Link to={row.to} className="flex items-center gap-2">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${row.wash} ${row.ink}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{row.title}</span>
                      <span className="block truncate text-[11px] text-muted">{row.body}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={ticked ? "Done" : "Mark this"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDone((cur) => ({ ...cur, [key]: !ticked }));
                      }}
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-[#efe7ff] text-[#7c3aed]"
                    >
                      {i === 2 && !done[key] ? <ChevronRight className="size-3.5" /> : ticked ? <Check className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${board.wash} p-4 shadow-[var(--shadow-border)]`}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-[#7c3aed]" />
            {board.sign} note
          </p>
          <p className="mt-3 text-[15px] leading-snug font-medium text-[#2a2140]">“{board.note}”</p>
          <p className="mt-3 text-xs text-muted">– {board.sign}</p>
          <span className="pointer-events-none absolute -right-3 -bottom-4 size-16 rounded-full bg-[#7c3aed]/80 shadow-[0_0_24px_rgba(124,58,237,0.7)]" />
          <span className="pointer-events-none absolute right-3 bottom-6 h-8 w-16 rounded-full border border-white/70" />
        </section>
      </div>

      <section className="rounded-[28px] bg-white p-3 shadow-[var(--shadow-border)]">
        <h2 className="px-1 text-sm font-semibold">{board.ask}</h2>
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {board.tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <li key={tile.label}>
                <Link to={tile.to} className="flex flex-col items-center rounded-2xl bg-[#f7f4ff] px-1 py-3 text-center shadow-[var(--shadow-border)]">
                  <span className="grid size-10 place-items-center text-[#6d28d9]">
                    <Icon className="size-6" />
                  </span>
                  <span className="mt-1 text-[11px] font-semibold">{tile.label}</span>
                  <span className="mt-2 grid size-5 place-items-center rounded-full bg-white text-[#7c3aed]">
                    <ChevronRight className="size-3" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
