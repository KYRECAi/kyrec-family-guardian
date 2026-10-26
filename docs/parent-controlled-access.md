# Parent-controlled child access — review handoff

Core dependency: `503bd089daadbf6929937300003fc397c31239aa` in KYRECAi/kyrec-core.
This feature is separate from the Family Goals approval repair in Core PR #76.
No deployment or live account/migration change is included.

Settings now includes **Parent consent for children**, per child, with
**Allow all listed features**, **Turn all off**, and individual switches for
Chat, Stan, Nova, Pulse, Moneybags, Scout, Map and Games. Changes require Save;
failed or stale saves require reloading persisted choices. No age field or
age-based unlock is used. Only the existing adult household owner can save.

Choices live in Core, not local storage. The authenticated Guardian server uses
GET/PUT `/v1/guardian/households/{household}/members/{member}/feature-access`.
The browser selects the target child but cannot supply the acting identity.
Core verifies membership, owner role, target child, revision and exact booleans.
Shared household snapshots carry the current caller's feature flags. Missing
flags deny child access, allowing a fail-closed client-first rollout.

Child navigation and direct route rendering use those flags. A games-only child
gets a simple games-only home, without the ordinary home map or companion/mood
widgets. Disabled features unmount after a fresh snapshot; failed refresh clears
family state. Child map reads also enforce the switch at Core. Companions still
have their existing server-side adult-beta restriction: parent feature choices
cannot bypass that release gate, personal/provider consent, location-sharing
consent, private-chat boundaries or reward approval. This limitation is visible
in the settings panel. Help, privacy and account controls remain accessible.

Evidence:
- Core: 537 Python tests with isolated PostgreSQL, no skips; includes eight new
  child-feature tests and restricted-runtime lifecycle/immutable-evidence checks.
- Guardian: production build and TypeScript pass; `npm test` passes (273 passed,
  five existing skips), including three new strict-contract/direct-route tests.
- `scripts/child-access-paired.ts`: synthetic HTTP test against the exact Core
  commit passes owner save, child denial, games-only snapshot, map denial,
  revocation and stale replay. It uses no real family accounts or provider calls.
- `scripts/child-access-browser.mjs`: isolated component harness, phone/desktop,
  development/built; games-only, all-on/all-off, per-child separation, failed-save
  recovery, non-owner controls, touch targets and no horizontal overflow pass.
  Screenshots inspected. This is not evidence of a deployed signed-in journey.
- Full-app development smoke was attempted; external sign-in requests encountered
  network tunnel errors. No successful full signed-in production journey is
  claimed. The component QA uses the installed system Chromium because the
  Playwright browser download endpoint was blocked in this workspace.

Release remains conditional on paired review, normal Core migration 007/runtime
SELECT+INSERT grant rollout, and actual deployed account testing. Child AI chat
and location sharing retain their existing release holds. Feature selection is
not proof of legal parental responsibility or completed privacy/clinical review.
