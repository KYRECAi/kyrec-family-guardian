import { isIP } from "node:net";
import type { AuthHandler } from "./mobile-api.server.ts";

export class NativeAddressUnavailable extends Error {
  readonly status = 503;
  constructor() {
    super("Native client-address trust is not configured");
  }
}
function address(value: string | undefined): string {
  if (!value || value !== value.trim() || value.includes("%") || !isIP(value))
    throw new NativeAddressUnavailable();
  return isIP(value) === 6 ? new URL(`http://[${value}]/`).hostname.slice(1, -1) : value;
}

/** Runtime peer is server-supplied, never read from a request header by this module. */
export function nativeClientAddress(
  request: Request,
  runtimePeer: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const mode = env.GUARDIAN_NATIVE_ADDRESS_MODE;
  if (!mode || mode === "development-shared") {
    if (env.NODE_ENV === "production") throw new NativeAddressUnavailable();
    // Deliberately conservative local default: all synthetic clients share limits.
    // Changing any forwarded headers never creates another bucket.
    return "127.0.0.1";
  }
  const peer = address(runtimePeer);
  if (mode === "direct") return peer;
  if (mode !== "single-proxy") throw new NativeAddressUnavailable();
  const peers = env.GUARDIAN_NATIVE_TRUSTED_PROXY_IPS?.split(",").map((ip) => address(ip.trim()));
  if (!peers?.length || !peers.includes(peer)) throw new NativeAddressUnavailable();
  // Only a proxy proven to OVERWRITE this header is supported. Appended chains,
  // duplicate/combined headers, ports and arbitrary Forwarded syntax fail closed.
  return address(request.headers.get("x-forwarded-for") ?? undefined);
}

export function nativeAuthWithAddress(
  auth: AuthHandler,
  incoming: Request,
  runtimePeer: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): AuthHandler {
  const client = nativeClientAddress(incoming, runtimePeer, env);
  return (request) => {
    const headers = new Headers(request.headers);
    for (const name of [
      "forwarded",
      "x-forwarded-for",
      "x-real-ip",
      "cf-connecting-ip",
      "x-client-ip",
    ])
      headers.delete(name);
    headers.set("x-forwarded-for", client);
    return auth(new Request(request, { headers }));
  };
}
