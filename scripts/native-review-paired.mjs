/** Run only against a supplied local Core checkout, with synthetic identities. */
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { pgliteDialect } from "../src/lib/auth/pglite-dialect.ts";
import { familyEmailOptions } from "../src/lib/auth/family-email-options.server.ts";
import { nativeReviewRequest } from "../src/lib/native-review.server.ts";

assert.ok(process.env.KYREC_CORE_TEST_ROOT, "Set a local synthetic Core test checkout.");
assert.equal(
  execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
    cwd: process.env.KYREC_CORE_TEST_ROOT,
    encoding: "utf8",
  }).trim(),
  "c306f07e47551fc99969fe4fc1cac50821031c9d",
  "Core checkout must match reviewed source 499eceb1213fec6f601ce77b262f2d9abe54dc84",
);
execFileSync(
  "git",
  ["diff", "--exit-code", "HEAD", "--", "app", "migrations", "scripts", "tests"],
  {
    cwd: process.env.KYREC_CORE_TEST_ROOT,
    stdio: "pipe",
  },
);
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
  async function login(loginEmail = email, loginPassword = password) {
    const response = await auth.api.signInEmail({
      body: { email: loginEmail, password: loginPassword },
      headers,
      asResponse: true,
    });
    assert.equal(response.status, 200);
    return new Headers({
      cookie: response.headers
        .getSetCookie()
        .map((v) => v.split(";")[0])
        .join("; "),
    });
  }
  const deviceTwo = await login();
  assert.notEqual(deviceTwo.get("cookie"), sessionHeaders.get("cookie"));
  const otherEmail = "native-other@example.test";
  await auth.api.signUpEmail({
    body: { email: otherEmail, password, name: "Other synthetic adult" },
    headers,
  });
  await auth.handler(
    new Request(messages.find((m) => m.address === otherEmail && m.purpose === "verify").url),
  );
  const otherSession = await login(otherEmail);
  async function request(action, data, session = sessionHeaders) {
    const current = await auth.api.getSession({
      headers: session,
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
  assert.equal((await request("status", base, deviceTwo)).choices.presentation.granted, true);
  const rendered = await request("results", base, deviceTwo);
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
  await assert.rejects(request("feedback", feedback, deviceTwo));
  await request("consent", {
    ...base,
    purpose: "presentation",
    granted: false,
    notice_version: "guardian-native-access-v1",
  });
  await assert.rejects(request("results", base, deviceTwo));
  assert.equal((await request("status", base, deviceTwo)).choices.presentation.granted, false);
  for (const action of ["status", "results"])
    await assert.rejects(request(action, base, otherSession));
  await assert.rejects(
    request(
      "consent",
      {
        ...base,
        purpose: "presentation",
        granted: true,
        notice_version: "guardian-native-access-v1",
      },
      otherSession,
    ),
  );
  await assert.rejects(request("feedback", feedback, otherSession));
  await request("consent", {
    ...base,
    purpose: "presentation",
    granted: true,
    notice_version: "guardian-native-access-v1",
  });
  assert.equal((await request("results", base, deviceTwo)).results.length, 1);
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "http://localhost:8191/account" },
    headers,
  });
  const reset = messages.find((m) => m.purpose === "reset" && m.address === email);
  const redirect = await auth.handler(new Request(reset.url));
  const token = new URL(redirect.headers.get("location")).searchParams.get("token");
  await auth.api.resetPassword({
    body: { token, newPassword: "synthetic-new-password-for-local-test" },
    headers,
  });
  await assert.rejects(request("results", base));
  await assert.rejects(request("results", base, deviceTwo));
  const fresh = await login(email, "synthetic-new-password-for-local-test");
  assert.equal((await request("results", base, fresh)).results.length, 1);
  await auth.api.signOut({ headers: fresh });
  await assert.rejects(request("results", base, fresh));
  await assert.rejects(nativeReviewRequest("other-user", "results", base));
  await auth.api.signOut({ headers: sessionHeaders });
  await assert.rejects(request("results", base));
  console.log(
    "Paired local PASS: two independent confirmed-account sessions; cross-session viewing/feedback withdrawal; second verified account denied status/results/consent/feedback; password reset invalidates both sessions; new login and sign-out; real Core HTTP and stable retry. Synthetic only. These are session clients, not physical devices or deployed browser-to-BFF acceptance.",
  );
} finally {
  child?.kill("SIGTERM");
  await db.close();
}
