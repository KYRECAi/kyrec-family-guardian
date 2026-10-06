import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { UpgradeGate } from "@/components/upgrade-gate";
import { Button } from "@/components/ui/button";
import { useGuardian, type Mood } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nova")({ component: NovaPage });

const MOODS: { id: Mood; label: string; blurb: string }[] = [
  { id: "bright", label: "Bright", blurb: "Light in an ordinary moment" },
  { id: "steady", label: "Steady", blurb: "Ordinary and OK" },
  { id: "light", label: "Light", blurb: "A little more room to breathe" },
  { id: "low", label: "Low", blurb: "Quiet — no need to explain" },
];

function NovaPage() {
  const moods = useGuardian((s) => s.novaMoods);
  const add = useGuardian((s) => s.addMood);
  const [mood, setMood] = useState<Mood>("steady");
  const [note, setNote] = useState("");

  return (
    <UpgradeGate need="plus" companion="nova">
    <div className="mx-auto max-w-3xl py-5">
      <div className="flex items-center gap-3">
        <img src="/companions/nova.jpg" alt="" className="size-14 rounded-full object-cover object-[center_12%] shadow-[0_0_0_2px_var(--color-pink)]" />
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Approved character · chosen wellbeing</p>
          <h1 className="text-2xl font-semibold tracking-tight">Nova</h1>
          <p className="text-sm text-muted">Feel heard. Care gently. Find lightness.</p>
          <Link to="/companions/$id" params={{ id: "nova" }} className="mt-1 inline-block text-xs font-medium text-blue">
            Official lore
          </Link>
        </div>
      </div>

      <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">
        Nova is for warmth when someone wants it. Nothing here is required, scored, or visible unless this household chooses to keep a note.
      </p>

      <section className="mt-5 rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Optional check-in</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMood(m.id)}
              className={cn(
                "rounded-lg px-3 py-3 text-left shadow-[var(--shadow-border)]",
                mood === m.id ? "bg-pink/15" : "bg-ink-2",
              )}
            >
              <span className="block text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted">{m.blurb}</span>
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="A sentence, if you want one"
          className="mt-3 w-full resize-none rounded-lg bg-ink-2 px-3 py-2 text-sm outline-none placeholder:text-subtle"
        />
        <Button
          className="mt-3"
          onClick={() => {
            add(mood, note.trim());
            setNote("");
          }}
        >
          Save privately on this device
        </Button>
      </section>

      {moods.length ? (
        <ul className="mt-5 space-y-2">
          {moods.map((m) => (
            <li key={m.at} className="rounded-xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="text-sm font-medium capitalize">{m.mood}</p>
              {m.note ? <p className="mt-1 text-sm text-muted">{m.note}</p> : null}
              <p className="mt-1 text-xs text-subtle">{new Date(m.at).toLocaleString("en-AU")}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-subtle">No check-ins yet. That is a perfectly good state.</p>
      )}

      <section className="mt-6 rounded-3xl border border-dashed border-line bg-panel px-5 py-8 text-center">
        <h2 className="font-semibold">Meal plan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          No meals are planned yet. Nova will not invent a family menu or fill this with sample dinners. Add a meal only if someone in this household wants one.
        </p>
      </section>
    </div>
    </UpgradeGate>
  );
}
