import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuardian } from "@/lib/store";

type ThemeId = "christmas" | "valentine" | "easter" | "moneybags";

type Theme = {
  id: ThemeId;
  title: string;
  kicker: string;
  sky: [string, string];
  paddle: "train" | "heart" | "basket" | "coin";
  items: { label: string; fill: string; pts: number }[];
};

const THEMES: Record<ThemeId, Theme> = {
  christmas: {
    id: "christmas",
    title: "Christmas Train",
    kicker: "Christmas",
    sky: ["#07122a", "#1a0f2e"],
    paddle: "train",
    items: [
      { label: "cane", fill: "#ff668b", pts: 10 },
      { label: "gift", fill: "#2ad997", pts: 15 },
      { label: "star", fill: "#ffbf19", pts: 20 },
      { label: "flake", fill: "#f7f9ff", pts: 8 },
    ],
  },
  valentine: {
    id: "valentine",
    title: "Valentine's Love Dash",
    kicker: "Valentine's Day",
    sky: ["#1a0a18", "#2a1024"],
    paddle: "heart",
    items: [
      { label: "heart", fill: "#ff4fbe", pts: 12 },
      { label: "note", fill: "#f7f9ff", pts: 16 },
      { label: "bonus", fill: "#ffbf19", pts: 24 },
    ],
  },
  easter: {
    id: "easter",
    title: "Easter Hunt",
    kicker: "Easter",
    sky: ["#07181a", "#0c2430"],
    paddle: "basket",
    items: [
      { label: "egg", fill: "#24a8ff", pts: 12 },
      { label: "egg", fill: "#ff4fbe", pts: 14 },
      { label: "egg", fill: "#2ad997", pts: 18 },
      { label: "gold", fill: "#ffbf19", pts: 28 },
    ],
  },
  moneybags: {
    id: "moneybags",
    title: "Moneybags Bonus",
    kicker: "Weekly bonus",
    sky: ["#1a1208", "#3a2a10"],
    paddle: "coin",
    items: [
      { label: "coin", fill: "#ffbf19", pts: 10 },
      { label: "coin", fill: "#e8c56b", pts: 16 },
      { label: "bonus", fill: "#7b3fff", pts: 28 },
    ],
  },
};

type Item = { x: number; y: number; vy: number; kind: number; r: number; sway: number };

const W = 390;
const H = 640;
const DURATION = 45;

