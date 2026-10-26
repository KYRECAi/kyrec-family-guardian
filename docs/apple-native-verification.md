# Minimal Apple verification gate

No paid service, Apple enrollment, credential setup or CI execution authorised by this checklist.

## Existing infrastructure inspected read-only

The existing `Guardian installed app` GitHub workflow uses `macos-latest`, a 25-minute iOS job timeout and `CODE_SIGNING_ALLOWED=NO` to compile an unsigned simulator app. It has push trigger only for `codex/guardian-installed-app`, plus eligible PR events targeting main; no workflow_dispatch. It does not automatically run for the current integration branch.

Prior PR22 commit `8619919f234ae8ce9f49d49d3beca6e873e27e55` has successful iOS and Android jobs in https://github.com/KYRECAi/kyrec-family-guardian/actions/runs/40213763591. That run predates the Keychain plugin and is NOT evidence that current Swift compiles.

A new current-head run requires a separately authorised workflow-trigger change for this branch (or permitted PR publication, still denied/pending). Re-running the old job only retests old code. Adding the integration branch to the existing workflow's push trigger would run the macOS and Ubuntu jobs, each capped at 25 minutes, using the repository's GitHub Actions quota and potentially billed minutes depending on its plan. No exact cost/remaining quota was available. No such change or run was made. An owner-provided existing Mac can instead perform local unsigned compilation without new CI execution.

## Unsigned Mac/simulator checks

1. Checkout the exact reviewed Guardian commit and pinned Core baseline. Run npm ci, type check, tests and build:mobile; mobile:prepare -- ios must discover GuardianSessionPlugin and resolve the local Swift product.
2. Compile using the workflow's existing xcodebuild command and record Xcode version, exact SHA and full result. Do not treat project generation as compilation.
3. In an isolated synthetic target, exercise the real plugin: Keychain save/read/update/delete; locked device denial; no iCloud sync or device-backup migration; failure to write/delete; process termination during refresh/logout; restart and reinstall behavior. Enable Main Thread Checker for WebKit document-origin checks.
4. Test actual CapacitorHttp against an isolated HTTPS endpoint: no cookie fallback, redirect/TLS rejection, timeout/offline state, malformed reply, expiry/revocation, account changes. Confirm tokens never enter browser storage or logs and old household data disappears on identity change.
5. Repeat remote-script/iframe/base attacks in actual WKWebView, including raw bridge messages from any child frame. Verify CSP enforcement on capacitor scheme and navigation away from local origin makes Keychain calls fail.
6. Verify two adult accounts and child permissions against intended Core using synthetic identities, including separate-household denial, owner-only access edits, and independent logout. No live mail/provider calls.

## Owner inputs before physical iPhone/iPad installation

- Approved Apple distribution route: owner-controlled development signing on existing devices, or separately approved TestFlight distribution.
- Existing Apple team/provisioning authority and confirmed bundle ownership `au.kyrec.familyguardian`; do not request passwords or private keys in chat.
- Designated test iPhone/iPad and OS versions; device identifiers only through the approved provisioning process if needed.
- Approved non-live Guardian endpoint with trusted client-address rules and pinned Core version, after security gates pass.

Only then record signed install/restart/upgrade/background/offline/logout acceptance on both physical device types. Simulator compilation alone is insufficient. Nothing here authorises live-family provisioning or release.

## Smaller proposed one-run verification (not triggered)

Rather than enabling both existing jobs on every integration-branch push, propose a dedicated verification branch `verify/guardian-native-ios-once` carrying one narrowly scoped workflow. It checks out the exact reviewed integration commit, runs only the existing unsigned iOS preparation/compile steps on standard `macos-latest`, and has one job with `timeout-minutes: 25`. No matrix, automatic retries, Android job, artifact upload or dependency cache. Permissions: contents read; checkout credential persistence off. Only the single approved branch push triggers it; no main merge or PR publication. No further pushes/reruns without approval. A concrete YAML draft is supplied in the task handoff, not installed under .github/workflows.

Official pricing checked 27 October 2026 Perth: standard macOS is USD 0.062/minute, minutes rounded up per job. 25 minutes equals USD 1.55 nominal runner compute before any included quota/tax. Proposed approval ceiling: USD 2 for this one attempt, no retries. This is an operational limit/estimate, not a configured GitHub account billing cap; none was changed. If a guaranteed invoice cap is required, verify account budget enforcement first. No artifact/cache storage is requested. Repository plan, privacy/included minutes balance and account-specific billing terms were not available, so free execution is not assumed.

Sources: https://docs.github.com/en/billing/reference/actions-runner-pricing and https://docs.github.com/en/billing/concepts/product-billing/github-actions.

Smallest owner inputs for a later physical trial: (1) whether an existing Apple team/development-signing route is available, or TestFlight is preferred; (2) which test iPhone/iPad and OS versions. Do not send passwords/private keys in chat. TestFlight/enrollment costs and real accounts are not authorised by unsigned compilation approval.
