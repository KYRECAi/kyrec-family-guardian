import { useState } from "react";
import { usePeople } from "@/lib/people";
import { useGuardian } from "@/lib/store";

const HORIZONS = ["This season", "This year", "Someday"] as const;

const PUBLIC = [
  { test: /job|work|career|apprentice|trade/, title: "Jobs and Skills WA", href: "https://www.jobsandskills.wa.gov.au/" },
  { test: /study|tafe|course|uni|exam|atar/, title: "TAFE WA", href: "https://www.tafe.wa.edu.au/" },
  { test: /money|save|budget|house/, title: "MoneySmart", href: "https://moneysmart.gov.au/" },
  { test: /health|fit|run|sport|team|train/, title: "Healthdirect", href: "https://www.healthdirect.gov.au/" },
  { test: /licence|license|drive|car/, title: "Transport WA", href: "https://www.transport.wa.gov.au/" },
];

function publicPage(want: string) {
  const hit = PUBLIC.find((p) => p.test.test(want.toLowerCase()));
  return hit ?? { title: "Services Australia", href: "https://www.servicesaustralia.gov.au/" };
}

function perthToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function PulseGoals() {
  const goals = useGuardian((s) => s.goals) ?? [];
  const addGoal = useGuardian((s) => s.addGoal);
  const removeGoal = useGuardian((s) => s.removeGoal);
  const addEvent = useGuardian((s) => s.addEvent);
  const { people } = usePeople();
  const [who, setWho] = useState(people[0]?.name ?? "Michael");
  const [want, setWant] = useState("");
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>("This year");
  const [planned, setPlanned] = useState<string | null>(null);

  return (
    <section className="mt-4 rounded-[24px] bg-panel p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] font-semibold tracking-wide text-violet uppercase">Future</p>
      <h2 className="mt-1 text-lg font-semibold">Goals and wants</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Say what someone wants next. Pulse puts a step on the plan. Public pages, Google, and ChatGPT stay closed until you open them. KYREC does not look anyone up.
      </p>

      <form
        className="mt-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          addGoal(who, want, horizon);
          setWant("");
        }}
      >
        <div className="flex gap-2">
          <select value={who} onChange={(e) => setWho(e.target.value)} className="h-11 rounded-full bg-ink-2 px-3 text-sm outline-none">
            {people.map((m) => (
              <option key={m.id}>{m.name}</option>
            ))}
          </select>
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as (typeof HORIZONS)[number])}
            className="h-11 rounded-full bg-ink-2 px-3 text-sm outline-none"
          >
            {HORIZONS.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            value={want}
            onChange={(e) => setWant(e.target.value)}
            placeholder="What do they want to get better at?"
            className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-4 text-sm outline-none"
          />
          <button type="submit" className="h-11 rounded-full bg-blue px-4 text-sm font-medium text-paper">
            Add
          </button>
        </div>
      </form>

      <ul className="mt-4 space-y-3">
        {goals.map((goal) => {
          const page = publicPage(goal.want);
          const q = encodeURIComponent(`${goal.want} in Perth, Western Australia. Practical public steps only.`);
          const ask = encodeURIComponent(
            `Help with this family goal using public information only. Who: ${goal.who}. Goal: ${goal.want}. Horizon: ${goal.horizon}. Give five small steps. Do not invent private facts.`,
          );
          return (
            <li key={goal.id} className="rounded-2xl bg-ink-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {goal.who} · {goal.horizon}
                  </p>
                  <p className="mt-0.5 text-sm">{goal.want}</p>
                </div>
                <button type="button" onClick={() => removeGoal(goal.id)} className="text-[11px] text-muted">
                  Remove
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">Next step: one practice, one public page, then a day on the plan.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <a href={page.href} target="_blank" rel="noreferrer" className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium">
                  {page.title}
                </a>
                <a
                  href={`https://www.google.com/search?q=${q}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium"
                >
                  Google
                </a>
                <a
                  href={`https://chatgpt.com/?q=${ask}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium"
                >
                  ChatGPT
                </a>
                <button
                  type="button"
                  onClick={() => {
                    addEvent(`${goal.who}: ${goal.want}`, perthToday(), "16:00", goal.who);
                    setPlanned(goal.id);
                  }}
                  className="rounded-full bg-violet px-3 py-1.5 text-xs font-medium text-paper"
                >
                  Put a step on the plan
                </button>
              </div>
              {planned === goal.id ? <p className="mt-2 text-xs text-violet">On today’s plan at 4:00.</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
