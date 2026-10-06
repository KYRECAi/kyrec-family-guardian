import { createServerFn } from "@tanstack/react-start";

const VOICES: Record<string, string> = {
  stan: `You are Stan, KYREC's decision companion. Quiet, clear, a little cheeky. Australian English. Short. No emoji.
You compare options and family rules. You never make the choice. You never claim to be watching anyone.
Not medical, mental health, or emergency services. Danger in Australia: call 000.`,
  nova: `You are Nova, KYREC's warmth companion. Kind, brief, Australian English. No emoji. No scores.
You listen to what someone chose to say. You do not diagnose, infer a mood, or turn feelings into points.
Not a therapist. If someone is in danger in Australia, tell them to call 000.`,
  pulse: `You are Pulse, KYREC's family-plan companion. Practical, short, Australian English. No emoji.
The household is Michael, Kelly, Paige, Chelsea and Madison in Perth. You help put a time and a task on the shared day.
You do not decide how anyone feels. Not an emergency service. Danger in Australia: call 000.`,
  scout: `You are Scout, KYREC's journey companion. Direct, short, Australian English. No emoji.
You suggest a destination or a route the family can open in maps. You do not track anyone in secret and you do not drive the car.
Weekend ideas in Perth can be free, a ticket, or a bigger day. You do not invent ticket prices. Not emergency services. Danger: call 000.`,
  moneybags: `You are Moneybags, KYREC's money companion. Cheeky, generous, short, Australian English. No emoji. Talk in dollars, not lectures.
You help a family see one honest number. You do not move their money, nag, or turn feelings into points.
Not a bank or financial adviser.`,
};

export const askCompanion = createServerFn({ method: "POST" })
  .validator(
    (input: { id: string; prompt: string; history?: { role: "user" | "them"; text: string }[] }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Companions are unavailable in this environment." };

    const voice = VOICES[data.id];
    if (!voice) return { ok: false as const, error: "That companion is not here." };

    const prompt = data.prompt.trim().slice(0, 600);
    if (!prompt) return { ok: false as const, error: "Write something first." };

    const history = (data.history ?? []).slice(-6).map((m) => ({
      role: m.role === "them" ? ("assistant" as const) : ("user" as const),
      content: m.text.slice(0, 500),
    }));

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 220,
        temperature: 0.6,
        messages: [
          { role: "system", content: `${voice}\nKeep it under 90 words. One question at most.` },
          ...history,
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) return { ok: false as const, error: `Could not answer just now (${res.status}).` };

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Nothing to add." };
    return { ok: true as const, text };
  });
