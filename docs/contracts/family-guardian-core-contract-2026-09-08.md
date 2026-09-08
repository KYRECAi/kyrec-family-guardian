# Family Guardian ↔ KYREC Core contract — verified position 2026-09-08

Status: **DRAFT / HOLD — development contract only**

## Mandatory boundary

`Family Guardian client -> approved Family Guardian server/API route -> KYREC Core`

The mobile/web client must never contain a Core service key or call privileged Core routes directly. The Family Guardian server authenticates the family user and household, enforces product permissions, minimises data, and then calls Core using server-held credentials.

## Current verified Core development interface

Private intake route: `POST /v1/intake/private`

Server-side authentication headers:

- `X-KYREC-Service-Id: kyrec-family-guardian-dev`
- `X-KYREC-Service-Key: <server-held KYREC_FAMILY_GUARDIAN_DEV_KEY>`

Current development workspace allow-list: `demo-family`.

The intake envelope must carry a stable event ID for retry/idempotency, workspace ID, permitted domain and event type, UTC occurrence time, declared purpose, matching permission reference and the minimum required payload. Core authenticates the service, assigns trusted source identity, checks permission and integrity, writes metadata-only audit evidence, and persists only accepted signals.

Current development read route: `GET /v1/dev/intelligence/{pack_id}`. It is development-only and is not an approved production product route.

## Current permission references

| Domain | Permission reference | Purpose |
|---|---|---|
| meal | `family-meals-consent-v1` | family meal pattern recognition |
| outing | `family-outings-consent-v1` | family outing preference learning |
| travel | `family-scout-travel-consent-v1` | family travel journey monitoring |
| flow | `family-flow-consent-v1` | family flow pattern recognition |
| planner | `family-planner-consent-v1` | family planner pattern recognition |
| money | `family-money-consent-v1` | family money pattern recognition |

Exact allowed event types remain governed by Core configuration and permission records; the product must not broaden them locally.

## Authority and failure behaviour

- Core produces permitted intelligence/recommendations; it does not become family authority.
- Companion access is least-privilege and role-specific.
- Consequential location, child, household, emotional or money actions require explicit human controls.
- Permission revocation must stop future intake and downstream companion access.
- Core unavailable/denied responses must fail safely: no silent local authority and no fabricated success.
- Raw private conversation is not durable trusted memory by default.
- Cross-household reads are prohibited.

## Verified gaps before implementation

1. No Family Guardian server/BFF exists in the supplied source.
2. No production user/household authentication or consent store is connected.
3. No production product-facing intelligence read route is established.
4. Core development service configuration allows meal, outing, flow, planner and money, while a travel permission also exists. That travel-domain mismatch must be resolved in Core before Scout journey integration.
5. Product payload schemas, retention/deletion behaviour, revocation tests and timeout/retry rules require joint product/Core acceptance.
6. Core shared changes must be made in `KYRECAi/kyrec-core`; product UI/state remains in this repository.

No live credentials, production route, release decision or scope approval is asserted by this document.
