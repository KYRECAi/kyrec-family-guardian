# Guardian native review: current-main integration checkpoint

This record supersedes the branch/dependency status in the earlier native-review and staging notes. Their historical test results remain intact. It records a source integration, not a deployment or hosted family acceptance.

**INTEGRATION:** Guardian personal review and Shared Shop, unchanged contracts.

**OBJECTIVE:** Reconcile Guardian PR #10 with current main, retain the later shopping-retry and street-map changes, and include PR #11's expanded two-session checks against one exact Core version.

**PRODUCT REPOSITORY:** KYRECAi/kyrec-family-guardian.

**CORE REPOSITORY:** KYRECAi/kyrec-core; no Core source changed in this task.

**PRODUCT BRANCH / COMMIT:** `feature/native-review-flow`; PR #10 records the final uploaded commit, tree and fresh CI result. Integration preserves the ancestry of previous PR #10 head `daf5f71d16fbb10cc18386ae086128a532755bbf`, current main `1c02c0d9cb383b5514cea5066efb6817a9b67244` and PR #11 head `4728bc7db264da8b5152112cb7eb57a241637ea0`.

**CORE BRANCH / COMMIT:** `feature/native-staging-bundle`, PR #59 `499eceb1213fec6f601ce77b262f2d9abe54dc84`, exact tree `c306f07e47551fc99969fe4fc1cac50821031c9d`. This includes Core PRs #56–58. All 357 downloaded source blobs and the full reconstructed tree were verified against GitHub before testing; the local reconstruction commit is not the upstream commit. Core CI #120 (run 38045398482) passed on the upstream exact commit: 433 Python tests, five Node tests, PostgreSQL, offline-native workflow, compilation, template lint, container and staging-script gates.

**STARTING STATE:** Core #48 and Guardian #9 were already merged. Guardian main included two later street-map commits. PR #10 was conflicted and six commits behind main; PR #11 targeted its feature branch. Core #56–59 remained draft. The only Git merge conflict was `package.json`'s test command: main included shopping-mutation regressions and the feature branch included native-review tests.

**FILES CHANGED:** Conflict resolution retains both test suites. PR #11's paired runner and checkpoint are integrated. The two paired runners now pin the same Core tree, and README links this current checkpoint. Main's shopping receipt/retry implementation, household context, map components, map/home routes and branding are retained without edits. PR #10's existing native routes/components and browser gate are retained.

**CONTRACT / ROUTE:** `guardian-shared-household-v1`; `guardian-native-review-v1`, using `/v1/guardian/households/{household}/native/{consent,results,feedback}`. No contract, production schema or runtime authority change is introduced by this integration.

**DATA SENT:** Freshly verified server-side account identity, household ID, separate explicit viewing/feedback choice and notice version, recommendation ID, stable feedback ID and structured kind. Shared Shop retains its operation receipts. Service credentials remain server-side; no raw conversations or client-selected actor/workspace grants are added.

**DATA RETURNED:** Own consent choices, minimal currently permitted review text, short expiry and feedback receipts with `execution_authorized=false`; existing Shared Shop snapshots. No unrelated household or audit contents are returned.

**AUTH / PERMISSION / WORKSPACE GATES:** Guardian's fresh verified-session and same-site checks remain. Core rechecks active service/scopes, current adult membership, exact household/workspace mapping, recipient target grants and the adult's independent purpose consent. Request-local resolvers and the Core #57 clock repair are retained. Core #58's policy loader remains default-deny without valid pinned configuration; #59's synthetic profile remains opt-in. Loading a policy does not issue recipient grants, consent or decisions.

**HUMAN AUTHORITY GATE:** Viewing and feedback do not approve actions, award points or mint executor authority. Consent belongs to the adult; household ownership does not provide another person's consent.

**ARCHITECTURE IMPACT:** None. No provider, paid service, AWS resource, route or database migration was added here. Core migration `006` and its restricted runtime grants remain a prerequisite for later native deployment.

