import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { nativeReviewRequest } from "./native-review.server.ts";
import {
  nativeNotice,
  consentInput,
  feedbackInput,
  resultsResponse,
} from "./native-review-contract.ts";

const household = "00000000-0000-4000-8000-000000000001";
const target = "00000000-0000-4000-8000-000000000002";
const expiry = () => new Date(Date.now() + 25000).toISOString();
process.env.KYREC_CORE_URL = "https://core.example.invalid";
process.env.KYREC_CORE_SERVICE_ID = "guardian";
process.env.KYREC_CORE_SERVICE_KEY = "synthetic-key-not-live".repeat(3);
const reply = (body: unknown) => (async () => Response.json(body)) as typeof fetch;

test("native choices reject actor, workspace and implicit consent", () => {
  const data = { household, purpose: "feedback", granted: true, notice_version: nativeNotice };
  for (const extra of [
    { user_id: "owner" },
    { workspace_id: "family" },
    { granted: "true" },
    { notice_version: "old" },
  ]) {
    assert.throws(() => consentInput.parse({ ...data, ...extra }));
  }
  assert.throws(() =>
    feedbackInput.parse({
      household,
      feedback_id: target,
      recommendation_id: target,
      kind: "usefulness",
    }),
  );
});

test("server forwards verified actor only and preserves own explicit choice", async () => {
  const data = {
    household,
    purpose: "feedback" as const,
    granted: false,
    notice_version: nativeNotice,
  };
  let called = false;
  const transport = (async (url: URL, init: RequestInit) => {
    called = true;
    assert.equal(url.pathname, `/v1/guardian/households/${household}/native/consent`);
    assert.equal(init.method, "PUT");
    assert.equal(new Headers(init.headers).get("X-Kyrec-User-Id"), "verified-adult");
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "error");
    assert.deepEqual(JSON.parse(String(init.body)), {
      purpose: "feedback",
      granted: false,
      notice_version: nativeNotice,
    });
    return Response.json({
      purpose: "feedback",
      granted: false,
      notice_version: nativeNotice,
      expires_at: expiry(),
    });
  }) as typeof fetch;
  await nativeReviewRequest("verified-adult", "consent", data, transport);
  assert.equal(called, true);
});

test("feedback retries retain ID and reject mismatched receipts", async () => {
  const data = { household, feedback_id: target, recommendation_id: target, kind: "accepted" };
  const transport = reply({ feedback_id: target, recorded: true, execution_authorized: false });
  assert.deepEqual(
    await nativeReviewRequest("adult", "feedback", data, transport),
    await nativeReviewRequest("adult", "feedback", data, transport),
  );
  await assert.rejects(
    nativeReviewRequest(
      "adult",
      "feedback",
      data,
      reply({ feedback_id: household, recorded: true, execution_authorized: false }),
    ),
  );
});

test("denial timeout stale and malformed responses do not become results", async () => {
  const result = {
    decision_id: target,
    recommendation_id: null,
    text: "Synthetic review",
    valid_until: expiry(),
    execution_authorized: false,
  };
  const good = { contract: "guardian-native-review-v1", results: [result] };
  resultsResponse.parse(await nativeReviewRequest("adult", "results", { household }, reply(good)));
  for (const raw of [
    { ...good, results: [{ ...result, execution_authorized: true }] },
    { ...good, results: [{ ...result, valid_until: "2000-01-01T00:00:00Z" }] },
    { private_evidence: "secret" },
  ]) {
    await assert.rejects(
      nativeReviewRequest("adult", "results", { household }, reply(raw)),
      /Personal review is unavailable/,
    );
  }
  for (const transport of [
    (async () => new Response("secret", { status: 403 })) as typeof fetch,
    (async () => {
      throw new Error("private service key");
    }) as typeof fetch,
  ]) {
    await assert.rejects(
      nativeReviewRequest("adult", "results", { household }, transport),
      (error: Error) =>
        !error.message.includes("secret") && !error.message.includes("private service"),
    );
  }
});

test("each public server function uses fresh verified family middleware", async () => {
  const source = await readFile(new URL("./native-review.ts", import.meta.url), "utf8");
  assert.equal((source.match(/createServerFn\(/g) ?? []).length, 4);
  assert.equal((source.match(/middleware\(\[familyAuthMiddleware\]\)/g) ?? []).length, 4);
  assert.equal((source.match(/nativeReviewRequest\(context.userId/g) ?? []).length, 4);
});
