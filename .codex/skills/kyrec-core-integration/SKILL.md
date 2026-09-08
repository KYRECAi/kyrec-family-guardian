---
name: kyrec-core-integration
description: Connect KYREC product repositories to KYREC Core through approved APIs, permissions, workspace boundaries and human-control gates without duplicating Core authority inside the product.
---

# KYREC Core Integration — Codex Skill

## Purpose
Use this skill whenever a KYREC product needs to read from, submit to or act on KYREC Core intelligence.

This skill defines the boundary between product code and Core authority.

## Architecture rule
`KYREC product client -> approved product/server API -> KYREC Core -> permitted response -> product UI / companion`

Do not make the product itself become Core.

## Repository separation
- `kyrec-core` owns shared intelligence, permissions, patterns, gaps, routing, audit and authority logic.
- Product repositories own their own UI, user flows, product-specific state and presentation.
- Shared business rules that determine consequential authority belong in Core unless explicitly approved otherwise.
- Product code may display or request an approved Core decision; it must not fake, duplicate or bypass that decision.

## Family Guardian boundary
For KYREC Family Guardian specifically:
- Stan, Nova, Pulse, Moneybags and Scout are Family Guardian companions.
- Family Guardian owns companion presentation and family-facing workflows.
- Core owns the permitted intelligence and authority state delivered to those workflows.
- Moneybags recommendation is not points authority.
- Moneybags eligibility is not unlock authority.
- Family Points and Bonus authority must fail safely if approval, workspace or one-time authority checks are not valid.

## Integration checklist
Before creating or changing an integration:
1. Identify the exact product feature requesting Core data.
2. Identify the Core route/module intended to serve it.
3. Confirm authentication and workspace identity.
4. Confirm permission purpose and allowed context.
5. Define the minimum request payload.
6. Define the minimum response payload.
7. Define timeout, unavailable and invalid-response behaviour.
8. Define audit/evidence requirements.
9. Define any human-approval requirement.
10. Define tests for wrong user, wrong workspace, missing permission, replay and expired authority where relevant.

## Data minimisation
Only move the data required for the feature.

Never send a companion or product all Core context merely because it is technically available.

Do not expose privileged API keys, internal service credentials, raw private transcripts by default, confidential Core internals in client responses, or unrelated family/workspace data.

## Contract discipline
Treat the Core/product interface as an explicit contract.

For each endpoint or integration define request schema, response schema, error schema, auth requirement, workspace requirement, permission requirement, version/compatibility expectation, idempotency/replay behaviour where applicable and audit expectation.

Changes that break an existing product contract must be deliberate, tested and handed over to the affected product owner.

## Failure behaviour
If Core is unavailable or denies the request:
- fail safely
- show a truthful product state
- do not manufacture a Core result locally
- do not silently downgrade authority checks
- preserve user control

## Testing matrix
Where relevant test valid request, invalid input, unauthenticated request, wrong workspace, missing permission, expired permission, duplicate/replay request, Core timeout, Core unavailable, malformed Core response, stale client state, already-consumed authority and product recovery after failure.

## Cross-repository handover
When work spans Core and a product repository, record Core branch/commit, product branch/commit, contract/version changed, tests run in Core, tests run in product, dependency order for merge/release and exact rollback points in both repositories.

Do not merge one side while pretending the other side has already been verified.

## Codex task close format
**INTEGRATION**  
**PRODUCT REPOSITORY**  
**CORE REPOSITORY**  
**PRODUCT BRANCH / COMMIT**  
**CORE BRANCH / COMMIT**  
**CONTRACT / ROUTE**  
**DATA SENT**  
**DATA RETURNED**  
**AUTH / PERMISSION / WORKSPACE GATES**  
**HUMAN AUTHORITY GATE**  
**TESTS PASS**  
**TESTS FAIL**  
**KNOWN OPEN ISSUES**  
**ROLLBACK POINTS**  
**EXACT RESUME POINT**  
**NEXT ACTION / OWNER**  
**MICHAEL APPROVAL REQUIRED: YES / NO**

## Control line
> Products use Core. Products do not become Core. Keep the contract narrow, permissioned, testable and human-controlled.
