import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mobile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (process.env.GUARDIAN_NATIVE_API_ENABLED !== "true")
          return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
        const { requireProductionIdentityConfiguration } =
          await import("@/lib/runtime-config.server");
        requireProductionIdentityConfiguration();
        const { auth } = await import("@/lib/auth/server");
        const { mobileApi } = await import("@/lib/native/mobile-api.server");
        const { getRequestIP } = await import("@tanstack/react-start/server");
        const { nativeAuthWithAddress } = await import("@/lib/native/client-address.server");
        try {
          const verifiedAuth = nativeAuthWithAddress(
            (req) => auth.handler(req),
            request,
            getRequestIP({ xForwardedFor: false }),
          );
          return mobileApi(request, verifiedAuth);
        } catch {
          return Response.json(
            { error: "Native account connection unavailable" },
            {
              status: 503,
              headers: { "Cache-Control": "no-store" },
            },
          );
        }
      },
    },
  },
});
