const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const game = require('../www/moneybags-game.js');

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

test('Moneybags Bonus is the first playable and seasonal games remain future previews', () => {
  assert.match(html, /Moneybags Bonus playable prototype/);
  assert.match(html, /Moneybags Bonus comes first/);
  assert.match(html, /Future seasonal game/);
});

test('a coin is always worth 50 game score and never awards Family Points', () => {
  const state = game.createState({ targetScore: 100 });
  assert.equal(game.start(state, { kind: 'simulated', status: 'approved', adultApproved: true }), true);
  assert.equal(game.collectCoin(state), 50);
  assert.equal(state.score, 50);
  assert.equal(state.familyPointsAwarded, 0);
  assert.equal(state.rewardStatus, 'game-score-only');
  assert.match(html, /Game score ≠ Family Points/);
  assert.match(html, /This prototype awards 0 Family Points/);
});

test('Moneybags Bonus requires an explicit adult-approved authority', () => {
  const missing = game.createState();
  const childOnly = game.createState();
  assert.equal(game.start(missing), false);
  assert.equal(game.start(childOnly, { kind: 'simulated', status: 'approved', adultApproved: false }), false);
  assert.equal(missing.phase, 'locked');
  assert.equal(childOnly.rewardStatus, 'authority-required');
});

test('Moneybags Bonus supports win, non-punitive timeout, pause and reset', () => {
  const won = game.createState({ durationSeconds: 45, targetScore: 100 });
  game.start(won, { kind: 'simulated', status: 'approved', adultApproved: true });
  game.collectCoin(won);
  game.pause(won);
  assert.equal(won.phase, 'paused');
  game.resume(won);
  game.collectCoin(won);
  assert.equal(won.phase, 'won');
  assert.equal(won.familyPointsAwarded, 0);

  const timedOut = game.createState({ durationSeconds: 45 });
  game.start(timedOut, { kind: 'simulated', status: 'approved', adultApproved: true });
  timedOut.secondsLeft = 1;
  game.tick(timedOut);
  assert.equal(timedOut.phase, 'finished');
  assert.equal(timedOut.score, 0);
  game.reset(timedOut);
  assert.equal(timedOut.phase, 'ready');
  assert.equal(timedOut.secondsLeft, 45);
});

test('Moneybags Bonus session length is constrained to the approved accessibility range', () => {
  assert.equal(game.createState({ durationSeconds: 10 }).durationSeconds, 45);
  assert.equal(game.createState({ durationSeconds: 60 }).durationSeconds, 60);
  assert.equal(game.createState({ durationSeconds: 300 }).durationSeconds, 120);
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
