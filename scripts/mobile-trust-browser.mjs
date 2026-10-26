import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve("dist/mobile");
const server = createServer(async (req, res) => {
  const path = resolve(root, `.${new URL(req.url, "http://localhost").pathname}`);
  if (!path.startsWith(root + sep) && path !== root) return res.writeHead(403).end();
  try {
    const mime = {
      ".js": "text/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".woff2": "font/woff2",
      ".svg": "image/svg+xml",
    };
    res.setHeader("Content-Type", mime[extname(path)] ?? "text/html");
    res.end(await readFile(path === root ? resolve(root, "index.html") : path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.GUARDIAN_TEST_CHROMIUM || undefined,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  let remoteRequests = 0;
  await page.route("https://untrusted.example/**", (route) => {
    remoteRequests++;
    return route.fulfill({
      contentType: "text/javascript",
      body: "window.__privilegedReadCount++",
    });
  });
  const runtimeErrors = [];
  page.on("pageerror", (e) => runtimeErrors.push(e.message));
  await page.goto(origin);
  await page.getByRole("heading", { name: "KYREC Family Guardian", exact: true }).waitFor();
  // Probe execution blocking in the real bundled document. This is a bridge spy,
  // not proof of WKWebView frame provenance or actual Keychain behavior.
  await page.evaluate(() => {
    window.__privilegedReadCount = 0;
    window.__policyViolations = [];
    document.addEventListener("securitypolicyviolation", (e) =>
      window.__policyViolations.push(e.effectiveDirective),
    );
    const remote = document.createElement("script");
    remote.src = "https://untrusted.example/steal.js";
    document.head.append(remote);
    const inline = document.createElement("script");
    inline.textContent = "window.__privilegedReadCount++";
    document.head.append(inline);
    const frame = document.createElement("iframe");
    frame.src = "https://untrusted.example/frame";
    document.body.append(frame);
    const base = document.createElement("base");
    base.href = "https://untrusted.example/";
    document.head.append(base);
  });
  await page.waitForFunction(() => window.__policyViolations.length >= 4);
  assert.equal(await page.evaluate(() => window.__privilegedReadCount), 0);
  assert.equal(remoteRequests, 0);
  assert.deepEqual(runtimeErrors, []);
  assert.equal(await page.evaluate(() => document.baseURI), origin + "/");
  const violations = await page.evaluate(() => window.__policyViolations);
  assert.ok(violations.includes("script-src-elem"));
  assert.ok(violations.includes("frame-src"));
  assert.ok(violations.includes("base-uri"));
  await mkdir("/workspace/screenshots", { recursive: true });
  await page.screenshot({ path: "/workspace/screenshots/native-trust-policy.png", fullPage: true });
  console.log(
    "PASS: bundled CSP blocks remote script, unpinned inline script, iframe and base rewriting before privileged-code execution; no remote request made.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
