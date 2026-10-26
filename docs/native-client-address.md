# Native client-address and throttling contract

No deployment topology or live proxy configuration was changed. Native login remains disabled.

The gateway used to discard all client-address context, so Better Auth used one shared per-path bucket. Blindly forwarding `X-Forwarded-For` would let a caller rotate addresses to avoid the five-attempt sign-in limit. The new wrapper computes one address from a server-supplied runtime peer and an explicit policy, strips competing forwarded-address headers, and supplies only that address to existing Better Auth. Limits are unchanged.

## Default and explicit modes

- Unset / `development-shared`: non-production uses a fixed loopback bucket regardless of incoming headers. This intentionally retains conservative shared throttling for local/synthetic use. In production it fails 503 before auth handling.
- `GUARDIAN_NATIVE_ADDRESS_MODE=direct`: uses the verified runtime peer; ignores incoming forwarded headers. Requires proof that this runtime value is the raw client socket address.
- `GUARDIAN_NATIVE_ADDRESS_MODE=single-proxy`: requires exact IP literals in `GUARDIAN_NATIVE_TRUSTED_PROXY_IPS`, matches the runtime peer against that list, then accepts one valid IP from `X-Forwarded-For`. Rejects chains, duplicates combined with commas, ports, malformed/scoped IPs and CIDRs. Proxy must overwrite client input, not append or preserve it. Unsupported/missing topology fails closed.

No default trusted public/private CIDR, wildcard proxy, deployment host or client-provided peer identity is guessed. No production setting was enabled. No addresses or raw request headers are newly logged by this code; existing auth session metadata/rate-limit lifecycle remains authoritative.

## Runtime prerequisite, independently confirmed

The route uses TanStack `getRequestIP({ xForwardedFor:false })`. The installed H3 implementation skips its own forwarded-header lookup but returns runtime `context.clientAddress` or `req.ip`. Installed srvx may already resolve `req.ip` from forwarded headers if its `trustProxy` configuration trusts the peer. Therefore this function name alone does NOT prove raw socket provenance.

Before production enabling, provide evidence from the intended ingress/runtime: raw peer provenance, runtime trustProxy settings, origin reachability, header overwrite behavior, and adversarial direct/forwarded requests. Until then leave native API disabled and mode unset. For a multi-proxy/CDN chain, this deliberately limited resolver is not applicable; design and test that topology separately rather than widening the allowlist.

## Evidence

Four targeted tests pass: fail-closed production default; spoof-resistant local/direct mode; exact-peer proxy parsing including IPv6/combined-header/CIDR cases; competing-header removal; and actual Better Auth with rate limiting enabled. Five failed attempts from one verified peer are allowed, sixth is 429 despite rotating spoofed headers; another verified peer retains its own bucket. Tests use synthetic addresses/PGlite and no live accounts or mail.

Independent reviewer reran all four tests, found no new concrete resolver bypass, and confirmed the runtime provenance caveat above. Native session/household authority tests remain separate and unchanged.
