import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { memoryService } from "./companion-memory-service.server.ts";
import {
  MEMORY_CONTRACT as contract,
  pendingMemories,
  currentMemories,
  MemoryContractError,
} from "./companion-memory-contract.ts";
import { coreRequest } from "./core-client.server.ts";

const id = "10000000-0000-4000-8000-000000000001";
const subject = "10000000-0000-4000-8000-000000000002";
const fact = { category: "preference", memory_key: "nickname", value: "Captain Olive" };
const proposal = { proposal_id: id, subject_person_id: subject, ...fact };

test("reads bounded versioned pending and current facts without treating names as authority", async () => {
  const calls: unknown[][] = [];
  const svc = memoryService("verified-account", async (...args) => {
    calls.push(args);
    return args[1].endsWith("pending")
      ? { contract, proposals: [proposal] }
      : { contract, memories: [{ memory_id: id, ...fact }] };
  });
  assert.deepEqual(await svc.pending(), [proposal]);
  assert.deepEqual(await svc.current(), [{ memory_id: id, ...fact }]);
  assert.ok(calls.every((call) => call[0] === "verified-account"));
});

test("approval uses verified account and only the decision outcome as the body", async () => {
  let call: unknown[] = [];
  const svc = memoryService("owner-account", async (...args) => {
    call = args;
    return { contract, proposal_id: id, status: "approved" };
  });
  assert.deepEqual(await svc.decide({ proposal_id: id, outcome: "approved" }), {
    proposal_id: id,
    status: "approved",
  });
  assert.deepEqual(call, [
    "owner-account",
    `/v1/guardian/companion-memory/proposals/${id}/decision`,
    "POST",
    { outcome: "approved" },
  ]);
});

test("client cannot inject owner, workspace, subject, arbitrary route or decision", async () => {
  let calls = 0;
  const svc = memoryService("owner-account", async () => {
    calls++;
  });
  for (const extra of ["actor_person_id", "workspace_id", "subject_person_id", "userId"])
    await assert.rejects(
      svc.decide({ proposal_id: id, outcome: "approved", [extra]: "Michael" }),
      MemoryContractError,
    );
  await assert.rejects(
    svc.decide({ proposal_id: "../../admin", outcome: "approved" }),
    MemoryContractError,
  );
  await assert.rejects(svc.decide({ proposal_id: id, outcome: "override" }), MemoryContractError);
  await assert.rejects(svc.forget({ memory_id: id, owner: true }), MemoryContractError);
  assert.equal(calls, 0);
});

test("no development or missing account fallback", () => {
  for (const account of ["", " ", "dev-user"])
    assert.throws(() => memoryService(account, async () => ({})), /Sign in/);
});

test("malformed, oversized, duplicate and extra private data responses fail closed", () => {
  for (const input of [
    { contract: "old", proposals: [] },
    { contract, proposals: Array(101).fill(proposal) },
    { contract, proposals: [proposal, proposal] },
    { contract, proposals: [{ ...proposal, transcript: "private" }] },
    { contract, proposals: [{ ...proposal, value: "x".repeat(201) }] },
    { contract, proposals: [{ ...proposal, subject_person_id: "Michael" }] },
    { contract, proposals: [], workspace_id: "other" },
  ])
    assert.throws(() => pendingMemories(input), MemoryContractError);
  assert.throws(() => currentMemories({ contract, memories: null }), MemoryContractError);
});

test("decision receipts must match requested record and outcome", async () => {
  for (const receipt of [
    { contract, proposal_id: subject, status: "approved" },
    { contract, proposal_id: id, status: "dismissed" },
    { contract, proposal_id: id, status: "pending" },
  ])
    await assert.rejects(
      memoryService("owner", async () => receipt).decide({ proposal_id: id, outcome: "approved" }),
      MemoryContractError,
    );
});

test("forgetting reports historical retention and never claims physical erasure", async () => {
  const response = {
    contract,
    memory_id: id,
    status: "forgotten",
    historical_records_retained: true,
  };
  const svc = memoryService("owner", async () => response);
  assert.equal((await svc.forget({ memory_id: id })).historical_records_retained, true);
  await assert.rejects(
    memoryService("owner", async () => ({
      ...response,
      historical_records_retained: false,
    })).forget({ memory_id: id }),
    MemoryContractError,
  );
});

test("unavailable Core and denied authority never become success or empty memory", async () => {
  const svc = memoryService("owner", async () => {
    throw new Error("unavailable");
  });
  await assert.rejects(svc.pending(), /unavailable/);
  await assert.rejects(svc.current(), /unavailable/);
  await assert.rejects(svc.decide({ proposal_id: id, outcome: "dismissed" }), /unavailable/);
});

test("all exposed server functions require real session middleware", () => {
  const source = readFileSync(new URL("./companion-memory.ts", import.meta.url), "utf8");
  assert.equal((source.match(/createServerFn\(/g) ?? []).length, 4);
  assert.equal((source.match(/\.middleware\(\[familyAuthMiddleware\]\)/g) ?? []).length, 4);
  assert.equal((source.match(/service\(context.userId\)/g) ?? []).length, 4);
});

test("existing transport keeps keys server-side, rejects redirects and preserves Core denial", async () => {
  const saved = { ...process.env };
  process.env.KYREC_CORE_URL = "https://core.invalid";
  process.env.KYREC_CORE_SERVICE_KEY = "synthetic-test-key-".repeat(3);
  process.env.KYREC_CORE_SERVICE_ID = "guardian-test";
  try {
    const transport: typeof fetch = async (url, init) => {
      assert.equal(String(url), "https://core.invalid/v1/guardian/companion-memory/pending");
      assert.equal(new Headers(init?.headers).get("X-Kyrec-User-Id"), "verified-owner");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.cache, "no-store");
      return new Response(JSON.stringify({ contract, proposals: [proposal] }), { status: 200 });
    };
    const svc = memoryService("verified-owner", (u, p, m, d) =>
      coreRequest(u, p, m, d, undefined, transport),
    );
    assert.deepEqual(await svc.pending(), [proposal]);
    const denied = memoryService("other-account", (u, p, m, d) =>
      coreRequest(
        u,
        p,
        m,
        d,
        undefined,
        async () => new Response("private error", { status: 403 }),
      ),
    );
    await assert.rejects(
      denied.pending(),
      (e: Error & { status?: number }) => e.status === 403 && !e.message.includes("private error"),
    );
  } finally {
    for (const key of ["KYREC_CORE_URL", "KYREC_CORE_SERVICE_KEY", "KYREC_CORE_SERVICE_ID"]) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
});

