import { Link } from "@tanstack/react-router";
import { useGuardian } from "@/lib/store";

function perthToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function MovieGap() {
  const events = useGuardian((s) => s.events) ?? [];
  const today = perthToday();
  const next = events
    .filter((event) => event.date >= today)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start))
    .slice(0, 3);

  if (!next.length) return null;

  return (
    <section className="mt-4 rounded-[24px] bg-panel p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">On the plan</h2>
        <Link to="/planner" className="text-xs font-medium text-violet">
          Open it
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {next.map((event) => (
          <li key={event.id} className="rounded-2xl bg-ink-2 px-3 py-2.5">
            <p className="text-sm font-semibold">{event.title}</p>
            <p className="text-xs text-muted">
              {event.date === today ? "Today" : event.date} · {event.start}
              {event.who ? ` · ${event.who}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
