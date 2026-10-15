# Current Core / Guardian staging checkpoint

Status: Core staging activated; Guardian source validation passed. Hosted family release HOLD.

Guardian PR #10 was repaired against companion-memory main and merged at
1dc73a236847e9a148f3d1e253423a9d16aba3e5. Exact repaired head
39f95aef08b90f72de74766497f1eb62077eacf3 passed run 38756675005:
271 tests passed, zero failed, four existing editor-only checks skipped.
Database migration, browser, build, audit and container gates passed.

The paired runners now require Core 117032f8cd174f12916f3e56abdfb1b8ea87820e, tree
3649acab91b772a9edf60a50e9abc173b213825f. The unchanged authority, consent,
retry and isolation assertions passed in paired run
[38787441781](https://github.com/KYRECAi/kyrec-core/actions/runs/38787441781),
against Guardian head 635a27c03e8096bfa9351122ca5767af150a32a0.
Guardian's full beta gate 38787402128 also passed. This runbook correction changes
documentation only; rerun exact-head gates after it. PostgreSQL 18.3 validation
passed in the Core release gate, matching the staging engine.

Run from Guardian with an exact, clean Core checkout:
```sh
export KYREC_CORE_TEST_ROOT=/absolute/path/to/core
export KYREC_CORE_TEST_PYTHON="$(command -v python)"
export GUARDIAN_PAIRED_CORE_ROOT="$KYREC_CORE_TEST_ROOT"
export GUARDIAN_PAIRED_CORE_PYTHON="$KYREC_CORE_TEST_PYTHON"
export GUARDIAN_PAIRED_CORE_COMMIT=117032f8cd174f12916f3e56abdfb1b8ea87820e
node --experimental-transform-types scripts/native-review-paired.mjs
node --experimental-transform-types scripts/paired-core-integration.ts
```

Use synthetic accounts and captured email only. The paired runners exercise
real local authentication and Core HTTP, not a hosted BFF or physical devices.

Core staging activation completed on 2026-10-15 at 18:35:46 UTC
(16 October in Australia). Migration exited 0; CloudFormation completed; ECS
has one healthy task at runtime revision 2, and the previous c07041a task stopped.
The public health route reports exact source 117032f; live and ready return 200.
Companion memory is enabled with a valid empty deny-all registry; anonymous
memory routes return 401. No family identity or consent bindings were invented.
See [the activation evidence](https://github.com/KYRECAi/kyrec-core/pull/68).
This does not establish a hosted Guardian BFF or authenticated memory acceptance.

Remaining gates: a confirmed Guardian staging host; synthetic account/service/workspace grants; hosted
two-session isolation and consent withdrawal; task replacement persistence;
an isolated restore drill; memory proposal/approval/recall/forget and authority
revocation. Real owner binding, private-data environment approval, Pi wiring,
notifications, verified person labels and child/product release gates remain
separate. Do not enable real memory based on source CI alone.
