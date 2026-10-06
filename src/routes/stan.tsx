import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { askStan } from "@/lib/stan";
import { useGuardian } from "@/lib/store";

export const Route = createFileRoute("/stan")({ component: StanPage });

const PROMPTS = [
  "What does pausing location sharing actually hide?",
  "How do we talk about Mia’s learner score without it feeling like surveillance?",
  "Which alerts are worth keeping on for an 11-year-old?",
];

function StanPage() {
  const messages = useGuardian((s) => s.stanMessages);
  const add = useGuardian((s) => s.addStan);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(prompt: string) {
    const q = prompt.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    setText("");
    add({ role: "user", text: q });
    const history = [...messages, { role: "user" as const, text: q }];
    const res = await askStan({ data: { prompt: q, history } });
    if (res.ok) add({ role: "stan", text: res.text });
    else setError(res.error);
    setBusy(false);
  }

  return (
    <div className="-mx-4 flex min-h-[calc(100dvh-8rem)] flex-col lg:-mx-8 lg:min-h-[calc(100dvh-6rem)] lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-navy lg:block lg:w-[42%]">
        <img src="/companions/stan.jpg" alt="" className="absolute inset-0 size-full object-cover object-[center_12%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 text-paper">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-70">Approved character</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Stan</h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-80">
            Clear information. Safety in view. People decide.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col px-4 py-5 lg:px-10">
        <div className="flex items-center gap-3 lg:hidden">
          <img src="/companions/stan.jpg" alt="" className="size-14 rounded-full object-cover object-[center_12%] shadow-[0_0_0_2px_var(--color-blue)]" />
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">Decision support</p>
            <h1 className="text-2xl font-semibold tracking-tight">Stan</h1>
          </div>
        </div>
        <p className="hidden text-sm text-muted lg:block">
          He steadies the decision. He does not take it.{" "}
          <Link to="/companions/$id" params={{ id: "stan" }} className="font-medium text-blue">
            Official lore
          </Link>
        </p>

        <div className="mt-5 flex flex-1 flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={
                m.role === "user"
                  ? "ml-10 rounded-xl bg-blue/12 px-4 py-3 text-sm leading-relaxed"
                  : "mr-6 rounded-xl bg-panel px-4 py-3 text-sm leading-relaxed shadow-[var(--shadow-border)]"
              }
            >
              {m.text}
            </div>
          ))}
          {busy ? (
            <p className="text-sm text-muted">
              <span className="inline-flex gap-1">
                <span className="size-1.5 animate-pulse rounded-full bg-blue" />
                <span className="size-1.5 animate-pulse rounded-full bg-blue [animation-delay:120ms]" />
                <span className="size-1.5 animate-pulse rounded-full bg-blue [animation-delay:240ms]" />
              </span>
              <span className="ml-2">Stan is thinking</span>
            </p>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className="rounded-full bg-panel px-3 py-2 text-left text-xs text-muted shadow-[var(--shadow-border)] hover:text-fg"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Stan — decisions stay with you"
            className="h-12 min-w-0 flex-1 rounded-xl bg-panel px-4 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus:shadow-[0_0_0_1px_var(--color-blue)]"
          />
          <Button type="submit" disabled={busy || !text.trim()}>
            Ask
          </Button>
        </form>
      </div>
    </div>
  );
}
