/** Isolated Core/Guardian contract test with synthetic identities only. */
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { coreRequest } from "../src/lib/core-client.server.ts";
import { allFeatures, childAccessSchema } from "../src/lib/child-feature-contract.ts";
import { shopSchema } from "../src/lib/shared-shop-contract.ts";

const root = process.env.GUARDIAN_PAIRED_CORE_ROOT;
const commit = process.env.GUARDIAN_PAIRED_CORE_COMMIT;
assert.ok(root && commit && process.env.GUARDIAN_PAIRED_CORE_PYTHON);
assert.equal(
  execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  commit,
);
execFileSync("git", ["diff", "--exit-code", "HEAD", "--", "app", "migrations"], { cwd: root });
const socket = createServer();
await new Promise<void>((resolve) => socket.listen(0, "127.0.0.1", resolve));
const port = (socket.address() as { port: number }).port;
await new Promise<void>((resolve) => socket.close(() => resolve()));
const server = spawn(process.env.GUARDIAN_PAIRED_CORE_PYTHON!, ["scripts/paired-core-fixture.py"], {
  env: {
    ...process.env,
    PYTHONPATH: root,
    GUARDIAN_PAIRED_PORT: String(port),
    KYREC_SOURCE_COMMIT: commit,
  },
  stdio: ["ignore", "ignore", "pipe"],
});
Object.assign(process.env, {
  NODE_ENV: "test",
  KYREC_CORE_URL: `http://127.0.0.1:${port}`,
  KYREC_CORE_SERVICE_ID: "guardian-paired-test",
  KYREC_CORE_SERVICE_KEY: "synthetic-paired-test-credential-0000000000",
});
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${process.env.KYREC_CORE_URL}/openapi.json`)).ok) break;
    } catch {
      /* startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const parent = "synthetic-parent",
    child = "synthetic-child";
  const house = (
    (await coreRequest(parent, "/v1/guardian/households", "POST", {
      name: "Synthetic family",
      display_name: "Parent",
      adult: true,
      shop_consent: true,
    })) as { household_id: string }
  ).household_id;
  const email = createHash("sha256").update("child@example.invalid").digest("hex");
  const invite = (await coreRequest(parent, `/v1/guardian/households/${house}/invites`, "POST", {
    role: "child",
    shop_consent: true,
    recipient_email_hash: email,
  })) as { invite_token: string };
  await coreRequest(
    child,
    "/v1/guardian/households/join",
    "POST",
    { token: invite.invite_token, display_name: "Child", shop_consent: true },
    undefined,
    fetch,
    email,
  );
  const path = `/v1/guardian/households/${house}/members/${child}/feature-access`;
  // A separate FIFO household must never inherit the first family's access.
  const otherParent = "synthetic-fifo-parent";
  const otherHouse = (
    (await coreRequest(otherParent, "/v1/guardian/households", "POST", {
      name: "Synthetic separate household",
      display_name: "Other parent",
      adult: true,
      shop_consent: true,
    })) as { household_id: string }
  ).household_id;
  assert.notEqual(otherHouse, house);
  await assert.rejects(() => coreRequest(otherParent, path));
  await assert.rejects(() =>
    coreRequest(otherParent, path, "PUT", { revision: 0, features: allFeatures(true) }),
  );
  await assert.rejects(() =>
    coreRequest(child, `/v1/guardian/households/${otherHouse}/shop`),
  );
  await assert.rejects(() =>
    coreRequest(parent, `/v1/guardian/households/${otherHouse}/shop`),
  );
  const initial = childAccessSchema.parse(await coreRequest(parent, path));
  assert.deepEqual(initial.features, allFeatures(false));
  const choices = { ...allFeatures(false), games: true };
  await assert.rejects(() => coreRequest(child, path, "PUT", { revision: 0, features: choices }));
  const saved = childAccessSchema.parse(
    await coreRequest(parent, path, "PUT", { revision: 0, features: choices }),
  );
  assert.equal(saved.revision, 1);
  assert.deepEqual(
    shopSchema.parse(await coreRequest(child, `/v1/guardian/households/${house}/shop`))
      .feature_access,
    choices,
  );
  await assert.rejects(() => coreRequest(child, `/v1/guardian/households/${house}/locations`));
  await coreRequest(parent, path, "PUT", { revision: 1, features: allFeatures(false) });
  await assert.rejects(() =>
    coreRequest(parent, path, "PUT", { revision: 1, features: allFeatures(true) }),
  );
  assert.deepEqual(
    childAccessSchema.parse(await coreRequest(child, path)).features,
    allFeatures(false),
  );
  console.log(
    `PASS: paired Core ${commit}; Guardian transport/schema, default deny, owner-only save, games only, map denial, revocation, stale replay, separate-household isolation.`,
  );
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => server.once("exit", resolve));
}
