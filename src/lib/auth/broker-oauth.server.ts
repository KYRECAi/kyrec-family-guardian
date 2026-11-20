import { genericOAuth, type GenericOAuthConfig } from "better-auth/plugins";
import { GROK_PROVIDERS } from "./providers.ts";

const callbackPrefix = "/oauth2/callback/";

export function grokBrokerOAuth(config: GenericOAuthConfig[]) {
  const plugin = genericOAuth({
    config: config.map((provider) => ({
      ...provider,
      // Preserve the subject previously stored for this broker account.
      accountSubject({ profile }) {
        const id = profile.id;
        return id === undefined || id === null || id === "" ? (profile.sub ?? "") : id;
      },
    })),
  });
  return {
    ...plugin,
    async init(ctx: Parameters<typeof plugin.init>[0]) {
      const result = await plugin.init(ctx);
      for (const provider of result.context.socialProviders) {
        if (config.some(({ providerId }) => providerId === provider.id)) {
          // Keep the broker's registered callback URI for the code exchange.
          provider.callbackPath = callbackPrefix + provider.id;
        }
      }
      return result;
    },
  };
}

export function routeGrokBrokerCallback(request: Request): Request {
  const url = new URL(request.url);
  const prefix = "/api/auth" + callbackPrefix;
  if (!url.pathname.startsWith(prefix)) return request;
  const providerId = url.pathname.slice(prefix.length);
  if (!GROK_PROVIDERS.some((provider) => provider.providerId === providerId)) return request;
  // Route the callback to Better Auth's state-checked social callback handler.
  url.pathname = "/api/auth/callback/" + providerId;
  return new Request(url, request);
}
