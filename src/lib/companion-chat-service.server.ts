import {
  CHAT_MEMORY_CONTRACT,
  chatChoice,
  chatRequest,
  chatProposal,
  memoryOptions,
  memoryContext,
  type ChatRequest,
} from "./companion-chat-contract.ts";
import type { CompanionRequest, CompanionResult } from "./openai-companion.server.ts";

type CoreRequest = (
  user: string,
  path: string,
  method?: string,
  data?: unknown,
) => Promise<unknown>;
const prefix = "/v1/guardian/companion-memory";
const unavailable =
  "Memory access changed or could not be confirmed. Refresh your memory choices before sending again.";
export function memoryChatService(user: string, core: CoreRequest) {
  if (!user?.trim() || user === "dev-user") throw new Error("Sign in to use memory.");
  async function context(input: ChatRequest) {
    return memoryContext(
      await core(user, prefix + "/chat-context", "POST", {
        household: input.household,
        companion: input.id,
        memory_ids: input.memory_ids,
        purpose: "companion_chat",
        provider: "openai",
        notice_version: CHAT_MEMORY_CONTRACT,
        consent: input.memory_consent,
      }),
      input,
    );
  }
  return {
    async options(raw: unknown) {
      const input = chatChoice.parse(raw);
      return memoryOptions(
        await core(
          user,
          prefix +
            "/chat-options?" +
            new URLSearchParams({ household: input.household, companion: input.id }),
        ),
        input,
      );
    },
    async propose(raw: unknown) {
      const input = chatProposal.parse(raw);
      const result = await core(user, prefix + "/chat-proposals/" + input.operation_id, "PUT", {
        household: input.household,
        companion: input.id,
        fact: input.fact,
      });
      const row = result as Record<string, unknown> | null;
      if (
        !row ||
        Object.keys(row).length !== 3 ||
        row.contract !== "companion-memory-v1" ||
        row.proposal_id !== input.operation_id ||
        !["pending", "approved", "dismissed"].includes(String(row.status))
      )
        throw new Error("Memory suggestion could not be confirmed.");
      return { status: row.status as "pending" | "approved" | "dismissed" };
    },
    async answer(
      raw: unknown,
      answer: (request: CompanionRequest) => Promise<CompanionResult>,
    ): Promise<CompanionResult & { reset_memory?: boolean }> {
      const input = chatRequest.parse(raw);
      if (!input.memory_ids.length)
        return answer({ id: input.id, prompt: input.prompt, history: input.history });
      try {
        const memories = await context(input);
        // A previous generated reply may quote a now-forgotten fact. Never send
        // earlier conversation turns in a memory-backed request.
        const result = await answer({ id: input.id, prompt: input.prompt, history: [], memories });
        const current = await context(input);
        if (JSON.stringify(current) !== JSON.stringify(memories)) throw new Error("Memory changed");
        return result;
      } catch {
        return { ok: false, error: unavailable, reset_memory: true };
      }
    },
  };
}
