import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuardian } from "@/lib/store";

const COLS = 6;
const ROWS = 6;
const KINDS = 4;
const MOVES = 18;
const FILLS = ["#ff4f7a", "#ff8fb8", "#ff4fbe", "#ffd166"];

function key(x: number, y: number) {
  return `${x},${y}`;
}

function fresh() {
  const grid: number[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: number[] = [];
    for (let x = 0; x < COLS; x++) row.push(Math.floor(Math.random() * KINDS));
    grid.push(row);
  }
  return settle(grid).grid;
}

function matches(grid: number[][]) {
  const hit = new Set<string>();
  for (let y = 0; y < ROWS; y++) {
    let run = 1;
    for (let x = 1; x <= COLS; x++) {
      if (x < COLS && grid[y]![x] === grid[y]![x - 1]) run++;
      else {
        if (run >= 3) for (let i = 0; i < run; i++) hit.add(key(x - 1 - i, y));
        run = 1;
      }
    }
  }
  for (let x = 0; x < COLS; x++) {
    let run = 1;
    for (let y = 1; y <= ROWS; y++) {
      if (y < ROWS && grid[y]![x] === grid[y - 1]![x]) run++;
      else {
        if (run >= 3) for (let i = 0; i < run; i++) hit.add(key(x, y - 1 - i));
        run = 1;
      }
    }
  }
  return hit;
}

function settle(grid: number[][]) {
  let score = 0;
  let board = grid.map((row) => row.slice());
  for (let guard = 0; guard < 12; guard++) {
    const hit = matches(board);
    if (!hit.size) break;
    score += hit.size * 10;
    for (let x = 0; x < COLS; x++) {
      const keep: number[] = [];
      for (let y = 0; y < ROWS; y++) if (!hit.has(key(x, y))) keep.push(board[y]![x]!);
      while (keep.length < ROWS) keep.unshift(Math.floor(Math.random() * KINDS));
      for (let y = 0; y < ROWS; y++) board[y]![x] = keep[y]!;
    }
  }
  return { grid: board, score };
}

function adjacent(a: [number, number], b: [number, number]) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

export function ValentineCrush() {
  const addGameScore = useGuardian((s) => s.addGameScore);
  const best = useGuardian((s) => s.gameBest.valentine ?? 0);
  const [grid, setGrid] = useState(() => fresh());
  const [pick, setPick] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(MOVES);
  const [done, setDone] = useState(false);
  const hearts = useMemo(() => FILLS, []);

  function tap(x: number, y: number) {
    if (done) return;
    if (!pick) {
      setPick([x, y]);
      return;
    }
    if (pick[0] === x && pick[1] === y) {
      setPick(null);
      return;
    }
    if (!adjacent(pick, [x, y])) {
      setPick([x, y]);
      return;
    }
    const next = grid.map((row) => row.slice());
    const a = next[pick[1]]![pick[0]]!;
    next[pick[1]]![pick[0]] = next[y]![x]!;
    next[y]![x] = a;
    const settled = settle(next);
    if (!settled.score) {
      setPick([x, y]);
      return;
    }
    const total = score + settled.score;
    const left = moves - 1;
    setGrid(settled.grid);
    setScore(total);
    setMoves(left);
    setPick(null);
    if (left <= 0) {
      setDone(true);
      addGameScore("valentine", total);
    }
  }

  function again() {
    setGrid(fresh());
    setPick(null);
    setScore(0);
    setMoves(MOVES);
    setDone(false);
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-[#2a1020]">
      <header className="flex items-center justify-between px-3 py-3 text-white">
        <Link to="/games" aria-label="Back to games" className="grid size-11 place-items-center rounded-lg">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="text-center">
          <p className="text-[11px] tracking-[0.14em] uppercase text-white/60">Valentine</p>
          <h1 className="text-sm font-semibold">Valentine Crush</h1>
        </div>
        <div className="w-11 text-right text-sm tabular-nums">{moves}</div>
      </header>
      <div className="mx-auto w-full max-w-[390px] flex-1 px-4 pb-8">
        <p className="mb-3 text-center text-sm text-white/80">
          <span className="font-semibold text-[#ffd166]">{score}</span> household points · best {Math.max(best, score)}
        </p>
        <div className="grid grid-cols-6 gap-1.5 rounded-3xl bg-white/10 p-3">
          {grid.map((row, y) =>
            row.map((kind, x) => {
              const on = pick?.[0] === x && pick?.[1] === y;
              return (
                <button
                  key={key(x, y)}
                  type="button"
                  aria-label="Heart"
                  onClick={() => tap(x, y)}
                  className={`grid aspect-square place-items-center rounded-xl text-2xl ${on ? "ring-2 ring-white" : ""}`}
                  style={{ background: hearts[kind] }}
                >
                  ♥
                </button>
              );
            }),
          )}
        </div>
        <p className="mt-3 text-center text-xs text-white/60">Tap two hearts that touch. Three in a line crush. {MOVES} moves.</p>
        {done ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-[#2a1020]">
            <p className="text-lg font-semibold">Household score {score}</p>
            <p className="mt-1 text-sm text-muted">+{Math.floor(score / 10)} family points. One score. Nobody is singled out.</p>
            <Button className="mt-4 w-full" onClick={again}>
              Play again
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
