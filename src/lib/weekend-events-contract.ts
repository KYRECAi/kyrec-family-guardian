import { z } from "zod";

const iso = z.iso.datetime({ offset: true });
const date = z.iso.date();
export const weekendInput = z.object({
  start: date.refine((value) => new Date(`${value}T12:00:00Z`).getUTCDay() === 6, "Choose a Saturday"),
  free_only: z.boolean().default(false),
}).strict();
const sourceUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password;
});
export const weekendResponse = z.object({
  contract: z.literal("guardian-weekend-events-v1"),
  weekend_start: date, weekend_end: date, timezone: z.literal("Australia/Perth"),
  coverage: z.string().max(200), free_only: z.boolean(),
  status: z.enum(["available", "no_matches", "unavailable"]),
  source_checked_at: iso.nullable(), has_more: z.boolean(), automatic_actions: z.literal(false),
  events: z.array(z.object({
    id: z.string().regex(/^[a-f0-9]{24}$/), name: z.string().min(1).max(250),
    starts_at: iso, ends_at: iso.nullable(), venue: z.string().max(500).nullable(),
    locality: z.string().max(200).nullable(), source_url: sourceUrl, checked_at: iso,
    price_min: z.number().finite().nonnegative().nullable(),
    price_max: z.number().finite().nonnegative().nullable(), currency: z.literal("AUD").nullable(),
    price_status: z.enum(["listed_free", "listed_price", "unknown"]), price_note: z.string().max(300),
    suitability: z.literal("parent_check_required"), booking_performed: z.literal(false),
  }).strict()).max(40),
}).strict();
export type WeekendEvents = z.infer<typeof weekendResponse>;

export function perthWeekendStart(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"Australia/Perth", year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(now);
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const day = new Date(Date.UTC(number("year"), number("month") - 1, number("day")));
  const weekday = day.getUTCDay();
  day.setUTCDate(day.getUTCDate() + (weekday === 0 ? -1 : (6 - weekday + 7) % 7));
  return day.toISOString().slice(0, 10);
}
