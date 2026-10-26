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
        return mobileApi(request, (req) => auth.handler(req));
      },
    },
  },
});
