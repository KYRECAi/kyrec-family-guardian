/** Tests the actual chat component with synthetic, manually completed requests. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer, build, preview } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { chromium } from "playwright";

const project = process.cwd();
const root = path.join(project, "artifacts/companion-chat-harness");
await mkdir(root, { recursive: true });
await writeFile(
  path.join(root, "index.html"),
  '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
);
await writeFile(
  path.join(root, "harness.css"),
  '@import "../../src/styles.css";\n@source "../../src";\n',
);
await writeFile(
  path.join(root, "fixtures.ts"),
  `
import { useSyncExternalStore } from "react";
let state = { id:"stan", user:"adult-one", household:"00000000-0000-4000-8000-000000000001", role:"adult" };
const listeners = new Set<()=>void>();
const requests:any[] = [];
const pending:any[] = [];
const controls = window.controls = {
 requests, pending, proposals:[], denyMemory:false, delayConsent:false,
 change(patch:any) { state={...state,...patch}; listeners.forEach(fn=>fn()); },
 complete(text:string) { const item=pending.shift(); if(!item) throw Error("No pending request"); item.resolve(item.kind==="chat"?(typeof text==="string"?{ok:true,text}:text):{enabled:true}); },
};
export function useHarness() { return useSyncExternalStore(fn=>{listeners.add(fn); return ()=>listeners.delete(fn);},()=>state); }
export function useCurrentUserState() { const s=useHarness(); return {user:s.user?{id:s.user,emailVerified:true}:null,isPending:false}; }
export function useHousehold() { const s=useHarness(); return {snapshot:{household_id:s.household,member_role:s.role}}; }
export async function askCompanion({data}:any) { requests.push(structuredClone(data)); return new Promise(resolve=>pending.push({kind:"chat",resolve})); }
export async function readChatMemories() { if(controls.denyMemory)throw Error("Synthetic denial");return {memories:[{memory_id:"11111111-1111-4111-8111-111111111111",category:"preference",memory_key:"communication_style",value:"Concise replies"},{memory_id:"22222222-2222-4222-8222-222222222222",category:"preference",memory_key:"meal_preference",value:"Vegetarian"}],fields:[{category:"preference",memory_key:"communication_style"}]}; }
export async function suggestChatMemory({data}:any) { controls.proposals.push(data); return {status:"pending"}; }
export async function setCompanionConsent({data}:any) { if(controls.delayConsent) return new Promise(resolve=>pending.push({kind:"consent",resolve})); return {enabled:data.enabled}; }
`,
);
await writeFile(
  path.join(root, "main.tsx"),
  `
import React from "react";
import { createRoot } from "react-dom/client";
import { CompanionChat } from "@/components/companion-chat";
import { useHarness } from "./fixtures";
import "./harness.css";
function Harness() { const s=useHarness(); return <main className="mx-auto max-w-lg p-4"><CompanionChat id={s.id} full={s.full} onFull={()=>window.controls.change({full:true})} onClose={()=>window.controls.change({full:false})}/></main>; }
createRoot(document.getElementById("root")!).render(<React.StrictMode><Harness/></React.StrictMode>);
`,
);
const fixture = path.join(root, "fixtures.ts");
const config = {
  configFile: false,
  root,
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: "@/lib/companion-ai", replacement: fixture },
      { find: "@/lib/auth/use-current-user", replacement: fixture },
      { find: "@/lib/household-context", replacement: fixture },
      { find: "@", replacement: path.join(project, "src") },
    ],
  },
  server: { host: "127.0.0.1", port: 8193, strictPort: true, fs: { allow: [project] } },
  build: { outDir: path.join(root, "dist") },
  preview: { host: "127.0.0.1", port: 8194, strictPort: true },
};
let server, built, browser;
const findings = [];
try {
  server = await createServer(config);
  await server.listen();
  await build(config);
  built = await preview(config);
  browser = await chromium.launch({
    headless: true,
    ...(process.env.GUARDIAN_TEST_BROWSER_EXECUTABLE
      ? { executablePath: process.env.GUARDIAN_TEST_BROWSER_EXECUTABLE }
      : {}),
  });
  await mkdir("artifacts/family-beta", { recursive: true });
  for (const mode of ["development", "production"]) {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
      await page.goto("http://127.0.0.1:" + (mode === "development" ? 8193 : 8194));
      const consent = page.getByRole("checkbox").first();
      const input = page.locator('input[maxlength="600"]');
      const send = page.getByRole("button", { name: "Send", exact: true });
      const roles = ["stan", "nova", "pulse", "moneybags", "scout"];
      const labels = {
        stan: "Stan",
        nova: "Nova",
        pulse: "Pulse",
        moneybags: "Moneybags",
        scout: "Scout",
      };
      const change = async (patch) => {
        await page.evaluate((p) => window.controls.change(p), patch);
      };
      const settle = () =>
        page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
      const complete = async (text) => {
        await page.evaluate((t) => window.controls.complete(t), text);
        await settle();
      };
      const enable = async () => {
        await consent.check();
        await page.waitForFunction(
          () => !document.querySelector('input[type="checkbox"]').disabled,
        );
      };
      const ask = async (text) => {
        await input.fill(text);
        await send.click();
        await page.waitForFunction(() => window.controls.pending.length === 1);
      };
      for (let i = 0; i < roles.length; i++) {
        const from = roles[i],
          to = roles[(i + 1) % roles.length];
        await change({ id: from });
        await page.getByText("Chat with " + labels[from], { exact: true }).waitFor();
        await enable();
        await ask("Private question for " + from);
        await change({ id: to });
        await page.getByText("Chat with " + labels[to], { exact: true }).waitFor();
        await settle();
        assert.equal(await input.inputValue(), "");
        assert.equal(await consent.isChecked(), false);
        await complete("Private delayed answer from " + from);
        assert.equal(
          await page.getByText("Private delayed answer from " + from, { exact: true }).count(),
          0,
          "Late " + from + " reply crossed into " + to,
        );
        assert.equal(
          await page.getByText("Private question for " + from, { exact: true }).count(),
          0,
        );
        await enable();
        await ask("Current question for " + to);
        const last = await page.evaluate(() => window.controls.requests.at(-1));
        assert.equal(last.id, to);
        assert.deepEqual(last.history, []);
        await complete("Current answer for " + to);
        await page.getByText("Current answer for " + to, { exact: true }).waitFor();
      }
      for (const patch of [
        { household: "00000000-0000-4000-8000-000000000002" },
        { user: "adult-two" },
        { user: null },
        { user: "adult-two", role: "child" },
      ]) {
        await change({
          user: "adult-one",
          role: "adult",
          household: "00000000-0000-4000-8000-000000000001",
          id: "nova",
        });
        await settle();
        await enable();
        await ask("Old scope question");
        await input.fill("Unsent private draft");
        await change(patch);
        await settle();
        await complete("Old scope reply");
        assert.equal(await input.inputValue(), "");
        assert.equal(await consent.isChecked(), false);
        assert.equal(await page.getByText("Old scope reply", { exact: true }).count(), 0);
        assert.equal(await page.getByText("Old scope question", { exact: true }).count(), 0);
      }
      await change({ user: "adult-one", role: "adult", id: "pulse" });
      await settle();
      await page.evaluate(() => {
        window.controls.delayConsent = true;
      });
      await consent.click();
      await page.waitForFunction(() => window.controls.pending.length === 1);
      await change({ id: "scout" });
      await settle();
      await complete("unused");
      assert.equal(await consent.isChecked(), false, "Late consent crossed into another companion");
      await page.evaluate(() => {
        window.controls.delayConsent = false;
      });
      await enable();
      await ask("Synthetic Scout question");
      await complete("Synthetic Scout answer.");
      for (const id of roles) {
        await change({ id, household: "00000000-0000-4000-8000-000000000001" });
        await settle();
        await enable();
        await page.getByRole("button", { name: "Choose remembered facts", exact: true }).click();
        const fact = page.getByRole("checkbox", {
          name: new RegExp("Use with " + labels[id] + ": communication style"),
        });
        await fact.check();
        await ask("Use my selected preference");
        const selected = await page.evaluate(() => window.controls.requests.at(-1));
        assert.deepEqual(selected.memory_ids, ["11111111-1111-4111-8111-111111111111"]);
        assert.equal(selected.memory_consent, true);
        assert.equal(selected.id, id);
        assert.deepEqual(selected.history, []);
        await complete("Memory-backed answer for " + id);
        await fact.uncheck();
        assert.equal(
          await page.getByText("Memory-backed answer for " + id, { exact: true }).count(),
          0,
        );
        await fact.check();
        await ask("Synthetic revoked memory");
        await complete({ ok: false, error: "Synthetic memory revoked", reset_memory: true });
        await page.getByText("Synthetic memory revoked", { exact: true }).waitFor();
        await page.getByRole("button", { name: "Choose remembered facts", exact: true }).click();
        await page.getByRole("button", { name: "Remember a fact", exact: true }).click();
        await page.getByLabel("Fact to remember", { exact: true }).fill("One fact for " + id);
        await page.getByRole("button", { name: "Send for memory review", exact: true }).click();
        await page
          .getByText(
            "Suggestion saved for owner review. It is not available to chat until approved.",
            { exact: true },
          )
          .waitFor();
        const proposed = await page.evaluate(() => window.controls.proposals.at(-1));
        assert.equal(proposed.id, id);
        assert.equal(proposed.fact.value, "One fact for " + id);
        assert.equal(await fact.isChecked(), false, "New proposal must not be auto-selected");
      }
      await page.evaluate(() => {
        window.controls.denyMemory = true;
      });
      await page.getByRole("button", { name: "Refresh memory choices", exact: true }).click();
      await page
        .getByText(
          "Memory is unavailable for this companion. You can still chat without remembered facts.",
          { exact: true },
        )
        .waitFor();
      await ask("No memory fallback chosen by user");
      assert.deepEqual(await page.evaluate(() => window.controls.requests.at(-1).memory_ids), []);
      await complete("Ordinary chat still available.");
      await page.evaluate(() => {
        window.controls.denyMemory = false;
      });
      await page.getByRole("button", { name: "Choose remembered facts", exact: true }).click();
      await page.getByRole("checkbox", { name: /Use with Scout: communication style/ }).check();
      await page.getByRole("button", { name: "Full screen", exact: true }).click();
      await page.getByRole("button", { name: "Remember a fact", exact: true }).click();
      assert.ok(
        await input.evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight),
        "Composer must stay visible in full screen",
      );
      await page.getByRole("button", { name: "Close chat", exact: true }).click();
      await page.getByRole("button", { name: "Remember a fact", exact: true }).click();
      await page.screenshot({
        path: "artifacts/family-beta/companion-chat-" + mode + "-" + width + ".png",
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      assert.deepEqual(errors, []);
      findings.push({ mode, width, roles, passed: true, errors });
      await context.close();
    }
  }
  await writeFile(
    "artifacts/family-beta/companion-chat-verdict.json",
    JSON.stringify(findings, null, 2),
  );
  console.log(
    "Companion isolation PASS: five roles; late replies and consent; account, household, sign-out and role changes; phone/desktop; development/production. Synthetic API only.",
  );
} finally {
  await browser?.close();
  await server?.close();
  await new Promise((resolve) => (built ? built.httpServer.close(resolve) : resolve()));
}
