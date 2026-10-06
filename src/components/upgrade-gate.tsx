import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { COMPANION_LORE, type CompanionId } from "@/lib/companions";
import { AUD, PLAN_LABEL, PRICE, accessPct, meetsPlan, type PlanId } from "@/lib/plans";
import { useGuardian } from "@/lib/store";

export function UpgradeGate({
  need,
  companion,
  headline,
  children,
}: {
  need: PlanId | "scout";
  companion: CompanionId;
  headline?: string;
  children: ReactNode;
}) {
  const plan = useGuardian((s) => s.plan);
  const scoutOn = useGuardian((s) => s.scoutOn);
  const ok = need === "scout" ? scoutOn : meetsPlan(plan, need);
  const pct = accessPct(companion, plan, scoutOn);
  const c = COMPANION_LORE[companion];

  if (ok) {
    if (pct > 0 && pct < 100) {
      return (
        <>
          <div className="mx-auto max-w-lg px-0 pt-4">
            <Link
              to="/plan"
              className="flex items-center justify-between rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]"
            >
              <p className="text-sm">
                <span className="font-semibold">
                  {companion === "nova"
                    ? "Nova’s meals and the shop list"
                    : companion === "moneybags"
                      ? "The household budget"
                      : companion === "pulse"
                        ? "Pulse holds the day"
                        : `${c.name} is on ${PLAN_LABEL[plan]}`}
                </span>
              </p>
              <span className="text-xs font-medium text-violet">See plans</span>
            </Link>
          </div>
          {children}
        </>
      );
    }
    return children;
  }

  const price =
    need === "scout"
      ? `${AUD.format(PRICE.scout)} / mo`
      : need === "plus"
        ? `${AUD.format(PRICE.plus)} / mo · Plus`
        : need === "pro"
          ? `${AUD.format(PRICE.pro)} / mo · Pro`
          : `${AUD.format(PRICE.complete)} / mo · Complete`;

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="overflow-hidden rounded-3xl bg-navy text-paper shadow-[var(--shadow-lift)]">
        <img src={c.portrait} alt="" className="h-44 w-full object-cover object-[center_18%] opacity-90" />
        <div className="p-5">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase opacity-70">
            {need === "scout" ? "Scout add-on" : PLAN_LABEL[need]} · {c.role}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {headline ??
              (need === "scout"
                ? "A destination in Maps. Scout logs it and hands it to Pulse."
                : need === "plus"
                  ? "The shared shop list, snatch, and Nova’s meals."
                  : need === "pro"
                    ? "A week of chosen trips, and Nova in full."
                    : "Pulse holds the day, the goals, and the household.")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed opacity-85">{c.tagline}</p>
          <p className="mt-4 text-sm font-medium">{price}</p>
          <p className="mt-1 text-xs opacity-70">Saved on this device. Card billing opens in the app store.</p>
          <Link to="/plan">
            <Button className="mt-4 w-full rounded-full bg-[linear-gradient(90deg,#5b8cff,#7b3fff)]">See plans</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
