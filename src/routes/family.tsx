import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NativeReview } from "@/components/native-review";
import { useHousehold } from "@/lib/household-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createHouseholdInvite, removeHouseholdMember } from "@/lib/shared-household";

export const Route = createFileRoute("/family")({ component: FamilyPage });
function FamilyPage() {
  const { snapshot, households, select, refresh } = useHousehold();
  const { user } = useCurrentUserState();
  const [role, setRole] = useState<"adult" | "child" | "guest">("adult");
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!snapshot) return null;
  return (
    <div className="mx-auto max-w-lg py-5">
      <h1 className="text-2xl font-semibold">{snapshot.name}</h1>
      <p className="mt-2 text-sm text-muted">
        Individual accounts. Shared shopping-list activity. Each person chooses whether to share
        their own location.
      </p>
      {households.length > 1 ? (
        <label className="mt-4 block">
          Household
          <select
            value={snapshot.household_id}
            onChange={(e) => {
              select(e.target.value);
              setCode(null);
            }}
            className="ml-3 min-h-11 rounded-xl bg-panel p-2"
          >
            {households.map((house) => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <ul className="mt-5 space-y-3">
        {snapshot.members.map((member) => (
          <li key={member.user_id} className="flex items-center gap-3 rounded-2xl bg-panel p-4">
            <div className="flex-1">
              <p className="font-semibold">
                {member.display_name}
                {member.user_id === user?.id ? " · you" : ""}
              </p>
              <p className="mt-1 text-xs text-muted">{member.role}</p>
            </div>
            {snapshot.is_owner && member.user_id !== user?.id ? (
              <button
                disabled={busy}
                className="min-h-11 px-3 text-sm text-violet"
                onClick={() => {
                  if (
                    !window.confirm(
                      `Remove ${member.display_name} from this household? Their shared-list access will stop.`,
                    )
                  )
                    return;
                  setBusy(true);
                  void removeHouseholdMember({
                    data: { household: snapshot.household_id, user_id: member.user_id },
                  })
                    .then(refresh)
                    .catch(() => setNotice("The removal was not confirmed. Please try again."))
                    .finally(() => setBusy(false));
                }}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {snapshot.is_owner ? (
        <section className="mt-6 rounded-2xl bg-panel p-4">
          <h2 className="font-semibold">Invite a family member</h2>
          <p className="mt-2 text-sm text-muted">
            They create their own account and confirm their email before joining. Codes last two
            days and can be used once.
          </p>
          <label className="mt-4 block">
            Their email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 w-full rounded-xl bg-ink-2 px-3"
            />
          </label>
          <label className="mt-4 block">
            Account role
            <select
              aria-label="Invitation role"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="ml-3 min-h-11 rounded-xl bg-ink-2 p-2"
            >
              <option value="adult">Adult</option>
              <option value="child">Child</option>
              <option value="guest">Guest</option>
            </select>
          </label>
          <label className="mt-4 flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            {role === "child"
              ? "I am the parent or guardian and approve this child joining the shared shopping list. Companion chat and location sharing require separate checks."
              : "I approve this invitation for access to this household's shared shopping list."}
          </label>
          <button
            disabled={busy || !consent || !email.trim()}
            className="mt-4 min-h-12 w-full rounded-full bg-violet px-4 font-semibold text-paper disabled:opacity-50"
            onClick={() => {
              setBusy(true);
              setNotice(null);
              void createHouseholdInvite({
                data: {
                  household: snapshot.household_id,
                  email: email.trim(),
                  role,
                  shop_consent: true,
                },
              })
                .then((result) => setCode(result.invite_token))
                .catch(() => setNotice("The invitation could not be created."))
                .finally(() => setBusy(false));
            }}
          >
            Create invitation code
          </button>
          {code ? (
            <>
              <label className="mt-4 block text-sm">
                Copy this private invitation code
                <input
                  readOnly
                  value={code}
                  className="mt-2 h-12 w-full rounded-xl bg-ink-2 px-3 text-sm"
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <p className="mt-2 text-xs text-muted">
                Share this code with the intended person. It grants shopping-list membership after
                verified sign-in.
              </p>
            </>
          ) : null}
        </section>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 text-sm">
          {notice}
        </p>
      ) : null}
      {snapshot.member_role === "adult" && user?.emailVerified && !user.isDevFallback ? (
        <NativeReview
          key={`${user.id}:${snapshot.household_id}`}
          household={snapshot.household_id}
        />
      ) : null}
      <Link to="/account" className="mt-6 inline-block min-h-11 text-sm text-violet">
        Your account and sign out
      </Link>
    </div>
  );
}
