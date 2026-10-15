import { createServerFn } from "@tanstack/react-start";
import { familyAuthMiddleware } from "./auth/middleware";
import { memoryDecision, forgetRequest } from "./companion-memory-contract";

async function service(userId: string) {
  const { coreRequest } = await import("./core-client.server");
  const { memoryService } = await import("./companion-memory-service.server");
  return memoryService(userId, coreRequest);
}

export const readPendingMemories = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .handler(async ({ context }) => (await service(context.userId)).pending());

export const readCurrentMemories = createServerFn({ method: "GET" })
  .middleware([familyAuthMiddleware])
  .handler(async ({ context }) => (await service(context.userId)).current());

export const decideMemory = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator(memoryDecision)
  .handler(async ({ data, context }) => (await service(context.userId)).decide(data));

export const forgetMemory = createServerFn({ method: "POST" })
  .middleware([familyAuthMiddleware])
  .validator(forgetRequest)
  .handler(async ({ data, context }) => (await service(context.userId)).forget(data));

