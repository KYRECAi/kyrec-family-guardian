import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { pgliteDialect } from "../auth/pglite-dialect.ts";
import { familyEmailOptions } from "../auth/family-email-options.server.ts";
import { mobileApi } from "./mobile-api.server.ts";

// Real Better Auth with synthetic accounts and intercepted mail, no providers.
test("native gateway verifies bearer, email, logout, actor and strict household inputs", async () => {
  const db = new PGlite();
  await db.exec(
    await readFile(new URL("../../../migrations/0001_auth.sql", import.meta.url), "utf8"),
  );
  let verification = "";
  const auth = betterAuth({
    baseURL: "https://guardian.example.test",
    secret: "synthetic-native-test-secret-32-characters",
    database: { dialect: pgliteDialect(() => db), type: "postgres" },
    ...familyEmailOptions(async (_purpose, _address, url) => {
      verification = url;
      return "synthetic";
    }),
    plugins: [bearer()],
    rateLimit: { enabled: false },
    session: { cookieCache: { enabled: false } },
  });
  const seen: string[] = [];
  const core = async (actor: string, path: string) => {
    seen.push(actor);
    if (path.includes("00000000-0000-4000-8000-000000000002"))
      throw Object.assign(new Error("other household"), { status: 403 });
    return { households: [] };
  };
  const invoke = (body: object, token?: string, extra = {}) =>
    mobileApi(
      new Request("https://guardian.example.test/api/mobile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...extra,
        },
        body: JSON.stringify(body),
      }),
      (r) => auth.handler(r),
      core,
    );
  try {
    const created = await auth.api.signUpEmail({
      body: {
        email: "adult@example.test",
        password: "synthetic-password-native",
        name: "Synthetic adult",
      },
    });
    const login = {
      action: "login",
      email: "adult@example.test",
      password: "synthetic-password-native",
    };
    assert.equal((await invoke(login)).status, 401);
    await auth.handler(new Request(verification));
    const signedIn = await invoke(login);
    assert.equal(signedIn.status, 200);
    const token = signedIn.headers.get("set-auth-token")!;
    assert.ok(token);
    const value = await signedIn.json();
    assert.equal(value.user.id, created.user.id);
    assert.equal(JSON.stringify(value).includes(token), false);
    assert.equal((await invoke({ action: "households" })).status, 401);
    assert.equal(
      (await invoke({ action: "households" }, "forged-synthetic-token-000000")).status,
      401,
    );
    assert.equal((await invoke({ action: "households", actor: "child" }, token)).status, 400);
    assert.equal(
      (await invoke({ action: "households" }, token, { Origin: "https://evil.example" })).status,
      403,
    );
    assert.equal(
      (await invoke({ action: "households" }, token, { Cookie: "session=fake" })).status,
      403,
    );
    assert.equal((await invoke({ action: "households" }, token)).status, 200);
    assert.deepEqual(seen, [created.user.id]);
    assert.equal(
      (await invoke({ action: "shop", household: "00000000-0000-4000-8000-000000000002" }, token))
        .status,
      403,
    );
    assert.equal(
      (await invoke({ action: "child_access", household: "../escape", member: "child" }, token))
        .status,
      400,
    );
    assert.equal((await invoke({ action: "logout" }, token)).status, 200);
    assert.equal((await invoke({ action: "session" }, token)).status, 401);
  } finally {
    await db.close();
  }
});

test("auth outage/rate-limit cannot masquerade as successful revocation or expiry", async () => {
  for (const action of ["logout", "session"]) {
    for (const status of [429, 500, 503]) {
      const response = await mobileApi(
        new Request("https://guardian.example.test/api/mobile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer synthetic-token-0000000000000",
          },
          body: JSON.stringify({ action }),
        }),
        async () => Response.json({ error: "unavailable" }, { status }),
      );
      assert.equal(response.status, status === 429 ? 429 : 503);
    }
  }
});
