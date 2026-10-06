import { useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { askCompanion } from "@/lib/companion-ai";
import { COMPANION_LORE, type CompanionId } from "@/lib/companions";
import { useGuardian } from "@/lib/store";

const STARTERS: Record<CompanionId, string[]> = {
  stan: ["What does pausing location actually hide?", "Which alerts are worth leaving on?"],
  nova: ["I just need a quiet minute.", "How do I check in without making it a chore?"],
  pulse: ["Dinner at 6:30 for everyone", "School pickup tomorrow at 3"],
  scout: ["Is the drive summary useful, or just a score?", "What does Scout actually watch?"],
  moneybags: ["We want one number for the week.", "How do we talk about money without a lecture?"],
};

const EMPTY: { role: "user" | "them"; text: string }[] = [];

function perthToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Perth",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function replyLocal(id: CompanionId, text: string) {
  const q = text.toLowerCase();
  if (id === "nova") {
    return "I’m here if you want warmth, not a score. Say it in one line, or don’t. Nothing here is shared unless you keep it.";
  }
  if (id === "scout") {
    return "I can summarise a trip you chose to share. I don’t score a person, and I don’t watch the drive in secret. If someone is in danger, call 000.";
  }
  if (id === "moneybags") {
    return "One honest number beats a dashboard. Tell me the weekly figure when you’re ready — I won’t nag, and I won’t touch family chat.";
  }
  if (id === "pulse") {
    const clock = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (clock) {
      let hour = Number(clock[1]);
      const min = clock[2] ?? "00";
      const ap = clock[3];
      if (ap === "pm" && hour < 12) hour += 12;
      if (ap === "am" && hour === 12) hour = 0;
      if (!ap && hour < 7) hour += 12;
      const start = `${String(hour).padStart(2, "0")}:${min}`;
      const title = text.replace(clock[0], "").replace(/\b(at|for everyone|tomorrow|today)\b/gi, "").trim() || "Family plan";
      return { text: `On the plan. ${title} at ${start}. No extra screens.`, event: { title, start } };
    }
    return "Tell me the thing and the time in one line. “Dinner at 6:30” lands on the plan. I won’t hand you a calendar first.";
  }
  return "Ask in one line. I’ll stay in my lane.";
}

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
  const stored = useGuardian((s) => s.chats[id]);
  const stanMessages = useGuardian((s) => s.stanMessages);
  const addChat = useGuardian((s) => s.addChat);
  const addStan = useGuardian((s) => s.addStan);
  const addEvent = useGuardian((s) => s.addEvent);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const messages =
    id === "stan"
      ? stanMessages.map((m) => ({ role: m.role === "user" ? ("user" as const) : ("them" as const), text: m.text }))
      : (stored ?? EMPTY);

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
    if (id === "stan") addStan({ role: "user", text: q });
    else addChat(id, { role: "user", text: q });

    if (id === "pulse") {
      const local = replyLocal(id, q);
      if (typeof local !== "string") addEvent(local.event.title, perthToday(), local.event.start, "Everyone");
    }

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    const res = await askCompanion({ data: { id, prompt: q, history } });
    if (res.ok) {
      if (id === "stan") addStan({ role: "stan", text: res.text });
      else addChat(id, { role: "them", text: res.text });
    } else {
      const local = replyLocal(id, q);
      const line = typeof local === "string" ? local : local.text;
      if (id === "stan") addStan({ role: "stan", text: line });
      else addChat(id, { role: "them", text: line });
      if (!res.error.includes("unavailable")) setError(res.error);
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
      <div ref={scroller} className={full ? "mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto" : "mt-2 max-h-36 space-y-2 overflow-y-auto"}>
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
          <button key={s} type="button" onClick={() => void send(s)} className="shrink-0 rounded-full bg-ink-2 px-3 py-1.5 text-xs">
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
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${c.name}`}
          className="h-11 min-w-0 flex-1 rounded-full bg-ink-2 px-4 text-sm outline-none"
        />
        <button type="submit" className="h-11 rounded-full bg-blue px-4 text-sm font-medium text-paper">
          Send
        </button>
      </form>
      {full ? (
        <button type="button" onClick={onClose} className="mt-3 h-12 w-full rounded-full bg-ink-2 text-sm font-semibold">
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
