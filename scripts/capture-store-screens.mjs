import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://127.0.0.1:8080";
const OUT = "/workspace/artifacts/store-screenshots";

const devices = [
  { id: "iphone-69", width: 440, height: 956, scale: 3 },
  { id: "samsung-phone", width: 360, height: 720, scale: 3 },
  { id: "tablet-8", width: 600, height: 960, scale: 2 },
  { id: "tablet-10", width: 800, height: 1280, scale: 2 },
  { id: "ipad-13", width: 1032, height: 1376, scale: 2 },
];

const shots = [
  ["02-home", "/"],
  ["03-map", "/map"],
  ["04-characters", "/companions"],
  ["05-stan", "/companions/stan"],
  ["06-nova-shop", "/companions/nova"],
  ["07-pulse", "/companions/pulse"],
  ["08-the-day", "/planner"],
  ["09-scout", "/companions/scout"],
  ["10-moneybags", "/companions/moneybags"],
  ["11-budget", "/budget"],
  ["12-family", "/family"],
  ["13-settings", "/settings"],
  ["14-plans", "/plan"],
  ["15-alerts", "/alerts"],
];

async function settle(page) {
  const enter = page.getByRole("button", { name: "Enter Family Guardian" });
  if (await enter.count()) {
    await enter.click({ timeout: 4000 }).catch(() => {});
    await enter.waitFor({ state: "detached", timeout: 4000 }).catch(() => {});
  }
  await page.waitForTimeout(450);
}

const browser = await chromium.launch({ headless: true });

for (const device of devices) {
  const dir = path.join(OUT, device.id);
  await mkdir(dir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    colorScheme: "light",
    locale: "en-AU",
    timezoneId: "Australia/Perth",
  });
  const page = await context.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(dir, "01-splash.jpg"),
    type: "jpeg",
    quality: 76,
    caret: "hide",
  });
  await settle(page);
  await page.evaluate(() => {
    const key = "kyrec-family-guardian-v6";
    const cur = JSON.parse(localStorage.getItem(key) || '{"state":{},"version":0}');
    cur.state = { ...(cur.state || {}), plan: "complete", scoutOn: true, seenTips: true };
    cur.version = cur.version ?? 0;
    localStorage.setItem(key, JSON.stringify(cur));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await settle(page);

  for (const [name, route] of shots) {
    await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(350);
    await settle(page);
    await page.screenshot({
      path: path.join(dir, `${name}.jpg`),
      type: "jpeg",
      quality: 76,
      caret: "hide",
    });
    console.log(device.id, name);
  }
  await context.close();
}

await browser.close();
console.log("done");
