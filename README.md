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

The reviewed Core dependency is merged `KYRECAi/kyrec-core` master commit
`ce703f7b7b2e6a416010ed4a6d8467f144f4282e`, contract
`guardian-shared-household-v1`, with Shared Shop migration `005` after Core
migrations `001`–`004`. Set `KYREC_CORE_EXPECTED_COMMIT` to the exact deployed,
reviewed Core commit; readiness rejects a different source.

Run `npm test`, `npm run typecheck`, `npm run lint` and `npm run test:browser`.
To run the synthetic paired transport/schema check, supply an exact Core checkout
and its Python with Core test dependencies installed:

```bash
GUARDIAN_PAIRED_CORE_ROOT=/path/to/kyrec-core \
GUARDIAN_PAIRED_CORE_PYTHON=/path/to/core-venv/bin/python \
GUARDIAN_PAIRED_CORE_COMMIT=ce703f7b7b2e6a416010ed4a6d8467f144f4282e \
node --experimental-transform-types scripts/paired-core-integration.ts
```

The paired check binds to loopback, creates temporary SQLite/PGLite databases,
captures synthetic email receipts and cleans up its Core fixture. It does not
prove hosted PostgreSQL, real email delivery, Google/OpenAI credentials or
two-device staging acceptance. See `docs/guardian-verification-2026-10-10.md`
for current evidence and remaining release gates. Live family use remains HOLD.
