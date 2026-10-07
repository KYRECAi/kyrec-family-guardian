import { useEffect, useState } from "react";
import { usePeople } from "@/lib/people";
import { useGuardian } from "@/lib/store";

const TIMES = [30, 45, 60, 90, 120] as const;
const PEOPLE = [2, 3, 4, 5] as const;

type Hit = { id: string; name: string; thumb: string };

const PACE = [
  { label: "Every few days", days: 3 },
  { label: "Weekly", days: 7 },
  { label: "Fortnight", days: 14 },
  { label: "Monthly", days: 30 },
] as const;

function gapDays(stamps: number[]) {
  if (stamps.length < 3) return null;
  const sorted = [...stamps].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] ?? 0) - (sorted[i - 1] ?? 0));
  gaps.sort((a, b) => a - b);
  const mid = gaps[Math.floor(gaps.length / 2)] ?? 0;
  if (mid < 86_400_000) return null;
  return Math.max(1, Math.round(mid / 86_400_000));
}

export function GroceryList() {
  const meals = useGuardian((s) => s.meals) ?? [];
  const groceries = useGuardian((s) => s.groceries) ?? [];
  const addMeal = useGuardian((s) => s.addMeal);
  const addGrocery = useGuardian((s) => s.addGrocery);
  const markGrocery = useGuardian((s) => s.markGrocery);
  const unmarkGrocery = useGuardian((s) => s.unmarkGrocery);
  const snatchGrocery = useGuardian((s) => s.snatchGrocery);
  const clearGrocery = useGuardian((s) => s.clearGrocery);
  const snatchOn = useGuardian((s) => s.snatchOn);
  const setSnatchOn = useGuardian((s) => s.setSnatchOn);
  const ensureStaples = useGuardian((s) => s.ensureStaples);
  const saveRegular = useGuardian((s) => s.saveRegular);
  const noteItemUse = useGuardian((s) => s.noteItemUse);
  const setItemEvery = useGuardian((s) => s.setItemEvery);
  const snoozeItem = useGuardian((s) => s.snoozeItem);
  const regulars = useGuardian((s) => s.regulars) ?? [];
  const itemUses = useGuardian((s) => s.itemUses) ?? {};
  const itemBuys = useGuardian((s) => s.itemBuys) ?? {};
  const itemEvery = useGuardian((s) => s.itemEvery) ?? {};
  const itemSnooze = useGuardian((s) => s.itemSnooze) ?? {};
  const longDay = useGuardian((s) => s.longDay);
  const setLongDay = useGuardian((s) => s.setLongDay);
  const [meal, setMeal] = useState("");
  const [item, setItem] = useState("");
  const [taste, setTaste] = useState("pasta");
  const [minutes, setMinutes] = useState<(typeof TIMES)[number]>(longDay ? 30 : 60);
  const [people, setPeople] = useState<(typeof PEOPLE)[number]>(4);
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [offer, setOffer] = useState<{ name: string; again: boolean } | null>(null);
  const [pace, setPace] = useState<string | null>(null);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const { people: household } = usePeople();
  const now = Date.now();
  const due = regulars.flatMap((name) => {
    const key = name.toLowerCase();
    if ((itemSnooze[key] ?? 0) > now) return [];
    const stamps = itemBuys[key] ?? [];
    const last = stamps.length ? Math.max(...stamps) : 0;
    const seen = gapDays(stamps);
    const days = itemEvery[key] ?? seen;
    if (!days || !last) return [];
    const since = Math.floor((now - last) / 86_400_000);
    if (now - last < days * 0.85 * 86_400_000) return [];
    return [{ name, days, since }];
  }).slice(0, 2);

  useEffect(() => {
    const persist = useGuardian.persist;
    const run = () => useGuardian.getState().ensureStaples();
    if (persist.hasHydrated()) run();
    return persist.onFinishHydration(run);
  }, []);

  async function searchPublic() {
    const q = taste.trim() || "chicken";
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { meals: { idMeal: string; strMeal: string; strMealThumb: string }[] | null };
      const next = (data.meals ?? []).slice(0, 6).map((m) => ({ id: m.idMeal, name: m.strMeal, thumb: m.strMealThumb }));
      setHits(next);
      if (!next.length) setNote("Nothing public came back for that taste. Try chicken, pasta, or fish.");
    } catch {
      setNote("The public recipe list did not answer. Try again.");
    }
    setBusy(false);
  }

  async function choose(hit: Hit) {
    addMeal(`${minutes} min · ${people} people · ${hit.name}`);
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${hit.id}`);
      const data = (await res.json()) as { meals: Record<string, string | null>[] | null };
      const row = data.meals?.[0];
      if (!row) return;
      for (let i = 1; i <= 8; i++) {
        const name = row[`strIngredient${i}`];
        if (name && name.trim()) addGrocery(name.trim());
      }
    } catch {
      setNote("The meal is on the menu. Ingredients did not come through.");
    }
  }

  return (
    <section className="mt-4 rounded-[24px] bg-panel p-4 shadow-[var(--shadow-border)]">
      <h2 className="text-center text-lg font-bold tracking-[0.16em]">SHARED SHOP</h2>
      <p className="mt-1 text-center text-xs text-muted">One list. The whole house.</p>

      <details className="mt-3 rounded-2xl bg-ink-2 p-3">
        <summary className="cursor-pointer text-sm font-semibold">Meals, if you want them</summary>
        <div className="mt-3 rounded-2xl bg-panel p-3">
        <p className="text-[11px] font-semibold tracking-wide text-violet uppercase">KYREC Core</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Pulse told Nova: kids’ sport is at 4.</li>
          <li>Scout told Nova: pickup is on the way home.</li>
          <li>{longDay ? "Someone marked a long day." : "No long day is marked."}</li>
        </ul>
        <label className="mt-2 flex items-center justify-between gap-3 text-sm">
          Long day
          <input type="checkbox" checked={Boolean(longDay)} onChange={(e) => setLongDay(e.target.checked)} />
        </label>
        <p className="mt-2 text-xs text-muted">
          Nova only sees what Core was allowed to pass. She does not watch hours or the drive.
        </p>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold">Taste</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["pasta", "chicken", "fish", "mild"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTaste(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${taste === t ? "bg-violet text-paper" : "bg-ink-2"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold">Time · 30 minutes to 2 hours</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMinutes(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${minutes === t ? "bg-violet text-paper" : "bg-ink-2"}`}
            >
              {t === 120 ? "2 hr" : `${t} min`}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold">Feeding</p>
        <div className="mt-2 flex gap-1.5">
          {PEOPLE.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPeople(n)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${people === n ? "bg-violet text-paper" : "bg-ink-2"}`}
            >
              {n}
            </button>
          ))}
        </div>
        {longDay && minutes > 45 ? (
          <p className="mt-2 text-xs text-muted">A long day is marked. 30 or 45 minutes is the easier one. You can still choose longer.</p>
        ) : null}
        <button
          type="button"
          onClick={() => void searchPublic()}
          className="mt-3 h-11 w-full rounded-full bg-blue text-sm font-medium text-paper"
        >
          {busy ? "Searching…" : "Search public recipes"}
        </button>
        {note ? <p className="mt-2 text-xs text-muted">{note}</p> : null}
        <ul className="mt-3 space-y-2">
          {hits.map((hit) => (
            <li key={hit.id} className="flex items-center gap-2 rounded-2xl bg-ink-2 p-2">
              <img src={hit.thumb} alt="" className="size-12 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{hit.name}</p>
                <a
                  href={`https://www.themealdb.com/meal/${hit.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-violet"
                >
                  Public recipe
                </a>
              </div>
              <button type="button" onClick={() => void choose(hit)} className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium">
                Choose
              </button>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-4 space-y-1">
        {meals.map((m) => (
          <li key={m.id} className="text-sm">
            {m.title}
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addMeal(meal);
          setMeal("");
        }}
      >
        <input
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          placeholder="Add a meal"
          className="h-10 min-w-0 flex-1 rounded-full bg-ink-2 px-3 text-sm outline-none"
        />
        <button type="submit" className="h-10 rounded-full bg-ink-2 px-3 text-xs font-medium">
          Add
        </button>
      </form>
      </details>

      {due.length ? (
        <ul className="mt-4 space-y-2">
          {due.map((row) => (
            <li key={row.name} className="rounded-2xl bg-gold/25 px-3 py-3">
              <p className="text-sm font-medium">
                {row.name} is usually every {row.days} days. It’s been {row.since}.
              </p>
              <p className="mt-1 text-xs text-muted">Need it this shop? This is the pattern, not a guess at the bag size.</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const you = household.find((p) => p.you)?.id ?? "michael";
                    const rowItem = groceries.find((g) => g.item.toLowerCase() === row.name.toLowerCase());
                    if (rowItem && !rowItem.by) {
                      markGrocery(rowItem.id, you);
                      noteItemUse(row.name);
                    }
                  }}
                  className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-paper"
                >
                  Yes, we need it
                </button>
                <button
                  type="button"
                  onClick={() => snoozeItem(row.name, now + Math.max(2, Math.round(row.days / 2)) * 86_400_000)}
                  className="rounded-full px-3 py-1.5 text-xs text-muted"
                >
                  Not this time
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Shared. Tap one and it lands for everyone.</p>
        <button
          type="button"
          onClick={() => setSnatchOn(snatchOn === false)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${snatchOn === false ? "bg-ink-2 text-muted" : "bg-gold text-navy"}`}
        >
          {snatchOn === false ? "Snatch off" : "Snatch on"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(regulars.length ? regulars : ["Milk", "Bread", "Eggs", "Coffee"]).map((name) => {
          const onPad = groceries.some((g) => g.item.trim().toLowerCase() === name.trim().toLowerCase());
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                if (!onPad) addGrocery(name);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${onPad ? "bg-ink-2 text-muted" : "bg-violet text-paper"}`}
            >
              {name}
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
          {Array.from({ length: Math.max(8, groceries.length) }, (_, i) => groceries[i] ?? null).map((g, i) => {
            if (!g) {
              return (
                <li key={`blank-${i}`} className="flex h-12 items-center px-3">
                  <span className="size-6 rounded-full border-2 border-fg/25" />
                </li>
              );
            }
            const you = household.find((p) => p.you)?.id ?? "michael";
            const snatched = Boolean(g.snatchedBy);
            const on = Boolean(ticked[g.id]);
            return (
              <li key={g.id} className="flex h-14 items-center gap-3 px-3">
                <button
                  type="button"
                  aria-label={on ? `Untick ${g.item}` : `Tick ${g.item}`}
                  onClick={() => setTicked((cur) => ({ ...cur, [g.id]: !cur[g.id] }))}
                  className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs ${on ? "border-violet bg-violet text-paper shadow-[0_0_12px_rgba(122,62,239,0.45)]" : "border-fg/25 bg-transparent"}`}
                >
                  {on ? "✓" : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setTicked((cur) => ({ ...cur, [g.id]: !cur[g.id] }))}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className={`block truncate text-base ${on ? "text-muted" : "text-fg"}`}>{g.item}</span>
                  <span className="block text-[11px] font-medium text-violet/80">15 family points</span>
                </button>
                {snatchOn === false ? null : (
                  <button
                    type="button"
                    disabled={snatched}
                    onClick={() => snatchGrocery(g.id, you)}
                    className={`h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${snatched ? "bg-ink-2 text-muted" : "bg-gold text-navy shadow-[0_0_18px_rgba(245,185,66,0.55)]"}`}
                  >
                    {snatched ? "Snatched" : "2× Snatch"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {groceries.some((g) => ticked[g.id]) ? (
          <button
            type="button"
            onClick={() => {
              for (const row of groceries) {
                if (ticked[row.id]) clearGrocery(row.id);
              }
              setTicked({});
            }}
            className="flex h-12 w-full items-center justify-center text-xs font-medium text-muted"
          >
            Delete ticked
          </button>
        ) : null}
      </div>
      {offer ? (
        <div className="mt-3 rounded-2xl bg-ink-2 p-3">
          <p className="text-sm font-medium">
            {offer.again ? `You keep getting ${offer.name}.` : `Save ${offer.name}?`}
          </p>
          <p className="mt-1 text-xs text-muted">It stays on this family’s list, so nobody types it again.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                saveRegular(offer.name);
                ensureStaples();
                setPace(offer.name);
                setOffer(null);
              }}
              className="rounded-full bg-violet px-3 py-1.5 text-xs font-semibold text-paper"
            >
              Save for next time
            </button>
            <button type="button" onClick={() => setOffer(null)} className="rounded-full px-3 py-1.5 text-xs text-muted">
              Just this shop
            </button>
          </div>
        </div>
      ) : null}
      {pace ? (
        <div className="mt-3 rounded-2xl bg-ink-2 p-3">
          <p className="text-sm font-medium">How often does this house get {pace}?</p>
          <p className="mt-1 text-xs text-muted">We’ll ask when that gap has passed. Two or three shops can correct it.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PACE.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => {
                  setItemEvery(pace, p.days);
                  setPace(null);
                }}
                className="rounded-full bg-panel px-3 py-1.5 text-xs font-medium"
              >
                {p.label}
              </button>
            ))}
            <button type="button" onClick={() => setPace(null)} className="rounded-full px-3 py-1.5 text-xs text-muted">
              We’ll see
            </button>
          </div>
        </div>
      ) : null}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = item.trim();
          if (!name) return;
          const known = regulars.some((r) => r.toLowerCase() === name.toLowerCase());
          const times = itemUses[name.toLowerCase()] ?? 0;
          addGrocery(name);
          noteItemUse(name);
          setItem("");
          if (!known) setOffer({ name, again: times >= 1 });
        }}
      >
        <input
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Not on the list"
          className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-4 text-sm outline-none"
        />
        <button type="submit" className="h-11 rounded-full bg-blue px-4 text-sm font-medium text-paper">
          Add
        </button>
      </form>
    </section>
  );
}
