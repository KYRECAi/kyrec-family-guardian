import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { familyAuthMiddleware } from "./auth/middleware";
import { shopSchema } from "./shared-household";

import { chatRequest, chatChoice, chatProposal } from "./companion-chat-contract";

export const setCompanionConsent = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) =>
    z.object({ household: z.string().uuid(), enabled: z.boolean() }).strict().parse(input),
  )
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    setResponseHeader("Pragma", "no-cache");
    const { coreRequest } = await import("./core-client.server");
    const { getSql } = await import("./db");
    const house = shopSchema.parse(
      await coreRequest(context.userId, `/v1/guardian/households/${data.household}/shop`),
    );
    if (data.enabled && house.member_role !== "adult")
      throw new Error("Adult companion beta access is required.");
    const sql = await getSql();
    await sql`insert into guardian_companion_consent(user_id,enabled,policy_version) values(${context.userId},${data.enabled},${"openai-companion-beta-v1"}) on conflict(user_id) do update set enabled=excluded.enabled,policy_version=excluded.policy_version,updated_at=now()`;
    return { enabled: data.enabled };
  });

export const askCompanion = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => chatRequest.parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    setResponseHeader("Pragma", "no-cache");
    const { coreRequest } = await import("./core-client.server");
    const { getSql } = await import("./db");
    const { openAICompanion } = await import("./openai-companion.server");
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_COMPANION_MODEL)
      return { ok: false as const, error: "OpenAI companions are not configured yet." };
    const house = shopSchema.parse(
      await coreRequest(context.userId, `/v1/guardian/households/${data.household}/shop`),
    );
    if (house.member_role !== "adult")
      return {
        ok: false as const,
        error:
          "Companion chat is limited to adult beta accounts while child-specific release checks are completed. In immediate danger in Australia, call 000.",
      };
    const sql = await getSql();
    const { reserveCompanionRequest } = await import("./companion-controls.server");
    const rejection = await reserveCompanionRequest(
      sql,
      context.userId,
      data.request_id,
      new Date(),
      Number(process.env.OPENAI_MAX_DAILY_REQUESTS ?? 20),
    );
    if (rejection) return { ok: false as const, error: rejection };
    const { memoryChatService } = await import("./companion-chat-service.server");
    return memoryChatService(context.userId, coreRequest).answer(data, openAICompanion);
  });

export const readChatMemories = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => chatChoice.parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    setResponseHeader("Pragma", "no-cache");
    const { coreRequest } = await import("./core-client.server");
    const { memoryChatService } = await import("./companion-chat-service.server");
    return memoryChatService(context.userId, coreRequest).options(data);
  });

export const suggestChatMemory = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator((input: unknown) => chatProposal.parse(input))
  .handler(async ({ data, context }) => {
    const { setResponseHeader } = await import("@tanstack/react-start/server");
    setResponseHeader("Cache-Control", "no-store");
    setResponseHeader("Pragma", "no-cache");
    const { coreRequest } = await import("./core-client.server");
    const { memoryChatService } = await import("./companion-chat-service.server");
    return memoryChatService(context.userId, coreRequest).propose(data);
  });
