import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { AVATARS, avatarSrc, resizePhoto } from "@/lib/avatars";
import { MEMBERS } from "@/lib/family";
import { usePeople } from "@/lib/people";
import { PLAN_LABEL } from "@/lib/plans";
import { LOOKS } from "@/lib/looks";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const you = MEMBERS[0]!;
  const youPhoto = useGuardian((s) => s.youPhoto);
  const avatarId = useGuardian((s) => s.avatarId);
  const setYouPhoto = useGuardian((s) => s.setYouPhoto);
  const setAvatarId = useGuardian((s) => s.setAvatarId);
  const mapsKey = useGuardian((s) => s.mapsKey);
  const look = useGuardian((s) => s.look) || "pink";
  const setLook = useGuardian((s) => s.setLook);
  const setMapsKey = useGuardian((s) => s.setMapsKey);
  const displayName = useGuardian((s) => s.displayName) || "Michael";
  const username = useGuardian((s) => s.username) || "michael";
  const setDisplayName = useGuardian((s) => s.setDisplayName);
  const setUsername = useGuardian((s) => s.setUsername);
  const plan = useGuardian((s) => s.plan);
  const [keyDraft, setKeyDraft] = useState(mapsKey);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [userDraft, setUserDraft] = useState(username);
  const { familyName } = usePeople();
  const setFamilyName = useGuardian((s) => s.setFamilyName);
  const setNickname = useGuardian((s) => s.setNickname);
  const addGuest = useGuardian((s) => s.addGuest);
  const removeGuest = useGuardian((s) => s.removeGuest);
  const guests = useGuardian((s) => s.guests) ?? [];
  const nicknames = useGuardian((s) => s.nicknames) ?? {};
  const [familyDraft, setFamilyDraft] = useState(familyName);
  const [nickDraft, setNickDraft] = useState<Record<string, string>>(nicknames);
  const [guestName, setGuestName] = useState("");
  const [guestNick, setGuestNick] = useState("");
  const face = youPhoto || (avatarId ? avatarSrc(avatarId) : null);

  return (
    <div className="mx-auto max-w-lg py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-violet uppercase">Account</p>
      <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted">Signed in on this device as @{username}</p>

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
        <p className="mt-1 text-sm text-muted">This is how your household sees you. Your username is the name you sign in with.</p>
        <label className="mt-4 block text-xs font-medium text-muted">Display name</label>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          className="mt-1 h-12 w-full rounded-2xl bg-ink-2 px-4 text-sm outline-none"
        />
        <label className="mt-3 block text-xs font-medium text-muted">Username</label>
        <div className="mt-1 flex h-12 items-center rounded-2xl bg-ink-2 px-4">
          <span className="text-sm text-muted">@</span>
          <input
            value={userDraft}
            onChange={(e) => setUserDraft(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))}
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
            toast("Account saved");
          }}
        >
          Save account
        </Button>
      </section>

      <section className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Family name</h2>
        <p className="mt-1 text-sm text-muted">This is the name on the family page. Change it to whatever you call yourselves.</p>
        <input
          value={familyDraft}
          onChange={(e) => setFamilyDraft(e.target.value)}
          className="mt-3 h-12 w-full rounded-2xl bg-ink-2 px-4 text-sm outline-none"
        />
        <Button
          className="mt-3"
          onClick={() => {
            setFamilyName(familyDraft);
            toast("Family name saved");
          }}
        >
          Save family name
        </Button>
      </section>

      <section className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Nicknames</h2>
        <p className="mt-1 text-sm text-muted">Optional. The nickname is what the household sees. Leave it blank to use their name.</p>
        <ul className="mt-3 space-y-2">
          {MEMBERS.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-sm">
                {m.name}
                <span className="block text-[11px] text-muted">{m.role}</span>
              </span>
              <input
                value={nickDraft[m.id] ?? ""}
                onChange={(e) => setNickDraft({ ...nickDraft, [m.id]: e.target.value })}
                placeholder="Nickname"
                className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-3 text-sm outline-none"
              />
            </li>
          ))}
        </ul>
        <Button
          className="mt-3"
          onClick={() => {
            for (const m of MEMBERS) setNickname(m.id, nickDraft[m.id] ?? "");
            toast("Nicknames saved");
          }}
        >
          Save nicknames
        </Button>
      </section>

      <section className="mt-4 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Guests</h2>
        <p className="mt-1 text-sm text-muted">
          A guest can be on the list and the shop run. They are not a member of the household, and they are not on the live map.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Name"
            className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-3 text-sm outline-none"
          />
          <input
            value={guestNick}
            onChange={(e) => setGuestNick(e.target.value)}
            placeholder="Nickname"
            className="h-11 w-28 rounded-full bg-ink-2 px-3 text-sm outline-none"
          />
        </div>
        <Button
          className="mt-3"
          onClick={() => {
            if (!guestName.trim()) return;
            addGuest(guestName, guestNick);
            setGuestName("");
            setGuestNick("");
            toast("Guest added");
          }}
        >
          Add guest
        </Button>
        <ul className="mt-3 space-y-2">
          {guests.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2 rounded-2xl bg-ink-2 px-3 py-2">
              <span className="text-sm">
                {g.nickname.trim() || g.name}
                {g.nickname.trim() ? <span className="text-muted"> · {g.name}</span> : null}
              </span>
              <button type="button" className="text-xs text-muted" onClick={() => removeGuest(g.id)}>
                Remove
              </button>
            </li>
          ))}
          {guests.length === 0 ? <li className="text-xs text-muted">No guests.</li> : null}
        </ul>
      </section>

      <section className="mt-5 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-semibold">Profile photo</h2>
        <p className="mt-1 text-sm text-muted">Shown on your map pin and next to your name.</p>
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
              <button type="button" className="text-left text-xs text-muted" onClick={() => setYouPhoto(null)}>
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
        <p className="mt-1 text-sm text-muted">
          Add your Google Maps key to use Google’s map. Until then, Family Guardian uses its own map of your places.
        </p>
        <input
          value={keyDraft}
          onChange={(e) => setKeyDraft(e.target.value)}
          placeholder="AIza…"
          autoComplete="off"
          className="mt-3 h-12 w-full rounded-2xl bg-ink-2 px-4 text-sm outline-none"
        />
        <Button
          className="mt-3"
          onClick={() => {
            setMapsKey(keyDraft);
            toast(keyDraft.trim() ? "Map saved" : "Using the Family Guardian map");
          }}
        >
          Save map
        </Button>
      </section>

      <section className="mt-4 grid gap-2">
        <Link to="/plan" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Plan</p>
          <p className="text-xs text-muted">Current plan: {PLAN_LABEL[plan]}. Change it any time.</p>
        </Link>
        <Link to="/alerts" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Notifications</p>
          <p className="text-xs text-muted">Choose which arrivals, departures, and trips can ping you.</p>
        </Link>
        <Link to="/permissions" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Permissions</p>
          <p className="text-xs text-muted">You choose what this household shares.</p>
        </Link>
        <Link to="/terms" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Terms and conditions</p>
          <p className="text-xs text-muted">The agreement for using Family Guardian.</p>
        </Link>
        <Link to="/privacy" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Privacy</p>
          <p className="text-xs text-muted">What we keep, and what stays with you.</p>
        </Link>
        <a href="https://kyrec.au" className="rounded-2xl bg-panel px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-semibold">Help</p>
          <p className="text-xs text-muted">kyrec.au</p>
        </a>
      </section>
    </div>
  );
}
