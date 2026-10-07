import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Compass, MapPinned, ShoppingBag, Siren, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { COMPANION_LORE, COMPANION_ORDER } from "@/lib/companions";
import { HOUSEHOLD, MEMBERS } from "@/lib/family";
import { avatarSrc } from "@/lib/avatars";
import { useGuardian, type Mood } from "@/lib/store";
import { usePeople } from "@/lib/people";
import { usePerthClock } from "@/lib/presence";

export const Route = createFileRoute("/")({ component: Home });

function todayJob(hour: number): { kicker: string; title: string; body: string; id: "map" | "pulse" | "stan"; cta: string } {
  if (hour < 12) {
    return {
      kicker: "This morning",
      title: "Who’s home.",
      body: "Michael, Kelly, Paige, Chelsea and Madison. One map.",
      id: "map",
      cta: "Open the map",
    };
  }
  if (hour < 17) {
    return {
      kicker: "This afternoon",
      title: "Pulse has the afternoon.",
      body: "Sport, pickup, dinner. Say it once. It’s on the plan.",
      id: "pulse",
      cta: "Open Pulse",
    };
  }
  return {
    kicker: "Tonight",
    title: "Stan, before you decide.",
    body: "He lays the choice out. You make it.",
    id: "stan",
    cta: "Ask Stan",
  };
}

