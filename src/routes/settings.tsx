import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { AVATARS, avatarSrc, resizePhoto } from "@/lib/avatars";
import { usePeople } from "@/lib/people";
import { PLAN_LABEL } from "@/lib/plans";
import { LOOKS } from "@/lib/looks";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { people, familyName } = usePeople();
  const you = people.find((person) => person.you)!;
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const setYouPhoto = useGuardian((s) => s.setYouPhoto);
  const setAvatarId = useGuardian((s) => s.setAvatarId);
  const look = useGuardian((s) => s.look) || "pink";
  const setLook = useGuardian((s) => s.setLook);
  const displayName = useGuardian((s) => s.displayName) || "You";
  const username = useGuardian((s) => s.username) || "";
  const setDisplayName = useGuardian((s) => s.setDisplayName);
  const setUsername = useGuardian((s) => s.setUsername);
  const plan = useGuardian((s) => s.plan);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [userDraft, setUserDraft] = useState(username);
  const face = youPhoto || (avatarId ? avatarSrc(avatarId) : null);

  return (
    <div className="mx-auto max-w-lg py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-violet uppercase">Account</p>
      <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted">Your preferences on this device</p>

      <section className="mt-5 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Colour</h2>
        <p className="mt-1 text-sm text-muted">The whole app follows this. Pink is the original.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {LOOKS.map((item) => {
            const on = look === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLook(item.id)}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left ${on ? "bg-ink-2 ring-2 ring-fg" : "bg-ink-2"}`}
              >
                <span
                  className="size-9 shrink-0 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${item.wash}, ${item.accent})` }}
                />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Your name</h2>
        <p className="mt-1 text-sm text-muted">
          These display preferences apply on this device. Sign in with your confirmed email; manage
          real household membership on the Family page.
        </p>
        <label className="mt-4 block text-xs font-medium text-muted">Display name</label>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl bg-ink-2 px-4 text-sm outline-none"
        />
        <label className="mt-3 block text-xs font-medium text-muted">Device nickname</label>
        <div className="mt-1 flex h-12 items-center rounded-2xl bg-ink-2 px-4">
          <span className="text-sm text-muted">@</span>
          <input
            value={userDraft}
            onChange={(e) =>
              setUserDraft(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "")
                  .slice(0, 20),
              )
            }
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <p className="mt-2 text-xs text-muted">3 to 20 letters, numbers, or underscores.</p>
        <Button
          className="mt-3"
          onClick={() => {
            if (userDraft.length < 3) {
              toast("Username needs at least 3 characters");
              return;
            }
            setDisplayName(nameDraft);
            setUsername(userDraft);
            toast("Device preferences saved");
          }}
        >
          Save device preferences
        </Button>
      </section>

      <section className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">{familyName}</h2>
        <p className="mt-2 text-sm text-muted">
          Invite adults, children or guests through their own confirmed email accounts. The family
          owner manages access.
        </p>
        <Link to="/family" className="mt-3 inline-block min-h-11 text-sm text-violet">
          Open family membership
        </Link>
      </section>

      <section className="mt-5 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Profile photo</h2>
        <p className="mt-1 text-sm text-muted">
          Your profile appearance on this device. The shared map shows the initials from your
          household membership.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <MemberAvatar member={you} src={face} size={72} />
          <div className="flex flex-col gap-2">
            <label className="inline-flex h-11 cursor-pointer items-center rounded-full bg-blue px-4 text-sm font-medium text-paper">
              Upload a photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  try {
                    setYouPhoto(await resizePhoto(file));
                    toast("Photo saved");
                  } catch (err) {
                    toast(err instanceof Error ? err.message : "Could not use that photo");
                  }
                }}
              />
            </label>
            {face ? (
              <button
                type="button"
                className="text-left text-xs text-muted"
                onClick={() => setYouPhoto(null)}
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-xs font-medium text-muted">Or pick an avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-label={a.label}
              onClick={() => setAvatarId(a.id)}
              className={`size-12 overflow-hidden rounded-full ${avatarId === a.id ? "ring-2 ring-blue ring-offset-2" : ""}`}
            >
              <img src={avatarSrc(a.id)} alt="" className="size-full" />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Map</h2>
        <p className="mt-2 text-sm text-muted">
          The app uses one shared, restricted Google Maps configuration. Each family member chooses
          whether to share their own current position.
        </p>
        <Link to="/map" className="mt-3 inline-block min-h-11 text-sm text-violet">
          Open your location controls
        </Link>
        <Link to="/account" className="mt-3 block min-h-11 text-sm text-violet">
          Your account and sign out
        </Link>
      </section>

      <section className="mt-4 grid gap-2">
        <Link to="/plan" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Plan</p>
          <p className="text-xs text-muted">
            Current plan: {PLAN_LABEL[plan]}. Change it any time.
          </p>
        </Link>
        <Link to="/alerts" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Notifications</p>
          <p className="text-xs text-muted">
            Choose which arrivals, departures, and trips can ping you.
          </p>
        </Link>
        <Link
          to="/permissions"
          className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]"
        >
          <p className="font-semibold">Permissions</p>
          <p className="text-xs text-muted">You choose what this household shares.</p>
        </Link>
        <Link to="/terms" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Terms and conditions</p>
          <p className="text-xs text-muted">The agreement for using Family Guardian.</p>
        </Link>
        <Link
          to="/privacy"
          className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]"
        >
          <p className="font-semibold">Privacy</p>
          <p className="text-xs text-muted">What we keep, and what stays with you.</p>
        </Link>
        <a
          href="https://kyrec.au"
          className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]"
        >
          <p className="font-semibold">Help</p>
          <p className="text-xs text-muted">kyrec.au</p>
        </a>
      </section>
    </div>
  );
}
