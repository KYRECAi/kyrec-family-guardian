import { z } from "zod";
import { childAccessChange, childAccessTarget } from "../child-feature-contract.ts";
import { coreRequest } from "../core-client.server.ts";

const operation = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("login"),
      email: z.string().email().max(254),
      password: z.string().min(1).max(128),
    })
    .strict(),
  z.object({ action: z.enum(["session", "logout", "households"]) }).strict(),
  z.object({ action: z.literal("shop"), household: z.string().uuid() }).strict(),
  childAccessTarget.extend({ action: z.literal("child_access") }).strict(),
  childAccessChange.extend({ action: z.literal("save_child_access") }).strict(),
]);
const sessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string(),
    emailVerified: z.literal(true),
  }),
  session: z.object({ expiresAt: z.coerce.date() }),
});
export type AuthHandler = (request: Request) => Promise<Response>;
const reply = (status: number, value: unknown, token?: string) =>
  Response.json(value, {
    status,
    headers: { "Cache-Control": "no-store", ...(token ? { "set-auth-token": token } : {}) },
  });

/** Native-only narrow gateway. No cookie fallback, arbitrary Core URL or caller actor. */
export async function mobileApi(request: Request, auth: AuthHandler, core = coreRequest) {
  if (
    request.method !== "POST" ||
    request.headers.has("origin") ||
    request.headers.has("cookie") ||
    request.headers.get("content-type")?.split(";")[0] !== "application/json"
  )
    return reply(403, { error: "Forbidden" });
  let input: z.infer<typeof operation>;
  try {
    const body = await request.text();
    if (body.length > 8192) return reply(413, { error: "Request too large" });
    input = operation.parse(JSON.parse(body));
  } catch {
    return reply(400, { error: "Invalid request" });
  }
  const bearer = request.headers.get("authorization");
  if (input.action !== "login" && !/^Bearer [^\s]{20,4096}$/.test(bearer ?? ""))
    return reply(401, { error: "Sign in required" });
  const authRequest = (path: string, method: string, body?: unknown) =>
    auth(
      new Request(new URL(`/api/auth/${path}`, request.url), {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(bearer && input.action !== "login" ? { Authorization: bearer } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  try {
    if (input.action === "logout") {
      const result = await authRequest("sign-out", "POST", {});
      if (result.ok) return reply(200, { revoked: true });
      return reply(result.status === 401 ? 401 : result.status === 429 ? 429 : 503, {
        revoked: false,
      });
    }
    if (input.action === "login") {
      const result = await authRequest("sign-in/email", "POST", {
        email: input.email,
        password: input.password,
      });
      const token = result.headers.get("set-auth-token");
      if (!result.ok || !token)
        return reply(result.status === 429 ? 429 : 401, { error: "Sign-in failed" });
      // Never forward the raw auth response (it contains session secrets).
      const checked = await auth(
        new Request(new URL("/api/auth/get-session", request.url), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const parsed = sessionSchema.safeParse(await checked.json());
      if (!checked.ok || !parsed.success || parsed.data.session.expiresAt.getTime() <= Date.now())
        return reply(401, { error: "Sign-in failed" });
      return reply(
        200,
        { user: parsed.data.user, expiresAt: parsed.data.session.expiresAt.toISOString() },
        token,
      );
    }
    const checked = await authRequest("get-session", "GET");
    if (!checked.ok)
      return reply(checked.status === 401 ? 401 : checked.status === 429 ? 429 : 503, {
        error: "Session unavailable",
      });
    const parsed = sessionSchema.safeParse(await checked.json());
    if (!checked.ok || !parsed.success || parsed.data.session.expiresAt.getTime() <= Date.now())
      return reply(401, { error: "Session expired" });
    const { user, session } = parsed.data;
    const refreshed = checked.headers.get("set-auth-token") ?? undefined;
    if (input.action === "session")
      return reply(200, { user, expiresAt: session.expiresAt.toISOString() }, refreshed);
    let path = "/v1/guardian/households";
    if (input.action === "shop") path += `/${input.household}/shop`;
    if (input.action === "child_access" || input.action === "save_child_access")
      path += `/${input.household}/members/${encodeURIComponent(input.member)}/feature-access`;
    const data = await core(
      user.id,
      path,
      input.action === "save_child_access" ? "PUT" : "GET",
      input.action === "save_child_access"
        ? { revision: input.revision, features: input.features }
        : undefined,
    );
    return reply(200, data, refreshed);
  } catch (error) {
    const status = (error as { status?: number }).status;
    return reply(status && [403, 404, 409, 422, 429].includes(status) ? status : 503, {
      error: "Request unavailable",
    });
  }
}
