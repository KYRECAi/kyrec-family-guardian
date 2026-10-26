import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  allFeatures,
  FEATURE_KEYS,
  FEATURE_LABELS,
  type ChildAccess,
  type ChildFeatures,
} from "@/lib/child-feature-contract";

type Api = {
  readChildAccess: (input: { data: { household: string; member: string } }) => Promise<ChildAccess>;
  saveChildAccess: (input: {
    data: { household: string; member: string; revision: number; features: ChildFeatures };
  }) => Promise<ChildAccess>;
};

export function ChildAccessPanel({
  household,
  isOwner,
  members,
  api,
  onSaved,
}: {
  household: string;
  isOwner: boolean;
  members: { user_id: string; display_name: string }[];
  api: Api;
  onSaved?: () => Promise<void>;
}) {
  const [selected, setSelected] = useState("");
  const child = members.find((member) => member.user_id === selected) ?? members[0];
  return (
    <section
      className="mt-5 rounded-3xl bg-panel p-4 shadow-[var(--shadow-border)]"
      aria-labelledby="child-access-heading"
    >
      <h2 id="child-access-heading" className="font-semibold">
        Parent consent for children
      </h2>
      <p className="mt-2 text-sm text-muted">
        Choose access for each child. Nothing turns on automatically with age.
      </p>
      {!isOwner ? (
        <p className="mt-4 text-sm">
          The family owner manages these choices. Children cannot change them.
        </p>
      ) : !child ? (
        <p className="mt-4 text-sm text-muted">
          Add a child through Family membership to choose their access.
        </p>
      ) : (
        <>
          <label className="mt-4 block text-sm font-medium" htmlFor="child-access-member">
            Child
          </label>
          <select
            id="child-access-member"
            value={child.user_id}
            onChange={(event) => setSelected(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl bg-ink-2 px-3"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.display_name}
              </option>
            ))}
          </select>
          <ChildAccessEditor
            key={`${household}:${child.user_id}`}
            household={household}
            member={child.user_id}
            api={api}
            onSaved={onSaved}
          />
        </>
      )}
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Feature access does not share private chats, start location tracking, or approve points and
        rewards. Children's AI chat and location sharing remain unavailable during the current beta,
        even when selected here. Immediate help remains available.
      </p>
    </section>
  );
}

function ChildAccessEditor({
  household,
  member,
  api,
  onSaved,
}: {
  household: string;
  member: string;
  api: Api;
  onSaved?: () => Promise<void>;
}) {
  const [record, setRecord] = useState<ChildAccess | null>(null);
  const [draft, setDraft] = useState<ChildFeatures>(allFeatures(false));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setRecord(null);
    setNotice("");
    void api
      .readChildAccess({ data: { household, member } })
      .then((result) => {
        if (!active) return;
        if (result.user_id !== member) throw new Error("Mismatched child");
        setRecord(result);
        setDraft(result.features);
      })
      .catch(() => {
        if (active) setNotice("Access choices could not be loaded. Try again.");
      });
    return () => {
      active = false;
    };
  }, [household, member, api, loadAttempt]);
  const allOn = FEATURE_KEYS.every((key) => draft[key]);
  const dirty = record && FEATURE_KEYS.some((key) => draft[key] !== record.features[key]);
  async function save() {
    if (!record || busy) return;
    setBusy(true);
    setNotice("");
    try {
      const result = await api.saveChildAccess({
        data: { household, member, revision: record.revision, features: draft },
      });
      if (result.user_id !== member) throw new Error("Mismatched child");
      setRecord(result);
      setDraft(result.features);
      setNotice("Access choices saved.");
      await onSaved?.();
    } catch {
      setNotice("Save was not confirmed. Reload the saved choices before trying again.");
      setRecord(null);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4">
      {!record ? (
        <div role="status" className="text-sm text-muted">
          {notice || "Loading access choices…"}
          {notice && (
            <Button className="mt-3" onClick={() => setLoadAttempt((value) => value + 1)}>
              Reload saved choices
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex min-h-14 items-center justify-between gap-4 rounded-xl bg-ink-2 p-3">
            <div>
              <label htmlFor="child-allow-all" className="font-medium">
                Allow all listed features
              </label>
              <p className="mt-1 text-xs text-muted">Or choose each one below, then save.</p>
            </div>
            <Switch
              className="h-11 w-14 [&>span]:size-7"
              id="child-allow-all"
              checked={allOn}
              disabled={busy}
              onCheckedChange={(enabled) => {
                setDraft(allFeatures(enabled));
                setNotice("");
              }}
            />
          </div>
          <Button
            variant="outline"
            className="mt-3"
            disabled={busy}
            onClick={() => {
              setDraft(allFeatures(false));
              setNotice("");
            }}
          >
            Turn all off
          </Button>
          <div className="mt-3 divide-y divide-line">
            {FEATURE_KEYS.map((key) => (
              <div key={key} className="flex min-h-14 items-center justify-between gap-4 py-3">
                <label htmlFor={`child-feature-${key}`} className="text-sm font-medium">
                  {FEATURE_LABELS[key]}
                </label>
                <Switch
                  className="h-11 w-14 [&>span]:size-7"
                  id={`child-feature-${key}`}
                  checked={draft[key]}
                  disabled={busy}
                  onCheckedChange={(enabled) => {
                    setDraft((current) => ({ ...current, [key]: enabled }));
                    setNotice("");
                  }}
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-4 min-h-12 w-full"
            disabled={busy || !dirty}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save child access"}
          </Button>
          {notice && (
            <p role="status" className="mt-3 text-sm">
              {notice}
            </p>
          )}
        </>
      )}
    </div>
  );
}
