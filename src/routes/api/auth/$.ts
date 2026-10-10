import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  const { requireProductionIdentityConfiguration } = await import("@/lib/runtime-config.server");
  requireProductionIdentityConfiguration();
  const { auth } = await import("@/lib/auth/server");
  const response = await auth.handler(request);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handle, POST: handle } },
});
