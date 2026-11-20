import { createFileRoute, Link } from "@tanstack/react-router";
import { ScoutWeekendEvents } from "@/components/scout-weekend-events";

export const Route = createFileRoute("/weekend")({component:WeekendPage});
function WeekendPage() {
  return <main className="mx-auto min-h-dvh max-w-3xl px-4 py-8">
    <header className="rounded-[24px] bg-navy p-6 text-paper">
      <p className="text-xs font-semibold tracking-widest">KYREC FAMILY GUARDIAN · SCOUT</p>
      <h1 className="mt-2 text-3xl font-semibold">A weekend together</h1>
      <p className="mt-3 text-sm text-paper/80">Ideas from across Perth. Explore the public listings, then decide what suits your family.</p>
    </header>
    <ScoutWeekendEvents />
    <p className="mt-6 text-xs text-muted">This page reads public event records only. It does not open family accounts, read private family information or make a booking.</p>
    <nav className="mt-4 flex gap-4 text-sm text-violet"><Link to="/account">Family account</Link><Link to="/privacy">Privacy</Link></nav>
  </main>;
}
