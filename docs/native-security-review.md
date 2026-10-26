# Native authentication security review

Review status: source fixes verified locally; real-family release HOLD.

## External code findings and change

The app's shared HTML injector previously inserted `https://grok.com/grok-app-builder/extensions.js` as a plain deferred script without integrity pinning or a sandbox. Repository comments identify platform attribution/branding as its purpose. A direct fetch on this task returned HTTP 403; the current remote script body was unavailable. No claim is made about its full current behavior, tracking or data recipients.

A script loaded this way executes in the app's realm, not an isolated grok.com origin: it can inspect DOM/entered credentials, browser storage, JavaScript objects, and any exposed Capacitor plugin. HttpOnly cookies cannot be read directly but same-origin authenticated operations remain callable. The Keychain adapter's raw read method would be reachable to that code. Capacitor's current native bridge drops originating-frame information before calling plugins, so an iframe or a top-level URL check alone is not a sufficient privilege boundary.

Following the explicit instruction to remove/isolate unneeded executable dependencies, authenticated HTML now removes the extension regardless of its opt-in flag. Auth defaults on, matching the existing auth client. Native output always removes it. A static attribution footer preserves visible platform attribution without remote executable content. Legacy explicitly unauthenticated template mode remains unchanged. No live platform setting was changed. Fonts use pinned local Geist/Geist Mono packages with bundled OFL license texts; roles, companion identity, colours and character artwork are unchanged.

The packaged mobile HTML receives a first-head CSP: local scripts plus hashes of the build's inline bootstrap; no remote scripts, arbitrary inline code, frames, objects, base rewriting or forms. Hashing accounts for HTML parser NUL/newline normalization. Build rejects remote/ambiguous script URLs, inline event attributes and headless documents. The Keychain plugin additionally refuses documents outside `capacitor://localhost`; its WebKit URL read is marshalled to the main thread. That native check still requires Apple execution verification.

The existing authenticated WEB Google Maps integration is different: it loads Google's Maps API to render an explicitly requested map. It was not silently removed or declared isolated by this change. Native CSP blocks it. Before native map enablement choose a native map renderer or separately reviewed isolated map surface with minimal permitted coordinates. The web Maps API remains an explicit third-party executable dependency needing its own trust review; this change does not claim the entire web app has a no-remote-code policy.

## Independent review and reproduced repairs

Independent internal reviewer examined server auth, Keychain/bridge, origin behavior, logout/refresh, account switching and disclosure boundaries. Found and reproduced:

1. Backend logout/session 429/5xx became 401; client could falsely report completed revocation and delete its retry token. Preserve outage/rate-limit status; pending revocation survives.
2. Queued child-access mutations could execute after logout intent. Check epoch/access lock before dispatch, including after async storage reads.
3. Failed Keychain tombstone write left same-process access available. Lock access immediately on logout. If all durable writes fail, a process restart cannot be guaranteed to remember logout intent; remote token may remain active. This remains a physical-device/recovery test gate, not a claim of completed revocation.
4. Refresh could return stale identity when logout occurred during a Keychain write. Recheck epoch/access lock after the write.

Reviewer rechecked the original three fixes and the deferred-write refresh reproduction. No caller-controlled actor or household-authority bypass was found in the narrow gateway. Swift compilation/device behavior was not reviewed as executed evidence.

## Local proof

Ten native-auth tests cover the repaired adversarial cases plus actual Better Auth bearer/email/logout policy, server actor selection, strict input and storage failure. Three script-policy tests cover auth/native injection removal, active-content rejection and parser-normalized CSP hashing. Full suite: 297 passed, five existing skips.

Real bundled-browser attack probes attempt remote code, arbitrary inline code, iframe creation and base rewriting: all blocked; no attacker request or probe execution. This is Chromium proof of the bundle policy, not proof of WKWebView/Keychain execution. Phone, iPad-size and desktop account/navigation/offline smoke now passes WITHOUT external-resource mocks; only deliberate offline resource errors are classified separately. Screens inspected after local font bundling. Production web/mobile builds, type checking, lint and iOS generation are separate checks.

## Remaining precise gates

- The gateway's reconstructed auth request has no trusted client-IP context. Better Auth therefore shares a per-path rate-limit bucket; production sign-in limit is five attempts/minute. Do not enable native login until the deployment's trusted proxy/client-address contract is selected and tested. Do not forward arbitrary client-supplied `X-Forwarded-For` as a shortcut. Existing throttling stays in place meanwhile.
- Native UI integration still disabled; Android secure-session adapter not implemented.
- Apple verification checklist and CI execution conditions: apple-native-verification.md.
- No activation, real accounts, external publication retry, credentials or deployment performed.
