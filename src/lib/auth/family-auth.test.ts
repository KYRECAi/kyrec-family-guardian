import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { Sql } from "../db.ts";
import { reserveCompanionRequest } from "../companion-controls.server.ts";
import { PGlite } from "@electric-sql/pglite";
import { betterAuth } from "better-auth";
import { familyEmailOptions } from "./family-email-options.server.ts";
import { pgliteDialect } from "./pglite-dialect.ts";
import { authEmail, deliverAuthEmail } from "./transactional-email.server.ts";

for (const backend of ["pglite", "postgres"] as const) {
  test(
    `email/password and companion request lifecycle (${backend})`,
    { skip: backend === "postgres" && !process.env.GUARDIAN_TEST_POSTGRES_URL },
    async () => {
      const db = backend === "pglite" ? new PGlite() : null;
      const pool =
        backend === "postgres"
          ? new Pool({ connectionString: process.env.GUARDIAN_TEST_POSTGRES_URL, max: 5 })
          : null;
      if (db) {
        for (const migration of ["0001_auth.sql", "0002_companion_controls.sql"])
          await db.exec(
            await readFile(new URL(`../../../migrations/${migration}`, import.meta.url), "utf8"),
          );
      }
      const messages: { purpose: string; address: string; url: string }[] = [];
      const auth = betterAuth({
        baseURL: "http://localhost:8080",
        secret: "synthetic-local-test-secret-32-characters-only",
        database: pool ?? { dialect: pgliteDialect(() => db!), type: "postgres" },
        ...familyEmailOptions(async (purpose, address, url) => {
          messages.push({ purpose, address, url });
          return "synthetic-mail-receipt";
        }),
        rateLimit: { enabled: false },
        session: { cookieCache: { enabled: false } },
      });
      const headers = new Headers({ Origin: "http://localhost:8080" });
      try {
        const email = `adult-${randomUUID()}@example.test`;
        await auth.api.signUpEmail({
          body: { email, password: "synthetic-password-one", name: "Test adult" },
          headers,
        });
        assert.equal(messages[0]?.purpose, "verify");
        await assert.rejects(
          auth.api.signInEmail({ body: { email, password: "synthetic-password-one" }, headers }),
        );
        const verification = await auth.handler(new Request(messages[0]!.url));
        assert.ok(verification.status < 400);
        const signedIn = await auth.api.signInEmail({
          body: { email, password: "synthetic-password-one" },
          headers,
          asResponse: true,
        });
        assert.equal(signedIn.status, 200);
        const cookie = signedIn.headers
          .getSetCookie()
          .map((c) => c.split(";")[0])
          .join("; ");
        const sessionHeaders = new Headers({ cookie });
        assert.ok(await auth.api.getSession({ headers: sessionHeaders }));
        await auth.api.requestPasswordReset({
          body: { email, redirectTo: "http://localhost:8080/account" },
          headers,
        });
        const reset = messages.find((message) => message.purpose === "reset");
        assert.ok(reset);
        const resetRedirect = await auth.handler(new Request(reset.url));
        const token = new URL(resetRedirect.headers.get("location")!).searchParams.get("token")!;
        await auth.api.resetPassword({
          body: { token, newPassword: "synthetic-password-two" },
          headers,
        });
        assert.equal(await auth.api.getSession({ headers: sessionHeaders }), null);
        await assert.rejects(
          auth.api.resetPassword({
            body: { token, newPassword: "synthetic-password-three" },
            headers,
          }),
        );
        await assert.rejects(
          auth.api.signInEmail({ body: { email, password: "synthetic-password-one" }, headers }),
        );
        const fresh = await auth.api.signInEmail({
          body: { email, password: "synthetic-password-two" },
          headers,
        });
        assert.equal(fresh.user.emailVerified, true);
        // Better Auth can swallow signup delivery failures. A successful
        // signup response is not proof that mail was sent or a login grant.
        const offlineMail = betterAuth({
          baseURL: "http://localhost:8080",
          secret: "synthetic-local-test-secret-32-characters-only",
          database: pool ?? { dialect: pgliteDialect(() => db!), type: "postgres" },
          ...familyEmailOptions(async () => {
            throw new Error("synthetic-mail-unavailable");
          }),
          rateLimit: { enabled: false },
        });
        const unconfirmedEmail = `unconfirmed-${randomUUID()}@example.test`;
        const unconfirmed = await offlineMail.api.signUpEmail({
          body: {
            email: unconfirmedEmail,
            password: "synthetic-password-one",
            name: "Unconfirmed test account",
          },
          headers,
        });
        assert.equal(unconfirmed.user.emailVerified, false);
        assert.equal(unconfirmed.token, null);
        await assert.rejects(
          offlineMail.api.signInEmail({
            body: { email: unconfirmedEmail, password: "synthetic-password-one" },
            headers,
          }),
        );
        await assert.rejects(
          offlineMail.api.sendVerificationEmail({ body: { email: unconfirmedEmail }, headers }),
        );
        const query = async (text: string, values: unknown[]) =>
          pool ? (await pool.query(text, values)).rows : (await db!.query(text, values)).rows;
        const sql = (async (parts: TemplateStringsArray, ...values: unknown[]) => {
          let text = parts[0];
          values.forEach((_value, i) => {
            text += `$${i + 1}${parts[i + 1]}`;
          });
          return query(text, values);
        }) as Sql;
        const userId = fresh.user.id;
        assert.match((await reserveCompanionRequest(sql, userId, randomUUID()))!, /Choose/);
        await sql`insert into guardian_companion_consent(user_id,enabled,policy_version) values(${userId},true,${"openai-companion-beta-v1"})`;
        const requests = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
        const now = new Date();
        const results = await Promise.all(
          requests.map((id) => reserveCompanionRequest(sql, userId, id, now, 3)),
        );
        assert.equal(results.filter((result) => result === null).length, 3);
        assert.match(
          (await reserveCompanionRequest(sql, userId, requests[0], now, 3))!,
          /already handled/,
        );
        assert.match(
          (await reserveCompanionRequest(
            sql,
            userId,
            randomUUID(),
            new Date(now.getTime() + 61000),
            3,
          ))!,
          /limit/,
        );
        await sql`update guardian_companion_consent set enabled=false where user_id=${userId}`;
        assert.match((await reserveCompanionRequest(sql, userId, randomUUID()))!, /Choose/);
        await query('delete from "user" where id=$1', [userId]);
      } finally {
        if (db) await db.close();
        if (pool) await pool.end();
      }
    },
  );
}

