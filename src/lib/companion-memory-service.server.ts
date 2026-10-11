import {
  currentMemories,
  pendingMemories,
  memoryDecision,
  decisionReceipt,
  forgetRequest,
  forgetReceipt,
} from "./companion-memory-contract.ts";

type RequestCore = (
  userId: string,
  path: string,
  method?: string,
  data?: unknown,
) => Promise<unknown>;
const prefix = "/v1/guardian/companion-memory";

/** Call only after familyAuthMiddleware verifies a fresh session. No caller IDs in input. */
export function memoryService(verifiedUserId: string, request: RequestCore) {
  if (!verifiedUserId?.trim() || verifiedUserId === "dev-user")
    throw new Error("Sign in to review memory.");
  return {
    async pending() {
      return pendingMemories(await request(verifiedUserId, `${prefix}/pending`));
    },
    async current() {
      return currentMemories(await request(verifiedUserId, `${prefix}/current`));
    },
    async decide(input: unknown) {
      const data = memoryDecision(input);
      return decisionReceipt(
        await request(verifiedUserId, `${prefix}/proposals/${data.proposal_id}/decision`, "POST", {
          outcome: data.outcome,
        }),
        data,
      );
    },
    async forget(input: unknown) {
      const data = forgetRequest(input);
      return forgetReceipt(
        await request(verifiedUserId, `${prefix}/memories/${data.memory_id}/forget`, "POST"),
        data.memory_id,
      );
    },
  };
}

