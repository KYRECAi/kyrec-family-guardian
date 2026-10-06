import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AUD,
  PLAN_CARDS,
  PLAN_LABEL,
  PRICE,
  SCOUT_CARD,
  type PlanId,
} from "@/lib/plans";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan")({ component: PlanPage });

function PlanPage() {
  const plan = useGuardian((s) => s.plan);
  const scoutOn = useGuardian((s) => s.scoutOn);
  const setPlan = useGuardian((s) => s.setPlan);
  const toggleScout = useGuardian((s) => s.toggleScout);

  function choose(id: PlanId) {
    setPlan(id);
    toast(id === "free" ? "On Family Guardian Free" : `${PLAN_LABEL[id]} is on`, {
      description: "Saved on this device. Card billing opens in the app store.",
    });
  }

  function addScout() {
    toggleScout();
    toast(scoutOn ? "Scout removed" : "Scout add-on is on", {
      description: `${AUD.format(PRICE.scout)} / mo · add or remove anytime.`,
    });
  }

  return (
    <div className="mx-auto max-w-lg pb-8">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="grid size-11 place-items-center rounded-full bg-panel shadow-[var(--shadow-border)]"
        >
          <span className="text-lg leading-none">‹</span>
        </Link>
        <div className="min-w-0 flex-1 rounded-2xl bg-panel px-4 py-3 text-center shadow-[var(--shadow-border)]">
          <h1 className="text-lg font-semibold">Plans</h1>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-violet">
            <span className="size-1.5 rounded-full bg-green" />
            Family Guardian membership
          </p>
        </div>
      </div>

      <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight">
        Choose your <span className="text-violet">Guardian</span>
      </h2>
      <p className="mt-2 text-center text-sm text-muted">Pick the plan for your household. You can change it later.</p>

      <ul className="mt-5 space-y-4">
        {PLAN_CARDS.map((card) => {
          const current = plan === card.id;
          return (
            <li key={card.id} className="rounded-[28px] bg-panel p-5 shadow-[var(--shadow-border)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-violet">{card.name}</p>
                  {card.price === 0 ? (
                    <p className="text-3xl font-semibold tracking-tight text-violet">Free</p>
                  ) : (
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-violet">
                      {AUD.format(card.price)}
                      <span className="ml-1 text-base font-medium text-muted">/mo</span>
                    </p>
                  )}
                </div>
                {card.badge ? (
                  <span className="rounded-full bg-violet px-3 py-1 text-[10px] font-semibold tracking-wide text-paper uppercase">
                    {card.badge}
                  </span>
                ) : null}
              </div>
              <ul className="mt-4 space-y-2">
                {card.includes.map((line) => (
                  <li key={line} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-green" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {current ? (
                <p className="mt-5 grid h-12 place-items-center rounded-full bg-green/15 text-sm font-semibold text-green">
                  ✓ Your current plan
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => choose(card.id)}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(90deg,#5b8cff,#7b3fff)] text-sm font-semibold text-paper"
                >
                  {card.price ? `Upgrade · ${AUD.format(card.price)}/mo` : "Switch to Free"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-[11px] font-semibold tracking-[0.16em] text-subtle uppercase">Add-ons</p>
      <section className="mt-3 rounded-[28px] bg-panel p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-violet">{SCOUT_CARD.name}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-violet">
              {AUD.format(SCOUT_CARD.price)}
              <span className="ml-1 text-base font-medium text-muted">/mo</span>
            </p>
          </div>
          <span className="rounded-full bg-violet px-3 py-1 text-[10px] font-semibold tracking-wide text-paper uppercase">
            {SCOUT_CARD.badge}
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {SCOUT_CARD.includes.map((line) => (
            <li key={line} className="flex gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-green" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        {scoutOn ? (
          <p className="mt-5 grid h-12 place-items-center rounded-full bg-green/15 text-sm font-semibold text-green">
            ✓ Scout is on
          </p>
        ) : (
          <button
            type="button"
            onClick={addScout}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-blue text-sm font-semibold text-paper"
          >
            Add Scout · {AUD.format(PRICE.scout)}/mo
          </button>
        )}
        {scoutOn ? (
          <button type="button" onClick={addScout} className="mt-2 w-full text-center text-xs text-muted">
            Remove Scout
          </button>
        ) : null}
      </section>

      <section className="mt-4 rounded-[28px] bg-navy p-5 text-paper">
        <p className="font-semibold">KYREC Business by Biko</p>
        <p className="mt-1 text-sm opacity-70">Separate app · {AUD.format(PRICE.beko)}</p>
        <Button
          className="mt-4 w-full rounded-full bg-[linear-gradient(90deg,#5b8cff,#7b3fff)]"
          onClick={() =>
            toast("Biko is a separate app", {
              description: `${AUD.format(PRICE.beko)} one-off. Not part of Family Guardian. Coming to the App Store.`,
            })
          }
        >
          Open KYREC Business
        </Button>
      </section>

      <p className="mt-5 text-center text-xs leading-relaxed text-subtle">
        Saved on this device. Card billing opens in the app store. Cancel anytime.
      </p>
    </div>
  );
}
