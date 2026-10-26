import { createHash } from "node:crypto";

/** Protect the privileged bundled realm; never authorize arbitrary inline code. */
export function secureMobileHtml(html) {
  if (!/<head(?:\s[^>]*)?>/i.test(html))
    throw new Error("Mobile HTML has no policy insertion point");
  const hashes = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(match[1])?.[1];
    if (src && (!src.startsWith("/") || src.startsWith("//") || /[\\&#]/.test(src)))
      throw new Error("Remote or ambiguous script in privileged mobile bundle");
    if (!src && match[2].trim())
      hashes.push(
        `'sha256-${createHash("sha256")
          .update(match[2].replaceAll("\u0000", "\uFFFD").replace(/\r\n?/g, "\n"))
          .digest("base64")}'`,
      );
  }
  if (/<(?:iframe|object|embed|base)\b/i.test(html) || /\son\w+\s*=/i.test(html))
    throw new Error("Unreviewed active content in privileged mobile bundle");
  const policy = [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(" ")}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
  // First head element: policy must precede executable markup.
  return html.replace(
    /<head([^>]*)>/i,
    `<head$1><meta http-equiv="Content-Security-Policy" content="${policy}">`,
  );
}
