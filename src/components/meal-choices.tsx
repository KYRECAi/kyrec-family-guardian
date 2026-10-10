import { useState } from "react";
import { useGuardian } from "@/lib/store";

type Recipe = { idMeal: string; strMeal: string; strMealThumb: string };

/** Preserve optional recipe browsing; only a deliberate tap writes to Core. */
export function MealChoices({ addToList }: { addToList: (names: string[]) => Promise<boolean> }) {
  const meals = useGuardian((state) => state.meals);
  const addMeal = useGuardian((state) => state.addMeal);
  const [query, setQuery] = useState("");
  const [meal, setMeal] = useState("");
  const [hits, setHits] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  async function search() {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query.trim())}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!response.ok) throw new Error("Recipes unavailable");
      const body = (await response.json()) as { meals: Recipe[] | null };
      setHits((body.meals ?? []).slice(0, 6));
      if (!body.meals?.length) setNote("No public recipes found. Try another ingredient.");
    } catch {
      setNote(
        "The public recipe service is unavailable. You can still add your own meal and shopping items.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function choose(recipe: Recipe) {
    setBusy(true);
    setIngredients([]);
    setNote(null);
    addMeal(recipe.strMeal.slice(0, 120));
    try {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(recipe.idMeal)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!response.ok) throw new Error("Ingredients unavailable");
      const body = (await response.json()) as { meals: Record<string, string | null>[] | null };
      const recipeDetails = body.meals?.[0];
      const names = Array.from(
        { length: 8 },
        (_, index) => recipeDetails?.[`strIngredient${index + 1}`]?.trim().slice(0, 120) ?? "",
      ).filter(Boolean);
      setIngredients(names);
      setNote(
        "Saved to your menu on this device. Choose whether to add these ingredients to the shared list.",
      );
    } catch {
      setNote("Saved to your device menu. Ingredients could not be loaded.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="mt-4 rounded-2xl bg-ink-2 p-3">
      <summary className="cursor-pointer text-sm font-semibold">Meals, if you want them</summary>
      <p className="mt-2 text-xs text-muted">
        Your meal menu stays on this device. Recipe searches go to the public MealDB service. Adding
        ingredients changes the household’s shared shopping list.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addMeal(meal);
          setMeal("");
        }}
      >
        <input
          aria-label="Meal for your menu"
          value={meal}
          onChange={(event) => setMeal(event.target.value)}
          maxLength={120}
          className="h-11 min-w-0 flex-1 rounded-full bg-panel px-3 text-sm"
          placeholder="Add a meal"
        />
        <button
          type="submit"
          disabled={!meal.trim()}
          className="min-h-11 rounded-full bg-violet px-4 text-sm text-paper"
        >
          Save meal
        </button>
      </form>
      <ul className="mt-3 space-y-2 text-sm">
        {meals.map((entry) => (
          <li key={entry.id}>{entry.title}</li>
        ))}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <input
          aria-label="Search public recipes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={80}
          className="h-11 min-w-0 flex-1 rounded-full bg-panel px-3 text-sm"
          placeholder="Ingredient or meal"
        />
        <button
          disabled={busy || !query.trim()}
          className="min-h-11 rounded-full bg-blue px-4 text-sm text-paper"
        >
          Search recipes
        </button>
      </form>
      <ul className="mt-3 space-y-2">
        {hits.map((recipe) => (
          <li key={recipe.idMeal} className="flex items-center justify-between gap-2 text-sm">
            <a
              href={`https://www.themealdb.com/meal/${encodeURIComponent(recipe.idMeal)}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {recipe.strMeal}
            </a>
            <button
              disabled={busy}
              className="min-h-11 rounded-full bg-panel px-3"
              onClick={() => void choose(recipe)}
            >
              Use meal
            </button>
          </li>
        ))}
      </ul>
      {ingredients.length ? (
        <div className="mt-3 text-sm">
          <p>{ingredients.join(", ")}</p>
          <button
            disabled={busy}
            className="mt-2 min-h-11 rounded-full bg-violet px-4 text-paper"
            onClick={() => {
              setBusy(true);
              void addToList(ingredients)
                .then((ok) => {
                  setNote(
                    ok
                      ? "Ingredients added to the shared list."
                      : "Some items were not confirmed. Check the shared list before trying again.",
                  );
                  if (ok) setIngredients([]);
                })
                .finally(() => setBusy(false));
            }}
          >
            Add ingredients to shared list
          </button>
        </div>
      ) : null}
      {note ? (
        <p role="status" className="mt-3 text-xs text-muted">
          {note}
        </p>
      ) : null}
    </details>
  );
}
