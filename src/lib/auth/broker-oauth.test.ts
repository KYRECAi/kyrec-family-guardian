import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { betterAuth } from "better-auth";
import { grokBrokerOAuth, routeGrokBrokerCallback } from "./broker-oauth.server.ts";

test("broker sign-in preserves the registered callback and existing account keys", async () => {
  const origin = "https://guardian-preview.grok-sandbox.com";
  const auth = betterAuth({
    baseURL: { allowedHosts: ["*.grok-sandbox.com"], fallback: "http://localhost:8080" },
    secret: randomBytes(32).toString("hex"),
    plugins: [
      grokBrokerOAuth([
        {
          providerId: "grok-google",
          clientId: "synthetic-client",
          authorizationUrl: "https://broker.example.test/authorize",
          tokenUrl: "https://broker.example.test/token",
        },
      ]),
    ],
  });
  const response = await auth.handler(
    new Request(origin + "/api/auth/sign-in/social", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ provider: "grok-google", disableRedirect: true }),
    }),
  );
  assert.equal(response.status, 200);
  const authorization = new URL((await response.json()).url);
  const registeredCallback = origin + "/api/auth/oauth2/callback/grok-google";
  assert.equal(authorization.searchParams.get("redirect_uri"), registeredCallback);
  assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");

  const callback = routeGrokBrokerCallback(new Request(registeredCallback + "?state=example"));
  assert.equal(callback.url, origin + "/api/auth/callback/grok-google?state=example");
  const unknownProvider = new Request(origin + "/api/auth/oauth2/callback/other");
  assert.equal(routeGrokBrokerCallback(unknownProvider), unknownProvider);

  const context = await auth.$context;
  const provider = context.socialProviders.find(({ id }) => id === "grok-google");
  assert.ok(provider?.accountSubject);
  assert.equal(await provider.accountSubject({ tokens: {}, profile: { id: "existing", sub: "other" } }), "existing");
  assert.equal(await provider.accountSubject({ tokens: {}, profile: { sub: "existing" } }), "existing");
});