test("authentication mail validates origin and escapes links; failed delivery is not reported as sent", async () => {
  assert.throws(() =>
    authEmail(
      "reset",
      "test@example.test",
      "https://untrusted.example/reset",
      "https://guardian.example.test",
    ),
  );
  const email = authEmail(
    "verify",
    "test@example.test",
    "https://guardian.example.test/verify?token=synthetic&callback=%22",
    "https://guardian.example.test",
  );
  assert.ok(email.html.includes("&amp;callback="));
  const config = {
    apiKey: "synthetic-resend-key",
    from: "guardian@example.test",
    baseURL: "https://guardian.example.test",
  };
  let request: RequestInit | undefined;
  const receipt = await deliverAuthEmail(
    "verify",
    "test@example.test",
    "https://guardian.example.test/verify",
    config,
    async (_url, options) => {
      request = options;
      return Response.json({ id: "synthetic-receipt" });
    },
  );
  assert.equal(receipt, "synthetic-receipt");
  assert.ok((request!.headers as Record<string, string>)["Idempotency-Key"]);
  await assert.rejects(
    deliverAuthEmail(
      "reset",
      "test@example.test",
      "https://guardian.example.test/reset",
      config,
      async () => new Response("unavailable", { status: 503 }),
    ),
  );
  await assert.rejects(
    deliverAuthEmail("reset", "test@example.test", "https://guardian.example.test/reset", {
      ...config,
      apiKey: "",
    }),
  );
});
