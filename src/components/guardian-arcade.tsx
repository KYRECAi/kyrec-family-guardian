import { useNavigate } from "@tanstack/react-router";
import { useGuardian } from "@/lib/store";
import { useHousehold } from "@/lib/household-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { ArcadeGameId } from "@/lib/arcade-contract";
import { ArcadePlayer } from "./arcade-player";

export function GuardianArcade({ game }: { game: ArcadeGameId }) {
  const { user } = useCurrentUserState();
  const { snapshot } = useHousehold();
  const navigate = useNavigate();
  const record = useGuardian(s => s.recordArcadeScore);
  const best = useGuardian(s => s.arcadeBest?.[game] ?? 0);
  // Account/household changes start a new isolated embedded game session.
  return <ArcadePlayer key={`${game}:${user?.id ?? "signed-out"}:${snapshot?.household_id ?? "no-family"}`}
    game={game} best={best} onScore={record} onClose={() => { void navigate({ to: "/games" }); }} />;
}
