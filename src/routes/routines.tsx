import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Leaf, RotateCcw, Sun, Users } from "lucide-react";
import { UpgradeGate } from "@/components/upgrade-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MEMBERS } from "@/lib/family";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/routines")({ component: PulseRhythm });

const TOOLS = [
  { id: "morning", title: "Morning rhythm", hint: "Start with purpose", icon: Sun, tone: "bg-violet/15 text-violet" },
  { id: "reset", title: "Reset routine", hint: "Begin again", icon: RotateCcw, tone: "bg-green/15 text-green" },
  { id: "calm", title: "Calm minute", hint: "Slow things down", icon: Leaf, tone: "bg-violet/15 text-violet" },
  { id: "family", title: "Family rhythm", hint: "Move together", icon: Users, tone: "bg-blue/15 text-blue" },
];

function PulseRhythm() {
  const plan = useGuardian((s) => s.plan);
  const rhythm = useGuardian((s) => s.rhythm);
  const toggle = useGuardian((s) => s.toggleRhythm);
  const full = plan === "complete";

  return (
    <UpgradeGate need="complete" companion="pulse">
    <div className="mx-auto max-w-lg py-4">
      <div className="rounded-3xl bg-panel p-5 shadow-[var(--shadow-border)]">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="size-2 rounded-full bg-green" /> Pulse is In Rhythm
        </p>
        <p className="mt-1 text-sm text-muted">Steady routines and gentle resets, without pressure or perfection.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
          <div>
            <p className="text-2xl font-semibold">{MEMBERS.length}</p>
            <p className="text-[11px] text-muted">Family members linked</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">Here</p>
            <p className="text-[11px] text-muted">All chats stay on this page</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{full ? "100%" : "0%"}</p>
            <p className="text-[11px] text-muted">Companion access level</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <h2 className="font-semibold">Find your rhythm</h2>
        <p className="text-xs text-subtle">Choose a routine tool</p>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const on = rhythm[t.id];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="w-[132px] shrink-0 rounded-3xl bg-panel p-3 text-left shadow-[var(--shadow-border)]"
            >
              <span className={cn("grid size-11 place-items-center rounded-full", t.tone)}>
                <Icon className="size-5" />
              </span>
              <p className="mt-3 text-sm font-semibold">{t.title}</p>
              <p className="text-[11px] text-muted">{on ? "Chosen today" : t.hint}</p>
            </button>
          );
        })}
      </div>

      <Link to="/planner" className="mt-4 flex items-center gap-3 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <span className="grid size-12 place-items-center rounded-2xl bg-violet/15 text-violet">
          <span className="text-lg">~</span>
        </span>
        <div className="flex-1">
          <p className="font-semibold">Balance is built one repeatable step at a time.</p>
          <p className="mt-1 text-xs text-muted">Pulse helps the family reset the day without shame, pressure or perfection.</p>
        </div>
      </Link>

      <section className="mt-3 flex items-center gap-3 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <span className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-blue),var(--color-green))] text-paper">
          <CalendarDays className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Pulse Planner & Calendar</p>
          <p className="text-xs text-muted">Plan events, tasks and routines — with room to breathe.</p>
          <p className="mt-1 text-[11px] font-medium text-green">Family schedule · private by default</p>
        </div>
        <Link to="/planner">
          <Button size="sm">Open planner</Button>
        </Link>
      </section>
      {!full ? <Badge tone="muted" className="mt-3">Preview on Family Guardian Free</Badge> : null}
    </div>
    </UpgradeGate>
  );
}
