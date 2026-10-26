import assert from "node:assert/strict";
import test from "node:test";
import {
  allFeatures,
  childAccessChange,
  canOpenFeatureRoute,
  featuresSchema,
} from "./child-feature-contract.ts";

test("feature choices require exact booleans and reject actor, age and blanket flags", () => {
  const input = {
    household: "00000000-0000-4000-8000-000000000001",
    member: "child",
    revision: 0,
    features: allFeatures(false),
  };
  assert.deepEqual(childAccessChange.parse(input), input);
  for (const extra of [
    { actor: "parent" },
    { age: 16 },
    { full_consent: true },
    { approved_by: "parent" },
  ])
    assert.throws(() => childAccessChange.parse({ ...input, ...extra }));
  assert.throws(() => featuresSchema.parse({ ...allFeatures(false), chat: "true" }));
  assert.throws(() => featuresSchema.parse({ ...allFeatures(false), future_feature: true }));
});
test("games-only permits games but denies direct map, chat and companion routes", () => {
  const choices = { ...allFeatures(false), games: true };
  for (const path of ["/games", "/games/moneybags", "/games/valentine"])
    assert.equal(canOpenFeatureRoute(path, "child", choices), true);
  for (const path of [
    "/map",
    "/drive",
    "/companions",
    "/companions/nova",
    "/talk/nova",
    "/nova",
    "/stan",
    "/planner",
    "/budget",
  ])
    assert.equal(canOpenFeatureRoute(path, "child", choices), false, path);
  for (const path of ["/", "/settings", "/account", "/privacy", "/terms"])
    assert.equal(canOpenFeatureRoute(path, "child", choices), true);
});
test("missing state fails closed and individual chat cannot override companion switch", () => {
  assert.equal(canOpenFeatureRoute("/games", "child"), false);
  assert.equal(
    canOpenFeatureRoute("/talk/nova", "child", { ...allFeatures(false), chat: true }),
    false,
  );
  assert.equal(
    canOpenFeatureRoute("/talk/nova", "child", { ...allFeatures(false), chat: true, nova: true }),
    true,
  );
  assert.equal(canOpenFeatureRoute("/map", "adult", allFeatures(false)), true);
});