export function SeasonalCatch({ id }: { id: ThemeId }) {
  const theme = THEMES[id];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const addGameScore = useGuardian((s) => s.addGameScore);
  const best = useGuardian((s) => s.gameBest[id] ?? 0);
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const addRef = useRef(addGameScore);
  addRef.current = addGameScore;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = {
      x: W / 2,
      keys: { l: false, r: false },
      items: [] as Item[],
      spawn: 0.2,
      score: 0,
      time: DURATION,
      pointer: null as number | null,
      hud: 0,
      awarded: false,
      wasPlaying: false,
    };

    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") state.keys.l = down;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") state.keys.r = down;
    };
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    const ptr = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      state.pointer = ((clientX - rect.left) / rect.width) * W;
    };
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      ptr(e.clientX);
    };
    const onMove = (e: PointerEvent) => {
      if (state.pointer != null) ptr(e.clientX);
    };
    const onUp = () => {
      state.pointer = null;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const playing = phaseRef.current === "play";
      if (playing && !state.wasPlaying) {
        state.score = 0;
        state.time = DURATION;
        state.awarded = false;
        state.items = [];
        state.x = W / 2;
      }
      state.wasPlaying = playing;

      if (playing) {
        state.time -= dt;
        if (state.time <= 0) {
          if (!state.awarded) {
            state.awarded = true;
            setScore(state.score);
            setLeft(0);
            setPhase("done");
            addRef.current(id, state.score);
          }
        } else {
          const speed = 280;
          if (state.pointer != null) {
            state.x += (state.pointer - state.x) * Math.min(1, dt * 12);
          } else {
            if (state.keys.l) state.x -= speed * dt;
            if (state.keys.r) state.x += speed * dt;
          }
          state.x = Math.max(36, Math.min(W - 36, state.x));
        }
      }

      state.spawn -= dt;
      if (state.spawn <= 0) {
        state.spawn = playing ? 0.5 + Math.random() * 0.4 : 0.9 + Math.random() * 0.6;
        const kind = Math.floor(Math.random() * theme.items.length);
        state.items.push({
          x: 28 + Math.random() * (W - 56),
          y: -20,
          vy: (playing ? 120 : 70) + Math.random() * 80,
          kind,
          r: 14 + Math.random() * 6,
          sway: Math.random() * Math.PI * 2,
        });
      }

      const paddleY = H - 86;
      const next: Item[] = [];
      for (const it of state.items) {
        it.y += it.vy * dt;
        it.x += Math.sin(it.y / 40 + it.sway) * 18 * dt;
        const caught =
          playing && it.y > paddleY - 10 && it.y < paddleY + 28 && Math.abs(it.x - state.x) < 48;
        if (caught) state.score += theme.items[it.kind]!.pts;
        else if (it.y < H + 30) next.push(it);
      }
      state.items = next;

      draw(ctx, theme, state, now);
      state.hud += dt;
      if (playing && state.hud > 0.2) {
        state.hud = 0;
        setScore(state.score);
        setLeft(Math.max(0, Math.ceil(state.time)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [id, theme]);

  function start() {
    setScore(0);
    setLeft(DURATION);
    setPhase("play");
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-ink">
      <header className="flex items-center justify-between px-3 py-3">
        <Link
          to="/games"
          aria-label="Back to games"
          className="grid size-11 place-items-center rounded-lg hover:bg-black/5"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="text-center">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{theme.kicker}</p>
          <h1 className="text-sm font-semibold">{theme.title}</h1>
        </div>
        <div className="w-11" />
      </header>

      <div className="relative mx-auto w-full max-w-[390px] flex-1 px-3 pb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="tabular font-semibold text-gold">{score} pts</span>
          <span className="tabular text-muted">{phase === "play" ? `${left}s` : `${DURATION}s`}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="h-auto w-full touch-none rounded-2xl shadow-[var(--shadow-lift)]"
        />

        {phase !== "play" ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-8 flex justify-center">
            <div className="pointer-events-auto w-full rounded-xl bg-panel/95 p-5 shadow-[var(--shadow-lift)] backdrop-blur-md">
              {phase === "ready" ? (
                <>
                  <h2 className="text-xl font-semibold tracking-tight">Play as the family</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Everyone contributes to one household score. Opt-in play, no pay-to-win. Drag or use arrow keys.
                  </p>
                  <p className="mt-2 text-xs text-subtle">Household best {best}</p>
                  <Button className="mt-5 w-full" onClick={start}>
                    Start {theme.title}
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold tracking-tight">Household score</h2>
                  <p className="mt-1 tabular text-4xl font-semibold text-gold">{score}</p>
                  <p className="mt-2 text-sm text-muted">
                    +{Math.floor(score / 10)} family points added. Best {Math.max(best, score)}.
                  </p>
                  <div className="mt-5 flex gap-2">
                    <Button className="flex-1" onClick={start}>
                      Play again
                    </Button>
                    <Link to="/points" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Points
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  theme: Theme,
  state: { x: number; items: Item[] },
  now: number,
) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.sky[0]);
  g.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 28; i++) {
    const sx = (i * 73) % W;
    const sy = (i * 51 + (now / 40) * (0.4 + (i % 5) * 0.1)) % H;
    ctx.fillStyle = "rgba(247,249,255,0.18)";
    ctx.beginPath();
    ctx.arc(sx, sy, i % 4 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const it of state.items) {
    const spec = theme.items[it.kind]!;
    ctx.fillStyle = spec.fill;
    if (spec.label === "heart") {
      heart(ctx, it.x, it.y, it.r);
      ctx.fill();
    } else if (spec.label === "star") {
      star(ctx, it.x, it.y, it.r);
      ctx.fill();
    } else if (spec.label === "cane") {
      ctx.lineWidth = 5;
      ctx.strokeStyle = spec.fill;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(it.x, it.y - 4, 7, Math.PI, 0);
      ctx.lineTo(it.x + 7, it.y + 10);
      ctx.stroke();
    } else if (spec.label === "coin" || spec.label === "bonus") {
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = spec.label === "bonus" ? "#ffbf19" : "#24184a";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("$", it.x, it.y + 4);
    } else {
      rounded(ctx, it.x - it.r, it.y - it.r, it.r * 2, it.r * 1.6, 6);
      ctx.fill();
    }
  }

  const px = state.x;
  const py = H - 78;
  if (theme.paddle === "train") {
    ctx.fillStyle = "#24a8ff";
    rounded(ctx, px - 46, py, 92, 28, 10);
    ctx.fill();
    ctx.fillStyle = "#09152d";
    ctx.fillRect(px - 28, py + 6, 18, 10);
    ctx.fillRect(px + 10, py + 6, 18, 10);
    ctx.fillStyle = "#ffbf19";
    ctx.beginPath();
    ctx.arc(px - 30, py + 28, 6, 0, Math.PI * 2);
    ctx.arc(px + 30, py + 28, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (theme.paddle === "heart") {
    ctx.fillStyle = "#ff4fbe";
    heart(ctx, px, py + 10, 28);
    ctx.fill();
  } else if (theme.paddle === "coin") {
    ctx.fillStyle = "#e8c56b";
    ctx.beginPath();
    ctx.arc(px, py + 14, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7b3fff";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#24184a";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("$", px, py + 20);
  } else {
    ctx.fillStyle = "#2ad997";
    rounded(ctx, px - 44, py, 88, 26, 12);
    ctx.fill();
  }
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y - s * 0.4, x - s, y - s * 0.1, x - s, y + s * 0.25);
  ctx.bezierCurveTo(x - s, y + s * 0.8, x, y + s * 1.05, x, y + s * 1.2);
  ctx.bezierCurveTo(x, y + s * 1.05, x + s, y + s * 0.8, x + s, y + s * 0.25);
  ctx.bezierCurveTo(x + s, y - s * 0.1, x, y - s * 0.4, x, y + s * 0.3);
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const b = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45);
  }
  ctx.closePath();
}
