---
name: kyrec-app-builder
description: Build KYREC mobile apps and major app features from a proven problem through controlled implementation, testing, Core/API integration, privacy review and release readiness.
---

# KYREC App Builder — Codex Skill

## Skill control
- Version: 1.1
- Classification: INTERNAL CONTROLLED

## Authority
Michael Willard is Founder and final authority for major product scope, spending, risk acceptance and release.

Jax owns product problem, user value, MVP boundaries and acceptance.

Adrian owns architecture, code quality, security, QA, release and engineering delivery.

## Skill set
- Problem-to-product translation
- User-flow and screen planning
- MVP definition
- Mobile app architecture and implementation
- API and KYREC Core integration
- Authentication and permissions
- State and data modelling
- Error and offline-state design
- Accessibility and mobile usability
- Automated and manual testing
- Security and privacy checks
- Git/GitHub source control
- Build and release preparation
- App Store / Google Play readiness
- Technical handovers and exact resume points

## Company rules
- Family first. Useful technology. Human control. Honest progress.
- Never invent capability, test results, customer evidence, approvals, metrics or technical proof.
- Preserve evidence before changing or replacing existing work.
- Public brand stays alive. Technical internals stay private.
- Historical records remain preserved and are not silently rewritten.

## Use this skill when
Use for a new KYREC mobile app, major app feature, app rebuild, prototype moving toward production, or an existing app that needs to be audited and completed.

## 1. Prove the job
Before coding define:
- who the user is
- the real problem
- evidence the problem matters
- what Version 1 must do
- what is explicitly out of scope

Do not start a new standalone app if the function belongs inside an approved KYREC product.

## 2. Audit before rebuilding
If an app already exists:
- inspect current source and working build first
- record what works, what is broken and what is missing
- preserve approved artwork, flows, data structures and evidence
- do not rewrite the whole app merely because a cleaner implementation is possible

## 3. Define the MVP
Create:
- one-sentence product job
- primary user journey
- required screens
- required data
- permissions
- Core/API dependencies
- error states
- definition of done
- no-build list

Keep Version 1 as small as possible while still genuinely useful.

## 4. Plan the technical build
Before changing code state:
- current framework/version
- app structure
- files/components expected to change
- packages required and why
- backend/API dependencies
- data storage approach
- security/privacy implications
- test plan
- rollback point

Use the framework already established by the project unless an architectural change is explicitly justified and approved.

## 5. Build in controlled steps
1. Save a Git checkpoint or verified backup.
2. Make one coherent change.
3. Format/analyse code.
4. Run relevant tests.
5. Run the app.
6. Verify existing functions still work.
7. Record the result.
8. Commit only when the state is understood.

Do not pile new features onto a broken build.

## 6. KYREC Core connection
Where Core is involved:
- client -> approved server/API route -> KYREC Core
- never expose privileged API keys in the app
- send only context required for the feature
- enforce workspace, role and permission boundaries
- pattern recognition may recommend; it does not become authority
- consequential actions require explicit human approval

## 7. Privacy and safety gate
Before handling personal information check:
- why data is required
- minimum data needed
- consent and revocation
- role-based access
- retention and deletion
- third-party data flows
- child/family implications
- location/background access
- misuse scenarios
- human override

Raw private conversations are not durable trusted memory by default.

## 8. UX quality gate
Important flows must cover loading, empty state, invalid input, permission denied, no-network where relevant, cancel/back, consequential-action confirmation, readable text, accessible controls and real-device testing.

## 9. Test before claiming done
Run the framework-appropriate static checks, automated tests, real-device or simulator/emulator tests, navigation, authentication, permissions, API failure, no-network, invalid input, account/session boundaries, deletion/cancellation where relevant and release build.

Record failed tests as well as passing tests.

## 10. Release readiness
Do not call the app release-ready until product acceptance passes, critical flows work, privacy/permissions match actual behaviour, secrets are absent, metadata is truthful, support works, policies are present where relevant, analytics are approved, crash/error handling is considered, rollback is known and Michael has approved the material release gate.

## Standard output
**APP / FEATURE**  
**OWNER**  
**STARTING STATE**  
**USER PROBLEM**  
**MVP**  
**NO-BUILD LIST**  
**SCREENS / FLOWS**  
**ARCHITECTURE**  
**CORE / API DEPENDENCIES**  
**FILES CHANGED**  
**PRIVACY / SECURITY**  
**TESTS RUN**  
**TESTS PASSED**  
**TESTS FAILED**  
**BUGS / REPAIRS**  
**GIT COMMIT**  
**RELEASE STATUS: READY / CONDITIONAL / HOLD**  
**EXACT RESUME POINT**  
**NEXT ACTION / OWNER**  
**MICHAEL APPROVAL REQUIRED: YES / NO**

## Builder rule
> Prove the problem. Preserve what works. Build one controlled step at a time. Test the real app. Never call it done because the code merely runs.
