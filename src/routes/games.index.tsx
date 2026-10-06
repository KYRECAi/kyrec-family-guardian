import { createFileRoute, Link } from "@tanstack/react-router";
import { UpgradeGate } from "@/components/upgrade-gate";
import { GAMES } from "@/lib/family";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/games/")({ component: GamesPage });

function GamesPage() {
  const best = useGuardian((s) => s.gameBest);

  return (
    <UpgradeGate need="plus" companion="stan" headline="Family points for the shop run, not a score against anyone.">
    <div className="mx-auto max-w-5xl py-5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Seasonal family games</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Family points become family moments</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Planned pop-up games turn positive habits into short cooperative events. Everyone contributes to one team score. Opt-in play, no pay-to-win.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to="/games/$id"
            params={{ id: g.id }}
            className="flex flex-col rounded-xl bg-panel p-5 shadow-[var(--shadow-border)]"
          >
            <p className="text-[11px] font-medium tracking-wider text-muted uppercase">{g.season}</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{g.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{g.blurb}</p>
            <p className="mt-4 text-sm text-gold">Household best {best[g.id] ?? 0}</p>
          </Link>
        ))}
      </div>
    </div>
    </UpgradeGate>
  );
}
