import { deploymentIssues } from "../src/lib/runtime-config.server.ts";

const issues = deploymentIssues();
if (issues.length) {
  console.error(`Guardian startup blocked: ${issues.join("; ")}`);
  process.exit(1);
}
process.env.NODE_ENV = "production";
process.env.GUARDIAN_RUNTIME_MODE = "production";
process.env.NITRO_HOST ??= "0.0.0.0";
process.env.NITRO_PORT ??= "8080";
await import("../.output/server/index.mjs");
