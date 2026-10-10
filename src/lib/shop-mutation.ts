export type ShopMutation = { household: string; action: string } & Record<string, unknown>;

/** Keep uncertain writes in memory for this account until a retry is confirmed. */
export function createShopMutations<T>(
  transport: (data: ShopMutation & { operation: string }) => Promise<T>,
) {
  const uncertain = new Map<string, string>();
  return async (input: ShopMutation): Promise<T> => {
    const key = JSON.stringify(
      Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b))),
    );
    let operation = uncertain.get(key);
    if (!operation) {
      if (uncertain.size >= 64)
        throw new Error("Too many unconfirmed changes. Retry an earlier change first.");
      operation = crypto.randomUUID();
      uncertain.set(key, operation);
    }
    const result = await transport({ ...input, operation });
    if (uncertain.get(key) === operation) uncertain.delete(key);
    return result;
  };
}
