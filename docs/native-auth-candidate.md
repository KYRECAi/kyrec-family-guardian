# Native authentication source candidate

HOLD for real credentials and family use. No native login UI has been enabled, no real accounts created, and no backend flag changed. This adds independently testable source below the existing mobile sign-in hold.

## Architecture and lifecycle

`NativeSession -> iOS CapacitorHttp -> Guardian /api/mobile -> verified Better Auth session -> Core`.

The narrow mobile endpoint is disabled unless the server explicitly sets `GUARDIAN_NATIVE_API_ENABLED=true`. Production identity configuration checks still apply. Only JSON POST without Origin or Cookie is accepted. No CORS grant, arbitrary Core path, caller actor or household authority is accepted. Auth uses existing Better Auth bearer verification and server session records; Core credentials stay on the server. The gateway checks verified email and expiry on every household operation. Core remains final authority for membership and owner-only child settings.

Login reuses existing email/password and email verification policy. Registration, invitation delivery, reset links and live mail are not added to the native UI by this change. Real accounts are not provisioned. The route returns minimal verified identity/expiry; signed bearer is transferred in an auth header, never in a household response.

The session controller serializes operations. Logout immediately invalidates in-flight results, then writes a durable pending-revocation marker before contacting the server. Offline logout remains pending, blocks access and blocks account switching, including after restart, until revocation is confirmed. It does not falsely claim remote logout succeeded. Missing/expired/revoked sessions deny access; no cached offline identity grants family data. Refresh revalidates the same identity against existing server sessions and accepts a server-issued replacement token/expiry. It does not invent an independent refresh token or bypass server expiry. Storage write failure never returns successful sign-in; best-effort revocation is attempted, with a possibly orphaned server session remaining a known failure limit until expiry/revocation.

## Native implementation

The local Capacitor plugin `@kyrec/guardian-session` has actual Swift Security-framework Keychain source, uses `WhenUnlockedThisDeviceOnly`, excludes iCloud synchronization, and exposes only one fixed session record. Atomic item update avoids delete/write gaps. No browser/Preferences fallback exists. The TypeScript iOS adapter refuses non-iOS and unavailable-plugin execution. Records are bound to the HTTPS Guardian origin; requests reject redirects and use bounded timeouts. Tokens exist transiently in the JS process to attach to native HTTP requests; they are not written to browser storage. This is not protection from arbitrary script execution inside the app.

Capacitor generation discovers GuardianSessionPlugin and includes the local Swift package with matching product name. Linux cannot compile the Security/UIKit/Capacitor Swift implementation here. Android secure storage is not implemented; Android remains sign-in blocked.

## Verification

- Ten targeted tests pass: actual Better Auth bearer gateway with PGlite/intercepted verification mail; forged/missing/unverified sessions; input actor injection, Origin/Cookie rejection, logout replay; session rotation/restart, expiry, identity changes, offline revocation, stale in-flight responses and storage failure.
- Paired test uses actual Better Auth sessions, the actual gateway handler and HTTP requests to Core `503bd089daadbf6929937300003fc397c31239aa`. Two synthetic adults and a synthetic child: household isolation, child self-grant rejected, owner grant succeeds, unrelated household read rejected, and logout is independent.
- Session storage and native HTTP are injected synthetic implementations in those tests. They do not prove Keychain or OS transport.
- Full suite: 297 passed, five existing skips. Type check, lint (four existing warnings), web/mobile builds and iOS generation pass. No Xcode compilation claimed.
- Bundled account-screen smoke remains blocked for credential entry and now passes phone/iPad/desktop without external-resource mocks; local fonts and extension removal repair the prior network dependency. Separate malicious-script probes verify the CSP. See native-security-review.md.

## Remaining concrete acceptance gates

1. On a Mac, compile the generated unsigned iOS project and plugin; test Keychain read/update/delete, locked-device failures, process termination during logout, reinstall behavior, and disabled iCloud/device migration. Review signed device build separately.
2. Exercise CapacitorHttp against an isolated test server: redirect denial, cookies absent, TLS failure, timeouts, malformed responses, server expiry/revocation and account changes. The app must never show the old household after identity change.
3. Authenticated/native output now excludes the remote platform extension, retaining static attribution, and mobile CSP excludes remote executable code. Actual WKWebView/Keychain enforcement still needs device proof. Web Google Maps remains a separate intentional executable dependency; native Maps must receive a separately reviewed renderer. See native-security-review.md.
4. Wire the verified native session to the account/household UI only after the preceding gates. Present pending logout truthfully and clear user-specific visible state when identity changes. Existing server-function calls cannot be assumed to work on device; this endpoint currently supports household list/shop read and child-access read/save only. Other operations remain unavailable until explicitly adapted and tested.
5. Apple signing/provisioning and an owner-approved installation channel are still required for physical iPhone/iPad acceptance. No enrollment, credentials, paid services, deployment or activation performed.

References: existing installed Better Auth bearer implementation and https://better-auth.com/docs/plugins/bearer; Capacitor v8 plugin contract https://capacitorjs.com/docs/plugins/ios. No library upgrades.
