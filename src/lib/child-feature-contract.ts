import { z } from "zod";

export const FEATURE_LABELS = {
  chat: "Chat",
  stan: "Stan",
  nova: "Nova",
  pulse: "Pulse",
  moneybags: "Moneybags",
  scout: "Scout",
  map: "Map",
  games: "Games",
} as const;
export type ChildFeature = keyof typeof FEATURE_LABELS;
export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as ChildFeature[];
export const featuresSchema = z
  .object({
    chat: z.boolean(),
    stan: z.boolean(),
    nova: z.boolean(),
    pulse: z.boolean(),
    moneybags: z.boolean(),
    scout: z.boolean(),
    map: z.boolean(),
    games: z.boolean(),
  })
  .strict();
export type ChildFeatures = z.infer<typeof featuresSchema>;
export const allFeatures = (enabled: boolean): ChildFeatures =>
  Object.fromEntries(FEATURE_KEYS.map((key) => [key, enabled])) as ChildFeatures;
export const childAccessTarget = z
  .object({ household: z.string().uuid(), member: z.string().min(1).max(200) })
  .strict();
export const childAccessChange = childAccessTarget
  .extend({ revision: z.number().int().nonnegative(), features: featuresSchema })
  .strict();
export const childAccessSchema = z
  .object({
    user_id: z.string(),
    revision: z.number().int().nonnegative(),
    features: featuresSchema,
  })
  .strict();
export type ChildAccess = z.infer<typeof childAccessSchema>;

export function routeFeatures(path: string): ChildFeature[] {
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "games") return ["games"];
  if (["map", "drive", "alerts"].includes(segments[0] ?? "")) return ["map"];
  if (["planner", "routines"].includes(segments[0] ?? "")) return ["pulse"];
  if (["budget", "points"].includes(segments[0] ?? "")) return ["moneybags"];
  if (segments[0] === "protection") return ["scout"];
  const companion = ["companions", "talk"].includes(segments[0] ?? "") ? segments[1] : segments[0];
  if (["stan", "nova", "pulse", "moneybags", "scout"].includes(companion ?? ""))
    return segments[0] === "talk"
      ? ["chat", companion as ChildFeature]
      : [companion as ChildFeature];
  return [];
}
export function canOpenFeatureRoute(path: string, role: string, features?: ChildFeatures): boolean {
  if (role !== "child") return true;
  if (path.replace(/\/$/, "") === "/companions")
    return ["stan", "nova", "pulse", "moneybags", "scout"].some(
      (key) => features?.[key as ChildFeature] === true,
    );
  return routeFeatures(path).every((key) => features?.[key] === true);
}
