import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { familyAuthMiddleware } from "./auth/middleware";

import { shopSchema } from "./shared-shop-contract";
export { memberSchema, shopSchema, type SharedShopSnapshot } from "./shared-shop-contract";
const id = z.string().uuid();
const name = z.string().trim().min(1).max(120);
const base = z.object({ household: id, operation: id });
const changeSchema = z.discriminatedUnion("action", [
  base.extend({ action: z.literal("add"), name }),
  base.extend({ action: z.literal("snatch"), line: id }),
  base.extend({ action: z.literal("delete"), ids: z.array(id).min(1).max(100) }),
  base.extend({ action: z.literal("snatch_setting"), on: z.boolean() }),
  base.extend({ action: z.literal("preset_add"), name }),
  base.extend({ action: z.literal("preset_delete"), name }),
  base.extend({
    action: z.literal("cadence"),
    name,
    days: z.union([z.literal(3), z.literal(7), z.literal(14), z.literal(30), z.null()]),
  }),
  base.extend({
    action: z.literal("feedback"),
    decision_id: z.string().length(64),
    kind: z.enum(["accepted", "rejected", "dismissed", "corrected", "usefulness"]),
    cadence_days: z.union([z.literal(3), z.literal(7), z.literal(14), z.literal(30)]).optional(),
    useful: z.boolean().optional(),
  }),
]);
export type ShopChange = z.infer<typeof changeSchema>;

export const listHouseholds = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .handler(async ({ context }) => {
    const { coreRequest } = await import("./core-client.server");
    return z
      .object({
        households: z.array(
          z.object({ id, name: z.string(), role: z.enum(["adult", "child", "guest"]) }),
        ),
      })
      .parse(await coreRequest(context.userId, "/v1/guardian/households"));
  });

export const createHousehold = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) =>
    z
      .object({ name, display_name: name, adult: z.literal(true), shop_consent: z.literal(true) })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return z
      .object({ household_id: id })
      .parse(await coreRequest(context.userId, "/v1/guardian/households", "POST", data));
  });

export const joinHousehold = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        token: z.string().min(40).max(100),
        display_name: name,
        shop_consent: z.literal(true),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    const { createHash } = await import("node:crypto");
    if (!context.verifiedEmail) throw new Error("A confirmed email address is required.");
    const emailHash = createHash("sha256")
      .update(context.verifiedEmail.trim().toLowerCase())
      .digest("hex");
    return z
      .object({ household_id: id })
      .parse(
        await coreRequest(
          context.userId,
          "/v1/guardian/households/join",
          "POST",
          data,
          undefined,
          fetch,
          emailHash,
        ),
      );
  });

export const createHouseholdInvite = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        household: id,
        email: z.email(),
        role: z.enum(["adult", "child", "guest"]),
        shop_consent: z.literal(true),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    const { createHash } = await import("node:crypto");
    const recipient_email_hash = createHash("sha256")
      .update(data.email.trim().toLowerCase())
      .digest("hex");
    return z
      .object({ invite_token: z.string(), expires_in_seconds: z.number() })
      .parse(
        await coreRequest(
          context.userId,
          `/v1/guardian/households/${data.household}/invites`,
          "POST",
          { role: data.role, shop_consent: data.shop_consent, recipient_email_hash },
        ),
      );
  });

export const removeHouseholdMember = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) =>
    z
      .object({ household: id, user_id: z.string().min(1).max(200) })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    await coreRequest(
      context.userId,
      `/v1/guardian/households/${data.household}/members/${encodeURIComponent(data.user_id)}`,
      "DELETE",
    );
    return { removed: true };
  });

export const readSharedShop = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => z.object({ household: id }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return shopSchema.parse(
      await coreRequest(context.userId, `/v1/guardian/households/${data.household}/shop`),
    );
  });

export const changeSharedShop = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => changeSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    const prefix = `/v1/guardian/households/${data.household}/shop`;
    const routes = {
      add: ["POST", `${prefix}/lines`, { name: "name" in data ? data.name : "" }],
      snatch: ["POST", `${prefix}/lines/${"line" in data ? data.line : ""}/snatch`, undefined],
      delete: ["POST", `${prefix}/lines/delete`, { ids: "ids" in data ? data.ids : [] }],
      snatch_setting: ["PUT", `${prefix}/snatch`, { on: "on" in data && data.on }],
      preset_add: ["POST", `${prefix}/presets`, { name: "name" in data ? data.name : "" }],
      preset_delete: [
        "POST",
        `${prefix}/presets/delete`,
        { name: "name" in data ? data.name : "" },
      ],
      cadence: [
        "PUT",
        `${prefix}/cadence`,
        { name: "name" in data ? data.name : "", days: "days" in data ? data.days : null },
      ],
      feedback: [
        "POST",
        `${prefix}/feedback`,
        data.action === "feedback"
          ? {
              decision_id: data.decision_id,
              kind: data.kind,
              ...(data.cadence_days ? { cadence_days: data.cadence_days } : {}),
              ...(data.useful !== undefined ? { useful: data.useful } : {}),
            }
          : {},
      ],
    } as const;
    const [method, path, body] = routes[data.action];
    return shopSchema.parse(await coreRequest(context.userId, path, method, body, data.operation));
  });

export const shopDecisionSchema = z.object({
  decision_id: z.string().length(64),
  item_name: z.string(),
  cadence_days: z.number(),
  wording: z.string(),
  confidence: z.enum(["human_selected", "observed_pattern"]),
  expires_at: z.string(),
});
export const readShopDecisions = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => z.object({ household: id }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return z
      .object({
        policy_version: z.literal("shared-shop-cadence-v1"),
        decisions: z.array(shopDecisionSchema).max(2),
      })
      .parse(
        await coreRequest(
          context.userId,
          `/v1/guardian/households/${data.household}/shop/decisions`,
        ),
      );
  });

export const readFamilyLocations = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => z.object({ household: id }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return z
      .object({
        positions: z.array(
          z.object({
            user_id: z.string(),
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            observed_at: z.string(),
            expires_at: z.string(),
          }),
        ),
      })
      .parse(
        await coreRequest(context.userId, `/v1/guardian/households/${data.household}/locations`),
      );
  });

export const shareOwnLocation = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        household: id,
        enabled: z.boolean(),
        latitude: z.number().finite().min(-90).max(90).optional(),
        longitude: z.number().finite().min(-180).max(180).optional(),
        lease_id: z.string().uuid().optional(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { coreRequest } = await import("./core-client.server");
    return z
      .object({
        shared: z.boolean(),
        expires_at: z.string().optional(),
        lease_id: z.string().uuid().optional(),
      })
      .parse(
        await coreRequest(
          context.userId,
          `/v1/guardian/households/${data.household}/location`,
          "POST",
          {
            enabled: data.enabled,
            ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
            ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
            ...(data.lease_id ? { lease_id: data.lease_id } : {}),
          },
        ),
      );
  });

export const familyProviderConfig = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .handler(async () => ({
    // Browser Maps keys are public by design: restrict this key to the deployed
    // website referrers and Maps JavaScript API in Google Cloud before release.
    mapsKey: process.env.GOOGLE_MAPS_BROWSER_KEY?.trim() ?? "",
    mapsId: process.env.GOOGLE_MAPS_MAP_ID?.trim() ?? "",
    companionsConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_COMPANION_MODEL),
  }));
