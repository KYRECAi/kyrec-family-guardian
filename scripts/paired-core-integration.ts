import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { familyEmailOptions } from "../src/lib/auth/family-email-options.server.ts";
import { pgliteDialect } from "../src/lib/auth/pglite-dialect.ts";
import { coreRequest, CoreUnavailable } from "../src/lib/core-client.server.ts";
import { shopSchema } from "../src/lib/shared-shop-contract.ts";
import { createShopMutations } from "../src/lib/shop-mutation.ts";

// This intentionally requires a second exact-source checkout. No source copy,
// production service key, paid provider or family email is used by this test.
assert.ok(
  process.env.GUARDIAN_PAIRED_CORE_ROOT,
  "Set GUARDIAN_PAIRED_CORE_ROOT to the reviewed Core checkout",
);
assert.ok(
  process.env.GUARDIAN_PAIRED_CORE_PYTHON,
  "Set GUARDIAN_PAIRED_CORE_PYTHON to its test Python",
);
const reviewedCore = "ce703f7b7b2e6a416010ed4a6d8467f144f4282e";
assert.equal(process.env.GUARDIAN_PAIRED_CORE_COMMIT, reviewedCore);
assert.equal(
  execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
    cwd: process.env.GUARDIAN_PAIRED_CORE_ROOT,
    encoding: "utf8",
  }).trim(),
  "ca0d92803a9890f07d0eb30e66340935ee782bbd",
  "Core checkout must match the reviewed merged source tree",
);
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", "app", "migrations"], {
  cwd: process.env.GUARDIAN_PAIRED_CORE_ROOT,
  stdio: "pipe",
});
const socket = createServer();
await new Promise<void>((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = (socket.address() as { port: number }).port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.env.GUARDIAN_PAIRED_CORE_PYTHON!, ["scripts/paired-core-fixture.py"], {
  env: {
    ...process.env,
    PYTHONPATH: process.env.GUARDIAN_PAIRED_CORE_ROOT,
    GUARDIAN_PAIRED_PORT: String(port),
    KYREC_SOURCE_COMMIT: process.env.GUARDIAN_PAIRED_CORE_COMMIT,
  },
  stdio: ["ignore", "ignore", "pipe"],
});
let diagnostics = "";
child.stderr.on("data", (data) => {
  diagnostics = (diagnostics + data).slice(-2000);
});
Object.assign(process.env, {
  NODE_ENV: "test",
  KYREC_CORE_URL: base,
  KYREC_CORE_SERVICE_ID: "guardian-paired-test",
  KYREC_CORE_SERVICE_KEY: "synthetic-paired-test-credential-0000000000",
});
const db = new PGlite();
const mail: { email: string; url: string }[] = [];
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/openapi.json`)).ok) break;
    } catch {
      /* startup */
    }
    if (child.exitCode !== null) throw new Error(diagnostics);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok((await fetch(`${base}/openapi.json`)).ok, diagnostics);
  const ready = await fetch(`${base}/v1/guardian/ready`, {
    headers: {
      "X-Kyrec-Service-Id": process.env.KYREC_CORE_SERVICE_ID!,
      "X-Kyrec-Service-Key": process.env.KYREC_CORE_SERVICE_KEY!,
    },
  });
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).source_commit, process.env.GUARDIAN_PAIRED_CORE_COMMIT);
  await db.exec(await readFile("migrations/0001_auth.sql", "utf8"));
  const auth = betterAuth({
    baseURL: "http://localhost:8080",
    secret: "synthetic-paired-auth-secret-000000000000",
    database: { dialect: pgliteDialect(() => db), type: "postgres" },
    ...familyEmailOptions(async (_purpose, email, url) => {
      mail.push({ email, url });
      return "synthetic-receipt";
    }),
    rateLimit: { enabled: false },
    session: { cookieCache: { enabled: false } },
  });
  const origin = new Headers({ Origin: "http://localhost:8080" });
  async function account(email: string) {
    await auth.api.signUpEmail({
      body: { email, password: "synthetic-paired-password", name: email.split("@")[0]! },
      headers: origin,
    });
    await assert.rejects(
      auth.api.signInEmail({
        body: { email, password: "synthetic-paired-password" },
        headers: origin,
      }),
    );
    assert.ok(
      (await auth.handler(new Request(mail.find((message) => message.email === email)!.url)))
        .status < 400,
    );
    const response = await auth.api.signInEmail({
      body: { email, password: "synthetic-paired-password" },
      headers: origin,
      asResponse: true,
    });
    assert.equal(response.status, 200);
    return new Headers({
      cookie: response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; "),
    });
  }
  async function actor(headers: Headers) {
    const session = await auth.api.getSession({ headers, query: { disableCookieCache: true } });
    assert.ok(
      session?.user.emailVerified,
      "Every delegated request requires a fresh confirmed session",
    );
    return session.user;
  }
  const first = await account("synthetic-owner@example.test");
  const second = await account("synthetic-member@example.test");
  const owner = await actor(first);
  const member = await actor(second);
  const call = async (
    headers: Headers,
    path: string,
    method = "GET",
    data?: unknown,
    operation?: string,
  ) => {
    const user = await actor(headers);
    return coreRequest(
      user.id,
      path,
      method,
      data,
      operation,
      fetch,
      createHash("sha256").update(user.email.toLowerCase()).digest("hex"),
    );
  };
  const house = (await call(first, "/v1/guardian/households", "POST", {
    name: "Synthetic family",
    display_name: "Owner",
    adult: true,
    shop_consent: true,
  })) as { household_id: string };
  const path = `/v1/guardian/households/${house.household_id}`;
  await assert.rejects(
    call(second, `${path}/shop`),
    (error: unknown) => error instanceof CoreUnavailable && error.status === 403,
  );
  const invitation = (await call(first, `${path}/invites`, "POST", {
    role: "adult",
    shop_consent: true,
    recipient_email_hash: createHash("sha256").update(member.email.toLowerCase()).digest("hex"),
  })) as { invite_token: string };
  await assert.rejects(
    call(first, "/v1/guardian/households/join", "POST", {
      token: invitation.invite_token,
      display_name: "Wrong recipient",
      shop_consent: true,
    }),
  );
  await call(second, "/v1/guardian/households/join", "POST", {
    token: invitation.invite_token,
    display_name: "Member",
    shop_consent: true,
  });
  let lost = true;
  const changes = createShopMutations(async (data) => {
    const snapshot = shopSchema.parse(
      await call(first, `${path}/shop/lines`, "POST", { name: data.name }, data.operation),
    );
    if (lost) {
      lost = false;
      throw new Error("Synthetic lost reply after Core commit");
    }
    return snapshot;
  });
  const input = { household: house.household_id, action: "add", name: "Bread" };
  await assert.rejects(changes(input));
  let snapshot = shopSchema.parse(await call(second, `${path}/shop`));
  await call(
    second,
    `${path}/shop/lines/delete`,
    "POST",
    { ids: [snapshot.lines[0]!.id] },
    randomUUID(),
  );
  assert.deepEqual((await changes(input)).lines, []);
  snapshot = await changes(input);
  await call(second, `${path}/shop/lines`, "POST", { name: "Milk" }, randomUUID());
  const bread = snapshot.lines[0]!.id;
  const winners = await Promise.all(
    [first, second].map((headers) =>
      call(headers, `${path}/shop/lines/${bread}/snatch`, "POST", undefined, randomUUID()),
    ),
  );
  const states = winners.map((state) => shopSchema.parse(state));
  assert.equal(
    new Set(states.map((state) => state.lines.find((line) => line.id === bread)!.snatched_by)).size,
    1,
  );
  assert.ok(states.every((state) => state.points === 30));
  snapshot = shopSchema.parse(
    await call(second, `${path}/shop/lines/delete`, "POST", { ids: [bread] }, randomUUID()),
  );
  assert.equal(snapshot.points, 0);
  const lease = (await call(second, `${path}/location`, "POST", { enabled: true })) as {
    lease_id: string;
  };
  await call(second, `${path}/location`, "POST", {
    enabled: true,
    latitude: -31.95,
    longitude: 115.84,
    lease_id: lease.lease_id,
  });
  assert.equal(
    ((await call(first, `${path}/locations`)) as { positions: unknown[] }).positions.length,
    1,
  );
  await call(second, `${path}/location`, "POST", { enabled: false });
  await assert.rejects(
    call(second, `${path}/location`, "POST", {
      enabled: true,
      latitude: -31.95,
      longitude: 115.84,
      lease_id: lease.lease_id,
    }),
  );
  const nextLease = (await call(second, `${path}/location`, "POST", { enabled: true })) as {
    lease_id: string;
  };
  await call(second, `${path}/location`, "POST", {
    enabled: true,
    latitude: -31.95,
    longitude: 115.84,
    lease_id: nextLease.lease_id,
  });
  await fetch(`${base}/__synthetic/advance`, { method: "POST" });
  assert.deepEqual(
    ((await call(first, `${path}/locations`)) as { positions: unknown[] }).positions,
    [],
  );
  await call(first, `${path}/members/${member.id}`, "DELETE");
  await assert.rejects(call(second, `${path}/shop`));
  await auth.api.signOut({ headers: first });
  await assert.rejects(call(first, `${path}/shop`));
  assert.notEqual(owner.id, member.id);
  console.log(
    "Paired Core/Guardian transport and schema gate PASS: confirmed accounts, recipient/membership denial, lost reply/retry, two-user snatch, reversal, location revocation/expiry, removal and sign-out. Synthetic dev databases; no hosted/browser/provider proof.",
  );
} finally {
  child.kill("SIGTERM");
  await db.close();
}
