export type ArcadeGameId = "moneybags" | "valentine";
export const ARCADE_CHANNEL = "kyrec.arcade";
export const ARCADE_VERSION = 1;
export const ARCADE_GAMES = {
  moneybags: { title: "Moneybags Bonus", url: "https://kyrecai.github.io/" },
  valentine: { title: "Valentine Crush", url: "https://kyrecai.github.io/valentine/" },
} as const;

export type ArcadeMessage = {
  type: typeof ARCADE_CHANNEL; version: 1; game: ArcadeGameId; session: string;
  event: "ready" | "result" | "close" | "paused";
  result?: { run: string; score: number; coins: number; level: number; cleared: boolean };
};

const isCount = (n: unknown, maximum = 1_000_000_000): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= maximum;

/** Untrusted game messages are UI/arcade scores only, never reward authority. */
export function readArcadeMessage(
  event: { origin: string; source: unknown; data: unknown },
  expected: { origin: string; source: unknown; game: ArcadeGameId; session: string },
): ArcadeMessage | null {
  if (!expected.source || event.source !== expected.source || event.origin !== expected.origin) return null;
  if (!event.data || typeof event.data !== "object" || Array.isArray(event.data)) return null;
  const msg = event.data as Record<string, unknown>;
  if (msg.type !== ARCADE_CHANNEL || msg.version !== ARCADE_VERSION || msg.game !== expected.game || msg.session !== expected.session) return null;
  if (!["ready", "result", "close", "paused"].includes(String(msg.event))) return null;
  const clean: ArcadeMessage = {
    type: ARCADE_CHANNEL, version: 1, game: expected.game, session: expected.session,
    event: msg.event as ArcadeMessage["event"],
  };
  if (msg.event === "result") {
    if (!msg.result || typeof msg.result !== "object" || Array.isArray(msg.result)) return null;
    const r = msg.result as Record<string, unknown>;
    if (typeof r.run !== "string" || !/^[a-zA-Z0-9_-]{1,96}$/.test(r.run) ||
        !isCount(r.score) || !isCount(r.coins) || !isCount(r.level,15) || r.level < 1 || typeof r.cleared !== "boolean") return null;
    clean.result = { run: r.run, score: r.score, coins: r.coins, level: r.level, cleared: r.cleared };
  }
  return clean;
}

export function arcadeUrl(game: ArcadeGameId, origin: string, session: string, gameUrl: string = ARCADE_GAMES[game].url) {
  const parent = new URL(origin);
  if (!/^https?:$/.test(parent.protocol) || parent.origin !== origin || !/^[a-zA-Z0-9_-]{16,96}$/.test(session)) {
    throw new Error("This game needs a supported secure app origin and session.");
  }
  const url = new URL(gameUrl);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Unsupported game source");
  url.search = new URLSearchParams({ embed: "1", origin, session }).toString();
  return url.href;
}

export function withArcadeBest(
  current: Record<string, number>, game: ArcadeGameId, score: number,
): Record<string, number> {
  if (!isCount(score) || !Object.hasOwn(ARCADE_GAMES, game)) return current;
  const prior = isCount(current[game]) ? current[game] : 0;
  return score > prior ? { ...current, [game]: score } : current;
}
