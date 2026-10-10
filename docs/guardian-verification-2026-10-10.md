# Guardian / merged Core verification — 10 October 2026

**INTEGRATION**  
Guardian PR #9 review and regression repair against merged Core #48. This is source and synthetic integration verification; real-family deployment remains HOLD.

**PRODUCT REPOSITORY**  
`KYRECAi/kyrec-family-guardian`, PR #9.

**CORE REPOSITORY**  
`KYRECAi/kyrec-core`, merged PR #48.

**PRODUCT BRANCH / COMMIT**  
`feature/family-beta-integration`; starting exact head `5e8ffe3443ad845d514953d9f16bafd17d06695c`, tree `b5ff762c18b0afe12d61e9def855f8d5d2ae13a0`. Final source/CI head is recorded on PR #9; this record is part of that reviewed tree.

**CORE BRANCH / COMMIT**  
Master `ce703f7b7b2e6a416010ed4a6d8467f144f4282e`, tree `ca0d92803a9890f07d0eb30e66340935ee782bbd`. The clean local checkout used for paired tests is prior head `689cec7e97f4814f6f92b404d655fb9837a4d613` with the identical merged tree. The paired runner checks this tree and rejects tracked app/migration changes. Shared Shop is migration `005`; migrations `001`–`004` remain intact. Set the hosted expected Core source to the exact reviewed/deployed commit, never the obsolete original PR head.

**STARTING STATE**  
Guardian #9 is draft/unmerged; main remains `2a1fbbc93bc61003baad6e6ec89404a4d7e99324`. Its original CI #3 passed. No unresolved GitHub review threads were present. All 260 starting source/assets were checked against GitHub blob hashes before edits. Export is React/TanStack Start/Nitro, not an Android/Capacitor build.

**REQUESTED RESULT**  
Verify confirmed accounts, Core delegation, shared shopping, locations and companions; fix confirmed failures and prepare the next staging acceptance gate without claiming live readiness.

**FILES CHANGED**  
Shopping mutation receipt helper/tests, household context, shared shopping UI, extracted unchanged response contract, isolated paired Core fixture/runner, test command, README/config comments and current/historical handover notices. The PR diff is the complete changed-path list.

**WHAT NOW WORKS**  
An uncertain shopping action keeps the same operation ID when the user retries it. A lost add response followed by another member deleting the item no longer resurrects that item. Once a retry is confirmed, a later deliberate add gets a new ID. Failed actions with different payloads/households keep separate receipts; account instances do not share them; at most 64 uncertain operations are retained. Receipts remain in account-provider memory across temporary snapshot failures, with no automatic retry. Reloading/leaving that provider ends this memory; this does not promise durable offline editing or cross-restart retry recovery.

Late mutation snapshots are rejected after the household/account epoch changes. The old “15 family points” line label is replaced by “Shared shopping item”; Core still awards only the first deliberate snatch (30), and deletion reverses it. README now correctly describes the shared server-configured Maps key rather than asking every family member to enter one.

**CONTRACT / ROUTE**  
`guardian-shared-household-v1`, `/v1/guardian/*`; response `shared-shop-v1`, cadence policy `shared-shop-cadence-v1`. The response schema was moved unchanged to a dependency-light module and remains re-exported for existing consumers. No Core API, migration, authority or policy was changed in this repair.

**DATA SENT**  
Fresh confirmed account ID, recipient email hash for joining, bounded household shopping requests and per-action UUID; independently consented current adult coordinates. OpenAI adapter sends only the person's supplied prompt and up to six bounded recent messages after adult consent; no household data, tools or Core credential. Authentication email tests capture synthetic receipts and send nothing.

**DATA RETURNED**  
Current permitted household snapshots/decisions, latest unexpired shared locations and bounded provider answers or truthful failures. Replayed shopping writes return current membership-checked state, not a historical snapshot.

**AUTH / PERMISSION / WORKSPACE GATES**  
Fresh database-backed confirmed sessions; private server-held Core service credentials; service/product/domain, current household membership and recipient-bound single-use invitation checks. Reviewed auth code disables session cookie caching and account linking; password reset revokes prior sessions. Wrong product/household, replay, expiry and restricted PostgreSQL roles are covered by merged Core gates. Child location/companion access remains blocked; this is not child rollout approval.

