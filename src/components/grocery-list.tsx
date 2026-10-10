import { useEffect, useState } from "react";
import { useHousehold } from "@/lib/household-context";
import { MealChoices } from "./meal-choices";
import { readShopDecisions, type ShopChange } from "@/lib/shared-household";

type Decision = Awaited<ReturnType<typeof readShopDecisions>>["decisions"][number];
const PACE = [
  { days: 3, label: "Every few days" },
  { days: 7, label: "Weekly" },
  { days: 14, label: "Fortnight" },
  { days: 30, label: "Monthly" },
] as const;

export function GroceryList() {
  const { snapshot, receive, refresh, change: mutate } = useHousehold();
  const [item, setItem] = useState("");
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const household = snapshot?.household_id;
  useEffect(() => {
    setTicked({});
    setItem("");
    setOffer(null);
    setDecisions([]);
  }, [household]);
  useEffect(() => {
    if (!household) return;
    let active = true;
    const load = async () => {
      try {
        const result = await readShopDecisions({ data: { household } });
        if (active) setDecisions(result.decisions);
      } catch {
        if (active) setDecisions([]);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [household, snapshot?.revision]);
  if (!snapshot) return <p className="mt-4 text-sm text-muted">Shared Shop is unavailable.</p>;
  const { lines, presets } = snapshot;
  async function change(
    input: Omit<ShopChange, "household" | "operation"> & Record<string, unknown>,
  ) {
    if (!household || pending) return false;
    setPending(true);
    setError(null);
    try {
      const fresh = await mutate({ ...input, household });
      receive(fresh);
      return true;
    } catch {
      setError("That change was not confirmed. Refreshing the shared list — please try again.");
      await refresh();
      return false;
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="mt-4 rounded-[24px] bg-panel p-4 shadow-[var(--shadow-border)]">
      <h2 className="text-center text-lg font-bold tracking-[0.16em]">SHARED SHOP</h2>
      <p className="mt-1 text-center text-xs text-muted">One list. The whole house.</p>
      <p className="mt-2 text-center text-sm font-semibold">{snapshot.points} shared shop points</p>
      <MealChoices
        key={household}
        addToList={async (names) => {
          for (const name of names) if (!(await change({ action: "add", name }))) return false;
          return true;
        }}
      />
      {error ? (
        <p role="alert" className="mt-3 text-sm">
          {error}
        </p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {decisions.map((decision) => (
          <li key={decision.decision_id} className="rounded-2xl bg-gold/25 p-3">
            <p className="text-sm font-medium">{decision.wording}</p>
            <p className="mt-1 text-xs text-muted">
              Based on this house’s list additions. It does not mean the item was bought.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={pending}
                className="min-h-11 rounded-full bg-violet px-4 text-sm font-semibold text-paper"
                onClick={() =>
                  void change({
                    action: "feedback",
                    decision_id: decision.decision_id,
                    kind: "accepted",
                  })
                }
              >
                Yes, we need it
              </button>
              <button
                disabled={pending}
                className="min-h-11 rounded-full bg-ink-2 px-4 text-sm"
                onClick={() =>
                  void change({
                    action: "feedback",
                    decision_id: decision.decision_id,
                    kind: "rejected",
                  })
                }
              >
                Not this time
              </button>
              <button
                disabled={pending}
                className="min-h-11 px-3 text-sm text-muted"
                onClick={() =>
                  void change({
                    action: "feedback",
                    decision_id: decision.decision_id,
                    kind: "dismissed",
                  })
                }
              >
                Dismiss
              </button>
            </div>
            <label className="mt-2 block text-xs text-muted">
              Correct the interval
              <select
                aria-label={`Correct interval for ${decision.item_name}`}
                disabled={pending}
                defaultValue=""
                className="ml-2 rounded-lg bg-panel p-2"
                onChange={(e) => {
                  const days = Number(e.target.value) as 3 | 7 | 14 | 30;
                  if (days)
                    void change({
                      action: "feedback",
                      decision_id: decision.decision_id,
                      kind: "corrected",
                      cadence_days: days,
                    });
                }}
              >
                <option value="">Choose…</option>
                {PACE.map((p) => (
                  <option key={p.days} value={p.days}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Changes reach everyone automatically.</p>
        <button
          disabled={pending || !snapshot.is_owner}
          type="button"
          onClick={() => void change({ action: "snatch_setting", on: !snapshot.snatch_on })}
          className={`min-h-11 rounded-full px-3 text-xs font-semibold ${snapshot.snatch_on ? "bg-gold text-navy" : "bg-ink-2 text-muted"}`}
        >
          {snapshot.snatch_on ? "Snatch on" : "Snatch off"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((preset) => {
          const onPad = lines.some(
            (line) => line.name.toLocaleLowerCase() === preset.name.toLocaleLowerCase(),
          );
          return (
            <button
              disabled={pending || onPad}
              key={preset.item_key}
              type="button"
              onClick={() => void change({ action: "add", name: preset.name })}
              className={`min-h-11 rounded-full px-3 text-sm font-semibold ${onPad ? "bg-ink-2 text-muted" : "bg-violet text-paper"}`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>
      <div
        className="mt-3 overflow-hidden rounded-[20px] border border-line bg-panel"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent, transparent 55px, color-mix(in oklab, var(--color-fg) 16%, transparent) 56px)",
          backgroundPosition: "0 8px",
        }}
      >
        <ul>
          {Array.from({ length: Math.max(8, lines.length) }, (_, i) => lines[i] ?? null).map(
            (line, i) => {
              if (!line)
                return (
                  <li key={`blank-${i}`} className="flex h-14 items-center px-3">
                    <span aria-hidden className="size-6 rounded-full border-2 border-fg/25" />
                  </li>
                );
              const selected = Boolean(ticked[line.id]);
              return (
                <li key={line.id} className="flex h-14 items-center gap-3 px-3">
                  <button
                    type="button"
                    aria-label={`${selected ? "Untick" : "Tick"} ${line.name}`}
                    aria-pressed={selected}
                    onClick={() => setTicked((old) => ({ ...old, [line.id]: !old[line.id] }))}
                    className={`grid size-11 shrink-0 place-items-center rounded-full border text-sm ${selected ? "border-violet bg-violet text-paper" : "border-fg/25"}`}
                  >
                    {selected ? "✓" : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicked((old) => ({ ...old, [line.id]: !old[line.id] }))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-base">{line.name}</span>
                    <span className="block text-[11px] font-medium text-violet/80">
                      Shared shopping item
                    </span>
                  </button>
                  {snapshot.snatch_on ? (
                    <button
                      disabled={pending || Boolean(line.snatched_by)}
                      type="button"
                      onClick={() => void change({ action: "snatch", line: line.id })}
                      className={`min-h-11 shrink-0 rounded-full px-3 text-xs font-semibold ${line.snatched_by ? "bg-ink-2 text-muted" : "bg-gold text-navy"}`}
                    >
                      {line.snatched_by ? "Snatched" : "2× Snatch"}
                    </button>
                  ) : null}
                </li>
              );
            },
          )}
        </ul>
        {lines.some((line) => ticked[line.id]) ? (
          <button
            disabled={pending}
            type="button"
            className="min-h-12 w-full text-xs font-medium text-muted"
            onClick={() => {
              void change({
                action: "delete",
                ids: lines.filter((line) => ticked[line.id]).map((line) => line.id),
              }).then((ok) => {
                if (ok) setTicked({});
              });
            }}
          >
            Delete ticked
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted">
        Ticks select items for deletion. Snatch adds 30 shop points once; deleting a snatched line
        reverses those points. Neither action confirms a purchase.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = item.trim();
          if (!name) return;
          void change({ action: "add", name }).then((ok) => {
            if (!ok) return;
            setItem("");
            if (!presets.some((p) => p.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
              setOffer(name);
          });
        }}
      >
        <input
          aria-label="New shopping item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          maxLength={120}
          placeholder="Not on the list"
          className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-4 text-sm outline-none"
        />
        <button
          disabled={pending || !item.trim()}
          type="submit"
          className="h-11 rounded-full bg-blue px-4 text-sm font-medium text-paper"
        >
          Add
        </button>
      </form>
      {offer ? (
        <div className="mt-3 rounded-2xl bg-ink-2 p-3">
          <p className="text-sm">Save {offer} as a regular for this family?</p>
          <button
            disabled={pending}
            className="mt-2 min-h-11 rounded-full bg-violet px-4 text-sm text-paper"
            onClick={() =>
              void change({ action: "preset_add", name: offer }).then((ok) => {
                if (ok) setOffer(null);
              })
            }
          >
            Save for next time
          </button>
          <button className="ml-2 min-h-11 text-sm" onClick={() => setOffer(null)}>
            Just this shop
          </button>
        </div>
      ) : null}
      <details className="mt-4 rounded-2xl bg-ink-2 p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Regular items and intervals
        </summary>
        <ul>
          {presets.map((preset) => (
            <li key={preset.item_key} className="mt-3 flex flex-wrap items-center gap-2">
              <span className="flex-1 text-sm">{preset.name}</span>
              <select
                aria-label={`Interval for ${preset.name}`}
                value={preset.cadence_days ?? ""}
                disabled={pending}
                className="min-h-11 rounded-lg bg-panel px-2 text-sm"
                onChange={(e) =>
                  void change({
                    action: "cadence",
                    name: preset.name,
                    days: e.target.value ? (Number(e.target.value) as 3 | 7 | 14 | 30) : null,
                  })
                }
              >
                <option value="">Use observed pattern</option>
                {PACE.map((p) => (
                  <option key={p.days} value={p.days}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button
                disabled={pending}
                className="min-h-11 px-2 text-xs text-muted"
                onClick={() => void change({ action: "preset_delete", name: preset.name })}
              >
                Remove regular
              </button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
