export function deploymentIssues(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing = [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "RESEND_API_KEY",
    "AUTH_EMAIL_FROM",
    "KYREC_CORE_URL",
    "KYREC_CORE_SERVICE_ID",
    "KYREC_CORE_SERVICE_KEY",
    "KYREC_CORE_EXPECTED_COMMIT",
    "OPENAI_API_KEY",
    "OPENAI_COMPANION_MODEL",
    "GOOGLE_MAPS_BROWSER_KEY",
    "GOOGLE_MAPS_MAP_ID",
    "GUARDIAN_SOURCE_COMMIT",
  ].filter((key) => !env[key]?.trim());
  const issues = missing.map((key) => `${key} is required`);
  if (env.KYREC_CORE_EXPECTED_COMMIT && !/^[a-f0-9]{40}$/.test(env.KYREC_CORE_EXPECTED_COMMIT))
    issues.push("Core dependency must identify an exact reviewed commit");
  if (env.GUARDIAN_RUNTIME_MODE && env.GUARDIAN_RUNTIME_MODE !== "production")
    issues.push("Hosted accounts require production runtime mode");
  if (env.GUARDIAN_SOURCE_COMMIT && !/^[a-f0-9]{40}$/.test(env.GUARDIAN_SOURCE_COMMIT))
    issues.push("Guardian source must identify an exact reviewed commit");
  if (env.VITE_AUTH_ENABLED === "false")
    issues.push("Family account authentication must be enabled");
  if (env.BETTER_AUTH_SECRET && env.BETTER_AUTH_SECRET.length < 32)
    issues.push("Authentication secret must contain at least 32 characters");
  if (env.KYREC_CORE_SERVICE_KEY && env.KYREC_CORE_SERVICE_KEY.length < 32)
    issues.push("Core service credential must contain at least 32 characters");
  for (const key of ["BETTER_AUTH_URL", "KYREC_CORE_URL"]) {
    if (!env[key]) continue;
    try {
      const url = new URL(env[key]!);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
        issues.push(`${key} must be a public HTTPS origin`);
    } catch {
      issues.push(`${key} must be a valid URL`);
    }
  }
  if (Boolean(env.OPENAI_API_KEY) !== Boolean(env.OPENAI_COMPANION_MODEL))
    issues.push("OpenAI requires both a server API key and an explicit model");
  return issues;
}

export function requireProductionIdentityConfiguration() {
  if (process.env.NODE_ENV !== "production" || process.env.GUARDIAN_RUNTIME_MODE === "development")
    return;
  const issues = deploymentIssues();
  if (issues.length) throw new Error(`Guardian deployment is not configured: ${issues.join("; ")}`);
}
