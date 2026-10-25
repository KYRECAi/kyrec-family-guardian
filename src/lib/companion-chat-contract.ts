import { z } from "zod";
import {
  currentMemories,
  MEMORY_CONTRACT,
  type CurrentMemory,
} from "./companion-memory-contract.ts";

export const CHAT_MEMORY_CONTRACT = "guardian-memory-chat-v1";
export const companionId = z.enum(["stan", "nova", "pulse", "moneybags", "scout"]);
export const chatChoice = z.object({ id: companionId, household: z.string().uuid() }).strict();
export const chatRequest = chatChoice
  .extend({
    request_id: z.string().uuid(),
    prompt: z.string().trim().min(1).max(600),
    history: z
      .array(z.object({ role: z.enum(["user", "them"]), text: z.string().max(600) }).strict())
      .max(6)
      .default([]),
    memory_ids: z.array(z.string().uuid()).max(8).default([]),
    memory_consent: z.boolean().default(false),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      new Set(value.memory_ids).size !== value.memory_ids.length ||
      (value.memory_ids.length && !value.memory_consent)
    )
      ctx.addIssue({ code: "custom", message: "Choose which memories this companion may use." });
  });
export type ChatRequest = z.infer<typeof chatRequest>;
export type ChatChoice = z.infer<typeof chatChoice>;
const envelope = z.object({
  contract: z.literal(CHAT_MEMORY_CONTRACT),
  companion: companionId,
  household: z.string().uuid(),
  memories: z.array(z.unknown()).max(100),
});
const fields = z
  .array(
    z
      .object({ category: z.string().min(1).max(80), memory_key: z.string().min(1).max(100) })
      .strict(),
  )
  .min(1)
  .max(30);
export type ChatMemoryOptions = { memories: CurrentMemory[]; fields: z.infer<typeof fields> };
function bound(
  row: { companion: string; household: string; memories: unknown[] },
  choice: ChatChoice,
) {
  if (row.companion !== choice.id || row.household !== choice.household)
    throw new Error("Memory recipient mismatch");
  return currentMemories({ contract: MEMORY_CONTRACT, memories: row.memories });
}
export function memoryOptions(raw: unknown, choice: ChatChoice): ChatMemoryOptions {
  const row = envelope.extend({ fields }).strict().parse(raw);
  return { memories: bound(row, choice), fields: row.fields };
}
export function memoryContext(raw: unknown, input: ChatRequest): CurrentMemory[] {
  const row = envelope
    .extend({ purpose: z.literal("companion_chat"), provider: z.literal("openai") })
    .strict()
    .parse(raw);
  const memories = bound(row, input);
  if (
    memories.length !== input.memory_ids.length ||
    memories.some((m, i) => m.memory_id !== input.memory_ids[i])
  )
    throw new Error("Memory selection changed");
  return memories;
}
export const chatProposal = chatChoice
  .extend({
    operation_id: z.string().uuid(),
    fact: z
      .object({
        category: z.string().min(1).max(80),
        memory_key: z.string().min(1).max(100),
        value: z.string().trim().min(1).max(200),
      })
      .strict(),
  })
  .strict();
