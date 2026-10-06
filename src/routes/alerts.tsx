import { createFileRoute } from "@tanstack/react-router";
import { MemberAvatar } from "@/components/member-avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ALERTS, memberById, type MemberId } from "@/lib/family";
import { usePeople } from "@/lib/people";
import { useGuardian } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({ component: AlertsPage });

const TONE = {
  arrival: "green",
  departure: "blue",
  driving: "gold",
  checkin: "blue",
  battery: "orange",
} as const;

const PINGS = [
  ["arrival", "Arrivals at chosen safe zones"],
  ["departure", "Departures from chosen safe zones"],
  ["driving", "Driving summaries and trip starts"],
  ["checkin", "Check-ins you asked for"],
  ["battery", "Low battery, only if they share it"],
  ["zoneOnly", "Only inside a safe zone you set"],
  ["quietHours", "Quiet hours, 9pm to 7am Perth"],
] as const;

const EXTRA = [
  {
    id: "a4",
    kind: "checkin" as const,
    memberId: "paige" as MemberId,
    title: "Paige’s check-in is waiting",
    detail: "You asked. Nothing is sent until she confirms.",
    time: "13:12",
  },
  {
    id: "a5",
    kind: "battery" as const,
    memberId: "kelly" as MemberId,
    title: "Kelly’s battery is low",
    detail: "Shown because battery sharing is on for Kelly.",
    time: "12:40",
  },
];

function AlertsPage() {
  const prefs = useGuardian((s) => s.alertPrefs);
  const people = useGuardian((s) => s.alertPeople);
  const setPref = useGuardian((s) => s.setAlertPref);
  const setPerson = useGuardian((s) => s.setAlertPerson);
  const read = useGuardian((s) => s.readAlertIds);
  const mark = useGuardian((s) => s.markAlertRead);
  const { people: household } = usePeople();

  const feed = [...ALERTS, ...EXTRA].filter((a) => {
    if (a.kind === "checkin" && prefs.checkin === false) return false;
    if (a.kind === "battery" && !prefs.battery) return false;
    if (a.kind === "arrival" || a.kind === "departure" || a.kind === "driving") {
      if (!prefs[a.kind]) return false;
    }
    if (people && people[a.memberId] === false) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-lg py-5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Smart alerts</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Privacy by design give you choice!</h1>

      <section className="mt-5 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">What can ping</h2>
        <ul className="mt-3 space-y-3">
          {PINGS.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <Switch checked={Boolean(prefs[key] ?? key !== "battery")} onCheckedChange={(v) => setPref(key, v)} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-3 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Who can ping</h2>
        <p className="mt-1 text-xs text-muted">Turn a person off and their events stay off this list.</p>
        <ul className="mt-3 space-y-3">
          {household.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <MemberAvatar member={m} size={32} />
                {m.name}
              </span>
              <Switch checked={people?.[m.id] !== false} onCheckedChange={(v) => setPerson(m.id, v)} />
            </li>
          ))}
        </ul>
      </section>

      <ul className="mt-4 space-y-2">
        {feed.map((a) => {
          const who = household.find((p) => p.id === a.memberId) ?? memberById(a.memberId);
          const seen = read.includes(a.id);
          return (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => mark(a.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-3xl bg-panel px-3 py-3 text-left shadow-[var(--shadow-border)]",
                  seen && "opacity-60",
                )}
              >
                <MemberAvatar member={who} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{a.title}</p>
                    <Badge tone={TONE[a.kind]}>{a.kind}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{a.detail}</p>
                </div>
                <span className="tabular shrink-0 text-xs text-subtle">{a.time}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
