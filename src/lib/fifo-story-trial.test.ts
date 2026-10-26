import assert from "node:assert/strict";
import { test } from "node:test";
import { createStoryTrial } from "../../scripts/fixtures/fifo-story-store.ts";
const story = {
  companion: "pulse" as const,
  story: "Synthetic day",
  drawing: [
    [
      { x: 12, y: 20 },
      { x: 30, y: 40 },
    ],
  ],
};
test("synthetic loop defaults off and requires an explicitly authored parent reply", async () => {
  const trial = createStoryTrial(),
    child = trial.connect("child"),
    parent = trial.connect("parent");
  await assert.rejects(child.submit(story));
  await assert.rejects(child.setAccess(true));
  await parent.setAccess(true);
  await child.submit(story);
  const entry = (await child.read()).entries[0];
  assert.equal(entry.reply, null);
  await assert.rejects(child.reply(entry.id, "forged parent"));
  await parent.reply(entry.id, "Manually typed synthetic reply");
  const seen = (await child.read()).entries[0];
  assert.deepEqual(seen.reply, {
    authorName: "Test Parent",
    text: "Manually typed synthetic reply",
  });
  await assert.rejects(parent.reply(entry.id, "replacement"));
  await parent.setAccess(false);
  assert.deepEqual((await child.read()).entries, []);
  await assert.rejects(child.submit(story));
});
test("synthetic fixture denies other household and forged payload attribution", async () => {
  const trial = createStoryTrial(),
    parent = trial.connect("parent"),
    child = trial.connect("child"),
    other = trial.connect("outsider");
  await parent.setAccess(true);
  await assert.rejects(child.submit({ ...story, authorName: "Parent" } as typeof story));
  await assert.rejects(child.submit({ ...story, drawing: [[{ x: Infinity, y: 0 }]] }));
  await child.submit(story);
  for (const action of [
    () => other.read(),
    () => other.setAccess(true),
    () => other.reply("1", "wrong household"),
  ])
    await assert.rejects(action());
  const snapshot = await child.read();
  snapshot.entries[0].story = "tampered";
  assert.equal((await child.read()).entries[0].story, story.story);
});
