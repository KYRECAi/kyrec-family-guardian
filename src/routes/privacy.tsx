import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-lg py-4">
      <Link to="/settings" className="text-sm text-violet">
        ‹ Settings
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Privacy</h1>
      <p className="mt-2 text-xs text-subtle">You choose what is shared</p>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
        <p>Family Guardian does not sell your profile. The people already on the map are the household set up in the app. Live location only updates when that person has sharing turned on.</p>
        <p>Your name, username, photo, avatar, Google Maps key, mood notes, and companion chat stay on this device. They are not uploaded to a KYREC server in this version of the app.</p>
        <p>If you ask Stan a question, that message is sent so he can answer. Do not include passwords, medical detail, or a precise home address.</p>
        <p>Pause sharing any time. Hidden locations stay hidden until you turn sharing back on.</p>
        <p>To remove what this device holds, use Clear data in Permissions. A published account will also let you delete the household from our servers. That control is not connected yet.</p>
      </div>
    </div>
  );
}
