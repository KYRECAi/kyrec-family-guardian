# Guardian companion connection checkpoint — 26 October 2026

All five companions are in scope: Stan, Nova, Pulse, Moneybags and Scout.
Each retains its established role and its individual connection/context.
Cooperation happens for a relevant task through existing Core permissions and
routing; no companion is the hub for the others. This work does not redefine
characters, install a new Core memory store, or create a blanket shared context.

## Verified source position

Guardian base: `75c54ce03ca2c5e356e11d18f6f33e375c5e781c` (installed-app PR #20).
Core inspected read-only: `fb9d9801d77017ff7aa464d1bb558c03528afcb8`.
Core source is present; this check did not establish live grants or device use.

| Companion | Existing Core capability located | Guardian chat connection |
| --- | --- | --- |
| Stan | Trusted-observation bridge and human-control boundaries | Individual chat exists; no approved-memory or routed-intelligence retrieval |
| Nova | Individual meal/support policies and relevant coordinated flows | Same missing retrieval |
| Pulse | Family Flow, planning and connection policies; coordinated flows | Same missing retrieval |
| Moneybags | Family Money policies and separate points/bonus authority | Same missing retrieval; chat never grants reward authority |
| Scout | Journey/travel services and planning capabilities | Same missing retrieval |

The source includes a coordinated Family Flow/Meals case with distinct Pulse,
Nova and Moneybags policies. It is evidence of existing role routing, not proof
that Guardian's chat is connected to it. Existing character roles and scopes
remain authoritative.

The current Guardian memory functions review pending/current records and
approve/dismiss/forget through `companion-memory-v1`. That interface binds
a verified account to a permitted subject/workspace; it has no receiving
companion or chat-purpose selector. A permitted review is not, on its own,
permission to send every returned fact to every companion or an AI provider.
The generic intelligence read route is development-only. The separate native
review contract supplies recipient-permitted text, but no companion identity.
Do not bypass these differences by guessing a destination from text.

Before chat recall is enabled, establish the exact product-facing recipient and
purpose contract around the existing Core services and policies, including
current identity, household, consent, expiry, revocation and provider-disclosure
checks. Identify any required adapter addition separately from Core's existing
memory/routing logic. No such addition or grant provisioning is part of this fix.

## Actual Guardian fix

The old component cleared some state in an effect after a companion/account
change, but left old asynchronous callbacks attached to the newly displayed
chat. A browser regression reproduced a delayed Stan answer in Nova's chat.
Household changes did not clear chat state either.

A chat instance is now keyed by companion, signed-in account, household and
member role. Switching any of them removes the old messages, input draft,
consent choice, error and busy state. Old reply/consent callbacks remain tied to
the retired instance. This is transient UI isolation, not durable memory or
cancellation of a request already sent to the server. No transcript is persisted
or handed to another companion. Existing server authentication remains required.

## Verification and acceptance

`npm run test:companion:browser` mounts the real chat component with synthetic
API functions and controlled delayed promises. It checks all five roles, fresh
outgoing history, late replies/consent, account changes, sign-out, household and
role changes, phone/desktop layout and console errors in development and built
output. Requests to outside hosts are blocked. It uses no live credentials or
family conversations. This test is part of the Family beta CI gate.

The integration acceptance flow remains: connect each companion individually;
verify that only its permitted context arrives; exercise a relevant coordinated
task under existing Core rules; approve/recall/restart/forget; revoke access;
prove another companion, person or household receives nothing without authority.

Release status: HOLD for connected family use. Native authentication and secure
session transport, actual memory-to-companion permission contracts, live service
bindings and device acceptance remain open. A passing isolation test is not a
claim that those connections now exist. No Core runtime/source branch, website,
AWS configuration, credentials or grants were changed in this task.
