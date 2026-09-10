const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const html = readFileSync(new URL('../www/index.html', `file://${__filename}`), 'utf8');

test('inline application JavaScript parses', () => {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0][1]));
});

test('the prototype clearly identifies sample data', () => {
  assert.match(html, /CONCEPT DEMO · Sample family data, not live monitoring/);
  assert.match(html, /Example concept data/);
});

test('the app has no remote asset or privileged API reference', () => {
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(html, /X-KYREC-Service-Key|KYREC_FAMILY_GUARDIAN_DEV_KEY/);
});

test('Pulse and Moneybags retain their approved Family Guardian roles', () => {
  assert.match(html, /Pulse[\s\S]*Family Flow, routines, planning and coordination/);
  assert.match(html, /Moneybags[\s\S]*Budget · Savings · Goals · Rewards/);
  assert.match(html, /adult approval is required/i);
});

test('privacy choices save locally without persisting mood', () => {
  assert.match(html, /localStorage\.setItem\(SETTINGS_KEY, JSON\.stringify\(\{toggles:state\.toggles\}\)\)/);
  assert.doesNotMatch(html, /localStorage\.setItem\([^\n]*mood/);
});
