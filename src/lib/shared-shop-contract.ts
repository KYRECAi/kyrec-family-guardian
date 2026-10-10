import { z } from "zod";

export const memberSchema = z.object({
  user_id: z.string(),
  display_name: z.string(),
  role: z.enum(["adult", "child", "guest"]),
});
export const shopSchema = z.object({
  contract_version: z.literal("shared-shop-v1"),
  household_id: z.string(),
  name: z.string(),
  revision: z.number().int().nonnegative(),
  points: z.number().int(),
  snatch_on: z.boolean(),
  is_owner: z.boolean(),
  member_role: z.enum(["adult", "child", "guest"]),
  members: z.array(memberSchema),
  presets: z.array(
    z.object({
      name: z.string(),
      item_key: z.string(),
      cadence_days: z.number().nullable(),
      snoozed_until: z.string().nullable(),
    }),
  ),
  lines: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      created_by: z.string(),
      created_at: z.string(),
      snatched_by: z.string().nullable(),
      snatched_at: z.string().nullable(),
    }),
  ),
});
export type SharedShopSnapshot = z.infer<typeof shopSchema>;
