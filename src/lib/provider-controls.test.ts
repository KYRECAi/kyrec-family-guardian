import assert from "node:assert/strict";
import { test } from "node:test";
import { deploymentIssues } from "./runtime-config.server.ts";
import { openAICompanion } from "./openai-companion.server.ts";
import { coreRequest, CoreUnavailable } from "./core-client.server.ts";

test("OpenAI is server-side, bounded, does not store responses or acquire Core authority", async () => {
  let request: RequestInit | undefined;
  const result = await openAICompanion(
    { id: "pulse", prompt: "Prepare a family list", history: [] },
    async (_url, options) => {
      request = options;
      return Response.json({
        status: "completed",
        output: [
          { type: "reasoning" },
          {
            type: "message",
            content: [
              { type: "output_text", text: "One option." },
              { type: "output_text", text: "Your choice." },
            ],
          },
        ],
      });
    },
    { apiKey: "synthetic-server-key", model: "synthetic-test-model" },
  );
  assert.deepEqual(result, { ok: true, text: "One option.\nYour choice." });
  const sent = JSON.parse(request!.body as string);
  assert.equal(sent.store, false);
  assert.equal(sent.max_output_tokens, 320);
  assert.equal(sent.tools, undefined);
  assert.ok(sent.instructions.includes("explicit approval"));
  assert.ok(!sent.instructions.includes("Michael"));
});

test("missing key, incomplete response, provider failure and timeout fail honestly", async () => {
  const input = { id: "nova" as const, prompt: "Hi", history: [] };
  let calls = 0;
  const transport = async () => {
    calls += 1;
    return new Response("", { status: 503 });
  };
  assert.equal((await openAICompanion(input, transport, {})).ok, false);
  assert.equal(calls, 0);
  const config = { apiKey: "synthetic-server-key", model: "synthetic-test-model" };
  assert.equal((await openAICompanion(input, transport, config)).ok, false);
  assert.equal(
    (
      await openAICompanion(
        input,
        async () => Response.json({ status: "incomplete", output: [] }),
        config,
      )
    ).ok,
    false,
  );
  assert.equal(
    (
      await openAICompanion(
        input,
        async () => {
          throw new Error("synthetic timeout");
        },
        config,
      )
    ).ok,
    false,
  );
});

test("hosted configuration rejects absent identity, unsafe origins and incomplete provider setup", () => {
  assert.ok(deploymentIssues({}).some((issue) => issue.includes("DATABASE_URL")));
  const env = {
    DATABASE_URL: "postgres://synthetic",
    BETTER_AUTH_SECRET: "s".repeat(32),
    BETTER_AUTH_URL: "https://guardian.example.test",
    RESEND_API_KEY: "synthetic",
    AUTH_EMAIL_FROM: "guardian@example.test",
    KYREC_CORE_URL: "https://core.example.test",
    KYREC_CORE_SERVICE_ID: "guardian",
    KYREC_CORE_SERVICE_KEY: "k".repeat(32),
    KYREC_CORE_EXPECTED_COMMIT: "b".repeat(40),
    OPENAI_API_KEY: "synthetic",
    OPENAI_COMPANION_MODEL: "synthetic-model",
    GOOGLE_MAPS_BROWSER_KEY: "synthetic",
    GOOGLE_MAPS_MAP_ID: "synthetic",
    GUARDIAN_SOURCE_COMMIT: "a".repeat(40),
  };
  assert.deepEqual(deploymentIssues(env), []);
  assert.ok(deploymentIssues({ ...env, VITE_AUTH_ENABLED: "false" }).length > 0);
  assert.ok(deploymentIssues({ ...env, KYREC_CORE_URL: "http://core.example.test" }).length > 0);
  assert.ok(deploymentIssues({ ...env, OPENAI_COMPANION_MODEL: "" }).length > 0);
  assert.ok(deploymentIssues({ ...env, GOOGLE_MAPS_BROWSER_KEY: "" }).length > 0);
  assert.ok(deploymentIssues({ ...env, GUARDIAN_RUNTIME_MODE: "development" }).length > 0);
  assert.ok(
    deploymentIssues({ ...env, KYREC_CORE_URL: "https://core.example.test/other" }).length > 0,
  );
});

test("Core server transport binds the session actor and fails on timeout or denial without copying secrets", async () => {
  const keys = ["KYREC_CORE_URL", "KYREC_CORE_SERVICE_ID", "KYREC_CORE_SERVICE_KEY"];
  const before = keys.map((key) => process.env[key]);
  Object.assign(process.env, {
    KYREC_CORE_URL: "https://core.example.test",
    KYREC_CORE_SERVICE_ID: "guardian",
    KYREC_CORE_SERVICE_KEY: "s".repeat(32),
  });
  try {
    let request: RequestInit | undefined;
    await coreRequest(
      "verified-user",
      "/v1/guardian/households",
      "GET",
      undefined,
      undefined,
      async (_url, options) => {
        request = options;
        return Response.json({ households: [] });
      },
    );
    assert.equal((request!.headers as Record<string, string>)["X-Kyrec-User-Id"], "verified-user");
    assert.equal(request!.redirect, "error");
    await assert.rejects(
      coreRequest(
        "verified-user",
        "/v1/guardian/households",
        "GET",
        undefined,
        undefined,
        async () => new Response("private server error", { status: 403 }),
      ),
      (error: unknown) =>
        error instanceof CoreUnavailable &&
        error.status === 403 &&
        !error.message.includes("private server error"),
    );
    await assert.rejects(
      coreRequest(
        "verified-user",
        "/v1/guardian/households",
        "GET",
        undefined,
        undefined,
        async () => {
          throw new Error("synthetic timeout");
        },
      ),
    );
    await assert.rejects(coreRequest("verified-user", "/v1/guardian/../internal"));
  } finally {
    keys.forEach((key, index) => {
      if (before[index] === undefined) delete process.env[key];
      else process.env[key] = before[index];
    });
  }
});
