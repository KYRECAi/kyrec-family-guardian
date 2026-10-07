# KYREC Core / Family Guardian integration — 7 October 2026

**INTEGRATION**  
Guardian shared household beta; contract `guardian-shared-household-v1`, policy `shared-shop-cadence-v1`.

**OBJECTIVE**  
Replace the device-only shared shop with durable household state. Add individual email/password accounts, confirmation and password reset, a shared app-level Maps configuration and server-side OpenAI companions. Prepare exact-source builds and review gates for a 10–20-family pilot.

**PRODUCT REPOSITORY**  
`KYRECAi/kyrec-family-guardian`

**CORE REPOSITORY**  
`KYRECAi/kyrec-core`

**PRODUCT BRANCH / COMMIT**  
`feature/family-beta-integration`. The PR head is the exact uploaded tree; final SHA and CI results are recorded in its GitHub PR. Starting commit: `2a1fbbc93bc61003baad6e6ec89404a4d7e99324`.

**CORE BRANCH / COMMIT**  
`feature/native-intelligence-sectors-3-4`. The PR head is the exact uploaded tree; final SHA and CI results are recorded in its GitHub PR. Parent is PR #47 head `455aa287c64eef7d94b38125617738db6806c7ea`, tree `8d976e4b13c02191c9747084565b45a42280fb28`. Master remains `e18a3997047344f39952faf5667ddad1a6ddea2a`. PR #47 remains open; this work does not merge it.

**STARTING STATE**  
Core PR #47 had 269 Python and five Node tests passing and all reported review threads resolved. Guardian's exported main is React/TanStack Start/Nitro, not the historical Capacitor archive named in its skill. Shared shopping, sample family identity and rewards were device-local; hosted accounts were not configured. Baseline Guardian tests failed in 16 places because export-only documentation was absent, auth-off template fixtures disagreed with the requested account default, and PWA helper tests picked up product metadata.

The historical CloudShell preview in the 3 October engineering handover is not proof of a permanent AWS service. This session's AWS console attempt returned Site Unavailable. Plugin discovery did not return an AWS management connector. No authenticated AWS inventory or public production endpoint could be verified.

**FILES CHANGED**  
Core: `app/decisions/`, `app/api/shared_shop.py`, API wiring/security/configuration, migration `004`, explicit service registration, regression/real-PostgreSQL tests, container source label, staging source checks and CI.  
Guardian: account/session/email controls, auth and companion-control migrations, product-to-Core contract/transport, household context and screens, shared shop and preserved optional meal browsing, Maps/location controls, server-side OpenAI adapter, device-store isolation, privacy/terms/preferences, lifecycle/provider/browser tests, non-root container and CI. The GitHub PR diffs enumerate exact paths. Existing companion art, roles, colours, games and Grok PWA/install assets remain in source.

**CONTRACT / ROUTE**  
Guardian browser calls authenticated TanStack server functions. Those derive the actor and confirmed email from a freshly checked session, then call Core using a server-held product credential. No browser receives the Core key.

| Core route | Purpose | Authority |
| --- | --- | --- |
| GET /v1/guardian/ready | Contract/schema/service readiness | Guardian service key and both shop/location scopes |
| GET/POST /v1/guardian/households | List own memberships / create an adult-managed household | Verified actor, explicit adult declaration and shopping consent |
| POST /v1/guardian/households/join | Redeem an invitation | Confirmed recipient email hash, unexpired single-use token, shopping consent |
| POST /v1/guardian/households/{id}/invites | Prepare a recipient-bound invitation | Current adult household owner |
| DELETE /v1/guardian/households/{id}/members/{user} | Revoke membership and location access | Current owner; cannot remove owner |
| GET /v1/guardian/households/{id}/shop | Shared snapshot | Current consenting member of this service/household |
| POST lines, lines/{id}/snatch, lines/delete | Change list and ledger | Current member, UUID operation receipt and atomic transaction |
| PUT shop/snatch | Enable/disable future snatches | Current owner; existing snatches remain |
| POST presets, presets/delete; PUT cadence | Shared saved items and human cadence | Current member, idempotent operation |
| GET shop/decisions; POST shop/feedback | Deterministic suggestions and human response | Current member; exact policy/evidence/expiry checks |
| GET shop/outcomes | Recorded response/usefulness counts | Current owner; not a causal purchase measurement |
| GET locations; POST location | Read permitted latest positions / change one's own sharing | Separate service location scope; current membership; adult beta for sharing; revocable lease |

**DATA SENT**  
Account email/name/password go to Better Auth on Guardian's origin; passwords are hashed by Better Auth. Resend receives recipient and time-limited confirmation/reset links. Core receives opaque session user ID, household ID, consent/role decisions, item names, operation/decision IDs, bounded timestamps and optional current coordinates. Email matching uses a SHA-256 hash, not a plain email field in Core. An email hash remains personal data and is not encryption.

