# Guardian GitHub release preparation

This change makes the tested runtime and migration images publishable through
GitHub Actions without a ChatGPT AWS connector session. It also generates the
first hosting stack's digest-pinned parameter file. It does not provision the
account database, run live migrations, populate secrets, grant Core consent, or
activate family access.

## What is implemented

- The existing Family beta gate is callable as a reusable workflow. All previous
  migrations, account/browser tests and HIGH/CRITICAL image scans remain required.
- Manual `Guardian tested image publication` runs only on main. Default
  `publish=false` builds/tests and retains images without requesting AWS access.
- When publishing is explicitly selected, the protected
  `guardian-image-publication` environment gates the AWS job.
- Publication uses temporary OIDC credentials restricted to Guardian ECR. No
  GitHub AWS access keys, no Core publisher reuse, no deployment privileges.
- Exactly the images from this run are loaded, checked against source labels and
  image IDs, pushed using immutable tags, pulled by ECR digest and compared again.
- `release.json` records the source and both verified image digests.
- `prepare` validates release/configuration metadata and generates runtime
  parameters with DesiredCount=0. It makes no AWS calls.

## One-time bootstrap (not performed)

1. Review and merge the hosting changes and this change. Configure the GitHub
   environment named `guardian-image-publication`: restrict deployment branches
   to main, require Michael's review, and disable admin bypass where available.
   The OIDC subject binds to this environment; AWS does not enforce GitHub branch
   rules for an environment subject, so the environment's branch restriction is
   required. Do not enable publication before these protections exist.
2. In an authorised AWS session, verify STS reports account 149935825388 and
   use ap-southeast-2. Inspect existing resources first. If the repository or
   role already exists, reconcile it; do not create duplicates or widen Core's role.
3. Verify the account's existing GitHub OIDC provider has audience
   sts.amazonaws.com. The template deliberately references that provider rather
   than creating a duplicate or altering Core's provider.
4. Review a CloudFormation change set for
   `infra/aws-staging/github-publisher.json` under stack
   `kyrec-family-guardian-staging-publisher`, using CAPABILITY_NAMED_IAM.
   This creates one immutable ECR repository and an image-only publisher role.
   ECR storage/scanning and GitHub artifact retention can incur charges. Obtain
   the concrete cost/change approval before executing it.
5. Run the GitHub publication workflow with publish=false first, then with
   publish=true after bootstrap and publication approval. Record run URL and
   release.json. The role cannot create stacks, access secrets, run migrations,
   update ECS or grant itself more permissions.

The AWS console's CloudShell can perform authorised bootstrap; the ChatGPT
connector is not required. GitHub cannot create its own initial AWS trust.
These are operator instructions, not a claim that a session is connected.

## Prepare first runtime change set

Use the exact source checkout recorded in release.json. Do not substitute the
latest branch after publication. Obtain the actual secret ARN and the isolated
account database security group from verified AWS metadata. Never paste secret
values into command arguments, chat or GitHub.

In an authorised operator shell, after database/configuration/Core prerequisites
in guardian-aws-hosting-plan-2026-10-16.md have been completed:

```sh
export AWS_DEFAULT_REGION=ap-southeast-2
test "$(aws sts get-caller-identity --query Account --output text)" = 149935825388
# Set GUARDIAN_CONFIG_SECRET_ARN and GUARDIAN_ACCOUNT_DATABASE_SG to verified metadata.
node scripts/guardian-release.mjs prepare /path/to/release.json
aws cloudformation create-change-set \
  --stack-name kyrec-family-guardian-staging-runtime \
  --change-set-name guardian-first-host \
  --change-set-type CREATE \
  --template-body file://infra/aws-staging/runtime.json \
  --parameters file://guardian-runtime-parameters.json \
  --capabilities CAPABILITY_IAM
```

CREATE is for a verified absent stack only. If the stack already exists, inspect
its state and prepare a reviewed UPDATE instead. This command creates a plan, not
an active Guardian service. Review the change set, permissions and complete costs
before execution. The operator uses their existing authorised CloudFormation
permissions; the GitHub publisher role is intentionally unable to execute it.

## Still required before beta

- Isolated hosted authentication database, restricted migration/runtime roles,
  backup/restore evidence and explicit migrations.
- Securely populated Guardian configuration, provider/model/sender decisions,
  Maps referrer restrictions and Core service/workspace permissions.
- Verified identity and consent bindings for memory, including revocation.
- Approved transition from synthetic-only staging to real family data.
- Reviewed activation to one task, authenticated readiness and exact deployed
  source/digest verification.
- Real signup/verification/reset/invitation tests, two users sharing a list,
  separate-family isolation, Maps and companion acceptance on phones.

Do not treat published images or a zero-task hosting stack as a live beta.
Do not send test emails without Michael's approval.

## Recovery

Publication failure leaves the running app untouched. A partial publication may
leave one immutable image; rerun uses a distinct run-attempt tag and no deployment
occurs. Repository deletion retains images; no automatic lifecycle expiry is set,
so rollback images are not silently removed. For the first hosting activation,
stop the Guardian service (DesiredCount=0) while preserving database, secrets and
audit evidence. Do not delete or roll back Core to undo a Guardian failure.

## Verification

Run `node --test scripts/guardian-release.test.mjs`.
The delivery CI validates both CloudFormation templates and parses workflow YAML.
The full existing beta gate also runs for the stacked hosting PR.
Actual OIDC, ECR publication, CloudFormation execution and hosted acceptance
require the one-time AWS bootstrap and remain unverified until executed.

References:
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html
