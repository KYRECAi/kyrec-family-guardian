/** Synthetic component rehearsal only: memory fixture, no account/provider/network APIs. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, preview } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";
const project = process.cwd(),
  root = path.join(project, "artifacts/fifo-story-harness");
await mkdir(root, { recursive: true });
await mkdir("/workspace/screenshots", { recursive: true });
await writeFile(
  path.join(root, "index.html"),
  '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
);
await writeFile(
  path.join(root, "harness.css"),
  '@import "../../src/styles.css";\n@source "../../src";\n',
);
await writeFile(
  path.join(root, "main.tsx"),
  `
import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { FifoStoryTrial } from '@/components/fifo-story-trial';
import { createStoryTrial } from '../../scripts/fixtures/fifo-story-store';
import './harness.css';
const trial = createStoryTrial();
function Trial() {
 const [role,setRole] = useState('child');
 const api = useMemo(() => trial.connect(role), [role]);
 return <><nav className="mx-auto flex max-w-3xl gap-3 px-5 pt-5" aria-label="Synthetic role controls"><button className="min-h-12 rounded-xl border p-3" onClick={()=>setRole('child')}>View as test child</button><button className="min-h-12 rounded-xl border p-3" onClick={()=>setRole('parent')}>View as test parent</button></nav><FifoStoryTrial key={role} api={api}/></>;
}
createRoot(document.getElementById('root')).render(<Trial/>);
`,
);
const config = {
  configFile: false,
  root,
  plugins: [react(), tailwind()],
  resolve: { alias: { "@": path.join(project, "src") } },
  build: { outDir: path.join(root, "dist") },
  preview: { host: "127.0.0.1", port: 8193, strictPort: true },
};
await build(config);
const server = await preview(config);
const browser = await chromium.launch({
  executablePath: process.env.GUARDIAN_TEST_CHROMIUM || undefined,
  args: ["--no-sandbox"],
});
try {
  for (const width of [1024, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 } });
    const errors = [],
      apiRequests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (/\/(api|_serverFn)\//.test(r.url())) apiRequests.push(r.url());
    });
    await page.goto("http://127.0.0.1:8193");
    await page.getByText("Story access is off.", { exact: false }).waitFor();
    assert.equal(await page.getByLabel("My story", { exact: true }).count(), 0);
    await page.getByRole("button", { name: "View as test parent", exact: true }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "View as test child", exact: true }).click();
    await page
      .getByLabel("My story", { exact: true })
      .fill("I drew the small steps that helped my day.");
    const pad = await page.getByRole("img", { name: "Drawing pad", exact: true }).boundingBox();
    await page.mouse.move(pad.x + 20, pad.y + 20);
    await page.mouse.down();
    await page.mouse.move(pad.x + 80, pad.y + 60, { steps: 6 });
    await page.mouse.up();
    await page.getByRole("button", { name: "Save for parent to read later" }).click();
    await page.getByText("No parent reply yet.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "View as test parent", exact: true }).click();
    await page
      .getByLabel("Reply to story 1", { exact: true })
      .fill("I have finished my shift and read your story. Thank you for showing me.");
    await page.getByRole("button", { name: "Save my reply", exact: true }).click();
    await page.getByText("From Test Parent", { exact: true }).waitFor();
    await page.getByRole("button", { name: "View as test child", exact: true }).click();
    await page.getByText("From Test Parent", { exact: true }).waitFor();
    assert.equal(await page.locator('svg[aria-label="Saved drawing"] polyline').count(), 1);
    assert.equal(await page.getByRole("button", { name: "Save my reply", exact: true }).count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({
      path: "/workspace/screenshots/fifo-story-" + width + ".png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "View as test parent", exact: true }).click();
    await page.getByRole("checkbox").uncheck();
    await page.getByRole("button", { name: "View as test child", exact: true }).click();
    await page.getByText("Story access is off.", { exact: false }).waitFor();
    assert.equal(await page.getByText("From Test Parent", { exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(apiRequests, []);
    await page.close();
  }
  console.log(
    "PASS: iPad/phone synthetic story and drawing, default off, manual parent reply, attributed child view and revocation; no account/provider API requests.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
