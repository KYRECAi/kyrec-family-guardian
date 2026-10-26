import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useHousehold } from "@/lib/household-context";
import { canOpenFeatureRoute } from "@/lib/child-feature-contract";

export function ChildFeatureGate({ children }: { children: ReactNode }) {
  const { snapshot } = useHousehold();
  const path = useRouterState({ select: (state) => state.location.pathname });
  if (!snapshot) return null;
  if (canOpenFeatureRoute(path, snapshot.member_role, snapshot.feature_access))
    return <>{children}</>;
  return (
    <section className="mx-auto max-w-lg py-8">
      <h1 className="text-2xl font-semibold">This feature is switched off</h1>
      <p className="mt-3 text-sm text-muted">
        Your parent can choose your access in Settings. Your age does not change these choices
        automatically.
      </p>
      <Link to="/" className="mt-4 inline-block min-h-11 text-violet">
        Back to home
      </Link>
      <p className="mt-4 text-sm">
        In immediate danger in Australia,{" "}
        <a href="tel:000" className="underline">
          call 000
        </a>
        . You do not need feature access to get help.
      </p>
    </section>
  );
}

export function ChildHome() {
  const { snapshot } = useHousehold();
  if (!snapshot) return null;
  const features = snapshot.feature_access;
  const companions = ["stan", "nova", "pulse", "moneybags", "scout"] as const;
  const any = features.games || features.map || companions.some((id) => features[id]);
  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="text-2xl font-semibold">Your space</h1>
      <p className="mt-2 text-sm text-muted">The features your parent has chosen for you.</p>
      <div className="mt-5 grid gap-3">
        {features.games && (
          <Link
            to="/games"
            className="rounded-2xl bg-panel p-5 font-semibold shadow-[var(--shadow-border)]"
          >
            Games
          </Link>
        )}
        {features.map && (
          <Link
            to="/map"
            className="rounded-2xl bg-panel p-5 font-semibold shadow-[var(--shadow-border)]"
          >
            Map
          </Link>
        )}
        {companions
          .filter((id) => features[id])
          .map((id) => (
            <Link
              key={id}
              to="/companions/$id"
              params={{ id }}
              className="rounded-2xl bg-panel p-5 font-semibold capitalize shadow-[var(--shadow-border)]"
            >
              {id}
            </Link>
          ))}
        {!any && (
          <p className="rounded-2xl bg-panel p-5 text-sm">
            Your features are switched off. Your parent can choose them in Settings.
          </p>
        )}
      </div>
      <Link to="/settings" className="mt-5 inline-block min-h-11 text-sm text-violet">
        Settings and access choices
      </Link>
      <p className="mt-4 text-sm">
        In immediate danger in Australia,{" "}
        <a href="tel:000" className="underline">
          call 000
        </a>
        . Help stays available.
      </p>
    </div>
  );
}
