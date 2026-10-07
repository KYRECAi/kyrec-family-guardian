import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const { deploymentIssues } = await import("@/lib/runtime-config.server");
        const issues = deploymentIssues();
        if (issues.length)
          return Response.json(
            { status: "not_ready", reason: "Deployment configuration is incomplete." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        try {
          const { getSql } = await import("@/lib/db");
          await (await getSql()).query('select id from "user" limit 1');
          const core = await fetch(
            `${process.env.KYREC_CORE_URL!.replace(/\/$/, "")}/v1/guardian/ready`,
            {
              signal: AbortSignal.timeout(3000),
              redirect: "error",
              headers: {
                "X-Kyrec-Service-Id": process.env.KYREC_CORE_SERVICE_ID!,
                "X-Kyrec-Service-Key": process.env.KYREC_CORE_SERVICE_KEY!,
              },
            },
          );
          if (!core.ok) throw new Error("Core not ready");
          const dependency = await core.json();
          if (
            dependency.status !== "ready" ||
            dependency.contract !== "guardian-shared-household-v1" ||
            dependency.source_commit !== process.env.KYREC_CORE_EXPECTED_COMMIT
          )
            throw new Error("Core dependency differs");
          return Response.json(
            {
              status: "ready",
              service: "kyrec-family-guardian",
              source_commit: process.env.GUARDIAN_SOURCE_COMMIT,
              companions: "configured",
              maps: "configured",
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json(
            { status: "not_ready", reason: "Account database or Core is unavailable." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
