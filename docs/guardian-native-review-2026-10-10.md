# Section 2 — Guardian personal review integration

**INTEGRATION:** `guardian-native-review-v1`.

**OBJECTIVE:** Let a freshly authenticated adult choose their own native viewing/feedback consent, see only explicitly permitted results, and submit structured feedback without approval or execution authority.

**PRODUCT REPOSITORY:** KYRECAi/kyrec-family-guardian.

**CORE REPOSITORY:** KYRECAi/kyrec-core.

**PRODUCT BRANCH / COMMIT:** New `feature/native-review-flow`, based on Guardian PR9 `5e8ffe3443ad845d514953d9f16bafd17d06695c`. The paired PR records its exact tested head.

**CORE BRANCH / COMMIT:** New `feature/guardian-native-flow`, based on Section1 PR56 `2369b07e96bd74304d843937c5865bc9b3c8c236`. The paired PR records its exact tested head. PR48 is now merged at `ce703f7b7b2e6a416010ed4a6d8467f144f4282e`; this supersedes Section1's historical unmerged dependency note.

**STARTING STATE:** Core native services, exact access bridge and separate consent existed, but had no product routes/screens. Guardian's existing verified account middleware and Core client were available in unmerged PR9.

**FILES CHANGED:** Core native router, main hosted-runtime composition, access status/recipient candidate methods, HTTP integration tests and this record. Product native contracts, server functions/client, personal review component, family/permissions links, behavioral/browser checks and CI test step. Synthetic paired fixtures: Core `scripts/guardian_native_test_server.py`, product `scripts/native-review-paired.mjs`. No existing account provider or schema changes. Migration006 remains the Section1 dependency.

**CONTRACT / ROUTE:** `/v1/guardian/households/{household UUID}/native/consent` GET/PUT; `/results` GET; `/feedback` POST. Hosted PostgreSQL runtime registers routes. Development fixtures mount the same router explicitly. Existing shared-shop contract remains unchanged. Do not enable native scopes on an old Core build. Staging configuration must pin the exact reviewed Section2 Core commit through Guardian's existing expected-commit health setting.

**DATA SENT:** Verified server session actor via existing server-held service credentials; household UUID; explicit purpose/boolean/current notice for consent; exact recommendation and feedback UUIDs plus structured feedback kind. No browser actor, workspace, access grant, service key or free-text evidence. Guardian inputs reject additional fields.

**DATA RETURNED:** Own current consent choices, up to 50 recipient candidates resolved individually into current generic Core language, optional separately authorized feedback recommendation ID, short expiry and literal `execution_authorized=false`; minimal feedback acknowledgment. No audit ledger, private transcripts, other family context or workspace/actor identity is returned.

**AUTH / PERMISSION / WORKSPACE GATES:** Every Guardian server function uses existing fresh verified family session middleware and same-origin checks. Core reauthenticates the service, its native scopes, owning household, current adult membership, service-workspace grant and exact purpose/target grants plus own current consent. Native services are created per request, never assigned another person's resolver globally. Rendering revalidates current Core decision/evidence authority. Historical feedback retains its separate permission semantics. No public provisioning endpoint exists.

**HUMAN AUTHORITY GATE:** Accept/reject/dismiss feedback is a response to a suggestion, not an approval, action, points change or reward unlock. Existing Core action authority stays required.

**ARCHITECTURE IMPACT:** Narrow additive HTTP/BFF/UI connection using existing auth and persistence. No new dependency or provider call. The family page mounts the review component only for a verified adult and keys it by user/household; unmount invalidates pending results. The screen clears results while checking, after failures, on blur/visibility changes, and when the short result expiry is reached. It does not persist result data in local storage. Refresh rechecks authority rather than restoring cached results.

**TESTS RUN:** Local Core full suite: 425 discovered, 408 passed, 17 PostgreSQL-dependent skips. New actual HTTP tests cover consent/render/feedback/retry/revoke, wrong actor/household, extra input, minimal output and sanitized backend failure. Guardian typecheck, lint (five pre-existing warnings), Vercel build and behavioral tests run locally. Added server/client schema, delegation, stale response, denial and receipt tests. Added isolated phone/desktop component browser tests in development and built mode, plus existing full-app account browser CI checks. A local paired test also passed using Better Auth/PGlite confirmation and fresh sessions, the real Guardian Core client over HTTP, and actual Core stores/services: render, feedback, exact retry, withdrawal, wrong user and sign-out denial. It uses synthetic email capture, never real mail. This tests the account/client/Core boundary, not a deployed browser/BFF session; the wrappers and browser component have separate checks. Exact-head CI outcomes and final counts are recorded in paired PRs.

**PASS:** See exact-head CI in paired PRs; local results above are not a claim that skipped PostgreSQL tests ran locally.

**FAIL:** An advancing-clock regression test first failed: Section1 stamped access start at resolver completion, after the language service had captured its time. Corrected the start to the latest of binding/grant/consent start, preserving expiry and current-state checks. The new test passes after repair. Initial local product test attempt failed because the text-only checkout lacked retained PWA assets; original unchanged assets were restored. Local Chromium download failed (truncated download), so browser verification runs in CI. No test is disabled to hide either condition.

**PRIVACY / SECURITY IMPACT:** Separate own choices, explicit off controls, no owner consent for another adult, no new external-model transfer. Choices last at most 30 days; turning off stops future access, not historical record retention. Existing consent events and feedback remain durable. The notice states this without inventing a deletion/retention promise. Feedback retry preserves its UUID to avoid duplicate writes after an ambiguous network response. Result revocation is rechecked on requests; already delivered text cannot be remotely recalled, and screen expiry is a display limit, not a guarantee against screenshots.

**GIT EVIDENCE:** Isolated branches; PR9 and PR56 are not edited or merged. Original product text files verified against exact remote blob SHAs. Binary brand/platform assets remain unchanged. New Core PR is dependent on PR56; product PR is dependent on PR9. Each draft targets the normal default branch for CI, so cumulative diffs include its dependency.

**RELEASE STATUS: CONDITIONAL** for engineering review; **HOLD** for real-family enablement. Not deployed. No live database migration, email dispatch, paid-provider activation or production configuration occurred.

**KNOWN OPEN ISSUES:** Paired deployed staging/two-device acceptance remains Section3. Native workspace/recipient provisioning is deliberately privileged and must validate current recipient disclosure permission, adult membership, exact target ownership, purpose and expiry; ordinary shopping membership must never mint a grant. No general automatic result generation or grant issuance was added. No guarantee is made that real households currently have provisioned results. Product/privacy owner must approve the notice and record retention/deletion policy before family rollout. Existing PR9 release blockers still apply.

**ROLLBACK POINTS:** Product `5e8ffe3443ad845d514953d9f16bafd17d06695c`; Core `2369b07e96bd74304d843937c5865bc9b3c8c236`. Disable native scopes first if later enabled; revert route/UI commits, retaining additive consent/audit records. Never drop historical data as a code rollback.

**EXACT RESUME POINT:** Review paired exact-head CI; merge dependencies in order under the applicable authorization. For Section3, provision synthetic workspace/recipient grants through a privileged staging connection, configure the reviewed Core commit/service scopes and run real sign-in, cross-user, revoke, offline and two-device checks.

**NEXT ACTION / OWNER:** Adrian with Guardian product owner: Section3 synthetic staging acceptance and notice/retention review.

**MICHAEL APPROVAL REQUIRED:** No for reversible development/draft PRs. Explicit approval is still required for production/live database changes or new material spend. No such action was taken.
