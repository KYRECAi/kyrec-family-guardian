import assert from "node:assert/strict";
import test from "node:test";
import { secureMobileHtml } from "./mobile-trust-policy.mjs";
import { injectGrokPwaHead } from "./grok-pwa-shared.mjs";

test("authenticated and native injection strips remote platform script even when opted on", () => {
  const before = { ...process.env };
  try {
    for (const auth of [undefined, "true"]) {
      if (auth) process.env.VITE_AUTH_ENABLED = auth;
      else delete process.env.VITE_AUTH_ENABLED;
      process.env.VITE_GROK_EXTENSIONS = "1";
      const html = injectGrokPwaHead(
        '<html><head><script src="https://grok.com/grok-app-builder/extensions.js" defer></script></head><body></body></html>',
      );
      assert.doesNotMatch(html, /extensions\.js/);
    }
    process.env.VITE_AUTH_ENABLED = "false";
    process.env.GUARDIAN_MOBILE_BUILD = "1";
    assert.doesNotMatch(injectGrokPwaHead("<html><head></head></html>"), /extensions\.js/);
  } finally {
    for (const key of ["VITE_AUTH_ENABLED", "VITE_GROK_EXTENSIONS", "GUARDIAN_MOBILE_BUILD"])
      if (before[key] === undefined) delete process.env[key];
      else process.env[key] = before[key];
  }
});

test("mobile policy permits pinned inline bootstrap and local modules, rejects active remote content", () => {
  const html = secureMobileHtml(
    '<html><head><script>window.localBootstrap=true</script><script src="/assets/app.js"></script></head></html>',
  );
  assert.match(html, /script-src 'self' 'sha256-/);
  assert.match(html, /frame-src 'none'/);
  assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf("<script>"));
  for (const tag of [
    '<script src="https://evil.example/x.js"></script>',
    '<script src="//evil.example/x.js"></script>',
    '<script src="/&#47;evil.example/x.js"></script>',
    '<iframe src="https://evil.example"></iframe>',
    '<img src="x" onerror="alert(1)">',
    '<base href="https://evil.example">',
  ])
    assert.throws(() => secureMobileHtml(`<html><head>${tag}</head></html>`));
});

test("policy hashes the HTML parser normalized script and rejects headless documents", () => {
  const normalized = secureMobileHtml('<head><script>let a="\uFFFD";\n</script></head>');
  const raw = secureMobileHtml('<head><script>let a="\u0000";\r\n</script></head>');
  assert.equal(normalized.match(/sha256-[^']+/)[0], raw.match(/sha256-[^']+/)[0]);
  assert.throws(() => secureMobileHtml('<script src="/local.js"></script>'), /insertion point/);
});
