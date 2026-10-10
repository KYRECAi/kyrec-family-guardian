# Evelyn memory review — integration handover

**INTEGRATION:** Guardian memory review, companion-memory-v1.

**OBJECTIVE:** Allow the configured owner to review Evelyn's structured memory proposals in Guardian and exclude approved facts from future recall.

**PRODUCT REPOSITORY:** KYRECAi/kyrec-family-guardian.

**CORE REPOSITORY:** KYRECAi/kyrec-core.

**PRODUCT BRANCH / COMMIT:** codex/evelyn-memory-review-20261011; exact head recorded by its PR.

**CORE BRANCH / COMMIT:** codex/evelyn-memory-bridge-20261011, 0fab42878e66829057ae93b6d93395f3946cafc7, draft PR #60.

**STARTING STATE:** Guardian main 1c02c0d9cb383b5514cea5066efb6817a9b67244. Existing signed-in server transport and Core credential configuration reused. No local Stan files changed.

**FILES CHANGED:** companion-memory contract, service, server functions, tests and review panel; companions index; test script; this handover.

**CONTRACT / ROUTE:** /v1/guardian/companion-memory/{pending,current}; POST /proposals/{UUID}/decision; POST /memories/{UUID}/forget. Core draft route, absent from inspected AWS release.

**DATA SENT:** Verified Guardian account through existing server-only transport; selected record UUID and approved/dismissed outcome. No browser-supplied owner, subject, workspace, transcript or credential.

**DATA RETURNED:** Bounded structured fact and record IDs, subject reference for pending proposals, matching decision receipt. Subject display names are not in the Core contract; person references are shown honestly and should be resolved into verified display labels before ordinary office use.

**AUTH / PERMISSION / WORKSPACE GATES:** Every server function uses familyAuthMiddleware, fresh real-account verification and same-site checks. Core resolves the configured account/service grant and enforces workspace, consent, scope, expiry and configured-owner restrictions. The UI is not an authority boundary. No development account fallback. No local storage or query cache of memories; account changes unmount the review state.

**HUMAN AUTHORITY GATE:** Only Core's configured owner can approve, dismiss or forget. The page provides a separate forget confirmation and does not equate forgetting with physical erasure. Grant provisioning remains an operator task, not a browser name match.

**ARCHITECTURE IMPACT:** Guardian remains a product UI and authenticated client; Core remains memory authority. Character roles are unchanged.

**TESTS RUN / PASS:** 10 new contract/service/transport tests; TypeScript check; ESLint (zero errors, five existing warnings); production Vercel build through the existing environment wrapper. Existing TypeScript suites: 58 + 6 passed, one real PostgreSQL case skipped. Explicit script suite: 189 passed, four skipped. Synthetic browser harness exercised the actual review component's pending, approval, recall and cancellation controls; this is not live Core or full-app browser verification.

**FAIL:** Two existing script symlink tests fail with Windows EPERM. Standard npm build cannot spawn the Vite shim on this Windows environment; invoking the same environment wrapper with Node and Vite's JS entry built successfully. Initial script tests had temporary-directory rename errors; rerunning with the workspace test-temp directory removed those errors. Full Linux CI and authenticated full-app mobile/desktop acceptance remain required.

**PRIVACY / SECURITY IMPACT:** Service keys stay server-side; request and response schemas reject added authority fields, mismatched receipts and extra transcript data. Core failures clear the displayed facts and never become successful approval or an empty confirmed memory view. Historical records/backups remain after forgetting; voice-profile deletion is not implemented here.

**GIT EVIDENCE:** Branch and PR contain the limited source changes above; no credentials, real conversations or test harness mocks are included.

**RELEASE STATUS: HOLD.** Not deployed; not live memory.

**KNOWN OPEN ISSUES:** Core real-database bridge tests; verified owner/service grants; real office data environment decision; Pi voice runtime integration; notification delivery; companion-to-companion routing and gap recognition; verified person labels; full-app account-switch, denied-access, mobile and production browser testing. Review buttons are available on demand; this is not push notification delivery. Existing AWS Core is synthetic-only staging at c07041aaccc77f93ccf7af3d659b91324810fd97, before both memory bridge and several merged Core migrations/features.

**ROLLBACK POINTS:** Guardian starting commit above; unchanged live AWS Core c07041aaccc77f93ccf7af3d659b91324810fd97. Neither PR has been merged or deployed by this work.

**EXACT RESUME POINT:** Check exact-head Guardian CI, then verify against Core #60 with synthetic grants before provisioning real identities or connecting Pi audio.

**NEXT ACTION / OWNER:** Engineering completes paired integration and remaining runtime paths; Michael controls owner binding and real-data release decisions.

**MICHAEL APPROVAL REQUIRED:** No additional approval for this draft implementation. Live access provisioning or a change to the synthetic-only environment requires a concrete reviewed release decision.

