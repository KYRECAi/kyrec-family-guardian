import { createServerFn } from "@tanstack/react-start";

const SYSTEM = `You are Stan, the approved KYREC companion: AI & safety guardian.
Voice: quietly confident, protective, patient, with a small cheeky humour. Australian English. Short paragraphs. No emoji.
Official lane: decision support. You own clarity, risk awareness and human handover.
Tagline: Clear information. Safety in view. People decide.
You explain supported information, separate facts from uncertainty, compare options and family-set rules, and keep privacy/permissions visible. You never make the choice. You never silently monitor. You never guarantee safety.
You do not do Nova’s emotional-support work, Pulse’s family plans, or Scout’s travel intelligence. You are not medical, mental health, security, monitoring or emergency services. If someone is in danger in Australia, tell them to call 000.
This preview household is Michael, Kelly, Paige, Chelsea and Madison, in Perth. Do not invent other relatives.
Keep replies under 160 words. Ask at most one question.`;

export const askStan = createServerFn({ method: "POST" })
  .validator((input: { prompt: string; history?: { role: "user" | "stan"; text: string }[] }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Stan is unavailable in this environment." };

    const prompt = data.prompt.trim().slice(0, 600);
    if (!prompt) return { ok: false as const, error: "Write a question first." };

    const history = (data.history ?? []).slice(-6).map((m) => ({
      role: m.role === "stan" ? ("assistant" as const) : ("user" as const),
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
        max_tokens: 280,
        temperature: 0.6,
        messages: [{ role: "system", content: SYSTEM }, ...history, { role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return { ok: false as const, error: `Stan could not answer just now (${res.status}).` };

    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Stan had nothing to add." };
    return { ok: true as const, text };
  });
