import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pause, RotateCcw } from "lucide-react";
import { ARCADE_CHANNEL, ARCADE_GAMES, ARCADE_VERSION, arcadeUrl, readArcadeMessage, type ArcadeGameId } from "@/lib/arcade-contract";

export function ArcadePlayer({ game, onClose, onScore, best, gameUrl = ARCADE_GAMES[game].url }: {
  game: ArcadeGameId; onClose: () => void; onScore: (game: ArcadeGameId, score: number) => void;
  best: number; gameUrl?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const seen = useRef(new Set<string>());
  const readySession = useRef<string | null>(null);
  const [connection, setConnection] = useState<{ url: string; session: string } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "offline" | "unavailable">("loading");
  const [round, setRound] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);
  const details = ARCADE_GAMES[game];

  useEffect(() => {
    seen.current.clear(); readySession.current = null; setRound(null);
    if (!navigator.onLine) { setStatus("offline"); setConnection(null); return; }
    const session = crypto.randomUUID();
    try { setConnection({ url: arcadeUrl(game, window.location.origin, session, gameUrl), session }); setStatus("loading"); }
    catch { setStatus("unavailable"); setConnection(null); }
  }, [game, gameUrl, retry]);

  useEffect(() => {
    if (!connection) return;
    let connected = readySession.current === connection.session;
    const timer = window.setTimeout(() => { if (!connected) setStatus(navigator.onLine ? "unavailable" : "offline"); }, 20_000);
    function receive(event: MessageEvent) {
      const msg = readArcadeMessage(event, { source: frame.current?.contentWindow, origin: new URL(gameUrl).origin, game, session: connection!.session });
      if (!msg) return;
      if (msg.event === "ready") { connected = true; readySession.current = connection!.session; window.clearTimeout(timer); setStatus("ready"); }
      if (msg.event === "close") onClose();
      if (msg.event === "result" && msg.result && !seen.current.has(msg.result.run)) {
        if (seen.current.size >= 100) seen.current.clear();
        seen.current.add(msg.result.run); onScore(game, msg.result.score); setRound(msg.result.score);
      }
    }
    const offline = () => { setStatus("offline"); setConnection(null); };
    window.addEventListener("message", receive); window.addEventListener("offline", offline);
    return () => { window.clearTimeout(timer); window.removeEventListener("message", receive); window.removeEventListener("offline", offline); };
  }, [connection, gameUrl, game, onClose, onScore]);

  function pause() {
    if (!connection) return;
    frame.current?.contentWindow?.postMessage({ type: ARCADE_CHANNEL, version: ARCADE_VERSION, game, session: connection.session, event: "pause" }, new URL(gameUrl).origin);
  }
  useEffect(() => {
    const hidden = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [connection, game, gameUrl]);

  return (
    <section className="guardian-arcade" aria-label={details.title}>
      <header className="guardian-arcade-bar">
        <button type="button" onClick={onClose} aria-label="Back to games" className="guardian-arcade-back"><ArrowLeft size={19} /></button>
        <div><h1>{details.title}</h1><p>Arcade play · game points only</p></div>
        <button type="button" onClick={pause} disabled={status !== "ready"} aria-label="Pause game"><Pause size={18} /></button>
      </header>
      <div className="guardian-arcade-stage">
        {connection && <iframe key={connection.session} ref={frame} src={connection.url} title={details.title}
          sandbox="allow-scripts allow-same-origin" allow="autoplay; web-share" referrerPolicy="no-referrer"
          onError={() => setStatus("unavailable")} />}
        {status !== "ready" && <div className="guardian-arcade-status" role="status">
          <h2>{status === "loading" ? "Opening your game…" : status === "offline" ? "Connect to play" : "The game couldn’t open"}</h2>
          <p>{status === "loading" ? "Getting everything ready." : "Check your connection and try again."}</p>
          {status !== "loading" && <button type="button" onClick={() => setRetry(n => n+1)}><RotateCcw size={17} /> Try again</button>}
          <button type="button" onClick={onClose}>Back to games</button>
        </div>}
      </div>
      <footer className="guardian-arcade-score" aria-live="polite">
        <span>{round === null ? "Your best" : "Round " + round.toLocaleString("en-AU") + " · Best"} {best.toLocaleString("en-AU")}</span>
        <span>Family Points stay separate</span>
      </footer>
    </section>
  );
}
