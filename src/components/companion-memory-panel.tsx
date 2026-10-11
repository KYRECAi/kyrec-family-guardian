import { useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  readPendingMemories,
  readCurrentMemories,
  decideMemory,
  forgetMemory,
} from "@/lib/companion-memory";
import type { PendingMemory, CurrentMemory } from "@/lib/companion-memory-contract";

export function CompanionMemoryPanel() {
  const { user, isPending } = useCurrentUserState();
  if (isPending || !user || !user.emailVerified || user.isDevFallback) return null;
  return <MemoryReview key={user.id} />;
}

function MemoryReview() {
  const [pending, setPending] = useState<PendingMemory[] | null>(null);
  const [current, setCurrent] = useState<CurrentMemory[] | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmForget, setConfirmForget] = useState<string | null>(null);
  const working = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const button =
    "min-h-11 rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-paper disabled:opacity-50";

  async function run(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setNotice("");
    try {
      await action();
    } catch {
      if (active.current) {
        setPending(null);
        setCurrent(null);
        setConfirmForget(null);
        setNotice(
          "Memory could not be confirmed. Check your connection and owner access, then refresh before trying again.",
        );
      }
    } finally {
      working.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function loadPending() {
    const result = await readPendingMemories();
    if (active.current) {
      setPending(result);
      setCurrent(null);
      setConfirmForget(null);
    }
  }
  async function loadCurrent() {
    const result = await readCurrentMemories();
    if (active.current) {
      setCurrent(result);
      setPending(null);
      setConfirmForget(null);
    }
  }
  async function decide(proposal_id: string, outcome: "approved" | "dismissed") {
    await decideMemory({ data: { proposal_id, outcome } });
    if (!active.current) return;
    setPending((items) => items?.filter((item) => item.proposal_id !== proposal_id) ?? null);
    setNotice(outcome === "approved" ? "Approved in Core." : "Suggestion dismissed in Core.");
  }
  async function forget(memory_id: string) {
    await forgetMemory({ data: { memory_id } });
    if (!active.current) return;
    setCurrent((items) => items?.filter((item) => item.memory_id !== memory_id) ?? null);
    setConfirmForget(null);
    setNotice("Excluded from future recall. Historical records and backups remain.");
  }

  return (
    <section
      aria-label="Companion memory"
      className="mt-5 rounded-[22px] bg-panel p-4 shadow-[var(--shadow-border)]"
    >
      <h2 className="text-lg font-semibold">Companion memory</h2>
      <p className="mt-1 text-sm text-muted">
        Review what Evelyn asks to remember. Only the configured owner can approve, dismiss or
        forget a fact.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={button} disabled={busy} onClick={() => void run(loadPending)}>
          Review suggestions
        </button>
        <button className={button} disabled={busy} onClick={() => void run(loadCurrent)}>
          View permitted memories
        </button>
      </div>
      {busy ? (
        <p role="status" className="mt-3 text-sm">
          Checking with Core…
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-3 text-sm">
          {notice}
        </p>
      ) : null}
      {pending?.length === 0 ? (
        <p className="mt-3 text-sm">No suggestions awaiting your review.</p>
      ) : null}
      {pending ? (
        <ul className="mt-3 space-y-3">
          {pending.map((item) => (
            <li key={item.proposal_id} className="rounded-xl border border-line p-3">
              <p className="text-xs text-muted">{item.memory_key.replaceAll("_", " ")}</p>
              <p className="mt-1 break-words">{item.value}</p>
              <p className="mt-2 break-all text-xs text-muted">
                Person reference: {item.subject_person_id}
              </p>
              <p className="mt-1 text-xs text-muted">
                Approve only if you recognise this person and the fact is correct.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  className={button}
                  disabled={busy}
                  onClick={() => void run(() => decide(item.proposal_id, "approved"))}
                >
                  Approve
                </button>
                <button
                  className={button}
                  disabled={busy}
                  onClick={() => void run(() => decide(item.proposal_id, "dismissed"))}
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {current?.length === 0 ? (
        <p className="mt-3 text-sm">No current memories in your permitted view.</p>
      ) : null}
      {current ? (
        <ul className="mt-3 space-y-3">
          {current.map((item) => (
            <li key={item.memory_id} className="rounded-xl border border-line p-3">
              <p className="text-xs text-muted">{item.memory_key.replaceAll("_", " ")}</p>
              <p className="mt-1 break-words">{item.value}</p>
              {confirmForget === item.memory_id ? (
                <div className="mt-2">
                  <p className="text-sm">
                    Exclude this fact from future recall? Historical records and backups remain.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() => void run(() => forget(item.memory_id))}
                    >
                      Confirm forget
                    </button>
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() => setConfirmForget(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={`${button} mt-2`}
                  disabled={busy}
                  onClick={() => setConfirmForget(item.memory_id)}
                >
                  Forget this fact
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        Voice profiles have separate controls. This page does not retain conversation transcripts or
        approve voice enrolment.
      </p>
    </section>
  );
}

