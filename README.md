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

The current Core staging deployment is commit
`117032f8cd174f12916f3e56abdfb1b8ea87820e`, tree
`3649acab91b772a9edf60a50e9abc173b213825f` (PR #67). AWS activation
completed on 16 October 2026 (Perth), with companion memory enabled and a
valid deny-all authority registry. The paired runners target this exact source.
Contracts remain `guardian-shared-household-v1` and `guardian-native-review-v1`;
Shared Shop migration `005` and native access migration `006` are applied.
Core activation does not establish a deployed Guardian BFF, account/service
bindings, retention consent, or real provider configuration.
See the [Core activation record](https://github.com/KYRECAi/kyrec-core/pull/68).
Set `KYREC_CORE_EXPECTED_COMMIT` to the exact deployed, reviewed Core commit;
readiness rejects a different source.

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run test:browser`.
To run the synthetic paired transport/schema check, supply an exact Core checkout
and its Python with Core test dependencies installed:

```bash
GUARDIAN_PAIRED_CORE_ROOT=/path/to/kyrec-core \
GUARDIAN_PAIRED_CORE_PYTHON=/path/to/core-venv/bin/python \
GUARDIAN_PAIRED_CORE_COMMIT=117032f8cd174f12916f3e56abdfb1b8ea87820e \
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
