/** Data validation only. Core owns identity, consent and owner authority. */
export const MEMORY_CONTRACT = "companion-memory-v1";
export type MemoryFact = { category: string; memory_key: string; value: string };
export type PendingMemory = MemoryFact & { proposal_id: string; subject_person_id: string };
export type CurrentMemory = MemoryFact & { memory_id: string };
export type MemoryDecision = { proposal_id: string; outcome: "approved" | "dismissed" };
export class MemoryContractError extends Error {
  constructor() {
    super("Memory response unavailable. Refresh and try again.");
  }
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new MemoryContractError();
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== keys.length || keys.some((key) => !Object.hasOwn(row, key)))
    throw new MemoryContractError();
  return row;
}
export function memoryId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
    throw new MemoryContractError();
  return value.toLowerCase();
}
function bounded(value: unknown, max: number): string {
  if (typeof value !== "string" || !value.trim() || Array.from(value).length > max)
    throw new MemoryContractError();
  return value;
}
function fact(row: Record<string, unknown>): MemoryFact {
  return {
    category: bounded(row.category, 80),
    memory_key: bounded(row.memory_key, 100),
    value: bounded(row.value, 200),
  };
}
function rows(value: unknown, key: string): unknown[] {
  const envelope = object(value, ["contract", key]);
  if (
    envelope.contract !== MEMORY_CONTRACT ||
    !Array.isArray(envelope[key]) ||
    envelope[key].length > 100
  )
    throw new MemoryContractError();
  return envelope[key];
}
function unique<T>(items: T[], id: (item: T) => string): T[] {
  if (new Set(items.map(id)).size !== items.length) throw new MemoryContractError();
  return items;
}
export function pendingMemories(value: unknown): PendingMemory[] {
  return unique(
    rows(value, "proposals").map((item) => {
      const row = object(item, [
        "proposal_id",
        "subject_person_id",
        "category",
        "memory_key",
        "value",
      ]);
      return {
        ...fact(row),
        proposal_id: memoryId(row.proposal_id),
        subject_person_id: memoryId(row.subject_person_id),
      };
    }),
    (item) => item.proposal_id,
  );
}
export function currentMemories(value: unknown): CurrentMemory[] {
  return unique(
    rows(value, "memories").map((item) => {
      const row = object(item, ["memory_id", "category", "memory_key", "value"]);
      return { ...fact(row), memory_id: memoryId(row.memory_id) };
    }),
    (item) => item.memory_id,
  );
}
export function memoryDecision(value: unknown): MemoryDecision {
  const row = object(value, ["proposal_id", "outcome"]);
  if (row.outcome !== "approved" && row.outcome !== "dismissed") throw new MemoryContractError();
  return { proposal_id: memoryId(row.proposal_id), outcome: row.outcome };
}
export function forgetRequest(value: unknown): { memory_id: string } {
  return { memory_id: memoryId(object(value, ["memory_id"]).memory_id) };
}
export function decisionReceipt(value: unknown, request: MemoryDecision) {
  const row = object(value, ["contract", "proposal_id", "status"]);
  if (
    row.contract !== MEMORY_CONTRACT ||
    memoryId(row.proposal_id) !== request.proposal_id ||
    row.status !== request.outcome
  )
    throw new MemoryContractError();
  return { proposal_id: request.proposal_id, status: request.outcome };
}
export function forgetReceipt(value: unknown, id: string) {
  const row = object(value, ["contract", "memory_id", "status", "historical_records_retained"]);
  if (
    row.contract !== MEMORY_CONTRACT ||
    memoryId(row.memory_id) !== id ||
    row.status !== "forgotten" ||
    row.historical_records_retained !== true
  )
    throw new MemoryContractError();
  return {
    memory_id: id,
    status: "forgotten" as const,
    historical_records_retained: true as const,
  };
}

