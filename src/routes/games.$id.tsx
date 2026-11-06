import { createFileRoute, Link } from "@tanstack/react-router";
import { SeasonalCatch } from "@/components/seasonal-catch";
import { GuardianArcade } from "@/components/guardian-arcade";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/games/$id")({ component: GamePlay });

function GamePlay() {
  const { id } = Route.useParams();
  if (id !== "christmas" && id !== "valentine" && id !== "easter" && id !== "moneybags") {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">That game isn’t available.</p>
        <Link to="/games">
          <Button className="mt-4">Back to games</Button>
        </Link>
      </div>
    );
  }
  if (id === "valentine") return <GuardianArcade game="valentine" />;
  if (id === "moneybags") return <GuardianArcade game="moneybags" />;

  return <SeasonalCatch id={id} />;
}
