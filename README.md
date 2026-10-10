# KYREC Family Guardian

The app in this repository is the current Family Guardian build: the home page, companions, shop list, map, and settings.

Install and run:

```bash
npm install
npm run dev
```

Hosted family accounts require the server configuration listed in `.env.example`.
Google Maps uses one app browser key and map ID configured on the server; restrict
that key to the deployed website referrers and Maps JavaScript API. OpenAI and
Core credentials stay on the server. Individual family members do not enter keys.

This native-review integration is verified against `KYRECAi/kyrec-core` PR #59
commit `499eceb1213fec6f601ce77b262f2d9abe54dc84`, tree
`c306f07e47551fc99969fe4fc1cac50821031c9d`. It includes the dependent Core
PRs #56–58, Shared Shop migration `005` and native access migration `006` after
unchanged migrations `001`–`004`. Contracts remain
`guardian-shared-household-v1` and `guardian-native-review-v1`.
Core master remains `ce703f7b7b2e6a416010ed4a6d8467f144f4282e`; the native
dependency is still a draft, and this check does not deploy or enable it.
Set `KYREC_CORE_EXPECTED_COMMIT` to the exact deployed, reviewed Core commit;
readiness rejects a different source.

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run test:browser`.
To run the synthetic paired transport/schema check, supply an exact Core checkout
and its Python with Core test dependencies installed:

```bash
GUARDIAN_PAIRED_CORE_ROOT=/path/to/kyrec-core \
GUARDIAN_PAIRED_CORE_PYTHON=/path/to/core-venv/bin/python \
GUARDIAN_PAIRED_CORE_COMMIT=499eceb1213fec6f601ce77b262f2d9abe54dc84 \
node --experimental-transform-types scripts/paired-core-integration.ts

KYREC_CORE_TEST_ROOT=/path/to/kyrec-core \
KYREC_CORE_TEST_PYTHON=/path/to/core-venv/bin/python \
node --experimental-transform-types scripts/native-review-paired.mjs
```

The paired check binds to loopback, creates temporary SQLite/PGLite databases,
captures synthetic email receipts and cleans up its Core fixture. It does not
prove hosted PostgreSQL, real email delivery, Google/OpenAI credentials or
two-device staging acceptance. Both runners require the pinned Core source tree.
See `docs/guardian-native-integration-2026-10-10.md` for the current integration
checkpoint; `docs/guardian-verification-2026-10-10.md` preserves the earlier
Shared Shop evidence. Live family use remains HOLD.
