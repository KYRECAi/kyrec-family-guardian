import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const mode = process.env.GUARDIAN_SMOKE_MODE ?? "development";
assert.ok(["development", "production", "container"].includes(mode));
const production = mode !== "development";
const port = mode === "container" ? 8082 : production ? 8081 : 8080;
const base = `http://127.0.0.1:${port}`;
// Exercise the release image's built app with synthetic preview configuration.
// The production entrypoint's fail-closed configuration is checked separately.
const command =
  mode === "container"
    ? [
        "docker",
        "run",
        "--rm",
        "--network",
        "host",
        "--name",
        "guardian-browser-test",
        "--env",
        "GUARDIAN_RUNTIME_MODE=development",
        "--env",
        "VITE_AUTH_ENABLED=true",
        "--env",
        `BETTER_AUTH_URL=${base}`,
        "--env",
        "NITRO_HOST=127.0.0.1",
        "--env",
        `NITRO_PORT=${port}`,
        "--entrypoint",
        "node",
        "guardian-beta:test",
        ".output/server/index.mjs",
      ]
    : production
      ? ["node", ".output/server/index.mjs"]
      : [
          "node",
          "node_modules/vite/bin/vite.js",
          "dev",
          "--host",
          "127.0.0.1",
          "--port",
          String(port),
        ];
const server = spawn(command[0], command.slice(1), {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    GUARDIAN_RUNTIME_MODE: "development",
    VITE_AUTH_ENABLED: "true",
    BETTER_AUTH_URL: base,
    NITRO_HOST: "127.0.0.1",
    NITRO_PORT: String(port),
  },
});
let diagnostics = "";
server.stdout.on("data", (data) => {
  diagnostics = (diagnostics + data).slice(-5000);
});
server.stderr.on("data", (data) => {
  diagnostics = (diagnostics + data).slice(-5000);
});
let browser;
try {
  const deadline = Date.now() + 55000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${base}/account`)).ok) break;
    } catch {
      /* startup */
    }
    if (server.exitCode !== null) throw new Error(`Preview stopped: ${diagnostics}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok((await fetch(`${base}/account`)).ok, diagnostics);
  await mkdir("artifacts/family-beta", { recursive: true });
  browser = await chromium.launch({ headless: true });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${base}/account`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
    await page.getByRole("button", { name: "Create an account", exact: true }).click();
    await page.getByRole("heading", { name: "Create your account", exact: true }).waitFor();
    assert.equal(await page.getByLabel("Your name", { exact: true }).count(), 1);
    await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
    await page.getByRole("button", { name: "Send reset link", exact: true }).waitFor();
    await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
    await page.getByRole("heading", { name: "Sign in", exact: true }).waitFor();
    await page.getByRole("img", { name: "KYREC", exact: true }).evaluate(async (image) => {
      await image.decode();
      if (!image.naturalWidth) throw new Error("KYREC logo did not render");
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
    );
    await page.screenshot({
      path: `artifacts/family-beta/${mode}-${viewport.width}.png`,
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    await page.goto(`${base}/privacy`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Privacy", exact: true }).waitFor();
    await page.goto(`${base}/terms`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Terms and conditions", exact: true }).waitFor();
    assert.deepEqual(errors, []);
    const status = await page.request.get(`${base}/api/health`);
    assert.equal(status.status(), 503); // Synthetic preview has no live credentials.
    const session = await page.request.get(`${base}/api/auth/get-session`);
    assert.equal(session.status(), 200);
    assert.equal(await session.json(), null);
    await context.close();
  }
  console.log(`Family account browser gate passed (${mode}, phone + desktop).`);
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
