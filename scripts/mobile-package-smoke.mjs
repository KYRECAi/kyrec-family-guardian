import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve("dist/mobile");
const evidence = resolve("artifacts/mobile-package");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error("Invalid path");
    let body;
    let type;
    try {
      body = await readFile(file);
      type = mime[extname(file)] ?? "application/octet-stream";
    } catch {
      if (extname(pathname) || pathname.startsWith("/api/")) {
        res.writeHead(404).end();
        return;
      }
      body = await readFile(resolve(root, "index.html"));
      type = "text/html";
    }
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" }).end(body);
  } catch {
    res.writeHead(400).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  await mkdir(evidence, { recursive: true });
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  const results = [];
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    const privateRequests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/\/(api|_serverFn)\//.test(request.url())) privateRequests.push(request.url());
    });
    await page.goto(origin);
    await page.getByRole("heading", { name: "KYREC Family Guardian", exact: true }).waitFor();
    assert.match(await page.getByRole("status").innerText(), /Sign-in is unavailable/);
    assert.equal(
      await page.getByRole("textbox", { name: "Email", exact: true }).isDisabled(),
      true,
    );
    assert.equal(
      await page.getByRole("button", { name: "Sign in", exact: true }).isDisabled(),
      true,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({
      path: resolve(evidence, `account-${viewport.width}.png`),
      fullPage: true,
    });
    await page.getByRole("link", { name: "Privacy", exact: true }).click();
    assert.ok((await page.locator("main").innerText()).toLowerCase().includes("privacy"));
    await page.reload();
    assert.ok((await page.locator("main").innerText()).toLowerCase().includes("privacy"));
    await page.goto(origin);
    await page.getByRole("heading", { name: "KYREC Family Guardian", exact: true }).waitFor();
    await page.getByRole("link", { name: "Privacy", exact: true }).click();
    assert.ok((await page.locator("main").innerText()).toLowerCase().includes("privacy"));
    await context.setOffline(true);
    await page.goBack();
    await page.getByRole("heading", { name: "KYREC Family Guardian", exact: true }).waitFor();
    assert.deepEqual(privateRequests, []);
    assert.deepEqual(errors, []);
    results.push({ viewport, passed: true, privateRequests: 0, errors });
    await context.close();
  }
  await writeFile(resolve(evidence, "verdict.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