**HUMAN AUTHORITY GATE**  
No automatic shopping retries, purchases, notifications, points grants, model training or companion actions. Human shopping changes alone use Core's transactional authority. Each adult controls their location; a stopped lease cannot be revived by a delayed publish.

**TESTS RUN**  
`npm test`, typecheck, lint, full dependency audit, Vercel and standalone Node builds, whitespace; three retry regressions; synthetic paired transport/schema runner against the exact merged Core source. Fresh GitHub CI on the final head is the authoritative browser/PostgreSQL/container release evidence, recorded on PR #9.

**PASS**  
Local unit/auth/provider suites: 255 passed, five explicit skips (four absent Grok editor-document fixtures and one unavailable local PostgreSQL server), zero failures. Typecheck passed; lint has zero errors and the same five pre-existing warnings. Dependency audit found zero vulnerabilities. Both output builds passed. Three retry regressions passed; the first two were recorded failing against the extracted original new-ID-per-attempt behavior before the repair.

Paired runner PASS: two separate confirmed Better Auth accounts; unconfirmed sign-in denied; outsider read and wrong invitation recipient denied; successful joining; real Core lost-reply/interleaved-delete/retry behavior; simultaneous two-user snatch with one winner/30 points; deletion reversal to zero; location lease revocation/delayed publish denial; six-minute expiry and purge; membership removal denial and fresh-session sign-out denial. Uses temporary SQLite/PGLite and the real Guardian transport/schema, with a synthetic Core service authenticator. It is not a hosted PostgreSQL or full TanStack HTTP/browser integration test.

**FAIL**  
Initial local suite stopped because the source reconstruction had not yet restored binary assets; after restoring and hash-checking all original assets, the complete suite passed. Local browser launch lacked Chromium; installation returned invalid/truncated archives. Local browser verification is not claimed. GitHub CI installs an isolated Chromium and runs phone/desktop gates on dev and built output. No local Docker/PostgreSQL proof is claimed.

**PRIVACY / SECURITY IMPACT**  
Operation receipts are bounded, account-scoped memory and contain no credential or chat. No extra data is sent to Core or providers. The synthetic fixture binds loopback and uses temporary data only; its clock-advance endpoint is never included in the app server. Role, consent, lease and paid-provider boundaries are preserved. This engineering review makes no legal compliance claim.

**KNOWN OPEN ISSUES**  
Real sender/domain setup, confirmation/reset delivery, restricted Maps configuration, explicitly selected OpenAI project/model/limits and real provider acceptance remain unverified. Staging end-to-end two-device acceptance, production PostgreSQL migration/service registration, backups/restore, retention/account deletion and release approval remain gates for a real-family pilot. An actual signed Android AAB/Google Play test track and child-specific rollout checks remain open. Drive/alerts/subscriptions/budget/routines include device-only/prototype flows and are not certified live integrations. Full-page reload recovery for uncertain shopping mutations is not implemented.

**ROLLBACK POINTS**  
Guardian prior PR head `5e8ffe3443ad845d514953d9f16bafd17d06695c` (its older Core dependency must not be reused blindly). Core master remains `ce703f7`; no Core changes, database migration or deployment were made in this task. Any later deployment needs its own concrete rollback plan.

**ENDING COMMIT**  
Final exact uploaded head and CI are recorded on PR #9. No Guardian merge or deployment is included in this task.

**RELEASE STATUS: CONDITIONAL / HOLD**  
Source review is conditional on final exact-head CI. Live families and Google Play remain HOLD until the open gates above are proved.

**EXACT RESUME POINT**  
Guardian #9 final head and CI result, plus this source record; paired test command is in README. Start staged paired HTTP/browser acceptance only after checking the actual deployed Core/source/configuration rather than assuming a merged repository is live.

**NEXT ACTION / OWNER**  
Adrian: complete exact-head GitHub gate and review; prepare a concrete staging environment/configuration change. Michael and Kelly: subsequent two-device family acceptance once that staging environment exists and is verified.

**MICHAEL APPROVAL REQUIRED: NO for authorized review/fixes/PR update; YES for a separately scoped live release or new paid resources.**  
No email dispatch, invitation dispatch, API-key creation, paid provider call, live migration, deployment or merge was performed.