OpenAI receives the selected companion's role instructions, the current message and at most six prior messages (600 characters each), only after individual adult consent. No shared household context, financial ledger, location, other person's chat, tools or Core action credential is sent to the model. Google receives ordinary Maps requests through one restricted app browser key. Optional recipe searches go to the existing public MealDB service; ingredient additions require a separate human tap.

**DATA RETURNED**  
Core returns only the selected household's members/roles, list/presets, shop points and revision; reproducible suggestion envelopes; and currently shared unexpired positions. OpenAI returns bounded reply text or an honest unavailable result. No local reply is manufactured as a provider success.

**AUTH / PERMISSION / WORKSPACE GATES**  
Confirmed personal email, minimum 12-character new password, expiring confirmation/reset links, fresh database session checks, disabled implicit account linking and reset-session revocation. Per-user device storage replaces the old shared v6 profile. Private chats and moods are excluded from persisted profiles. Household checks bind both service and actor on every operation; recipient-bound invitations do not accept a client-supplied user identity. Location and shopping scopes are separate. Child/guest companion requests and child location sharing are blocked in this beta. Role declarations are human attestations, not verified age assurance.

Rate controls use atomic database request reservations for OpenAI (proposed default: three/minute and 20/day per account), plus a per-actor Core limit. Core's limiter now fails closed at its identity capacity. The proposed staging service cap is 6,000/minute to accommodate several simultaneous households; this is not a measured capacity guarantee or an applied production setting.

**HUMAN AUTHORITY GATE**  
Typing/adding an item pays no points. Ticks remain device-local deletion selection and pay no points. A deliberate first snatch pays 30 shop points once. Deletion reverses 30 in the same transaction. Concurrent losing snatches return the winning state. Shopping suggestions never add an item without an explicit response. Corrections and useful/not-useful outcomes do not update live policy automatically. Companions cannot write calendar events, claim an action occurred or grant reward/financial/disclosure authority. Each adult independently enables their own location; a late request cannot revive a stopped lease.

**ARCHITECTURE IMPACT**  
Products use Core. Guardian owns presentation and account delivery; Core owns household membership, transactional shopping authority and native suggestion policy. This is the first Shared Shop implementation of Sector 3 and Sector 4, not completion of every KYREC planning domain. It works with all external language models disabled. Sector 4 records human responses; it does not claim demonstrated family benefit, automated training or autonomous self-modification.

Production uses PostgreSQL in both repositories. SQLite/PGLite are explicitly development-only. Builds no longer implicitly migrate a hosted database. Core migration `004` and Guardian's root migrations run as separate controlled release steps. Core migration `003` from PR #47 is included in the PostgreSQL CI migration chain.

**TESTS RUN**  
Core: full Python suite, five Node control-model tests, Python compilation, shell syntax, whitespace, focused permission/expiry/replay/concurrent-write/rollback/retention tests.  
Guardian: typecheck, complete script/app/auth/provider suites, lint, retained Vercel build, standalone Node server build, account/privacy/terms/auth/health HTTP smoke. GitHub additionally runs isolated PostgreSQL, phone/desktop browser gates for development and production output, and exact-source non-root container builds.

**PASS**  
At preparation: Core 289 Python tests passed, one PostgreSQL test skipped locally because there is no isolated local server; five Node tests passed. Guardian 252 tests passed; four missing Grok editor documentation checks and one local PostgreSQL test were explicitly skipped. Typecheck and lint passed (five warnings remain). Standalone HTTP routes returned expected 200/null/503 statuses. Production startup correctly refused missing credentials. Final CI proof and exact commit SHAs are maintained on the PRs.

The production dependency audit found a high-severity source-map-js advisory and a moderate optional fast-uri advisory. source-map-js was updated to 1.2.2, unused optional peer entries were removed by npm, and the runtime audit now reports zero vulnerabilities. Tests/typecheck/lint were rerun against that lockfile. CI requires the same audit and checks out the exact head SHA used in container source labels.

**FAIL**  
Baseline Guardian fixture/export failures were reproduced and corrected without changing PWA product metadata. New limiter-capacity regression failed before its fix and passed afterward. A transient typecheck failure after removing a prototype sharing variable was fixed. Two existing lint errors (mutable binding and empty catch) were corrected. Local Playwright browser installation failed because its download endpoint returned invalid/empty archives; browser verification is assigned to CI and must be checked there. AWS console access failed. No local Docker or PostgreSQL daemon is available. These limitations are not reported as passes.

