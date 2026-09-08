---
name: kyrec-family-guardian-app
description: Build, audit, repair, test and prepare the KYREC Family Guardian app for release in Codex while preserving approved product scope, companion roles, privacy, human control, evidence and existing working code.
---

# KYREC Family Guardian — Codex Skill

## Skill control
- Version: 1.2
- Classification: INTERNAL CONTROLLED

## Authority
Michael Willard is Founder and final authority for major product scope, spending, risk acceptance and release.

Jax owns the product problem, user value, MVP boundaries and product acceptance.

Adrian owns architecture, code quality, security, APIs, KYREC Core integration, testing, release engineering, rollback and recovery.

## Product identity
The product is **KYREC Family Guardian**.

Family Guardian companions:
- Stan
- Nova
- Pulse
- Moneybags
- Scout

**Biko is not a Family Guardian companion.** Biko belongs to **KYREC Business by Biko**, spelled **B-I-K-O**.

## Company rules
- Family first.
- Useful technology.
- Human control.
- Honest progress.
- Preserve proof before changing working or historical material.
- Never invent test results, commits, build status, customer evidence, approvals, security proof or release readiness.
- Public brand stays alive; technical internals stay private.
- Pattern recognition may recommend; it does not become authority.
- Companions receive only permitted context.
- Consequential actions require stronger human approval.
- Raw private conversations are not durable trusted memory by default.

## HARD CHARACTER-DIRECTION LOCK — PULSE & MONEYBAGS
This is a permanent Founder rule unless Michael explicitly changes it later.

- **Pulse's approved direction, Family Guardian role, personality, visual identity and purpose must not be changed, replaced, narrowed, repositioned or redefined.**
- **Moneybags' approved direction, Family Guardian role, personality, visual identity and purpose must not be changed, replaced, narrowed, repositioned or redefined.**
- New games, children's experiences, education, media, YouTube, animation, stories, scenes, features and commercial opportunities may only **add to** the approved Pulse and Moneybags directions.
- New popularity or audience evidence can justify extensions, but never becomes authority to rewrite either character's existing lock.
- If new work conflicts with an existing lock, preserve the existing lock and mark the new proposal **HOLD — conflicts with character lock**.

**Control rule:** Preserve the character. Preserve the role. Add new experiences around it. Never rewrite the lock.

## Use this skill when
Use for auditing Family Guardian source, fixing bugs, changing screens/navigation, companion features, Family Points, Moneybags Bonus, journeys/maps/routines/plans/safe zones, permissions and family-role access, KYREC Core/API integration, Android/iOS packaging, release QA, Git handovers and exact resume points.

## Inspect before changing
Before editing:
1. Find repository root.
2. Inspect README, manifests, app config and main entry points.
3. Run Git status and record starting branch/commit where available.
4. Identify framework, versions and build method.
5. Map current screens and working flows.
6. Record what is broken, mocked, missing or only visual.
7. Save a checkpoint before material edits.

Never replace a working app merely because a rewrite is cleaner.

## Existing supplied source baseline
The supplied `nova-family-guardian.zip` is a Capacitor project.

Known baseline:
- package: `nova-family-guardian`
- Capacitor core/android: `^6.1.2`
- app ID: `au.kyrec.familyguardian`
- configured app name in source: `NOVA`
- web directory: `www`
- main implementation: `www/index.html`
- current implementation is largely self-contained HTML/CSS/JavaScript
- Android is generated through Capacitor

Treat historical `NOVA` naming inside the source as an existing-source fact, not current naming authority. Current product name is **KYREC Family Guardian**.

Do not change app ID, signing identity, bundle/package identity or store identity without explicit approval.

## Core boundary
When KYREC Core is involved:

`Family Guardian client -> approved Family Guardian server/API route -> KYREC Core`

Never put privileged API keys in the client, bypass Core permissions, use unrelated product routes, expose internal Core architecture publicly, or allow one companion to read all family context by default.

## Companion boundaries
- **Stan:** safety-minded guidance, permissions, trusted observations and human-control support.
- **Nova:** warm family support within approved least-privilege contexts.
- **Pulse:** Family Flow, routines, planning, coordination and pressure-pattern support.
- **Moneybags:** Family Money patterns, Family Points and Bonus experiences. Recommendation is not points authority. Eligibility is not unlock authority. Adult approval remains required where designed.
- **Scout:** journeys, travel, arrivals, public-event intelligence and mobility support.

Shared intelligence belongs in Core. Each companion receives only the permitted output for its role.

## Build in controlled steps
For each coherent change:
1. Save Git checkpoint or verified backup.
2. Make one understandable change.
3. Run available syntax/static checks.
4. Run automated tests where available.
5. Run/build the app.
6. Test the changed flow.
7. Re-test affected old flows.
8. Record failures and repairs.
9. Commit only when state is understood.

Do not stack new features on an unexplained broken state.

## Privacy and family safety gate
For personal/family data identify: data collected, purpose, who can see it, permissions, role limits, retention/deletion, third-party recipients, revocation, misuse scenario and human override.

Location, child accounts, multi-household access, emotional signals and financial patterns require stricter controls.

## Character and brand integrity
Use approved KYREC character references where actual companion art is required. Do not substitute approximate versions of Stan, Nova, Pulse, Moneybags or Scout when approved artwork exists. Placeholder graphics are implementation placeholders, not character authority.

## Testing and proof
For the current Capacitor/web implementation verify, where relevant:
- JavaScript loads without runtime errors
- navigation works
- controls update state correctly
- small-screen layout works
- Capacitor sync succeeds
- Android build succeeds
- test APK installs where environment permits
- permissions behave correctly
- no-network path is checked
- secrets are absent from client code
- package/app identity remains correct
- old features still work

If automated tests do not exist, say so. Record PASS and FAIL evidence.

## Release gate
Use READY, CONDITIONAL or HOLD. Never use READY merely because the app launches.

## Codex task close format
**FAMILY GUARDIAN TASK**  
**STARTING BRANCH / COMMIT**  
**STARTING STATE**  
**REQUESTED RESULT**  
**FILES CHANGED**  
**WHAT NOW WORKS**  
**TESTS RUN**  
**PASS**  
**FAIL**  
**PRIVACY / SECURITY IMPACT**  
**KNOWN OPEN ISSUES**  
**ENDING COMMIT**  
**RELEASE STATUS: READY / CONDITIONAL / HOLD**  
**EXACT RESUME POINT**  
**NEXT ACTION**  
**MICHAEL APPROVAL REQUIRED: YES / NO**

## Control line
> Prove the problem. Preserve what works. Build Family Guardian one controlled step at a time. Test the real behaviour. Never call it finished because the screen looks finished.
