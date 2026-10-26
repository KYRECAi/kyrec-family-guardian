import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { coreRequest } from "../src/lib/core-client.server.ts";
import { memoryChatService } from "../src/lib/companion-chat-service.server.ts";
import { openAICompanion } from "../src/lib/openai-companion.server.ts";

const root = process.env.KYREC_CORE_TEST_ROOT;
const python = process.env.KYREC_CORE_TEST_PYTHON;
if (!root || !python) throw Error("Exact Core checkout and test Python required");
const listener = net.createServer();
await new Promise((r) => listener.listen(0, "127.0.0.1", r));
const port = listener.address().port;
await new Promise((r) => listener.close(r));
const child = spawn(
  python,
  [path.resolve("scripts/companion-memory-paired.py"), root, String(port)],
  { env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" }, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
child.stdout.on("data", (s) => {
  logs = (logs + s).slice(-10000);
});
child.stderr.on("data", (s) => {
  logs = (logs + s).slice(-10000);
});
const base = "http://127.0.0.1:" + port;
Object.assign(process.env, {
  NODE_ENV: "test",
  KYREC_CORE_URL: base,
  KYREC_CORE_SERVICE_ID: "guardian",
  KYREC_CORE_SERVICE_KEY: "s".repeat(32),
});
const transport = (url, options = {}) =>
  fetch(url, { ...options, headers: { ...options.headers, authorization: "Bearer synthetic" } });
const request = (user, path, method, data) =>
  coreRequest(user, path, method, data, undefined, transport);
const service = memoryChatService("adult-account", request);
let providers = 0;
const render = (expected) => (input) =>
  openAICompanion(
    input,
    async (_url, options) => {
      providers++;
      const body = JSON.parse(options.body);
      assert.equal(body.store, false);
      assert.ok(JSON.stringify(body.input).includes(expected));
      assert.ok(!JSON.stringify(body.input).includes("STALE_HISTORY"));
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: "Synthetic remembered answer" }],
          },
        ],
      });
    },
    { apiKey: "synthetic-only", model: "synthetic-only" },
  );
try {
  let identity;
  for (let i = 0; i < 200; i++) {
    if (child.exitCode !== null) throw Error("Core fixture stopped: " + logs);
    try {
      const r = await fetch(base + "/fixture");
      if (r.ok) {
        identity = await r.json();
        break;
      }
    } catch {
      /* The loopback fixture may still be starting. */
    }
    await pause(100);
  }
  assert.ok(identity, "Core fixture startup timed out: " + logs);
  const { household, memory_id } = identity;
  const input = (id, ids = [memory_id]) => ({
    id,
    household,
    request_id: randomUUID(),
    prompt: "Use my preference",
    history: [{ role: "them", text: "STALE_HISTORY" }],
    memory_ids: ids,
    memory_consent: true,
  });
  for (const id of ["stan", "nova", "pulse", "moneybags", "scout"]) {
    const options = await service.options({ id, household });
    assert.equal(options.memories[0].value, "Concise replies");
    const result = await service.answer(input(id), render("Concise replies"));
    assert.equal(result.ok, true);
  }
  // Explicit selection for two relevant roles never transfers either transcript.
  const operation_id = randomUUID();
  assert.deepEqual(
    await service.propose({
      id: "nova",
      household,
      operation_id,
      fact: { category: "preference", memory_key: "meal_preference", value: "Vegetarian" },
    }),
    { status: "pending" },
  );
  assert.equal((await service.options({ id: "pulse", household })).memories.length, 1);
  await request(
    "adult-account",
    "/v1/guardian/companion-memory/proposals/" + operation_id + "/decision",
    "POST",
    { outcome: "approved" },
  );
  const fresh = memoryChatService("adult-account", request);
  const meal = (await fresh.options({ id: "nova", household })).memories.find(
    (m) => m.memory_key === "meal_preference",
  );
  assert.ok(meal);
  for (const id of ["nova", "pulse"]) {
    assert.equal((await fresh.answer(input(id, [meal.memory_id]), render("Vegetarian"))).ok, true);
  }
  await assert.rejects(service.options({ id: "stan", household: randomUUID() }));
  await assert.rejects(
    memoryChatService("different-account", request).options({ id: "stan", household }),
  );
  const before = providers;
  await request(
    "adult-account",
    "/v1/guardian/companion-memory/memories/" + meal.memory_id + "/forget",
    "POST",
  );
  assert.equal(
    (await service.answer(input("nova", [meal.memory_id]), render("Must not run"))).ok,
    false,
  );
  assert.equal(providers, before);
  const changed = await service.answer(input("stan"), async () => {
    await request(
      "adult-account",
      "/v1/guardian/companion-memory/memories/" + memory_id + "/forget",
      "POST",
    );
    return { ok: true, text: "STALE_RESULT" };
  });
  assert.equal(changed.ok, false);
  assert.ok(!JSON.stringify(changed).includes("STALE_RESULT"));
  await fetch(base + "/fixture/revoke", { method: "POST" });
  await assert.rejects(service.options({ id: "scout", household }));
  console.log(
    "PAIRED MEMORY PASS: real Core HTTP + Guardian transport + memory service + captured provider payload; all five roles, explicit cooperation, proposal/approval/fresh recall/forget, wrong account/household, revocation and late-result suppression. Synthetic data only.",
  );
} finally {
  child.kill();
  await new Promise((resolve) =>
    child.exitCode !== null ? resolve() : child.once("exit", resolve),
  );
}
