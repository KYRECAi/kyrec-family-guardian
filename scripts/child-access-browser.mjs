/** Synthetic component QA; no production route, session bypass or real child data. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer, build, preview } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";

const project = process.cwd();
const root = path.join(project, "artifacts/child-access-harness");
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
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChildAccessPanel } from '@/components/child-access-panel';
import { allFeatures } from '@/lib/child-feature-contract';
import './harness.css';
const controls = window.controls = { fail: false, calls: [] };
const records = Object.fromEntries(['child-one','child-two'].map(user_id => [user_id, {user_id, revision:0, features:allFeatures(false)}]));
const api = {
 readChildAccess: async ({data}) => structuredClone(records[data.member]),
 saveChildAccess: async ({data}) => {
  controls.calls.push(structuredClone(data));
  if (controls.fail) { controls.fail=false; throw Error('Synthetic outage'); }
  if (records[data.member].revision !== data.revision) throw Error('Stale choices');
  records[data.member] = { user_id:data.member, revision:data.revision+1, features:structuredClone(data.features) };
  return structuredClone(records[data.member]);
 }
};
createRoot(document.getElementById('root')).render(<main className="mx-auto max-w-lg p-4"><h1 className="text-2xl font-semibold">Settings</h1><ChildAccessPanel household="00000000-0000-4000-8000-000000000001" isOwner={!location.search.includes('child')} members={[{user_id:'child-one',display_name:'Child One'},{user_id:'child-two',display_name:'Child Two'}]} api={api}/></main>);
`,
);
const config = {
  configFile: false,
  root,
  plugins: [react(), tailwind()],
  resolve: { alias: { "@": path.join(project, "src") } },
  server: { host: "127.0.0.1", port: 8189, strictPort: true, fs: { allow: [project] } },
  build: { outDir: path.join(root, "dist") },
  preview: { host: "127.0.0.1", port: 8190, strictPort: true },
};
let server, built, browser;
try {
  server = await createServer(config);
  await server.listen();
  await build(config);
  built = await preview(config);
  browser = await chromium.launch({
    headless: true,
    ...(process.env.GUARDIAN_TEST_CHROMIUM
      ? { executablePath: process.env.GUARDIAN_TEST_CHROMIUM }
      : {}),
  });
  for (const mode of ["development", "production"])
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const url = "http://127.0.0.1:" + (mode === "development" ? 8189 : 8190);
      await page.goto(url);
      await page.getByRole("switch", { name: "Games", exact: true }).waitFor();
      assert.equal(await page.getByRole("switch", { checked: true }).count(), 0);
      assert.ok(
        (await page.getByRole("switch", { name: "Games", exact: true }).boundingBox()).height >= 44,
      );
      await page.getByRole("switch", { name: "Games", exact: true }).click();
      await page.getByRole("button", { name: "Save child access" }).click();
      await page.getByText("Access choices saved.", { exact: true }).waitFor();
      assert.equal(await page.getByRole("switch", { checked: true }).count(), 1);
      await page.screenshot({
        path: "/workspace/screenshots/child-access-" + mode + "-" + width + ".png",
        fullPage: true,
      });
      await page.getByLabel("Child", { exact: true }).selectOption("child-two");
      await page.getByRole("switch", { name: "Games", exact: true }).waitFor();
      assert.equal(await page.getByRole("switch", { checked: true }).count(), 0);
      await page.getByRole("switch", { name: "Allow all listed features" }).click();
      assert.equal(await page.getByRole("switch", { checked: true }).count(), 9);
      await page.getByRole("button", { name: "Save child access" }).click();
      await page.getByText("Access choices saved.", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Turn all off" }).click();
      await page.getByRole("button", { name: "Save child access" }).click();
      await page.getByText("Access choices saved.", { exact: true }).waitFor();
      assert.equal(await page.getByRole("switch", { checked: true }).count(), 0);
      await page.getByLabel("Child", { exact: true }).selectOption("child-one");
      await page.getByRole("switch", { name: "Games", exact: true, checked: true }).waitFor();
      await page.getByRole("switch", { name: "Nova", exact: true }).click();
      await page.evaluate(() => {
        window.controls.fail = true;
      });
      await page.getByRole("button", { name: "Save child access" }).click();
      await page.getByRole("button", { name: "Reload saved choices" }).click();
      await page.getByRole("switch", { name: "Games", exact: true, checked: true }).waitFor();
      assert.equal(
        await page.getByRole("switch", { name: "Nova", exact: true }).getAttribute("aria-checked"),
        "false",
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.goto(url + "?child");
      await page.getByText("The family owner manages these choices.", { exact: false }).waitFor();
      assert.equal(await page.getByRole("switch").count(), 0);
      assert.deepEqual(errors, []);
      await context.close();
    }
  console.log(
    "PASS: parent child-access settings, phone/desktop, dev/built; all off, games only, all on, individual children, denied save recovery and non-owner read-only. Synthetic component harness.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await new Promise((resolve) => (built ? built.httpServer.close(resolve) : resolve()));
}