**TESTS RUN:** Combined Guardian `npm test`: 265 tests, 260 passed, zero failed, five skips (four unavailable Grok editor-document checks and the unconfigured local PostgreSQL check). Typecheck and lint passed with five existing warnings. Vercel and standalone Node builds passed; dependency audit found zero vulnerabilities. Changed paired scripts passed ESLint and formatting; whitespace passed. The exact Core tree ran 433 Python tests: 416 passed, 17 PostgreSQL-dependent checks skipped locally; five Node tests, compilation and shell syntax passed. Existing upstream Core CI supplies the database/template/container evidence for that unchanged tree. Fresh Guardian CI must pass on the uploaded combined head; its result is recorded in PR #10.

**PASS:** Paired Shared Shop test on exact Core #59 source: confirmed accounts, wrong-recipient/membership denial, lost reply followed by another member's deletion and safe retry, concurrent snatch/points/reversal, location revocation/expiry, member removal and sign-out. Expanded native paired test: two independent sessions, own consent/results, exact feedback retry, cross-session viewing/feedback withdrawal, a second verified account denied all four operations, password-reset revocation of both sessions, fresh login and sign-out. Real local Better Auth/PGlite and Core HTTP/services were used with synthetic accounts and captured email; no real provider calls.

**FAIL:** Initial merge stopped at the test-command conflict; resolved by retaining both suites. A first invocation used a nonexistent npm shortcut; the documented direct Node command then passed. Local Chromium download returned truncated archives, so no local browser pass is claimed. CI remains responsible for the phone/desktop component and full-app browser gates, real PostgreSQL and non-root container. No test was removed or weakened to pass.

**PRIVACY / SECURITY IMPACT:** Scoped review covered identity delegation, own-purpose consent, current recipient/workspace checks, feedback retry, non-executing responses, expiry/default-deny policy configuration and restricted grant provisioning. No material integration blocker found. There were no unresolved inline review threads on Guardian #10/#11 or Core #56–59 at inspection. This does not certify real-family privacy, provider activation or deployed browser acceptance.

**GIT EVIDENCE:** PR #10 preserves the three source histories and records the locally tested/uploaded tree comparison. Core is unchanged. No merge to Guardian main or Core master, AWS deployment, live migration, grant provisioning, real email or provider activation was performed.

**RELEASE STATUS: CONDITIONAL** until fresh combined-head Guardian CI and screenshot inspection pass; PR #10 records that final gate. **HOLD** for deployed family use.

**KNOWN OPEN ISSUES:** Exact current AWS image/source and Guardian host identity; reviewed synthetic release/configuration and bounded recipient provisioning; deployed two-device and second-household acceptance; persistence, backup restoration and rollback proof. Existing provider/sender, retention/account deletion, cross-reload uncertain-write recovery, child rollout and Google Play requirements remain. Automated session clients and isolated browser harnesses are not deployed two-device proof.

**ROLLBACK POINTS:** Guardian PR #10 prior head `daf5f71d16fbb10cc18386ae086128a532755bbf`; main `1c02c0d9cb383b5514cea5066efb6817a9b67244` stays unchanged. PR #11 source is preserved as ancestry. Core remains exact #59 `499eceb1213fec6f601ce77b262f2d9abe54dc84`; its current master is `ce703f7b7b2e6a416010ed4a6d8467f144f4282e`. Revert an integration change without deleting additive consent/audit records. A future deployed rollback must pin actual previous images and configuration together.

**EXACT RESUME POINT:** Check the final PR #10 CI result and reviewed source pair, then prepare the bounded synthetic release using verified current deployment identities. Keep Core #56–59 together in dependency order; #56 alone lacks #57's clock repair. Keep native configuration disabled until its reviewed deployment and provisioning are ready.

**NEXT ACTION / OWNER:** Adrian completes the combined-source gate and prepares the concrete staging plan. Michael approves any separately specified gated live/database change after the plan and checks are ready.

**MICHAEL APPROVAL REQUIRED:** No for this authorized development/PR integration. No gated live action was attempted; any subsequent approval request must describe its exact deployment/data scope, checks, risk, rollback and cost.
