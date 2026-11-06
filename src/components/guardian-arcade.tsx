import { useNavigate } from "@tanstack/react-router";
import { useGuardian } from "@/lib/store";
import { useHousehold } from "@/lib/household-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { arcadeBestKey, type ArcadeGameId } from "@/lib/arcade-contract";
import { ArcadePlayer } from "./arcade-player";

export function GuardianArcade({ game }: { game: ArcadeGameId }) {
  const { user } = useCurrentUserState();
  const { snapshot } = useHousehold();
  const navigate = useNavigate();
  const record = useGuardian(s => s.recordArcadeScore);
  const scope = user?.id && snapshot?.household_id ? JSON.stringify([user.id, snapshot.household_id]) : null;
  const best = useGuardian(s => scope ? s.arcadeBest?.[arcadeBestKey(game, scope)] ?? 0 : 0);
  // Account/household changes start a new isolated embedded game session.
  return <ArcadePlayer key={`${game}:${user?.id ?? "signed-out"}:${snapshot?.household_id ?? "no-family"}`}
    game={game} best={best} onScore={(reportedGame, score) => { if (scope) record(reportedGame, score, scope); }} onClose={() => { void navigate({ to: "/games" }); }} />;
}
