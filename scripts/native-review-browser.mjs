/** Isolated component harness only; never part of production routes or auth. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer, build, preview } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";

const project = process.cwd();
const root = path.join(project, "artifacts/native-review-harness");
await mkdir(root, { recursive: true });
await writeFile(
  path.join(root, "index.html"),
  '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
);
await writeFile(
  path.join(root, "main.tsx"),
  `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { NativeReviewPanel } from '@/components/native-review-panel';
import '@/styles.css';
const household='00000000-0000-4000-8000-000000000001';
const choices={presentation:{granted:false,expires_at:null},feedback:{granted:false,expires_at:null}};
const controls=window.controls={fail:false,calls:[],expired:false};
const api={
 readNativeChoices:async()=>({notice_version:'guardian-native-access-v1',choices:structuredClone(choices)}),
 chooseNativeConsent:async({data})=>{choices[data.purpose]={granted:data.granted,expires_at:data.granted?new Date(Date.now()+86400000).toISOString():null};return {...data,expires_at:new Date(Date.now()+86400000).toISOString()};},
 readNativeResults:async()=>({contract:'guardian-native-review-v1',results:controls.expired?[]:[{decision_id:household,recommendation_id:choices.feedback.granted?household:null,text:'Synthetic result for your review. This message does not approve or execute an action.',valid_until:new Date(Date.now()+30000).toISOString(),execution_authorized:false}]}),
 sendNativeFeedback:async({data})=>{controls.calls.push(data);if(controls.fail){controls.fail=false;throw Error('synthetic outage');}return {feedback_id:data.feedback_id,recorded:true,execution_authorized:false};}
};
createRoot(document.getElementById('root')).render(<main className="mx-auto max-w-lg p-4"><NativeReviewPanel household={household} api={api}/></main>);
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
  browser = await chromium.launch({ headless: true });
  await mkdir("artifacts/family-beta", { recursive: true });
  for (const mode of ["development", "production"]) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("http://127.0.0.1:" + (mode === "development" ? 8189 : 8190));
      await page.getByRole("heading", { name: "Your personal review" }).waitFor();
      await page.getByRole("button", { name: "Refresh personal review" }).click();
      await page.getByRole("button", { name: "Allow viewing", exact: true }).click();
      await page.getByText("Synthetic result for your review.", { exact: false }).waitFor();
      assert.equal(await page.getByRole("button", { name: "Accept suggestion" }).count(), 0);
      await page.getByRole("button", { name: "Allow feedback", exact: true }).click();
      await page.getByRole("button", { name: "Accept suggestion" }).waitFor();
      await page.screenshot({
        path: "artifacts/family-beta/native-" + mode + "-" + width + ".png",
        fullPage: true,
      });
      await page.evaluate(() => {
        window.controls.fail = true;
      });
      await page.getByRole("button", { name: "Accept suggestion" }).click();
      await page.getByText("Personal review is unavailable.", { exact: false }).waitFor();
      assert.equal(
        await page.getByText("Synthetic result for your review.", { exact: false }).count(),
        0,
      );
      await page.getByRole("button", { name: "Retry unconfirmed feedback" }).click();
      await page.getByText("Feedback recorded. No action was approved or carried out.").waitFor();
      const calls = await page.evaluate(() => window.controls.calls);
      assert.equal(calls.length, 2);
      assert.deepEqual(calls[0], calls[1]);
      await page.getByRole("button", { name: "Turn off viewing" }).click();
      await page.getByText("Your choice was turned off.").waitFor();
      assert.equal(
        await page.getByText("Synthetic result for your review.", { exact: false }).count(),
        0,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      assert.deepEqual(errors, []);
      await context.close();
    }
  }
  console.log(
    "Native review component browser PASS: phone/desktop, development/built, consent, denial, exact retry and revocation. Synthetic API harness; not a deployed paired login test.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await new Promise((resolve) => (built ? built.httpServer.close(resolve) : resolve()));
}
