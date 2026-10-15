# Guardian Sydney AWS hosting preparation

Status: PREPARED, not deployed. Real-family launch remains HOLD.

Michael selected Sydney AWS hosting on 16 October 2026. This records the concrete
runtime design and the configuration still required; it is not deployment approval
or a claim that the app is live.

## Verified starting point

- Guardian PR #14 merged as `503a0dd3ee1743312029d11a5837bfeefdd0fdac`.
- Core PR #68 merged as `4730c2439fc68c8c79f1bc6d7975de65a48ebabb`.
- The running Core application remains release `117032f8cd174f12916f3e56abdfb1b8ea87820e`.
  The later Core merge changes only documentation/CI pins; do not deploy it merely
  to make master match the runtime label.
- Final pre-merge Guardian gate 38798293106, Core gate 38798321344 and exact paired
  run 38798321433 passed. The stale staging-runbook review finding was repaired
  and resolved before merge.
- Sydney account 149935825388 contains one ECS cluster and one service: Core.
  No App Runner service or Guardian server-config secret was found there.
- Existing Guardian production startup requires account database, authenticated
  Core access, email, OpenAI and Maps configuration. `/api/health` checks the
  account table and exact authenticated Core dependency; it cannot be replaced
  with a static success response.

## Prepared runtime template

`infra/aws-staging/runtime.json` reuses the existing Core staging VPC/subnets and
ECS cluster while creating a separate Guardian service, task and roles, security
groups, Cloud Map namespace, API Gateway HTTPS endpoint and 30-day logs.
It does not modify the Core service or grant Guardian access to Core database
credentials. Guardian calls Core through its HTTPS API and separately provisioned
service identity.

The task uses 0.25 x86 vCPU and 512 MiB RAM, a digest-pinned Guardian ECR image and
Fargate 1.4.0. DesiredCount defaults to zero. A rolling replacement allows temporary
overlap and uses ECS automatic failure rollback. Test memory use before increasing
capacity; changing capacity changes the cost estimate.

Only the API VPC-link security group can reach the task on port 8080. Egress is
HTTPS plus PostgreSQL to the supplied account-database security group. The template
adds a narrowly sourced database ingress rule; confirm the database SG belongs to
this VPC before creating a change set. The task role has no AWS policies. Its
execution role reads exactly one Guardian configuration secret, with JSON-key
selection for server environment injection. No key values belong in this template,
CloudFormation parameters, build arguments, images, logs or Git.

The HTTPS API origin also becomes BETTER_AUTH_URL. All app authentication and
session checks remain in place. Gateway limits are 25 requests/second, burst 50;
these do not change Core's 120 requests/minute allowance. No DNS or custom domain
change is included. The task's health check uses the real `/api/health` route.

## Required inputs before activation

1. Build, smoke-test, scan and publish the exact reviewed Guardian source to
   `kyrec-family-guardian-staging`, then independently verify its ECR manifest and
   source label. The current Dockerfile is not changed here. Core's clean image
   scan is not evidence that the separate Guardian image is clean.
2. Provide a separate Guardian authentication database and restricted runtime
   login. If sharing the existing PostgreSQL instance, use an isolated database
   and role, never Core's runtime/bootstrap credentials. Review privileged setup
   and grants, apply Guardian migrations explicitly using its existing migrator,
   and test restart/persistence and cross-database refusal. This template does not
   create a database or run migrations. The current runtime image does not include
   the standalone migration source; prepare a separate reviewed migration runner.
3. Provision the Guardian Core service identity and minimum domain/workspace
   grants using Core's operator-controlled mechanism. Register verified synthetic
   accounts, person/owner mapping and explicit consent separately. An empty memory
   authority registry does not authorize recall.
4. Create/populate one server-owned secret named
   `kyrec-family-guardian-staging/server-config`, using the AWS-managed Secrets
   Manager key. Required JSON keys are DATABASE_URL, BETTER_AUTH_SECRET,
   RESEND_API_KEY, AUTH_EMAIL_FROM, KYREC_CORE_SERVICE_ID,
   KYREC_CORE_SERVICE_KEY, OPENAI_API_KEY, OPENAI_COMPANION_MODEL,
   GOOGLE_MAPS_BROWSER_KEY and GOOGLE_MAPS_MAP_ID. Populate it through an approved
   secure path; never paste credentials into chat. Preserve the existing explicit
   OpenAI daily-request limit unless Michael approves a cost-impacting change.
5. Verify email sender/domain and confirmation/reset delivery, approve the OpenAI
   project/model/cost, and restrict the Maps browser key to the final HTTPS host
   and Maps JavaScript API. Maps' browser key is intentionally public; OpenAI,
   email and Core service credentials remain server-side.
6. Supply the exact image URI, source SHA, configuration-secret ARN and account
   database SG. Validate the account/region, inspect the CloudFormation change set,
   and stop for Michael's approval of the specified paid/security/database actions.
   Keep DesiredCount=0 until the image, migrations, configuration and identity gates
   pass; then review activation to one task. Do not substitute fake secrets or
   bypass startup/readiness checks to bring it up.

## Cost evidence and limits

AWS Price List API (AmazonECS, Sydney Linux x86 on-demand) returned:

| Item | USD per hour |
|---|---:|
| vCPU | 0.04856 |
| GiB memory | 0.00532 |

Using 730 hours, one 0.25-vCPU/0.5-GiB task is USD 10.804/month in compute.
A 0.5-vCPU/1-GiB task would be USD 21.608/month. These were calculated by script,
not inferred from Core's earlier budget. They are not a complete hosting estimate.

Add public IPv4, API requests, service discovery, logs, ECR storage, secrets,
account database capacity/storage/backups, transfer, tax and provider usage.
Database placement, provider model/limits and expected traffic remain undecided;
finish that estimate before paid activation. Preserve the existing Core budget
alert; it is not a spending cap. No paid resources were created for this plan.

## Acceptance and rollback

After approved deployment, establish source/digest and real readiness; test
confirmation, login, password reset and session revocation on two sessions and
two households. Exercise shared list synchronization, concurrent snatch, stable
retry, membership removal, location expiry/withdrawal and native consent refusal.
Test approved memory across task replacement, wrong owner/workspace refusal,
revocation and forget. Verify SMTP, Maps and OpenAI separately without recording
keys or private content in evidence. Use synthetic records until real-family
environment and privacy gates are approved.

Record task/image/configuration metadata before every change. A first host has
no previous successful deployment for ECS to restore: the stop path is to scale
the new service to zero and preserve account data, secrets and audit history.
Later releases may restore the recorded prior image/configuration. Do not delete
Core, down-migrate history, or restore revoked grants. A database restoration
exercise and actual phone/browser acceptance remain required before a pilot.
