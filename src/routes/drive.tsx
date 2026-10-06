import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { MemberAvatar } from "@/components/member-avatar";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CONVERSATIONS, HOUSEHOLD, TRIPS, WEEKLY_SCORES, memberById } from "@/lib/family";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/drive")({ component: DrivePage });

function DrivePage() {
  const insights = useGuardian((s) => s.driveInsights);
  const setInsight = useGuardian((s) => s.setDriveInsight);

  return (
    <div className="mx-auto max-w-5xl py-5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Scout · drive safety</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Useful summaries, not a feed</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Scout organises the journey. Drive safety stays a conversation — figures are illustrative, and families decide what is visible.
      </p>
      <Link to="/companions/$id" params={{ id: "scout" }} className="mt-2 inline-block text-xs font-medium text-blue">
        Official lore
      </Link>
      <div className="mt-3">
        <Link to="/protection">
          <Badge tone="blue">Compare protection</Badge>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl bg-panel p-5 shadow-[var(--shadow-border)] lg:col-span-2">
          {insights.score ? (
            <div className="flex flex-col items-center">
              <ScoreRing score={HOUSEHOLD.driveScore} size={168} label={HOUSEHOLD.driveLabel} />
              <p className="mt-2 text-sm text-muted">{HOUSEHOLD.drivePeriod}</p>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Score hidden by household choice.</p>
          )}
        </section>
        <section className="grid grid-cols-2 gap-3 lg:col-span-3">
          <Stat hidden={!insights.trips} label="Trips" value={String(HOUSEHOLD.trips)} />
          <Stat hidden={!insights.trips} label="Distance" value={`${HOUSEHOLD.distanceKm} km`} />
          <Stat hidden={!insights.speed} label="Top speed" value={`${HOUSEHOLD.topSpeed} km/h`} />
          <Stat hidden={!insights.phone} label="Phone touches" value={String(HOUSEHOLD.phoneTouches)} />
        </section>
      </div>

      <section className="mt-4 rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Weekly trend</h2>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_SCORES}>
              <XAxis dataKey="week" tick={{ fill: "#5a657c", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[70, 100]} />
              <Bar dataKey="score" fill="#1a7ef0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Conversation starters</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {CONVERSATIONS.map((c) => (
            <article key={c.id} className="rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold">Recent trips</h2>
        <ul className="mt-3 space-y-2">
          {TRIPS.map((t) => {
            const who = memberById(t.who);
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl bg-panel px-3 py-3 shadow-[var(--shadow-border)]">
                <MemberAvatar member={who} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {t.from} → {t.to}
                  </p>
                  <p className="text-xs text-muted">
                    {who.short} · {t.when}
                  </p>
                </div>
                <div className="text-right">
                  {insights.score ? <Badge tone="green">{t.score}</Badge> : null}
                  <p className="mt-1 tabular text-xs text-subtle">
                    {insights.trips ? `${t.km} km` : "—"}
                    {insights.phone ? ` · ${t.phoneTouches} taps` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Visible insights</h2>
        <p className="mt-1 text-xs text-muted">Hide any driving summary this household does not want on screen.</p>
        <ul className="mt-3 space-y-3">
          {(
            [
              ["score", "Drive safety score"],
              ["trips", "Trip count and distance"],
              ["speed", "Top speed"],
              ["phone", "Phone touches"],
            ] as const
          ).map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <Switch checked={insights[key]} onCheckedChange={(v) => setInsight(key, v)} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, hidden }: { label: string; value: string; hidden: boolean }) {
  return (
    <div className="rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium tracking-wider text-muted uppercase">{label}</p>
      <p className="mt-2 tabular text-2xl font-semibold">{hidden ? "Hidden" : value}</p>
    </div>
  );
}
