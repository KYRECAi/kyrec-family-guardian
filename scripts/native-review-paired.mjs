/** Run only against a supplied local Core checkout, with synthetic identities. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { pgliteDialect } from "../src/lib/auth/pglite-dialect.ts";
import { familyEmailOptions } from "../src/lib/auth/family-email-options.server.ts";
import { nativeReviewRequest } from "../src/lib/native-review.server.ts";

assert.ok(process.env.KYREC_CORE_TEST_ROOT, "Set a local synthetic Core test checkout.");
const db = new PGlite();
let child;
try {
  await db.exec(await readFile("migrations/0001_auth.sql", "utf8"));
  const messages = [];
  const auth = betterAuth({
    baseURL: "http://localhost:8191",
    secret: "synthetic-paired-session-secret-not-live-000",
    database: { dialect: pgliteDialect(() => db), type: "postgres" },
    ...familyEmailOptions(async (purpose, address, url) => {
      messages.push({ purpose, address, url });
      return "synthetic-receipt";
    }),
    session: { cookieCache: { enabled: false } },
    rateLimit: { enabled: false },
  });
  const headers = new Headers({ Origin: "http://localhost:8191" });
  const email = "native-paired@example.test",
    password = "synthetic-password-for-local-test";
  await auth.api.signUpEmail({ body: { email, password, name: "Synthetic adult" }, headers });
  await assert.rejects(auth.api.signInEmail({ body: { email, password }, headers }));
  await auth.handler(new Request(messages[0].url));
  const signed = await auth.api.signInEmail({
    body: { email, password },
    headers,
    asResponse: true,
  });
  assert.equal(signed.status, 200);
  const cookie = signed.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  const sessionHeaders = new Headers({ cookie });
  const actor = (
    await auth.api.getSession({ headers: sessionHeaders, query: { disableCookieCache: true } })
  ).user;
  assert.equal(actor.emailVerified, true);
  child = spawn(
    process.env.KYREC_CORE_TEST_PYTHON || "python",
    [
      path.resolve(process.env.KYREC_CORE_TEST_ROOT, "scripts/guardian_native_test_server.py"),
      "--user",
      actor.id,
    ],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  const lines = createInterface({ input: child.stdout });
  const metadata = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error("Core fixture did not start")), 15000);
    child.once("exit", () => {
      clearTimeout(timeout);
      reject(Error("Core fixture stopped"));
    });
    lines.once("line", (line) => {
      clearTimeout(timeout);
      resolve(JSON.parse(line));
    });
  });
  process.env.KYREC_CORE_URL = "http://127.0.0.1:8192";
  process.env.KYREC_CORE_SERVICE_ID = "guardian";
  process.env.KYREC_CORE_SERVICE_KEY = "synthetic-paired-key-not-live-000000";
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(process.env.KYREC_CORE_URL + "/openapi.json");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  async function request(action, data) {
    const current = await auth.api.getSession({
      headers: sessionHeaders,
      query: { disableCookieCache: true },
    });
    assert.ok(current?.user?.emailVerified, "Fresh confirmed session required");
    return nativeReviewRequest(current.user.id, action, data);
  }
  const base = { household: metadata.household };
  const status = await request("status", base);
  assert.equal(status.choices.presentation.granted, false);
  for (const purpose of ["presentation", "feedback"])
    await request("consent", {
      ...base,
      purpose,
      granted: true,
      notice_version: "guardian-native-access-v1",
    });
  const rendered = await request("results", base);
  assert.equal(rendered.results.length, 1);
  const feedback = {
    ...base,
    feedback_id: crypto.randomUUID(),
    recommendation_id: rendered.results[0].recommendation_id,
    kind: "accepted",
  };
  assert.deepEqual(await request("feedback", feedback), await request("feedback", feedback));
  await request("consent", {
    ...base,
    purpose: "feedback",
    granted: false,
    notice_version: "guardian-native-access-v1",
  });
  await assert.rejects(request("feedback", feedback));
  await assert.rejects(nativeReviewRequest("other-user", "results", base));
  await auth.api.signOut({ headers: sessionHeaders });
  await assert.rejects(request("results", base));
  console.log(
    "Paired local PASS: confirmed individual account, fresh session, real Core HTTP consent/render/feedback/retry/revoke, wrong user and sign-out denial. No real email or external model. BFF wrappers/browser deployment remain separately tested.",
  );
} finally {
  child?.kill("SIGTERM");
  await db.close();
}
