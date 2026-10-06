import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DayBoard } from "@/components/day-board";
import { UpgradeGate } from "@/components/upgrade-gate";
import { Button } from "@/components/ui/button";
import { ROUTINES } from "@/lib/family";
import { usePeople } from "@/lib/people";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planner")({ component: Planner });

function ymd(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Planner() {
  const events = useGuardian((s) => s.events);
  const addEvent = useGuardian((s) => s.addEvent);
  const removeEvent = useGuardian((s) => s.removeEvent);
  const tasks = useGuardian((s) => s.tasks) ?? [];
  const addTask = useGuardian((s) => s.addTask);
  const toggleTask = useGuardian((s) => s.toggleTask);
  const today = ymd(new Date());
  const [selected, setSelected] = useState(today);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("18:30");
  const [who, setWho] = useState("Everyone");
  const [task, setTask] = useState("");
  const { people } = usePeople();

  const days = useMemo(() => {
    const s = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return d;
    });
  }, []);

  const onDay = events.filter((e) => e.date === selected);
  const standing =
    selected === today
      ? ROUTINES.filter((r) => r.companion === "pulse").map((r) => ({
          id: r.id,
          title: r.title,
          start: r.when,
          who: r.who,
          fixed: true,
        }))
      : [];
  const board = [...standing, ...onDay];

  return (
    <UpgradeGate need="complete" companion="pulse">
    <div className="mx-auto max-w-lg py-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">The day</h1>
        <p className="text-sm text-muted">Sport, pickup, dinner. Coloured so you can see the shape of it.</p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = ymd(d);
          const active = key === selected;
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={cn(
                "rounded-2xl px-1 py-2 text-center",
                active ? "bg-pink text-white" : "bg-panel shadow-[var(--shadow-border)]",
              )}
            >
              <span className="block text-[10px] uppercase opacity-70">
                {d.toLocaleDateString("en-AU", { weekday: "short" })}
              </span>
              <span className="mt-1 block text-sm font-semibold">{d.getDate()}</span>
              {isToday && !active ? <span className="mt-1 block size-1.5 mx-auto rounded-full bg-pink" /> : null}
            </button>
          );
        })}
      </div>

      <form
        className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addEvent(title.trim(), selected, start, who);
          setTitle("");
        }}
      >
        <p className="text-sm font-semibold">Add to this day</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dinner, pickup, calm minute…"
          className="mt-2 h-11 w-full rounded-xl bg-ink-2 px-3 text-sm outline-none"
        />
        <div className="mt-2 flex gap-2">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-11 rounded-xl bg-ink-2 px-3 text-sm outline-none" />
          <select value={who} onChange={(e) => setWho(e.target.value)} className="h-11 flex-1 rounded-xl bg-ink-2 px-3 text-sm outline-none">
            <option>Everyone</option>
            {people.map((m) => (
              <option key={m.id}>{m.short}</option>
            ))}
          </select>
          <Button type="submit" size="sm">
            Add
          </Button>
        </div>
      </form>

      <DayBoard items={board} onRemove={(id) => onDay.some((e) => e.id === id) && removeEvent(id)} />

      <section className="mt-5">
        <h2 className="text-lg font-semibold">To do</h2>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTask(task);
            setTask("");
          }}
        >
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Sport bag, bread, pickup note"
            className="h-11 flex-1 rounded-2xl bg-panel px-3 text-sm shadow-[var(--shadow-border)] outline-none"
          />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
        <ul className="mt-2 space-y-2">
          {tasks.length === 0 ? (
            <li className="text-sm text-muted">Nothing to tick yet.</li>
          ) : (
            tasks.map((item, i) => {
              const dot = ["bg-orange", "bg-mint", "bg-pink", "bg-blue", "bg-violet"][i % 5];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(item.id)}
                    className="flex w-full items-center gap-3 rounded-[22px] bg-panel px-3 py-3 text-left shadow-[var(--shadow-border)]"
                  >
                    <span className={cn("grid size-5 place-items-center rounded-md border border-line", item.done && "bg-mint text-white")}>
                      {item.done ? "✓" : ""}
                    </span>
                    <span className={cn("size-2.5 rounded-full", dot)} />
                    <span className={cn("text-sm font-medium", item.done && "text-muted line-through")}>{item.title}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
    </UpgradeGate>
  );
}
