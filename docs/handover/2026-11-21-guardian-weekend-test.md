# Guardian weekend integration handover

**INTEGRATION:** Core public research worker → authenticated public weekend contract → Guardian server → Scout/public weekend view.

**OBJECTIVE:** One-weekend public family-choice test for 21–22 November 2026, Perth-wide browsing, optional free-only choice and no default budget cap.

**PRODUCT REPOSITORY:** KYRECAi/kyrec-family-guardian.

**CORE REPOSITORY:** KYRECAi/kyrec-core.

**PRODUCT BRANCH / COMMIT:** feature/guardian-weekend-events, starting 2071dbc7e685cc522051fd04940a4297255ea24d. Final implementation commit and PR recorded in completion.

**CORE BRANCH / COMMIT:** feature/guardian-weekend-events, starting 8ea5afaef6d95e11b896a4193055d7e072dec1b7. Final implementation commit and PR recorded in completion.

**STARTING STATE:** Source inventory/Visit Perth adapter already existed, but no Guardian dated-events contract or UI. Scout showed static attraction ideas. No research-worker credentials or live deployment access were configured in the environment.

**FILES CHANGED:** Core main/router, public weekend projection, tests, contract/evidence/handover. Guardian weekend contract/server function/server transport/component/public route, exact public path guard, Scout inclusion, generated routes, test script and optional browser readiness selector. No other business/repository changed.

**CONTRACT / ROUTE:** guardian-weekend-events-v1; service-authenticated GET /v1/guardian/events/weekend with Saturday start and explicit free-only query. Guardian public /weekend, plus the signed-in Scout component. No new private-data route.

**DATA SENT:** Saturday date and free-only boolean to Core. Research worker sends only publicly extracted source facts. No family actor, household, ages, private preferences, budget, conversation or real login is sent to source publishers.

**DATA RETURNED:** Bounded fresh public event cards, source/date/venue/price-check metadata and explicit no-action/suitability limits. No service secrets, raw pages or private family ledger.

**AUTH / PERMISSION / WORKSPACE GATES:** Registered Guardian service, outing domain, source policy and validated public lane; no workspace overrides. Browser gets no Core key. Same-site/no-store Guardian boundary and strict response/freshness checks. Exact public-page matching skips private stores only for public information; existing verified-account/household gates remain.

**HUMAN AUTHORITY GATE:** Parent chooses organiser link and confirms suitability/cost/session. No booking, messages, planner mutation, permission expansion or production activation.

**ARCHITECTURE IMPACT:** Public-only read model and product presentation. Uses current collector/research HTTP intake, existing signal store and source policy. No database migration, hosted scheduler, AWS resource or live key change.

**TESTS RUN:** Full Core control-screen gate and new API/projection tests; Guardian full suite plus six weekend tests, TypeScript and production build; existing browser smoke with feature-ready selector; actual browser filter tests and dev/built screenshots; real local HTTP worker and HTTPS production-build transport.

**PASS:** Core: 577 tests, 552 passed/25 PostgreSQL-dependent skips; six Node tests passed. Guardian: 282 tests passed, TypeScript/build passed. Forty smoke-verdict tests passed. Local worker confirmed 20 intake records; 19 weekend listings and eight source-listed free. Desktop/mobile production-build comparison has no divergence and no uncaught/console errors after verified proxy transport configuration. Client asset check found no service-key identifiers.

**FAIL:** Initial npm install failed on unwritable default cache; fixed using a task cache. Initial test syntax typo fixed. Standard browser check hit the private account gate as expected; no account was fabricated, and a public-only route was added. Browser external assets initially failed proxy CA trust; verified fetch transport retained TLS verification. Test CA bundle initially lacked a PEM separator and was repaired. Built-preview restart helper failed in this runtime; a directly managed npm preview on its expected port was verified. Early smoke snapshots raced asynchronous feed loading; added optional readiness selector without weakening assertions. The pre-existing missing custom share-card brand note remains; no branding overhaul was undertaken. No outstanding functional failure in final checks.

**PRIVACY / SECURITY IMPACT:** Public browsing reads no family workspace. Demo research is withheld. Missing/stale/unknown data stays unavailable/unknown. Synthetic local service keys and local certificate keys remain outside source and were not printed. No real account credentials, family data, email, private disclosure or paid model used.

**GIT EVIDENCE:** Both feature branches are committed/pushed for review; exact final refs/PRs in completion. Core branch includes earlier source/program/Pilot history; coordinate review order. No merge to master or deployment.

**RELEASE STATUS:** CONDITIONAL for local one-weekend review. HOLD for live family rollout until service binding, deployment approval, source operations, scheduler and runtime acceptance.

**KNOWN OPEN ISSUES:** First Visit Perth batch only, not full Perth website coverage; other source adapters remain candidates. Source labels do not prove child suitability, sessions or family total. Worker ran locally, not a durable hosted schedule. No real family-account acceptance. Existing app share-card note and unavailable .grok skill/tool references are recorded rather than claimed complete; installed Playwright and existing source guidance were used for checks.

**ROLLBACK POINTS:** Core 8ea5afaef6d95e11b896a4193055d7e072dec1b7; Guardian 2071dbc7e685cc522051fd04940a4297255ea24d. Revert isolated feature commits while preserving observation/audit history. No live data rollback required.

**EXACT RESUME POINT:** Review contract/evidence and local family snapshot. With legitimate service configuration, Guardian /weekend reads Core's public feed; signed-in Scout includes it too. Core worker command remains documented in source ingestion contract. Never substitute synthetic test keys for a production service registration.

**NEXT ACTION / OWNER:** Michael reviews the weekend choices; engineering reviews both exact branches and prepares a disclosed live activation only after environment/service prerequisites are verified.

**MICHAEL APPROVAL REQUIRED:** NO for completed local work. YES before a concrete production deployment or live service configuration, under the existing Adrian release gate. No such approval is requested on an unspecified action.

Verified Core implementation commit: `ad27282` (full remote reference recorded in the Core PR). The HTML evidence file is a frozen public-source review snapshot, not a live fallback feed.

Final reconciliation: preserved Guardian main `b2fc7ef4b0b309284a20a5212a79413d574df69e`, including dependency, standalone-build and broker OAuth repairs. Re-ran all 282 Guardian tests, typecheck and build successfully. Latest built preview used port 8082 because the older 8081 listener could not be attributed safely; it was left untouched. Final desktop/mobile dev and built smoke reports match, with no errors or horizontal overflow.
