import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/permissions")({ component: PermissionsPage });

function PermissionsPage() {
  const reset = useGuardian((s) => s.resetDemo);
  return (
    <div className="mx-auto max-w-lg py-5">
      <h1 className="text-3xl font-semibold">Your sharing choices</h1>
      <section className="mt-5 rounded-xl bg-panel p-4">
        <h2 className="font-semibold">Your location</h2>
        <p className="mt-2 text-sm text-muted">
          Each adult controls their own sharing. Another member cannot turn your location on.
          Stopping removes your current point; points expire after five minutes if the connection is
          lost.
        </p>
        <Link to="/map" className="mt-4 inline-block min-h-11 text-sm text-violet">
          Open your location controls
        </Link>
      </section>
      <section className="mt-4 rounded-xl bg-panel p-4">
        <h2 className="font-semibold">Shared shopping</h2>
        <p className="mt-2 text-sm text-muted">
          List activity is visible to your household. The family owner manages invitations and
          access.
        </p>
        <Link to="/family" className="mt-4 inline-block min-h-11 text-sm text-violet">
          Manage family membership
        </Link>
      </section>
      <section className="mt-4 rounded-xl bg-panel p-4">
        <h2 className="font-semibold">Companion chat</h2>
        <p className="mt-2 text-sm text-muted">
          Choose whether to use OpenAI from the companion screen. A shared family list does not give
          anyone access to your private conversation.
        </p>
        <Link to="/companions" className="mt-4 inline-block min-h-11 text-sm text-violet">
          Open companions
        </Link>
      </section>
      <p className="mt-6 text-xs text-muted">
        In immediate danger in Australia, call{" "}
        <a href="tel:000" className="underline">
          000
        </a>
        . Guardian is not an emergency service.
      </p>
      <Button variant="outline" className="mt-5" onClick={reset}>
        Clear preferences on this device
      </Button>
      <p className="mt-2 text-xs text-muted">
        This clears device preferences. It does not delete your server account or shared family
        list.
      </p>
      <Link to="/privacy" className="mt-4 inline-block min-h-11 text-sm text-violet">
        Read the privacy notice
      </Link>
    </div>
  );
}
