import { createHash } from "node:crypto";

type MailPurpose = "verify" | "reset";
type MailConfig = { apiKey: string; from: string; baseURL: string; replyTo?: string };

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export function authEmail(purpose: MailPurpose, address: string, link: string, baseURL: string) {
  const target = new URL(link);
  const origin = new URL(baseURL);
  if (
    target.origin !== origin.origin ||
    (target.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(target.hostname))
  ) {
    throw new Error("Authentication email destination is invalid.");
  }
  const reset = purpose === "reset";
  const label = reset ? "Reset password" : "Confirm email";
  const subject = `${label} for KYREC Family Guardian`;
  const description = reset
    ? "You requested a password reset. This link expires in one hour."
    : "Confirm this email address to sign in to your own family account. This link expires in one hour.";
  return {
    to: [address],
    subject,
    text: `${subject}\n\n${description}\n\n${link}\n\nIf you did not request this, ignore this email.`,
    html: `<html lang="en"><body style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;padding:20px;color:#17152b"><h1 style="font-size:24px">${label}</h1><p style="font-size:16px;line-height:1.5">${description}</p><p><a href="${escape(link)}" style="display:inline-block;padding:16px 24px;background:#7138d9;color:white;border-radius:12px;text-decoration:none">${label}</a></p><p style="font-size:14px">If you did not request this, ignore this email.</p><p style="font-size:14px">KYREC Family Guardian</p></body></html>`,
  };
}

export async function deliverAuthEmail(
  purpose: MailPurpose,
  address: string,
  link: string,
  config: MailConfig = {
    apiKey: process.env.RESEND_API_KEY?.trim() ?? "",
    from: process.env.AUTH_EMAIL_FROM?.trim() ?? "",
    baseURL: process.env.BETTER_AUTH_URL?.trim() ?? "http://localhost:8080",
    replyTo: process.env.AUTH_EMAIL_REPLY_TO?.trim(),
  },
  transport: typeof fetch = fetch,
) {
  if (!config.apiKey || !config.from) throw new Error("Account email delivery is not configured.");
  const email = authEmail(purpose, address, link, config.baseURL);
  // Await the receipt: serverless shutdown must not drop a fire-and-forget send.
  // Resend deduplicates repeat requests for the same authentication link.
  const response = await transport("https://api.resend.com/emails", {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `guardian-auth-${createHash("sha256").update(`${purpose}:${address}:${link}`).digest("hex")}`,
    },
    body: JSON.stringify({
      ...email,
      from: config.from,
      ...(config.replyTo ? { reply_to: config.replyTo } : {}),
    }),
  });
  if (!response.ok) throw new Error("Account email delivery failed. Please request a new link.");
  const receipt = (await response.json()) as { id?: unknown };
  if (typeof receipt.id !== "string" || !receipt.id)
    throw new Error("Account email delivery was not confirmed.");
  return receipt.id;
}
