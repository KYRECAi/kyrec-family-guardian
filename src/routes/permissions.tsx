import { createFileRoute } from "@tanstack/react-router";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePeople } from "@/lib/people";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/permissions")({ component: PermissionsPage });

function PermissionsPage() {
  const paused = useGuardian((s) => s.locationPaused);
  const togglePaused = useGuardian((s) => s.togglePaused);
  const sharing = useGuardian((s) => s.sharing);
  const setSharing = useGuardian((s) => s.setSharing);
  const reset = useGuardian((s) => s.resetDemo);
  const { people } = usePeople();

  return (
    <div className="mx-auto max-w-3xl py-5">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Permissions</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your family. Your rules.</h1>
      <p className="mt-2 text-sm text-muted">
        Family Guardian starts with visible choices. Location, alerts and family data should only be used for features you deliberately turn on.
      </p>

      <section className="mt-5 rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Pause location sharing</h2>
            <p className="mt-1 text-xs text-muted">Hides live positions for the whole household until you resume.</p>
          </div>
          <Switch checked={!paused} onCheckedChange={() => togglePaused()} />
        </div>
      </section>

      <section className="mt-4 rounded-xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-semibold">Who is sharing a location</h2>
        <ul className="mt-3 space-y-3">
          {people.filter((m) => !m.guest).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <MemberAvatar member={m} size={40} paused={!sharing[m.id] || paused} />
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted">{m.role}</p>
                </div>
              </div>
              <Switch checked={sharing[m.id]} onCheckedChange={(v) => setSharing(m.id, v)} />
            </li>
          ))}
        </ul>
      </section>

      <ul className="mt-6 space-y-3 text-sm text-muted">
        <li>You choose what is shared.</li>
        <li>You control every permission.</li>
        <li>You can pause location sharing.</li>
        <li>No selling private family stories.</li>
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-subtle">
        Family Guardian is not an emergency, medical, law-enforcement, or guaranteed safety service. Location and driving features need a compatible device, permission, and a connection. If anyone is in danger in Australia, call 000.
      </p>

      <Button variant="outline" className="mt-4" onClick={reset}>
        Clear data on this device
      </Button>
    </div>
  );
}
