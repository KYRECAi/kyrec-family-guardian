import { useEffect, useRef, useState } from "react";
import { readWeekendEvents } from "@/lib/weekend-events";
import { perthWeekendStart, type WeekendEvents } from "@/lib/weekend-events-contract";

export function ScoutWeekendEvents() {
  const [start,setStart] = useState(() => perthWeekendStart());
  const [freeOnly,setFreeOnly] = useState(false);
  const [result,setResult] = useState<WeekendEvents|null>(null);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const generation = useRef(0);
  const load = async () => {
    const current = ++generation.current;
    setResult(null);setError(null);setLoading(true);
    try {
      const fresh = await readWeekendEvents({data:{start,free_only:freeOnly}});
      if (current === generation.current) setResult(fresh);
    } catch { if (current === generation.current) setError("Weekend events are unavailable. Refresh to try again."); }
    finally { if (current === generation.current) setLoading(false); }
  };
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    return () => { generation.current++;window.clearInterval(timer);window.removeEventListener("focus",refresh); };
  }, [start,freeOnly]);
  const stamp = (value:string) => new Intl.DateTimeFormat("en-AU",{timeZone:"Australia/Perth",dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  const weekendMidnight = Date.parse(`${start}T00:00:00+08:00`);
  const visibleEvents = result?.events.slice().sort((a,b) =>
    Number(Date.parse(a.starts_at) < weekendMidnight) - Number(Date.parse(b.starts_at) < weekendMidnight)
    || Date.parse(a.starts_at) - Date.parse(b.starts_at)) ?? [];
  return <section className="mt-4 rounded-[24px] bg-panel p-4 shadow-[var(--shadow-border)]" aria-labelledby="weekend-events-title">
    <h2 id="weekend-events-title" className="text-base font-semibold">This weekend across Perth</h2>
    <p className="mt-1 text-xs text-muted">Public listings from Core. Choose where you want to go. Check age suitability and booking details with the organiser.</p>
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <label className="text-xs">Weekend starts (Saturday)<input aria-label="Weekend starts Saturday" type="date" value={start} onChange={(event)=>setStart(event.target.value)} className="mt-1 block rounded-lg bg-ink-2 px-3 py-2" /></label>
      <label className="flex items-center gap-2 py-2 text-xs"><input type="checkbox" checked={freeOnly} onChange={(event)=>setFreeOnly(event.target.checked)} />Free events only</label>
      <button type="button" onClick={()=>void load()} disabled={loading} className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-paper">{loading ? "Checking Core…" : "Refresh events"}</button>
    </div>
    <p className="mt-2 text-xs text-muted">No budget filter by default. Listed prices may be per ticket; the total for your family needs checking.</p>
    <div role="status" className="mt-3 text-sm">{error || (loading ? "Checking current source records…" : result?.status === "unavailable" ? "No current source records are available yet." : result?.status === "no_matches" ? "No current listings match this weekend and price choice." : "")}</div>
    {result?.source_checked_at && <p className="mt-2 text-xs text-muted">Source checked {stamp(result.source_checked_at)} · Perth time</p>}
    <ul className="mt-3 space-y-3">{visibleEvents.map((event)=><li key={event.id} className="rounded-2xl bg-ink-2 p-3">
      <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold">{event.name}</h3><span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs">{event.price_status === "listed_free" ? "Listed free" : event.price_status === "listed_price" ? `From $${event.price_min}` : "Check price"}</span></div>
      {Date.parse(event.starts_at) < weekendMidnight && <p className="mt-1 text-xs font-medium">Ongoing listing — confirm the weekend sessions.</p>}
      <p className="mt-1 text-xs">{stamp(event.starts_at)}{event.ends_at ? ` – ${stamp(event.ends_at)}` : ""}</p>
      <p className="mt-1 text-xs text-muted">{[event.venue,event.locality].filter(Boolean).join(" · ") || "Check venue with organiser"}</p>
      <p className="mt-2 text-xs text-muted">{event.price_note}</p>
      <a className="mt-2 inline-block text-xs font-semibold text-violet" href={event.source_url} target="_blank" rel="noreferrer">Check organiser listing ↗</a>
    </li>)}</ul>
    {result?.has_more && <p className="mt-2 text-xs text-muted">More source listings are available; this view shows the first 40.</p>}
    <p className="mt-3 text-xs text-muted">Nothing is booked or added to your family plan automatically.</p>
  </section>;
}