The final auth-library review confirmed that Better Auth can swallow a signup email callback failure and return a pending, unverified account. Account/reset notices now acknowledge a request without promising a delivery. PGLite and PostgreSQL lifecycle coverage verifies that such an account gets no session and cannot sign in, and failed resend surfaces an error. Resend delivery still requires an actual provider receipt; no real recipient was contacted in this test.

**PRIVACY / SECURITY IMPACT**  
No real family data, API keys, account emails or private transcripts were used. No email was sent to a person. Service/model/email credentials remain server-side, and authenticated provider calls reject redirects. Google browser keys are deliberately public and must be referrer- and API-restricted in Google Cloud before a pilot.

Only the latest location point is stored; it is hidden after five minutes. Stopping immediately revokes the lease and removes the point. The running Core service purges expired positions every minute and at startup, plus expired invitations and 30-day suggestion/audit records. Database backups and outages require an explicit retention policy before a real-family release; expiry does not delete historical backups.

Idempotency receipts store revision metadata rather than copies of historical family snapshots. OpenAI uses Responses API with `store: false`; this does not promise zero provider abuse-monitoring retention. No clinical, legal or child-safety certification has occurred.

**GIT EVIDENCE**  
Both changes are isolated branches/PRs. Remote trees are checked against locally staged trees. No merge, live deployment, DNS/routing change, service registration, production migration, API key creation, billing change or family invitation dispatch has occurred. Local Core worktree metadata pointed to an expired previous-session directory; it was reconstructed against the exact remote PR #47 tree without replacing working files.

**RELEASE STATUS: HOLD**  
Code is prepared for review. A real-family pilot and public launch remain held pending the named operational and product checks below. A GitHub push is not a live AWS deployment.

**KNOWN OPEN ISSUES**  
1. Authenticated AWS inventory/access, current cost review, approved exact staging release, real health/source verification and restored-backup rehearsal are missing. Existing `infra/aws-staging/` is labelled synthetic-only; it is not approval to put family data there.
2. Guardian's account database, Core service registration/secret exchange, a verified sender/from address, confirmed-email delivery, restricted shared Maps key/map ID, and approved OpenAI project/model/limits still need secure live configuration. No secrets should be pasted in chat or committed.
3. Self-service account/household deletion and a reviewed full privacy/retention notice remain required before public store release. A child-specific rollout needs separate age/consent/safeguarding review.
4. Real two-device/family acceptance testing, denied/offline recovery, multi-tab location behavior, sustained pilot capacity and provider receipts remain to prove after staging.
5. Other existing app areas (driving/arrivals, billing/plan screens, budget/rewards, routines) include prototypes or device-only behavior. Their presence is not proof of live integration. Companion roles remain preserved; their chat does not turn those capabilities into executed server actions.
6. This exported SSR app has no verified current Android release build. Historical Capacitor app identity `au.kyrec.familyguardian` must not be changed without approval. An Android packaging approach, signing access and actual AAB/install proof are still needed. Google Play data-safety/deletion disclosures and policy testing must precede submission.

**ROLLBACK POINTS**  
Guardian starting main: `2a1fbbc93bc61003baad6e6ec89404a4d7e99324`. Core parent: `455aa287c64eef7d94b38125617738db6806c7ea`; protected master: `e18a3997047344f39952faf5667ddad1a6ddea2a`. Before merge, leave/close the isolated PRs. After a future rollout, disable public access and restore the approved compatible app/image pair; preserve additive database tables and retained data. Do not drop schemas as a quick rollback. No running production pair has been established in this session.

**EXACT RESUME POINT**  
Read both PR head SHAs and latest CI runs. Resolve any actual PostgreSQL/browser/container failure before considering merge. Release dependency order is PR #47, the new Core contract, then Guardian. Review the combined Core master diff; do not treat the stacked parent as merged. Resolve AWS access and secure configuration, then prepare a concrete approval card for the exact staging resources/image/cost. Only after staging evidence and a separate live approval can the 10–20-family pilot open.

**NEXT ACTION / OWNER**  
Adrian: complete CI review and then authenticated infrastructure/configuration verification, staged acceptance and rollback proof. Michael: enable the approved AWS access path and approve the fully described release/cost when ready. Product/governance owners: beta acceptance and privacy/child/store readiness.

**MICHAEL APPROVAL REQUIRED: YES**  
Routine development is authorized. A scoped approval is still required for undisclosed live infrastructure/data/routing, material spend and production OpenAI configuration. The governing Adrian skill says: “Do not treat a broad instruction such as ‘finish it,’ ‘make it work’ or ‘sort it out’ as approval for an undisclosed live action. Approval must follow a clear description of the exact action.” No approval for an unspecified live deployment is requested by this handover.
