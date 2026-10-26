# Parent controls and installed-app integration candidate

Status: HOLD for real-family use. Local synthetic candidate, not deployment approval.

## Pinned inputs

- Core parent access: `503bd089daadbf6929937300003fc397c31239aa`.
- Guardian parent access: `f475ab81b022616a34c67cde972fc84cd7c48d9e`.
- Guardian installed-app PR22: `8619919f234ae8ce9f49d49d3beca6e873e27e55`.
- Newer Guardian main/game link: `2071dbc`.
- Independent Core goal approval PR76 repair: `fa529b00c172d0dd5d5595dfa9709ca33df5f6d4`; not included in this Core baseline.

Integration preserves all source histories. Conflict resolution retains both the mobile sign-in hold and ChildFeatureGate, and both test suites. No changes to Core authority, identity, credentials or live membership.

## Evidence

- Combined Guardian suite: 284 passed, five existing skips (including optional PostgreSQL auth test).
- Type check, production web build and bundled mobile build pass. Lint passes with four existing warnings; generated child-access harness output is now excluded consistently with other harnesses.
- Paired HTTP test against pinned Core passes default deny, owner-only save, map denial, stale revision, revocation, and separate synthetic household read/write rejection.
- Auth lifecycle test uses local PGlite and intercepted mail: unverified sign-in denied; missing/forged session denied; two identities remain separate; logout revokes its session without affecting the other; password reset revokes prior session and cannot replay.
- Isolated package browser check passes phone 390px, iPad-sized 1024px and desktop 1280px: credential entry disabled, privacy navigation/reload, offline return, no private API calls. External resources are explicitly replaced with empty synthetic responses in this mode, not tested as live dependencies. Expected resource-disconnected errors during the explicit offline step are recorded separately; late unexpected console errors still fail after context closure.
- Unmocked package smoke FAILS here on external-resource tunnel/disconnected errors. Do not call that a clean full-app pass. Original default smoke remains strict.
- No physical device, native secure-store, signed-in mobile API, live email or provider acceptance performed.

## Remaining implementation and install prerequisites

1. Native transport/session source is now implemented; see native-auth-candidate.md for test evidence and remaining Apple compilation, device, integration-UI and external-script gates. Keep mobile credential entry blocked until those pass.
2. Verified session -> Guardian mobile API -> pinned local Core now passes in one synthetic flow for two adult accounts and a child, including cross-household denial and owner-only feature changes. OS storage/HTTP are not included in that synthetic proof.
3. Decide whether a second adult can manage child access. Current canonical authority is adult household owner only; do not silently treat membership as parent authority.
4. Preserve per-feature default-off choices separately from provider/memory permissions and individual goal approval. Child AI and location-sharing holds remain.
5. For Apple compilation use the existing project path and its Xcode requirements. Actual iPhone/iPad installation needs an approved signing/provisioning and distribution path, owner-controlled bundle identity `au.kyrec.familyguardian`, and physical-device acceptance. Current CI workflow produces unsigned simulator output only. No enrollment, credentials or spending performed.
6. A memory-only synthetic Pulse/Moneybags story/drawing and manually attributed parent-reply trial now exists; see fifo-story-trial.md. Real-user integration still needs verified connected identity and a Core-owned durable contract. No generated reply may impersonate a parent. Use synthetic identities/content while child/live-AI holds remain. No family accounts or invitations created.

Draft PR and PR-description publication remain pending after automatic approval-review denial; no retry in this integration work. No merge to main, live migration, deployment, notifications or account provisioning.