function Home() {
  const clock = usePerthClock();
  const sharing = useGuardian((s) => s.sharing);
  const paused = useGuardian((s) => s.locationPaused);
  const noteVisit = useGuardian((s) => s.noteVisit);
  const events = useGuardian((s) => s.events);
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const addMood = useGuardian((s) => s.addMood);
  const [sos, setSos] = useState(false);
  const { people, familyName } = usePeople();
  const displayName = useGuardian((s) => s.displayName) || HOUSEHOLD.youName;
  const inZones = people.filter((m) => !m.guest && sharing[m.id] && !paused && m.status === "still").length;
  const job = todayJob(clock.hour);
  const face = youPhoto || (avatarId ? avatarSrc(avatarId) : null);
  const next = events[0];
  const lead = job.id === "map" ? null : COMPANION_LORE[job.id];

  useEffect(() => {
    noteVisit();
  }, [noteVisit]);

  return (
    <div className="relative -mx-4 min-h-[calc(100dvh-6.5rem)] overflow-hidden pb-8">
      <div className="relative mx-auto max-w-lg px-4 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-[24px] bg-panel px-4 py-3 shadow-[var(--shadow-border)] backdrop-blur-md">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-violet uppercase">{familyName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {clock.greeting}, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {paused ? "Sharing is paused." : `${inZones} of ${people.filter((m) => !m.guest).length} are home.`}
          </p>
        </div>
        <Link to="/settings" className="shrink-0 rounded-full bg-panel p-1 shadow-[var(--shadow-border)] backdrop-blur-md">
          <MemberAvatar member={MEMBERS[0]!} src={face} size={48} />
        </Link>
      </div>

      <div className="relative mt-4">
        {job.id === "map" ? (
          <Link to="/map" className="flex gap-3 overflow-hidden rounded-[28px] bg-panel p-4 shadow-[var(--shadow-lift)] backdrop-blur-md">
            <img src="/brand/home.jpg" alt="" className="h-28 w-24 shrink-0 rounded-2xl object-cover" />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-violet uppercase">{job.kicker}</p>
              <p className="mt-1 text-xl font-semibold leading-tight">{job.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{job.body}</p>
              <span className="mt-3 inline-flex rounded-full bg-violet px-4 py-2 text-sm font-medium text-paper">{job.cta}</span>
            </div>
          </Link>
        ) : (
          <Link to="/companions/$id" params={{ id: job.id }} className="flex gap-3 overflow-hidden rounded-[28px] bg-panel p-4 shadow-[var(--shadow-lift)] backdrop-blur-md">
            <img src={lead?.portrait} alt="" className="h-28 w-24 shrink-0 rounded-2xl object-cover object-[center_12%]" />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-violet uppercase">{job.kicker}</p>
              <p className="mt-1 text-xl font-semibold leading-tight">{job.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{job.body}</p>
              <span className="mt-3 inline-flex rounded-full bg-violet px-4 py-2 text-sm font-medium text-paper">{job.cta}</span>
            </div>
          </Link>
        )}
      </div>

      <ul className="relative mt-4 space-y-2">
        <li>
          <Link to="/map" className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)] backdrop-blur-md">
            <span className="grid size-10 place-items-center rounded-2xl bg-orange/15 text-orange"><MapPinned className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Who’s home</span>
              <span className="block text-xs text-muted">One map</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/companions/$id" params={{ id: "pulse" }} className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)] backdrop-blur-md">
            <span className="grid size-10 place-items-center rounded-2xl bg-mint/15 text-mint"><CalendarDays className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">The day</span>
              <span className="block text-xs text-muted">Sport, pickup, dinner</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/companions/$id" params={{ id: "stan" }} className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)] backdrop-blur-md">
            <span className="grid size-10 place-items-center rounded-2xl bg-violet/15 text-violet"><Sparkles className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">A decision</span>
              <span className="block text-xs text-muted">Stan lays it out. You choose.</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/companions/$id" params={{ id: "nova" }} className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)] backdrop-blur-md">
            <span className="grid size-10 place-items-center rounded-2xl bg-gold/20 text-orange"><ShoppingBag className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">The shop list</span>
              <span className="block text-xs text-muted">Snatch one item, not the lot</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/companions/$id" params={{ id: "scout" }} className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)] backdrop-blur-md">
            <span className="grid size-10 place-items-center rounded-2xl bg-blue/15 text-blue"><Compass className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">A destination</span>
              <span className="block text-xs text-muted">Scout logs it for Pulse</span>
            </span>
          </Link>
        </li>
      </ul>

      <div className="relative mt-6">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Talk now</p>
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {COMPANION_ORDER.map((id) => {
            const c = COMPANION_LORE[id];
            return (
              <li key={id}>
                <Link to="/companions/$id" params={{ id }} className="flex flex-col items-center gap-1">
                  <img src={c.portrait} alt="" className="size-14 rounded-2xl object-cover object-[center_12%] shadow-[var(--shadow-border)]" />
                  <span className="text-[11px] font-medium">{c.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Household</h2>
          <Link to="/map" className="text-xs font-medium text-violet">
            Map
          </Link>
        </div>
        <ul className="mt-2 space-y-2">
          {people.map((m) => (
            <li key={m.id}>
              <Link to="/map" className="flex items-center gap-3 rounded-2xl bg-panel px-3 py-2 shadow-[var(--shadow-border)]">
                <span className="relative">
                  <MemberAvatar member={m} src={m.you ? face : undefined} size={40} />
                  <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-green shadow-[0_0_8px_#16a34a]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.name}</span>
                  <span className="block truncate text-xs text-muted">{paused ? "Sharing paused" : m.place}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">On the plan</h2>
          <Link to="/companions/$id" params={{ id: "pulse" }} className="text-xs font-medium text-violet">
            Tell Pulse
          </Link>
        </div>
        {next ? (
          <p className="mt-2 text-sm">
            <span className="font-medium">{next.title}</span>
            <span className="text-muted"> · {next.start} · {next.who}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">Nothing yet. One sentence to Pulse puts it here.</p>
        )}
      </section>

      <section className="mt-4">
        <h2 className="text-sm font-semibold">How are you</h2>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {(
            [
              ["Bright", "bg-mint/15 text-mint"],
              ["Steady", "bg-blue/15 text-blue"],
              ["Light", "bg-gold/25 text-orange"],
              ["Low", "bg-pink/15 text-pink"],
            ] as const
          ).map(([label, tone]) => (
            <Link
              key={label}
              to="/companions/$id"
              params={{ id: "nova" }}
              onClick={() => addMood(label.toLowerCase() as Mood, "")}
              className={`rounded-2xl bg-panel py-3 text-center text-xs font-semibold shadow-[var(--shadow-border)] ${tone}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-4 flex items-center justify-between">
        <Link to="/settings" className="text-xs font-medium text-muted">
          Settings · terms · privacy
        </Link>
        <button type="button" onClick={() => setSos(true)} className="inline-flex items-center gap-1 text-xs font-medium text-danger">
          <Siren className="size-3.5" /> SOS
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-subtle">Private. Secure. You’re in control.</p>

      {sos ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-navy/40 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-3xl bg-panel p-5 shadow-[var(--shadow-lift)]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">KYREC is not an emergency service</h2>
              <button type="button" onClick={() => setSos(false)} className="grid size-10 place-items-center rounded-full hover:bg-black/5">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If anyone is in danger in Australia, call 000 now. Family Guardian cannot contact emergency services, police, or medical help.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="tel:000" className="flex-1">
                <Button className="w-full" variant="danger">
                  Call 000
                </Button>
              </a>
              <Button className="flex-1" variant="outline" onClick={() => setSos(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
