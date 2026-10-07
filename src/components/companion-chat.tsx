import { useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { askCompanion, setCompanionConsent } from "@/lib/companion-ai";
import { COMPANION_LORE, type CompanionId } from "@/lib/companions";
import { useHousehold } from "@/lib/household-context";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

const STARTERS: Record<CompanionId, string[]> = {
  stan: ["What does pausing location actually hide?", "Which alerts are worth leaving on?"],
  nova: ["I just need a quiet minute.", "How do I check in without making it a chore?"],
  pulse: ["Dinner at 6:30 for everyone", "School pickup tomorrow at 3"],
  scout: ["Is the drive summary useful, or just a score?", "What does Scout actually watch?"],
  moneybags: ["We want one number for the week.", "How do we talk about money without a lecture?"],
};

const EMPTY: { role: "user" | "them"; text: string }[] = [];

export function CompanionChat({
  id,
  full,
  onFull,
  onClose,
}: {
  id: CompanionId;
  full?: boolean;
  onFull?: () => void;
  onClose?: () => void;
}) {
  const c = COMPANION_LORE[id];
  const { snapshot } = useHousehold();
  const { user } = useCurrentUserState();
  const [messages, setMessages] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    setMessages([]);
    setConsent(false);
  }, [id, user?.id]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = scroller.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages.length, busy, full]);

  useEffect(() => {
    if (!full) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full, onClose]);

  async function send(prompt: string) {
    const q = prompt.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    setText("");
    if (!snapshot || !consent) {
      setError("Choose whether to send your messages to OpenAI before chatting.");
      setBusy(false);
      return;
    }
    setMessages((current) => [...current, { role: "user", text: q }]);
    try {
      const res = await askCompanion({
        data: {
          id,
          household: snapshot.household_id,
          request_id: crypto.randomUUID(),
          prompt: q,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text.slice(0, 600) })),
        },
      });
      if (res.ok) setMessages((current) => [...current, { role: "them", text: res.text }]);
      else setError(res.error);
    } catch {
      setError("The companion connection is unavailable. Please try later.");
    }
    setBusy(false);
  }

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted">Chat with {c.name}</p>
        {full ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center gap-1 rounded-full bg-navy px-4 text-sm font-semibold text-paper"
          >
            <X className="size-4" /> Close
          </button>
        ) : (
          <button
            type="button"
            onClick={onFull}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-ink-2 px-3 text-xs font-medium"
          >
            <Maximize2 className="size-3.5" /> Full screen
          </button>
        )}
      </div>
      <label className="mt-3 flex gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={consent}
          disabled={busy || snapshot?.member_role !== "adult"}
          onChange={(e) => {
            const enabled = e.target.checked;
            if (!snapshot) return;
            setBusy(true);
            void setCompanionConsent({ data: { household: snapshot.household_id, enabled } })
              .then(() => setConsent(enabled))
              .catch(() => setError("Could not save your companion choice."))
              .finally(() => setBusy(false));
          }}
        />
        Send my message and up to six recent chat messages to OpenAI so this companion can answer.
        Chats stay in this tab and are not shared with family members.
      </label>
      <p className="mt-2 text-xs text-muted">
        AI responses can be mistaken. In immediate danger in Australia, call{" "}
        <a href="tel:000" className="underline">
          000
        </a>
        . Child companion access requires separate release checks.
      </p>
      <div
        ref={scroller}
        className={
          full
            ? "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto"
            : "mt-2 max-h-36 space-y-2 overflow-y-auto"
        }
      >
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl bg-blue/12 px-3 py-2 text-sm leading-relaxed"
                : "mr-4 rounded-2xl bg-ink-2 px-3 py-2 text-sm leading-relaxed"
            }
          >
            {m.text}
          </div>
        ))}
        {busy ? <p className="text-sm text-muted">{c.name} is writing…</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {STARTERS[id].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            className="shrink-0 rounded-full bg-ink-2 px-3 py-1.5 text-xs"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input
          value={text}
          maxLength={600}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${c.name}`}
          className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-4 text-sm outline-none"
        />
        <button
          type="submit"
          className="h-11 rounded-full bg-blue px-4 text-sm font-medium text-paper"
        >
          Send
        </button>
      </form>
      {full ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-12 w-full rounded-full bg-ink-2 text-sm font-semibold"
        >
          Close chat
        </button>
      ) : null}
    </>
  );

  if (full) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-ink px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        {body}
      </div>
    );
  }

  return <div className="rounded-[22px] bg-panel p-3 shadow-[var(--shadow-border)]">{body}</div>;
}
