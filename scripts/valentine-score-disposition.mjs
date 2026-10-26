/** Reproduction of known PR23 regression, NOT a game acceptance test or scoring bridge. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { build, preview } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";
const project = process.cwd(),
  root = path.join(project, "artifacts/valentine-disposition");
await mkdir(root, { recursive: true });
await writeFile(
  path.join(root, "index.html"),
  '<html><head></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
);
await writeFile(
  path.join(root, "main.tsx"),
  `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { ValentineCrush } from '@/components/valentine-crush';
import { useGuardian } from '@/lib/store';
useGuardian.setState({ gameBest: {valentine:12}, points:34 });
function Probe() { const best=useGuardian(s=>s.gameBest.valentine); const points=useGuardian(s=>s.points); return <><output data-testid="score">{JSON.stringify({best,points})}</output><ValentineCrush/></>; }
const root = createRootRoute({component:Probe});
createRoot(document.getElementById('root')).render(<RouterProvider router={createRouter({routeTree:root})}/>);
`,
);
const config = {
  configFile: false,
  root,
  plugins: [react()],
  resolve: { alias: { "@": path.join(project, "src") } },
  build: { outDir: path.join(root, "dist") },
  preview: { host: "127.0.0.1", port: 8194, strictPort: true },
};
await build(config);
const server = await preview(config);
const browser = await chromium.launch({
  executablePath: process.env.GUARDIAN_TEST_CHROMIUM || undefined,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://sky-green-terra-kite.grok.me/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<button onclick="parent.postMessage({type:'game-complete',game:'valentine',score:1000,points:100},'*');this.textContent='Synthetic round ended'">End synthetic round</button>`,
    }),
  );
  await page.goto("http://127.0.0.1:8194");
  const before = await page.getByTestId("score").innerText();
  assert.deepEqual(JSON.parse(before), { best: 12, points: 34 });
  await page.frameLocator("iframe").getByRole("button", { name: "End synthetic round" }).click();
  await page
    .frameLocator("iframe")
    .getByRole("button", { name: "Synthetic round ended" })
    .waitFor();
  // Drain queued postMessage delivery without assuming any real external protocol.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.close();
          channel.port2.close();
          resolve(null);
        };
        channel.port2.postMessage(null);
      }),
  );
  assert.equal(await page.getByTestId("score").innerText(), before);
  assert.deepEqual(errors, []);
  console.log(
    "REPRODUCED known host integration gap: actual ValentineCrush component leaves best=12 and points=34 after synthetic cross-origin completion message. No live game completion tested; arbitrary iframe points remain untrusted.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
