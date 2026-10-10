import { useEffect, useRef, useState } from "react";
import {
  nativeNotice,
  type NativeChoices,
  type NativeFeedback,
  type NativeResult,
} from "@/lib/native-review-contract";

type ReviewApi = Pick<
  typeof import("@/lib/native-review"),
  "chooseNativeConsent" | "readNativeChoices" | "readNativeResults" | "sendNativeFeedback"
>;

export function NativeReviewPanel({ household, api }: { household: string; api: ReviewApi }) {
  const { chooseNativeConsent, readNativeChoices, readNativeResults, sendNativeFeedback } = api;
  const [choices, setChoices] = useState<NativeChoices | null>(null);
  const [results, setResults] = useState<NativeResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<NativeFeedback | null>(null);
  const alive = useRef(false);
  const sequence = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sequence.current += 1;
    };
  }, []);
  // Expired results are removed, including when a background tab wakes up.
  useEffect(() => {
    const clearExpired = () =>
      setResults((items) => items.filter((item) => Date.parse(item.valid_until) > Date.now()));
    const timer = window.setInterval(clearExpired, 1000);
    const hide = () => {
      sequence.current += 1;
      setResults([]);
      setChoices(null);
    };
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  async function run(action?: () => Promise<unknown>, success?: string) {
    const current = ++sequence.current;
    setBusy(true);
    setResults([]);
    setChoices(null);
    setMessage(null);
    try {
      if (action) await action();
      const fresh = await readNativeChoices({ data: { household } });
      const items = fresh.choices.presentation.granted
        ? await readNativeResults({ data: { household } })
        : { results: [] };
      if (!alive.current || sequence.current !== current) return;
      setChoices(fresh);
      setResults(items.results);
      setMessage(success ?? null);
    } catch {
      if (alive.current && sequence.current === current)
        setMessage(
          "Personal review is unavailable. Any change was not confirmed. Refresh to check your choices or retry feedback.",
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function feedback(data: NativeFeedback) {
    setPending(data);
    void run(async () => {
      await sendNativeFeedback({ data });
      if (alive.current) setPending(null);
    }, "Feedback recorded. No action was approved or carried out.");
  }
  const button =
    "min-h-11 rounded-xl border border-line bg-panel px-4 py-2 text-sm text-fg hover:border-violet disabled:opacity-50";
  return (
    <section className="mt-6 rounded-2xl bg-panel p-4" aria-labelledby="native-review-title">
      <h2 id="native-review-title" className="text-lg font-semibold">
        Your personal review
      </h2>
      <p className="mt-2 text-sm text-muted">
        Choose whether to view Core results shared specifically with you and whether to record your
        feedback. These choices belong to you, not the household owner.
      </p>
      <p className="mt-2 text-sm text-muted">
        Choices last up to 30 days. You can turn either off here. Turning off stops future access;
        it does not erase feedback or the record of your choices. This feature does not send your
        choices or feedback to an external AI model.
      </p>
      <button className={`${button} mt-4`} disabled={busy} onClick={() => void run()}>
        Refresh personal review
      </button>
      {busy ? (
        <p role="status" className="mt-3 text-sm">
          Checking your current access…
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      ) : null}
      {choices ? (
        <div className="mt-4 space-y-4">
          {(["presentation", "feedback"] as const).map((purpose) => (
            <div key={purpose} className="rounded-xl bg-ink-2 p-3">
              <h3 className="font-semibold">
                {purpose === "presentation" ? "View my results" : "Record my feedback"}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {purpose === "presentation"
                  ? "Display only results Core currently permits you to see."
                  : "Save your response against a recommendation, including whether you found it useful. Feedback does not approve an action."}
              </p>
              <p className="mt-2 text-sm">{choices.choices[purpose].granted ? "On" : "Off"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className={button}
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        chooseNativeConsent({
                          data: { household, purpose, granted: true, notice_version: nativeNotice },
                        }),
                      "Your choice was saved.",
                    )
                  }
                >
                  Allow {purpose === "presentation" ? "viewing" : "feedback"}
                </button>
                <button
                  className={button}
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        chooseNativeConsent({
                          data: {
                            household,
                            purpose,
                            granted: false,
                            notice_version: nativeNotice,
                          },
                        }),
                      "Your choice was turned off.",
                    )
                  }
                >
                  Turn off {purpose === "presentation" ? "viewing" : "feedback"}
                </button>
              </div>
            </div>
          ))}
          {choices.choices.presentation.granted && !results.length ? (
            <p className="text-sm text-muted">
              No current results are available for you. Refresh to check again.
            </p>
          ) : null}
        </div>
      ) : null}
      {results.map((item) => (
        <article key={item.decision_id} className="mt-4 rounded-xl bg-ink-2 p-3">
          <p className="text-sm">{item.text}</p>
          {item.recommendation_id ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(["accepted", "rejected", "dismissed"] as const).map((kind) => (
                <button
                  className={button}
                  key={kind}
                  disabled={busy || !!pending}
                  onClick={() =>
                    feedback({
                      household,
                      feedback_id: crypto.randomUUID(),
                      recommendation_id: item.recommendation_id!,
                      kind,
                    })
                  }
                >
                  {
                    { accepted: "Accept suggestion", rejected: "Not for me", dismissed: "Dismiss" }[
                      kind
                    ]
                  }
                </button>
              ))}
            </div>
          ) : null}
        </article>
      ))}
      {pending ? (
        <button className={`${button} mt-3`} disabled={busy} onClick={() => feedback(pending)}>
          Retry unconfirmed feedback
        </button>
      ) : null}
    </section>
  );
}
