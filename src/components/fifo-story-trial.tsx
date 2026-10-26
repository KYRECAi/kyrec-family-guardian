import { useEffect, useRef, useState } from "react";
import type {
  StoryCompanion,
  StoryDrawing,
  StorySession,
  StoryTrialAPI,
} from "@/lib/fifo-story-contract";

const button = "min-h-12 rounded-xl bg-violet px-4 py-3 text-white disabled:opacity-50";
const prompts = {
  pulse: "Pulse story: Pick one small thing that helped your day flow. Tell or draw what happened.",
  moneybags:
    "Moneybags story: Imagine saving for something useful. Tell or draw one small step you could take.",
};
function Drawing({ drawing }: { drawing: StoryDrawing }) {
  return (
    <>
      {drawing.map((stroke, i) => (
        <polyline
          key={i}
          points={stroke.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

/** Pure prototype surface with injected API; no production route or real account access. */
export function FifoStoryTrial({ api }: { api: StoryTrialAPI }) {
  const [session, setSession] = useState<StorySession | null>(null);
  const [companion, setCompanion] = useState<StoryCompanion>("pulse");
  const [story, setStory] = useState("");
  const [drawing, setDrawing] = useState<StoryDrawing>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const drawingActive = useRef(false);
  const currentApi = useRef(api);
  currentApi.current = api;
  useEffect(() => {
    let active = true;
    setSession(null);
    setStory("");
    setDrawing([]);
    setReplies({});
    setError("");
    api
      .read()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) setError("This household is unavailable.");
      });
    return () => {
      active = false;
    };
  }, [api]);
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await work();
      const next = await api.read();
      if (currentApi.current === api) setSession(next);
    } catch {
      if (currentApi.current === api)
        setError("The change was not saved. Refresh this trial and check access.");
    } finally {
      if (currentApi.current === api) setBusy(false);
    }
  }
  function point(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(600, ((event.clientX - bounds.left) * 600) / bounds.width)),
      y: Math.max(0, Math.min(300, ((event.clientY - bounds.top) * 300) / bounds.height)),
    };
  }
  return (
    <main className="mx-auto max-w-3xl space-y-5 px-5 py-8">
      <h1 className="text-2xl font-semibold">A little story for later</h1>
      <p className="rounded-xl bg-panel p-4 text-sm">
        Synthetic trial only. Scripted prompts, no AI, no messages sent outside this screen. A reply
        appears only after the tester types and submits it as Test Parent.
      </p>
      {error && <p role="alert">{error}</p>}
      {session && (
        <>
          <p>
            Viewing as <strong>{session.name}</strong>
          </p>
          {session.role === "adult" && (
            <label className="flex min-h-12 items-center gap-3 rounded-xl bg-panel p-4">
              <input
                type="checkbox"
                checked={session.enabled}
                disabled={busy}
                onChange={(e) => void run(() => api.setAccess(e.target.checked))}
              />
              Allow this synthetic child to use this story trial
            </label>
          )}
          {!session.enabled && (
            <p role="status">Story access is off. The parent controls this choice.</p>
          )}
          {session.enabled && session.role === "child" && (
            <section className="space-y-4">
              <div className="flex gap-3">
                {(["pulse", "moneybags"] as const).map((name) => (
                  <button
                    key={name}
                    className={button}
                    aria-pressed={companion === name}
                    onClick={() => setCompanion(name)}
                  >
                    {name === "pulse" ? "Pulse" : "Moneybags"}
                  </button>
                ))}
              </div>
              <p>{prompts[companion]}</p>
              <label className="block">
                My story
                <textarea
                  aria-label="My story"
                  className="mt-2 min-h-24 w-full rounded-xl bg-panel p-3"
                  maxLength={1000}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                />
              </label>
              <svg
                role="img"
                aria-label="Drawing pad"
                viewBox="0 0 600 300"
                className="w-full touch-none rounded-xl border border-line bg-panel text-violet"
                onPointerDown={(e) => {
                  if (drawing.length >= 20) return;
                  drawingActive.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const p = point(e);
                  setDrawing((current) => [...current, [p]]);
                }}
                onPointerMove={(e) => {
                  if (!drawingActive.current) return;
                  const p = point(e);
                  setDrawing((current) =>
                    current.map((stroke, i) =>
                      i === current.length - 1 && stroke.length < 500 ? [...stroke, p] : stroke,
                    ),
                  );
                }}
                onPointerUp={() => {
                  drawingActive.current = false;
                }}
                onPointerCancel={() => {
                  drawingActive.current = false;
                }}
              >
                <Drawing drawing={drawing} />
              </svg>
              <div className="flex flex-wrap gap-3">
                <button className={button} onClick={() => setDrawing([])}>
                  Clear drawing
                </button>
                <button
                  className={button}
                  disabled={busy || !story.trim()}
                  onClick={() =>
                    void run(async () => {
                      await api.submit({ companion, story, drawing });
                      setStory("");
                      setDrawing([]);
                    })
                  }
                >
                  Save for parent to read later
                </button>
              </div>
            </section>
          )}
          <section className="space-y-4" aria-label="Saved stories">
            {session.entries.map((entry) => (
              <article
                key={entry.id}
                className="space-y-3 rounded-2xl border border-line bg-panel p-5"
              >
                <h2 className="font-semibold">
                  {entry.childName} · {entry.companion === "pulse" ? "Pulse" : "Moneybags"} story
                </h2>
                <p className="whitespace-pre-wrap">{entry.story}</p>
                {entry.drawing.length > 0 && (
                  <svg
                    aria-label="Saved drawing"
                    viewBox="0 0 600 300"
                    className="max-h-52 w-full text-violet"
                  >
                    <Drawing drawing={entry.drawing} />
                  </svg>
                )}
                {entry.reply ? (
                  <div className="rounded-xl bg-panel-2 p-4">
                    <h3 className="font-semibold">From {entry.reply.authorName}</h3>
                    <p className="whitespace-pre-wrap">{entry.reply.text}</p>
                    <p className="mt-2 text-xs">Manually submitted in this synthetic trial.</p>
                  </div>
                ) : (
                  <p>No parent reply yet.</p>
                )}
                {!entry.reply && session.role === "adult" && session.enabled && (
                  <>
                    <label className="block">
                      Your reply after shift
                      <textarea
                        aria-label={`Reply to story ${entry.id}`}
                        className="mt-2 min-h-24 w-full rounded-xl border border-line p-3"
                        maxLength={1000}
                        value={replies[entry.id] ?? ""}
                        onChange={(e) =>
                          setReplies((all) => ({ ...all, [entry.id]: e.target.value }))
                        }
                      />
                    </label>
                    <button
                      className={button}
                      disabled={busy || !replies[entry.id]?.trim()}
                      onClick={() => void run(() => api.reply(entry.id, replies[entry.id]))}
                    >
                      Save my reply
                    </button>
                  </>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
