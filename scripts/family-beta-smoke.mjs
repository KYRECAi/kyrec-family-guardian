import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const production = process.env.GUARDIAN_SMOKE_MODE === "production";
const port = production ? 8081 : 8080;
const base = `http://127.0.0.1:${port}`;
const command = production
  ? ["node", ".output/server/index.mjs"]
  : ["node", "node_modules/vite/bin/vite.js", "dev", "--host", "127.0.0.1", "--port", String(port)];
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
      path: `artifacts/family-beta/${production ? "production" : "development"}-${viewport.width}.png`,
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
  console.log(
    `Family account browser gate passed (${production ? "production" : "development"}, phone + desktop).`,
  );
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
