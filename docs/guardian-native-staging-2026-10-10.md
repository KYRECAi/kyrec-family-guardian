# Section 3 — synthetic session acceptance and staging checkpoint

## Verified scope

Two independent sessions of the same confirmed synthetic adult now exercise the real Better Auth session store and real local Core HTTP adapter. A second confirmed account is denied access. These are automated session clients, not two physical devices and not a deployed browser-to-BFF test.

The test proves consent enabled in one session is visible in the other; withdrawing presentation or feedback blocks the other session; a second confirmed account cannot read status/results or change consent/feedback; password reset revokes both existing sessions; a new login works and sign-out denies further requests. Existing stable-feedback retry checks remain. Mail is captured locally; no delivery provider or model is called.

## Live read-only observations, 10 October 2026 UTC

At the previously recorded AWS staging endpoint, `/v1/health/live` returned 200 with `status=ok`; `/v1/health/ready` returned 200 with database, audit integrity and writable-data checks true. `/v1/guardian/ready` returned 404. Initial probes at `/health` and `/ready` also returned 404; those are not the documented health paths. No deployed source commit was established from these responses. The historical 9 October handover records c07041a; that record is not a current release-identity check.

No AWS CLI, AWS environment configuration or callable AWS connector was available in this session. No live database, grant, deployment, email or paid-service change occurred.

## Configuration and acceptance gate

1. Establish the current ECS image digest/source and the Guardian staging host using approved operator access. Record current rollback identities before changing either service.
2. Resolve dependency order: Core PR56 then PR57; Guardian PR9 then PR10. This test change builds on PR10. Merge status and exact final CI heads must be checked again before release.
3. Implement and review explicit hosted native decision-policy composition. Core's hosted factory currently defaults to an empty policy registry. Do not copy the test fixture into hosting, bypass policy validation, or treat service scopes as policy authority.
4. In approved synthetic staging only, provision the service scopes (`native_presentation`, `native_feedback`), service/workspace access, household mapping, adult memberships and exact recipient/target grants with bounded expiry. Separate viewing and feedback consent must remain adult-owned and initially off. Migration006 and runtime role restrictions must be verified before use.
5. Configure Guardian server secrets: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, Core URL/service ID/key and `KYREC_CORE_EXPECTED_COMMIT` matching the actually deployed tested source. Pin `GUARDIAN_SOURCE_COMMIT`. Keep values out of client bundles and evidence. Account verification/reset delivery needs its separately approved provider configuration; this task has not activated it.
6. On two actual browser/device sessions, confirm login, render with explicit consent, feedback retry, cross-session withdrawal, wrong-account refusal, password reset revocation, sign-out, expiry, outage/recovery and no stale result after backgrounding. Record actual BFF no-store responses and readiness/source identity. Repeat with a second household for workspace isolation. Never use real family records to populate this rehearsal.
7. Record results and restored baseline. Healthy Core alone does not pass this gate. No family pilot until all relevant integration/release gates pass.

## Unified integration close

**INTEGRATION:** Guardian personal review, unchanged guardian-native-review-v1 contract.
**OBJECTIVE:** Strengthen multi-session acceptance and identify staging prerequisites.
**PRODUCT REPOSITORY:** KYRECAi/kyrec-family-guardian.
**CORE REPOSITORY:** KYRECAi/kyrec-core.
**PRODUCT BRANCH / COMMIT:** test/native-two-session-acceptance, based on remote daf5f71d16fbb10cc18386ae086128a532755bbf (local reconstructed checkpoint fed9ed5).
**CORE BRANCH / COMMIT:** feature/guardian-native-flow, remote 01022d0dedeb762fadb09f758aab1a861393a54d; unchanged local native-flow source.
**STARTING STATE:** Section2 passed CI; both feature PRs draft. Hosted policy registry default-deny.
**FILES CHANGED:** scripts/native-review-paired.mjs; this document.
**CONTRACT / ROUTE:** /v1/guardian/households/{household}/native/{consent,results,feedback}; unchanged.
**DATA SENT:** Synthetic household ID, freshly verified server actor, separate purpose/choice/current notice, recommendation and stable feedback IDs. Server-held synthetic service credential.
**DATA RETURNED:** Own consent, minimal Core presentation and feedback receipt; no other-account records.
**AUTH / PERMISSION / WORKSPACE GATES:** Fresh Better Auth session, current adult membership, service/workspace scope, exact recipient grant, separate own consent, Core revalidation.
**HUMAN AUTHORITY GATE:** Recommendations remain non-executing; no points/action authority added.
**ARCHITECTURE IMPACT:** Test-only extension; no runtime change.
**TESTS RUN:** Expanded paired test against real local Core HTTP; ESLint on changed script; formatter. Previous broad CI evidence belongs to the parent PR, not this new head.
**PASS:** All expanded session checks; current AWS liveness/readiness. Changed-script lint passes.
**FAIL:** No behavioral test failure. Guardian readiness absent at recorded AWS endpoint; deployed integration gate remains unpassed.
**PRIVACY / SECURITY IMPACT:** Synthetic accounts only; no real mail, model calls or live writes. No secrets recorded.
**GIT EVIDENCE:** Draft change is linked from the session response; exact remote commit recorded in its PR.
**RELEASE STATUS: HOLD** for deployed family use; local session checks pass.
**KNOWN OPEN ISSUES:** Hosted policy composition, exact deployed identity, authorized provisioning, Guardian staging configuration and actual two-device browser acceptance.
**ROLLBACK POINTS:** Product daf5f71d16fbb10cc18386ae086128a532755bbf; Core unchanged at 01022d0dedeb762fadb09f758aab1a861393a54d. Live rollback identity still needs operator verification.
**EXACT RESUME POINT:** Establish current approved operator access and deployed identities, then complete reviewed policy composition before native staging activation.
**NEXT ACTION / OWNER:** Adrian prepares the policy/configuration change and validates it; Michael supplies access if needed and approves any concrete live change required under the CTO release gate.
**MICHAEL APPROVAL REQUIRED:** No for this test-only draft; yes for a subsequently specified live database/release change under the Adrian skill. No such action was attempted here.
