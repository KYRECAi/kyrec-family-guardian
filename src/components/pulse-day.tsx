import { Link } from "@tanstack/react-router";
import { DayBoard } from "@/components/day-board";
import { ROUTINES } from "@/lib/family";
import { useGuardian } from "@/lib/store";

function perthToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function PulseDay() {
  const events = useGuardian((s) => s.events) ?? [];
  const today = perthToday();
  const mine = events.filter((e) => e.date === today);
  const standing = ROUTINES.filter((r) => r.companion === "pulse").map((r) => ({
    id: r.id,
    title: r.title,
    start: r.when,
    who: r.who,
    fixed: true,
  }));

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-lg font-semibold">Today</h2>
        <Link to="/planner" className="text-xs font-medium text-pink">
          Open the day
        </Link>
      </div>
      <DayBoard items={[...standing, ...mine]} />
    </section>
  );
}
