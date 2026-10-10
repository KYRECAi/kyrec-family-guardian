import assert from "node:assert/strict";
import { test } from "node:test";
import { createShopMutations } from "./shop-mutation.ts";

test("a lost reply followed by another member's deletion does not resurrect a shopping item", async () => {
  const receipts = new Set<string>();
  const list = new Set<string>();
  const operations: string[] = [];
  let dropReply = true;
  const change = createShopMutations(async (data) => {
    operations.push(data.operation);
    if (!receipts.has(data.operation)) {
      receipts.add(data.operation);
      list.add(data.name as string);
    }
    if (dropReply) {
      dropReply = false;
      throw new Error("Reply lost after commit");
    }
    return [...list];
  });
  const input = { household: "house-one", action: "add", name: "Bread" };
  await assert.rejects(change(input));
  list.delete("Bread"); // Another member completed this item.
  assert.deepEqual(await change(input), []);
  assert.equal(operations[0], operations[1]);
  assert.equal(receipts.size, 1);
  assert.deepEqual(await change(input), ["Bread"]); // A later deliberate add is new.
  assert.notEqual(operations[1], operations[2]);
});

test("failed actions retain separate receipts across different payloads and households", async () => {
  const operations: string[] = [];
  const change = createShopMutations(async (data) => {
    operations.push(data.operation);
    throw new Error("Offline");
  });
  const first = { household: "one", action: "cadence", name: "Milk", days: 7 };
  for (const input of [first, { ...first, days: 14 }, { ...first, household: "two" }, first])
    await assert.rejects(change(input));
  assert.equal(new Set(operations.slice(0, 3)).size, 3);
  assert.equal(operations[0], operations[3]);
});

test("different account instances do not share pending operations and the pending set is bounded", async () => {
  const operations: string[] = [];
  const offline = async (data: { operation: string }) => {
    operations.push(data.operation);
    throw new Error("Offline");
  };
  const one = createShopMutations(offline);
  const two = createShopMutations(offline);
  const input = { household: "one", action: "add", name: "Milk" };
  await assert.rejects(one(input));
  await assert.rejects(two(input));
  assert.notEqual(operations[0], operations[1]);
  await assert.rejects(one({ name: "Milk", action: "add", household: "one" }));
  assert.equal(operations[0], operations[2]);
  for (let i = 1; i < 64; i++) await assert.rejects(one({ ...input, name: `Item ${i}` }));
  const before = operations.length;
  await assert.rejects(one({ ...input, name: "Overflow" }), /Too many unconfirmed/);
  assert.equal(operations.length, before);
  await assert.rejects(one(input), /Offline/); // Existing uncertain changes can still retry.
  assert.equal(operations.at(-1), operations[0]);
});
