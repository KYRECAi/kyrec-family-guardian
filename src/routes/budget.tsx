import { createFileRoute } from "@tanstack/react-router";
import { Lock, Utensils, House, Car, ShoppingBag, Heart, Star } from "lucide-react";
import { useState } from "react";
import { UpgradeGate } from "@/components/upgrade-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/budget")({ component: BudgetHub });

const TABS = ["Overview", "Plan", "Activity", "Goals"] as const;

function aud(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
}

function BudgetHub() {
  const started = useGuardian((s) => s.budgetStarted);
  const start = useGuardian((s) => s.startBudget);
  const income = useGuardian((s) => s.weeklyIncome);
  const setIncome = useGuardian((s) => s.setWeeklyIncome);
  const cats = useGuardian((s) => s.budgetCats);
  const addCat = useGuardian((s) => s.addBudgetCat);
  const txs = useGuardian((s) => s.budgetTx);
  const addTx = useGuardian((s) => s.addBudgetTx);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [catName, setCatName] = useState("");
  const [catAmt, setCatAmt] = useState("");
  const [txAmt, setTxAmt] = useState("");
  const [txNote, setTxNote] = useState("");
  const [incomeDraft, setIncomeDraft] = useState("");

  const spent = txs.reduce((s, t) => s + t.amount, 0);
  const planned = cats.reduce((s, c) => s + c.planned, 0);
  const left = Math.max(0, income - spent);
  const unallocated = Math.max(0, income - planned);

  return (
    <UpgradeGate need="pro" companion="moneybags">
    <div className="mx-auto max-w-lg py-4">
      <section className="rounded-3xl bg-panel p-5 shadow-[var(--shadow-border)]">
        <div className="flex items-start gap-3">
          <img src="/companions/icons/moneybags.png" alt="" className="size-16 rounded-2xl object-cover bg-navy" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Your family money map</p>
            <h1 className="mt-1 text-2xl font-semibold">Budget Hub</h1>
            <p className="mt-1 text-sm text-muted">Plan it, track it and understand it — with Moneybags beside you.</p>
            <Badge tone="gold" className="mt-2">
              <Lock className="mr-1 size-3" /> Private by default · AUD
            </Badge>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <p className="text-xs text-muted">This week · left after recorded spending</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{aud(left)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Unallocated in the plan</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{aud(unallocated)}</p>
          </div>
        </div>
      </section>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-11 shrink-0 rounded-full px-4 text-sm font-medium",
              tab === t ? "bg-blue text-paper" : "bg-panel text-fg shadow-[var(--shadow-border)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        !started ? (
          <section className="mt-4 rounded-3xl bg-panel px-6 py-10 text-center shadow-[var(--shadow-border)]">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-violet/15 text-violet">
              <Star className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Your real numbers start here</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No sample balances and no pretend savings. Add your income and first category to build a budget that belongs to your family.
            </p>
            <Button className="mt-5" onClick={start}>
              Start my plan
            </Button>
          </section>
        ) : (
          <section className="mt-4 rounded-3xl bg-panel p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-semibold">This week at a glance</h2>
            <p className="text-xs text-muted">Expected, planned and recorded — not guessed.</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-xs text-muted">Income</dt>
                <dd className="mt-1 font-semibold">{aud(income)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Planned</dt>
                <dd className="mt-1 font-semibold">{aud(planned)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Recorded</dt>
                <dd className="mt-1 font-semibold">{aud(spent)}</dd>
              </div>
            </dl>
          </section>
        )
      ) : null}

      {tab === "Plan" ? (
        <section className="mt-4 space-y-3">
          <form
            className="rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(incomeDraft);
              if (!Number.isFinite(n)) return;
              setIncome(n);
              setIncomeDraft("");
              if (!started) start();
            }}
          >
            <p className="text-sm font-semibold">Weekly income</p>
            <div className="mt-2 flex gap-2">
              <input
                value={incomeDraft}
                onChange={(e) => setIncomeDraft(e.target.value)}
                inputMode="decimal"
                placeholder="AUD this week"
                className="h-11 flex-1 rounded-xl bg-ink-2 px-3 text-sm outline-none"
              />
              <Button type="submit" size="sm">
                Save
              </Button>
            </div>
          </form>
          <form
            className="rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!catName.trim()) return;
              addCat(catName.trim(), Number(catAmt) || 0);
              setCatName("");
              setCatAmt("");
              if (!started) start();
            }}
          >
            <p className="text-sm font-semibold">Add a category</p>
            <div className="mt-2 grid grid-cols-[1fr_90px_auto] gap-2">
              <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Rent, food…" className="h-11 rounded-xl bg-ink-2 px-3 text-sm outline-none" />
              <input value={catAmt} onChange={(e) => setCatAmt(e.target.value)} inputMode="decimal" placeholder="AUD" className="h-11 rounded-xl bg-ink-2 px-3 text-sm outline-none" />
              <Button type="submit" size="sm">
                Add
              </Button>
            </div>
          </form>
          {cats.length === 0 ? (
            <p className="px-2 text-sm text-muted">No categories yet. This plan stays empty until you add one.</p>
          ) : (
            <ul className="space-y-2">
              {cats.map((c, i) => {
                const Icon = [House, Utensils, Car, ShoppingBag, Heart, Star][i % 6]!;
                const tone = ["bg-orange/15 text-orange", "bg-mint/15 text-mint", "bg-blue/15 text-blue", "bg-pink/15 text-pink", "bg-violet/15 text-violet", "bg-gold/25 text-orange"][i % 6];
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-[22px] bg-panel px-3 py-2.5 shadow-[var(--shadow-border)]">
                    <span className={`grid size-10 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></span>
                    <span className="min-w-0 flex-1 font-medium">{c.name}</span>
                    <span className="text-sm font-semibold">{aud(c.planned)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "Activity" ? (
        <section className="mt-4 space-y-3">
          {cats.length === 0 ? (
            <p className="rounded-3xl bg-panel px-4 py-8 text-center text-sm text-muted shadow-[var(--shadow-border)]">
              Add a category in Plan before recording spending.
            </p>
          ) : (
            <form
              className="rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]"
              onSubmit={(e) => {
                e.preventDefault();
                const cat = cats[0]!;
                addTx(cat.id, Number(txAmt) || 0, txNote.trim());
                setTxAmt("");
                setTxNote("");
              }}
            >
              <p className="text-sm font-semibold">Record spending</p>
              <div className="mt-2 flex gap-2">
                <input value={txAmt} onChange={(e) => setTxAmt(e.target.value)} inputMode="decimal" placeholder="AUD" className="h-11 w-24 rounded-xl bg-ink-2 px-3 text-sm outline-none" />
                <input value={txNote} onChange={(e) => setTxNote(e.target.value)} placeholder="What was it?" className="h-11 flex-1 rounded-xl bg-ink-2 px-3 text-sm outline-none" />
                <Button type="submit" size="sm">
                  Log
                </Button>
              </div>
            </form>
          )}
          {txs.length === 0 ? (
            <p className="px-2 text-sm text-muted">No recorded spending this week.</p>
          ) : (
            <ul className="space-y-2">
              {txs.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
                  <span className="text-sm">{t.note || "Spending"}</span>
                  <span className="font-medium">{aud(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "Goals" ? (
        <section className="mt-4 rounded-3xl bg-panel p-5 shadow-[var(--shadow-border)]">
          <h2 className="font-semibold">Family goals stay earned</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Moneybags only celebrates after this household finishes within its own weekly target and Family Points. Nothing is sold, scored against a person, or filled with sample savings.
          </p>
        </section>
      ) : null}
    </div>
    </UpgradeGate>
  );
}
