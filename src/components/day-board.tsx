export function blockTone(title: string) {
  const t = title.toLowerCase();
  if (t.includes("dinner") || t.includes("meal") || t.includes("lunch")) return "bg-pink/25";
  if (t.includes("sport") || t.includes("train")) return "bg-mint/25";
  if (t.includes("pick") || t.includes("school")) return "bg-blue/15";
  if (t.includes("movie")) return "bg-gold/30";
  return "bg-violet/12";
}

export function DayBoard({
  items,
  onRemove,
}: {
  items: { id: string; title: string; start: string; who: string; fixed?: boolean }[];
  onRemove?: (id: string) => void;
}) {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start));
  if (!sorted.length) {
    return <p className="rounded-[22px] bg-panel px-4 py-8 text-center text-sm text-muted">Nothing on this day yet.</p>;
  }
  return (
    <ol className="relative ml-3 space-y-2 border-l-2 border-pink/50 pl-4">
      {sorted.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[1.4rem] top-4 size-2.5 rounded-full bg-pink" />
          <div className={`rounded-2xl px-3 py-2.5 ${blockTone(item.title)}`}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold">{item.title}</p>
              <p className="shrink-0 text-xs font-semibold">{item.start}</p>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <p className="text-xs text-muted">{item.who}</p>
              {onRemove && !item.fixed ? (
                <button type="button" onClick={() => onRemove(item.id)} className="text-[11px] text-subtle">
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
