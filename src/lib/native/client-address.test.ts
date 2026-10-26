import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { pgliteDialect } from "../auth/pglite-dialect.ts";
import { familyEmailOptions } from "../auth/family-email-options.server.ts";
import { nativeClientAddress, nativeAuthWithAddress } from "./client-address.server.ts";
import { mobileApi } from "./mobile-api.server.ts";

const incoming = (xff = "198.51.100.10") =>
  new Request("https://guardian.example.test/api/mobile", {
    headers: {
      "x-forwarded-for": xff,
      "x-real-ip": "203.0.113.99",
      "cf-connecting-ip": "203.0.113.99",
      Forwarded: "for=203.0.113.99",
    },
  });
test("default never trusts attacker headers and production needs explicit topology", () => {
  for (const value of ["198.51.100.10", "198.51.100.11", "garbage", "a,b"])
    assert.equal(
      nativeClientAddress(incoming(value), undefined, { NODE_ENV: "development" }),
      "127.0.0.1",
    );
  assert.throws(() => nativeClientAddress(incoming(), "192.0.2.1", { NODE_ENV: "production" }));
  assert.throws(() =>
    nativeClientAddress(incoming(), "192.0.2.1", {
      NODE_ENV: "production",
      GUARDIAN_NATIVE_ADDRESS_MODE: "development-shared",
    }),
  );
  assert.throws(() =>
    nativeClientAddress(incoming(), undefined, { GUARDIAN_NATIVE_ADDRESS_MODE: "direct" }),
  );
  assert.equal(
    nativeClientAddress(incoming(), "192.0.2.2", { GUARDIAN_NATIVE_ADDRESS_MODE: "direct" }),
    "192.0.2.2",
  );
});
test("single-proxy requires exact runtime peer and one valid overwritten address", () => {
  const env = {
    NODE_ENV: "production",
    GUARDIAN_NATIVE_ADDRESS_MODE: "single-proxy",
    GUARDIAN_NATIVE_TRUSTED_PROXY_IPS: "192.0.2.1,2001:db8::1",
  };
  assert.equal(nativeClientAddress(incoming(), "192.0.2.1", env), "198.51.100.10");
  assert.equal(
    nativeClientAddress(incoming("2001:db8::2"), "2001:0db8:0:0::1", env),
    "2001:db8::2",
  );
  for (const peer of [undefined, "192.0.2.2", "spoofed", "127.0.0.1"])
    assert.throws(() => nativeClientAddress(incoming(), peer, env));
  for (const value of [
    "198.51.100.10,192.0.2.1",
    "unknown",
    "for=198.51.100.10",
    "198.51.100.10:1234",
    "fe80::1%eth0",
    "",
  ])
    assert.throws(() => nativeClientAddress(incoming(value), "192.0.2.1", env));
  assert.throws(() =>
    nativeClientAddress(incoming(), "192.0.2.1", {
      ...env,
      GUARDIAN_NATIVE_TRUSTED_PROXY_IPS: "0.0.0.0/0",
    }),
  );
});
test("trusted address rewrite strips competing header sources", async () => {
  let seen!: Headers;
  const wrapped = nativeAuthWithAddress(
    async (request) => {
      seen = request.headers;
      return Response.json({});
    },
    incoming(),
    "192.0.2.22",
    { GUARDIAN_NATIVE_ADDRESS_MODE: "direct" },
  );
  await wrapped(incoming());
  assert.equal(seen.get("x-forwarded-for"), "192.0.2.22");
  for (const header of ["forwarded", "x-real-ip", "cf-connecting-ip", "x-client-ip"])
    assert.equal(seen.get(header), null);
});
test("actual Better Auth enforces five attempts despite spoofing; verified peers have separate buckets", async () => {
  const db = new PGlite();
  await db.exec(
    await readFile(new URL("../../../migrations/0001_auth.sql", import.meta.url), "utf8"),
  );
  const auth = betterAuth({
    baseURL: "https://guardian.example.test",
    secret: "synthetic-rate-limit-secret-00000000000",
    database: { dialect: pgliteDialect(() => db), type: "postgres" },
    ...familyEmailOptions(async () => "synthetic"),
    plugins: [bearer()],
    advanced: { ipAddress: { ipAddressHeaders: ["x-forwarded-for"] } },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
  });
  async function attempt(peer: string, fake: string) {
    const request = new Request("https://guardian.example.test/api/mobile", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": fake },
      body: JSON.stringify({
        action: "login",
        email: "unknown@example.test",
        password: "synthetic-password",
      }),
    });
    return mobileApi(
      request,
      nativeAuthWithAddress((r) => auth.handler(r), request, peer, {
        GUARDIAN_NATIVE_ADDRESS_MODE: "direct",
      }),
    );
  }
  try {
    for (let i = 0; i < 5; i++)
      assert.equal((await attempt("192.0.2.40", `203.0.113.${i}`)).status, 401);
    assert.equal((await attempt("192.0.2.40", "203.0.113.200")).status, 429);
    assert.equal((await attempt("192.0.2.41", "203.0.113.200")).status, 401);
  } finally {
    await db.close();
  }
});
