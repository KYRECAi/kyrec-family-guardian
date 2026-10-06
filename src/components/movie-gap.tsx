import { useState } from "react";
import { useGuardian } from "@/lib/store";

const GAPS = [
  { id: 90, label: "90 min", line: "Short and done" },
  { id: 120, label: "2 hours", line: "Stay on the couch" },
] as const;

const PEOPLE = [2, 3, 4, 5] as const;

const FILMS = [
  { title: "Paddington", minutes: 95, taste: "family", line: "Warm. Easy to follow after sport.", href: "https://en.wikipedia.org/wiki/Paddington_(film)" },
  { title: "The Iron Giant", minutes: 86, taste: "family", line: "Quiet, and it fits a long day.", href: "https://en.wikipedia.org/wiki/The_Iron_Giant" },
  { title: "My Neighbor Totoro", minutes: 86, taste: "family", line: "Soft. Nobody has to keep up.", href: "https://en.wikipedia.org/wiki/My_Neighbor_Totoro" },
  { title: "How to Train Your Dragon", minutes: 98, taste: "adventure", line: "A ride, still home before late.", href: "https://en.wikipedia.org/wiki/How_to_Train_Your_Dragon_(2010_film)" },
  { title: "The Lego Movie", minutes: 100, taste: "adventure", line: "Loud in a good way. Then bed.", href: "https://en.wikipedia.org/wiki/The_Lego_Movie" },
  { title: "Moana", minutes: 107, taste: "adventure", line: "Songs on the way to lights out.", href: "https://en.wikipedia.org/wiki/Moana_(2016_film)" },
  { title: "Wallace & Gromit: The Curse of the Were-Rabbit", minutes: 85, taste: "funny", line: "Short enough for a tired house.", href: "https://en.wikipedia.org/wiki/Wallace_%26_Gromit:_The_Curse_of_the_Were-Rabbit" },
  { title: "The Bad Guys", minutes: 100, taste: "funny", line: "Jokes. No homework energy.", href: "https://en.wikipedia.org/wiki/The_Bad_Guys_(film)" },
  { title: "Sing", minutes: 108, taste: "funny", line: "Everyone can sing the one they know.", href: "https://en.wikipedia.org/wiki/Sing_(2016_American_film)" },
  { title: "Luca", minutes: 95, taste: "animation", line: "Summer, even on a school night.", href: "https://en.wikipedia.org/wiki/Luca_(2021_film)" },
  { title: "Encanto", minutes: 102, taste: "animation", line: "One family. One song stuck in your head.", href: "https://en.wikipedia.org/wiki/Encanto" },
  { title: "Ratatouille", minutes: 111, taste: "animation", line: "Dinner, then the film about dinner.", href: "https://en.wikipedia.org/wiki/Ratatouille_(film)" },
] as const;

const TASTES = [
  { id: "family", label: "Together" },
  { id: "adventure", label: "A ride" },
  { id: "funny", label: "A laugh" },
  { id: "animation", label: "Drawn" },
] as const;

function perthToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function MovieGap() {
  const addEvent = useGuardian((s) => s.addEvent);
  const longDay = useGuardian((s) => s.longDay);
  const [gap, setGap] = useState<(typeof GAPS)[number]["id"]>(longDay ? 90 : 120);
  const [people, setPeople] = useState<(typeof PEOPLE)[number]>(4);
  const [taste, setTaste] = useState<(typeof FILMS)[number]["taste"]>("family");
  const [picked, setPicked] = useState<string | null>(null);

  const fits = FILMS.filter((film) => film.taste === taste && film.minutes <= gap + 10);
  const lead = fits[0];

  function choose(title: string) {
    addEvent(`Movie · ${title}`, perthToday(), "19:45", `${people} people`);
    setPicked(title);
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[28px] bg-panel shadow-[var(--shadow-lift)]">
      <div className="relative">
        <img src="/brand/movie-night.jpg" alt="" className="aspect-[16/10] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-paper">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase">Tonight’s gap</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Sport. Home. Dinner. Then this.</h2>
          <p className="mt-1 max-w-sm text-sm text-paper/80">
            The busy part is already on the plan. The film is the part you keep.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pt-4 text-center">
        {[
          ["4:00", "Sport"],
          ["Home", "Pickup"],
          ["6:30", "Dinner"],
        ].map(([when, label]) => (
          <div key={label} className="rounded-2xl bg-ink-2 px-2 py-2">
            <p className="text-sm font-semibold">{when}</p>
            <p className="text-[11px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-4">
        <p className="text-xs text-muted">
          {longDay
            ? "A long day is marked. Start with the shorter film. You can still stay for two hours."
            : "No long day is marked. Two hours still fits if you want it."}
        </p>

        <div className="mt-3 flex gap-2">
          {GAPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGap(g.id)}
              className={`flex-1 rounded-2xl px-3 py-3 text-left ${gap === g.id ? "bg-navy text-paper" : "bg-ink-2"}`}
            >
              <span className="block text-sm font-semibold">{g.label}</span>
              <span className={`block text-[11px] ${gap === g.id ? "text-paper/70" : "text-muted"}`}>{g.line}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {TASTES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTaste(t.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${taste === t.id ? "bg-violet text-paper" : "bg-ink-2"}`}
            >
              {t.label}
            </button>
          ))}
          {PEOPLE.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPeople(n)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${people === n ? "bg-violet text-paper" : "bg-ink-2"}`}
            >
              {n} watching
            </button>
          ))}
        </div>

        {lead ? (
          <article className="mt-4 rounded-[22px] bg-navy p-4 text-paper">
            <p className="text-[11px] font-semibold tracking-wide text-gold uppercase">Fits the gap</p>
            <h3 className="mt-1 text-xl font-semibold">{lead.title}</h3>
            <p className="mt-1 text-sm text-paper/75">
              {lead.minutes} min · {lead.line}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => choose(lead.title)}
                className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy"
              >
                Put it on tonight
              </button>
              <a href={lead.href} target="_blank" rel="noreferrer" className="text-xs text-paper/70">
                Public page
              </a>
            </div>
          </article>
        ) : (
          <p className="mt-4 text-sm text-muted">Nothing in this list fits that gap. Try 2 hours.</p>
        )}

        <ul className="mt-3 space-y-2">
          {fits.slice(1).map((film) => (
            <li key={film.title} className="flex items-center gap-3 rounded-2xl bg-ink-2 px-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{film.title}</p>
                <p className="text-xs text-muted">
                  {film.minutes} min · {film.line}
                </p>
              </div>
              <button type="button" onClick={() => choose(film.title)} className="text-xs font-semibold text-violet">
                This one
              </button>
            </li>
          ))}
        </ul>

        {picked ? (
          <p className="mt-3 rounded-2xl bg-violet/12 px-3 py-3 text-sm font-medium text-violet">
            {picked} is on tonight at 7:45, for {people}. Lights down when you say.
          </p>
        ) : null}
      </div>
    </section>
  );
}
