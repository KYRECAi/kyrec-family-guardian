# Guardian companion memory connection - 26 October 2026

All five companions are connected through the same bounded memory contract,
with independent selections and existing roles: Stan, Nova, Pulse, Moneybags and
Scout. Core's existing reviewed-memory store, role routing, approval and forget
lifecycle remain authoritative. This is an additive adapter, not a new memory
store or a replacement for the existing intelligence packs.

## What the app does

After consenting to companion chat, an adult chooses approved facts relevant to
the selected companion. The notice explicitly identifies OpenAI as the provider
receiving those facts. Up to eight facts may be selected; none is selected by
default. Another companion needs its own selection. For a relevant coordinated
task, the user may select the same approved fact for two companions without
transferring either conversation. Automatic pack-to-chat orchestration is not
part of this memory connection; existing Core coordinated flows remain intact.

Remember a fact submits one explicit structured suggestion. Core's configured
owner still approves or dismisses it through the existing review panel. Typing a
chat message does not automatically save a fact or transcript. Review or forget
memories opens the existing companion review screen. Forgotten facts are
excluded from future recall; historical records and backups remain.

Selections and conversations stay in the current component session. Switching
companion, account, household or member role resets them. Changing memory
choices clears the chat. A memory-backed answer uses the new message and fresh
facts, without previous turns that could repeat a forgotten fact. Approved facts
remain in Core and can be selected again after restarting the app.

## Contract and authority

Product baseline: PR #21, 3b1f87d36167944c841ce4cc3208c5298367c8b9.
Core baseline: fb9d9801d77017ff7aa464d1bb558c03528afcb8.
Core adapter: PR #78; exact paired heads are pinned in the Core memory-pair CI.

New contract: guardian-memory-chat-v1. Under /v1/guardian/companion-memory:

- GET chat-options: household UUID and companion; approved own facts and registered proposal fields.
- POST chat-context: household, companion, selected UUIDs, purpose companion_chat,
  provider openai, current notice and explicit consent true.
- PUT chat-proposals/{operation_id}: household, companion and one registered fact;
  returns the existing companion-memory-v1 proposal receipt.

Guardian server functions verify the real account session. Core authenticates
the service and its current workspace grant, binds the verified account's own
adult subject, and checks the existing household membership and workspace map.
The existing registry must explicitly include memory:chat:<companion>:openai
for each intended companion, alongside memory:read (and memory:propose for
suggestions). Existing review/read grants are not upgraded automatically.
The source service must be family_guardian. Device grants and another person's
review authority do not grant chat disclosure.

Every recalled UUID must still be approved, active and permitted. Core applies
existing retention consent, scope and expiry checks. Missing/unknown/forgotten
IDs deny the whole selection. The app validates exact recipient, household,
purpose, provider and returned UUIDs before constructing a provider request.
Core is checked again after generation; changed/revoked context discards that
answer and clears memory selection. An already transmitted fact cannot be
withdrawn from an in-flight provider request or a previously displayed answer.

Core access audit records operation, recipient, provider and selected count,
without values, transcripts or memory UUIDs. Responses are no-store. Facts enter
the model as user data, never privileged instructions; keys and record IDs stay
out of the provider's content. No actions, points or approvals can be executed
by the model. Existing voices and safeguarding responses are preserved.

## Validation and release

New Core tests cover all recipients, exact selection, own-adult authority,
household/service/workspace membership, scope/consent/expiry, malformed requests,
proposal/review/forget and audit failure. Guardian tests cover strict envelopes,
selected payloads, provider-data separation and revocation during generation.
The real component browser gate exercises selection, suggestion, reset, denied
access and phone/desktop/full-screen layout in development and built output.
The paired runner uses real Core HTTP routes, Guardian server transport and
service logic with captured synthetic provider responses. No live model call is
required for these checks.

Local Windows typecheck and lint pass (four existing warnings). An initial local
full build hit Windows EPERM copying a generated install asset; Linux CI runs
both full build targets and native packaging. Exact run results belong in the
PRs, not inferred from a successful component harness.

Release remains HOLD for connected family use until reviewed source is activated
and current service/account/household bindings, scoped grants and consent are
provisioned. Native authentication/session transport, real device acceptance
and live provider configuration remain separate open work. No website, AWS
runtime, credential, grant or account binding is deployed or changed by this PR.
Rollback: leave the existing runtime and grants in place; remove the app adapter
before removing the additive Core routes. There is no data migration to undo.
