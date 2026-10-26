/** Isolated Core/Guardian contract test with synthetic identities only. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { pgliteDialect } from "../src/lib/auth/pglite-dialect.ts";
import { familyEmailOptions } from "../src/lib/auth/family-email-options.server.ts";
import { mobileApi } from "../src/lib/native/mobile-api.server.ts";
import { NativeSession } from "../src/lib/native/session.ts";
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
  await assert.rejects(() => coreRequest(child, `/v1/guardian/households/${otherHouse}/shop`));
  await assert.rejects(() => coreRequest(parent, `/v1/guardian/households/${otherHouse}/shop`));
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
  // Full synthetic session -> gateway -> actual HTTP Core chain. No native OS is mocked as proven.
  const authDb = new PGlite();
  try {
    await authDb.exec(await readFile("migrations/0001_auth.sql", "utf8"));
    let verifyURL = "";
    const auth = betterAuth({
      baseURL: "https://guardian.example.test",
      secret: "synthetic-paired-auth-secret-000000000000",
      database: { dialect: pgliteDialect(() => authDb), type: "postgres" },
      ...familyEmailOptions(async (_purpose, _email, url) => {
        verifyURL = url;
        return "synthetic";
      }),
      plugins: [bearer()],
      rateLimit: { enabled: false },
      session: { cookieCache: { enabled: false } },
    });
    const actors = [];
    for (const label of ["family", "fifo", "child"]) {
      const email = `${label}@example.test`;
      const account = await auth.api.signUpEmail({
        body: { email, name: label, password: "synthetic-paired-password" },
      });
      await auth.handler(new Request(verifyURL));
      let home: { household_id: string };
      if (label === "child") {
        const emailHash = createHash("sha256").update(email).digest("hex");
        const invite = (await coreRequest(
          actors[0].id,
          `/v1/guardian/households/${actors[0].home}/invites`,
          "POST",
          {
            role: "child",
            shop_consent: true,
            recipient_email_hash: emailHash,
          },
        )) as { invite_token: string };
        home = (await coreRequest(
          account.user.id,
          "/v1/guardian/households/join",
          "POST",
          {
            token: invite.invite_token,
            display_name: "Synthetic child",
            shop_consent: true,
          },
          undefined,
          fetch,
          emailHash,
        )) as { household_id: string };
      } else {
        home = (await coreRequest(account.user.id, "/v1/guardian/households", "POST", {
          name: `Synthetic ${label}`,
          display_name: label,
          adult: true,
          shop_consent: true,
        })) as { household_id: string };
      }
      let value: string | null = null;
      const client = new NativeSession(
        {
          read: async () => value,
          write: async (next) => {
            value = next;
          },
          clear: async () => {
            value = null;
          },
        },
        async (body, token) => {
          const result = await mobileApi(
            new Request("https://guardian.example.test/api/mobile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify(body),
            }),
            (r) => auth.handler(r),
          );
          return {
            status: result.status,
            data: await result.json(),
            token: result.headers.get("set-auth-token") ?? undefined,
          };
        },
      );
      await client.login(email, "synthetic-paired-password");
      assert.equal((await client.refresh())!.id, account.user.id);
      const homes = (await client.request({ action: "households" })) as {
        households: { id: string }[];
      };
      assert.deepEqual(
        homes.households.map((h) => h.id),
        [home.household_id],
      );
      actors.push({ client, home: home.household_id, id: account.user.id });
    }
    await assert.rejects(
      actors[0].client.request({ action: "shop", household: actors[1].home }),
      /403/,
    );
    await assert.rejects(
      actors[1].client.request({ action: "shop", household: actors[0].home }),
      /403/,
    );
    const childTarget = { household: actors[2].home, member: actors[2].id };
    await assert.rejects(
      actors[2].client.request({
        action: "save_child_access",
        ...childTarget,
        revision: 0,
        features: allFeatures(true),
      }),
      /403/,
    );
    await actors[0].client.request({
      action: "save_child_access",
      ...childTarget,
      revision: 0,
      features: choices,
    });
    assert.deepEqual(
      (
        (await actors[2].client.request({ action: "child_access", ...childTarget })) as {
          features: unknown;
        }
      ).features,
      choices,
    );
    await assert.rejects(
      actors[1].client.request({ action: "child_access", ...childTarget }),
      /403/,
    );
    await actors[2].client.logout();
    await actors[0].client.logout();
    await assert.rejects(actors[0].client.request({ action: "households" }), /Sign in/);
    assert.ok(await actors[1].client.refresh());
    await actors[1].client.logout();
    console.log(
      "PASS: actual synthetic Better Auth sessions -> mobile gateway -> pinned HTTP Core; two adult identities, separate households, cross-household denial and independent logout.",
    );
  } finally {
    await authDb.close();
  }
  console.log(
    `PASS: paired Core ${commit}; Guardian transport/schema, default deny, owner-only save, games only, map denial, revocation, stale replay, separate-household isolation.`,
  );
} finally {
  server.kill("SIGTERM");
  await new Promise((resolve) => server.once("exit", resolve));
}
