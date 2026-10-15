# Current Core / Guardian staging checkpoint

Status: source validation in progress; hosted release HOLD.

Guardian PR #10 was repaired against companion-memory main and merged at
1dc73a236847e9a148f3d1e253423a9d16aba3e5. Exact repaired head
39f95aef08b90f72de74766497f1eb62077eacf3 passed run 38756675005:
271 tests passed, zero failed, four existing editor-only checks skipped.
Database migration, browser, build, audit and container gates passed.

The paired runners now require Core f727b65fa1317de51b81b1f765de503e72e023f8, tree
c1a3fb09a17c3f5387616f623218ef6927a8d9ff. Their unchanged authority, consent,
retry and isolation assertions must pass again against this source.
A source pin update is not a test result. Core PR #65 separately adds
PostgreSQL 18.3 validation, matching the inspected staging engine.

Run from Guardian with an exact, clean Core checkout:
```sh
export KYREC_CORE_TEST_ROOT=/absolute/path/to/core
export KYREC_CORE_TEST_PYTHON="$(command -v python)"
export GUARDIAN_PAIRED_CORE_ROOT="$KYREC_CORE_TEST_ROOT"
export GUARDIAN_PAIRED_CORE_PYTHON="$KYREC_CORE_TEST_PYTHON"
export GUARDIAN_PAIRED_CORE_COMMIT=f727b65fa1317de51b81b1f765de503e72e023f8
node --experimental-transform-types scripts/native-review-paired.mjs
node --experimental-transform-types scripts/paired-core-integration.ts
```

Use synthetic accounts and captured email only. The paired runners exercise
real local authentication and Core HTTP, not a hosted BFF or physical devices.

AWS inspection on 2026-10-15 found Core still on c07041aaccc77f93ccf7af3d659b91324810fd97,
before the later sectors, native grants and memory bridge. No Guardian ECS
service was found in the inspected account. No deployed acceptance is claimed.

Remaining gates: exact-source image publication and migration; a confirmed
Guardian staging host; synthetic account/service/workspace grants; hosted
two-session isolation and consent withdrawal; task replacement persistence;
an isolated restore drill; memory proposal/approval/recall/forget and authority
revocation. Real owner binding, private-data environment approval, Pi wiring,
notifications, verified person labels and child/product release gates remain
separate. Do not enable real memory based on source CI alone.
