/** SYNTHETIC ONLY. Memory-only trial; never wire this fixture to a real account. */
import { z } from "zod";
import type { StoryEntry, StoryTrialAPI } from "../../src/lib/fifo-story-contract.ts";
const submission = z
  .object({
    companion: z.enum(["pulse", "moneybags"]),
    story: z.string().trim().min(1).max(1000),
    drawing: z
      .array(
        z
          .array(
            z.object({ x: z.number().min(0).max(600), y: z.number().min(0).max(300) }).strict(),
          )
          .max(500),
      )
      .max(20),
  })
  .strict();
const replyText = z.string().trim().min(1).max(1000);
const identities = {
  child: { role: "child", name: "Test Child", household: "family" },
  parent: { role: "adult", name: "Test Parent", household: "family" },
  outsider: { role: "adult", name: "Other Household Adult", household: "other" },
} as const;
export function createStoryTrial() {
  let enabled = false;
  const entries: StoryEntry[] = [];
  let sequence = 0;
  function connect(identity: keyof typeof identities): StoryTrialAPI {
    const actor = identities[identity];
    if (!actor) throw new Error("Unknown synthetic identity");
    const membership = () => {
      if (actor.household !== "family") throw new Error("Household denied");
    };
    const adult = () => {
      membership();
      if (actor.role !== "adult") throw new Error("Parent only");
    };
    return {
      async read() {
        membership();
        return {
          role: actor.role,
          name: actor.name,
          enabled,
          entries: structuredClone(enabled || actor.role === "adult" ? entries : []),
        };
      },
      async setAccess(value) {
        adult();
        if (typeof value !== "boolean") throw new Error("Invalid access");
        enabled = value;
      },
      async submit(input) {
        membership();
        if (actor.role !== "child" || !enabled) throw new Error("Child access off");
        const value = submission.parse(input);
        entries.push({
          id: String(++sequence),
          child: identity,
          childName: actor.name,
          ...structuredClone(value),
          reply: null,
        });
      },
      async reply(id, text) {
        adult();
        if (!enabled) throw new Error("Child access off");
        const entry = entries.find((e) => e.id === id);
        if (!entry || entry.reply) throw new Error("Reply unavailable or already sent");
        entry.reply = { authorName: actor.name, text: replyText.parse(text) };
      },
    };
  }
  return { connect };
}
