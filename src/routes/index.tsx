import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, MapPinned, MessageCircle, Shield, Siren, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FamilyMap } from "@/components/family-map";
import { MemberAvatar } from "@/components/member-avatar";
import { avatarSrc } from "@/lib/avatars";
import { type MemberId } from "@/lib/family";
import { useHouseholdMotion } from "@/lib/presence";
import { useGuardian, type Mood } from "@/lib/store";
import { usePeople } from "@/lib/people";

export const Route = createFileRoute("/")({ component: Home });

const FEELINGS = [
  { label: "Amazing", line: "Let's make the day", mood: "bright" },
  { label: "Pretty good", line: "Let's keep this", mood: "steady" },
  { label: "Okay", line: "Let's see what we need", mood: "light" },
  { label: "Better days", line: "Nova's here", mood: "low" },
] as const;

function Home() {
  const sharing = useGuardian((s) => s.sharing);
  const paused = useGuardian((s) => s.locationPaused);
  const noteVisit = useGuardian((s) => s.noteVisit);
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const addMood = useGuardian((s) => s.addMood);
  const [sos, setSos] = useState(false);
  const [selected, setSelected] = useState<MemberId>("michael");
  const motion = useHouseholdMotion();
  const { people } = usePeople();
  const face = youPhoto || (avatarId ? avatarSrc(avatarId) : null);
  const house = people.filter((m) => !m.guest);
  const moving = house.filter((m) => sharing[m.id] && !paused && m.status === "moving");
  const safe = !paused && moving.length === 0;

  useEffect(() => {
    noteVisit();
  }, [noteVisit]);

  return (
    <div className="relative -mx-4 min-h-[calc(100dvh-6.5rem)] overflow-hidden pb-8">
      <div className="relative mx-auto max-w-lg px-4 pt-3">
        <section className="overflow-hidden rounded-[28px] bg-[radial-gradient(120%_80%_at_50%_0%,color-mix(in_oklab,var(--color-violet)_28%,white),var(--color-panel)_62%)] px-4 pt-4 pb-5 shadow-[var(--shadow-lift)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold tracking-[0.22em] text-violet">NOVA</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-panel/80 px-3 py-1 text-[11px] font-semibold shadow-[var(--shadow-border)]">
              <span className={`size-2 rounded-full ${safe ? "bg-green shadow-[0_0_8px_#16a34a]" : "bg-gold"}`} />
              {paused ? "Sharing paused" : safe ? "Everyone is safe" : `${moving.length} on the way`}
            </span>
          </div>
          <h1 className="mt-4 text-[2rem] leading-[1.05] font-semibold tracking-tight">
            Know where
            <span className="block text-violet">your family is.</span>
          </h1>
          <p className="mt-2 text-sm text-muted">Stay connected. Stay protected. Together.</p>
          <ul className="mt-4 grid grid-cols-3 gap-2">
            <li>
              <Link to="/map" className="block rounded-2xl bg-panel/75 px-2 py-2 text-center shadow-[var(--shadow-border)]">
                <Shield className="mx-auto size-4 text-violet" />
                <span className="mt-1 block text-[11px] font-semibold">Real time</span>
                <span className="block text-[10px] text-muted">Family safety</span>
              </Link>
            </li>
            <li>
              <Link to="/companions/$id" params={{ id: "nova" }} className="block rounded-2xl bg-panel/75 px-2 py-2 text-center shadow-[var(--shadow-border)]">
                <MessageCircle className="mx-auto size-4 text-violet" />
                <span className="mt-1 block text-[11px] font-semibold">Stay connected</span>
                <span className="block text-[10px] text-muted">Anytime</span>
              </Link>
            </li>
            <li>
              <Link to="/settings" className="block rounded-2xl bg-panel/75 px-2 py-2 text-center shadow-[var(--shadow-border)]">
                <Bell className="mx-auto size-4 text-violet" />
                <span className="mt-1 block text-[11px] font-semibold">Smart alerts</span>
                <span className="block text-[10px] text-muted">When it matters</span>
              </Link>
            </li>
          </ul>
        </section>

        <section className="relative mt-3 overflow-hidden rounded-[28px] bg-panel p-3 shadow-[var(--shadow-border)]">
          <div className="mb-2 flex items-end justify-between px-1">
            <Link to="/companions/$id" params={{ id: "stan" }} className="flex items-center gap-2">
              <img src="/companions/stan.jpg" alt="" className="size-12 rounded-2xl object-cover object-[center_12%]" />
              <span className="text-xs font-semibold">Stan</span>
            </Link>
            <Link to="/map" className="text-[11px] font-semibold tracking-[0.14em] text-violet uppercase">Open map</Link>
            <Link to="/companions/$id" params={{ id: "nova" }} className="flex items-center gap-2">
              <span className="text-xs font-semibold">Nova</span>
              <img src="/companions/nova.jpg" alt="" className="size-12 rounded-2xl object-cover object-[center_12%]" />
            </Link>
          </div>
          <div className="holo-stage">
            <FamilyMap
              compact
              variant="stage"
              paused={paused}
              sharing={sharing}
              selectedId={selected}
              onSelect={setSelected}
              positions={motion.positions}
            />
            <div className="holo-scan pointer-events-none absolute inset-0" />
          </div>
          <ul className="space-y-2">
            {house.map((m) => (
              <li key={m.id}>
                <Link to="/map" className="flex items-center gap-3 rounded-2xl bg-ink-2 px-3 py-2">
                  <MemberAvatar member={m} src={m.you ? face : undefined} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{m.you ? "You" : m.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <span className={`size-1.5 rounded-full ${m.status === "moving" ? "bg-gold" : "bg-green"}`} />
                      {paused || !sharing[m.id] ? "Sharing off" : m.place === "Home" ? "361 Wright Road" : m.place}
                    </span>
                  </span>
                  <MapPinned className="size-4 text-violet" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-semibold">
            <Link to="/companions/$id" params={{ id: "stan" }} className="rounded-2xl bg-ink-2 px-3 py-2 text-center">Stan watches the choice.</Link>
            <Link to="/companions/$id" params={{ id: "nova" }} className="rounded-2xl bg-ink-2 px-3 py-2 text-center">Nova has the house.</Link>
          </div>
        </section>

        <section className="mt-4">
          <h2 className="text-center text-sm font-semibold">How are you feeling today?</h2>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {FEELINGS.map((feel) => (
              <Link
                key={feel.mood}
                to="/companions/$id"
                params={{ id: "nova" }}
                onClick={() => addMood(feel.mood as Mood, feel.label)}
                className="rounded-2xl border border-violet/30 bg-panel px-1 py-3 text-center shadow-[0_0_16px_color-mix(in_oklab,var(--color-violet)_35%,transparent)]"
              >
                <span className="block text-xs font-semibold text-violet">{feel.label}</span>
                <span className="mt-1 block text-[10px] leading-tight text-muted">{feel.line}</span>
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
        <p className="mt-4 text-center text-xs text-subtle">Private. Secure. You’re in control.</p>

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
                  <Button className="w-full" variant="danger">Call 000</Button>
                </a>
                <Button className="flex-1" variant="outline" onClick={() => setSos(false)}>Close</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}