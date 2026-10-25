import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const ACCOUNT = '149935825388';
export const REGION = 'ap-southeast-2';
export const REPOSITORY = 'kyrec-family-guardian-staging';
export const REGISTRY = ACCOUNT + '.dkr.ecr.' + REGION + '.amazonaws.com';
export const IMAGE = REGISTRY + '/' + REPOSITORY;
const shaPattern = /^[a-f0-9]{40}$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
function check(ok, message) { if (!ok) throw new Error(message); }

export function validateIdentity(identity, source) {
  check(shaPattern.test(source ?? ''), 'A full lowercase source commit is required');
  check(identity.source === source, 'Release source does not match this run');
  for (const target of ['runtime', 'migration']) {
    check(digestPattern.test(identity[target] ?? ''), 'Invalid ' + target + ' image ID');
  }
  return identity;
}

export function deploymentParameters(release, config) {
  check(shaPattern.test(release.source ?? ''), 'Invalid source commit');
  for (const target of ['runtime', 'migration']) {
    check(typeof release[target] === 'string' && release[target].startsWith(IMAGE + '@'), 'Wrong image repository');
    check(digestPattern.test(release[target].slice(IMAGE.length + 1)), 'Invalid image digest');
  }
  check(/^arn:aws:secretsmanager:ap-southeast-2:149935825388:secret:kyrec-family-guardian-staging\/server-config-[A-Za-z0-9]{6}$/.test(config.secretArn ?? ''), 'Expected Guardian configuration secret ARN, not its value');
  check(/^sg-([a-f0-9]{8}|[a-f0-9]{17})$/.test(config.databaseSecurityGroup ?? ''), 'Invalid database security group ID');
  return Object.entries({
    FoundationStackName: 'kyrec-core-staging-foundation',
    ImageIdentifier: release.runtime,
    SourceCommit: release.source,
    ConfigurationSecretArn: config.secretArn,
    AccountDatabaseSecurityGroupId: config.databaseSecurityGroup,
    DesiredCount: '0',
  }).map(([ParameterKey, ParameterValue]) => ({ ParameterKey, ParameterValue }));
}

function run(command, args, options = {}) {
  const r = spawnSync(command, args, { encoding: 'utf8', timeout: 300000, maxBuffer: 16 * 1024 * 1024, ...options });
  // Never echo arguments, auth tokens or raw provider output on failure.
  if (r.error || r.status !== 0) throw new Error(command + ' failed; inspect the named workflow step');
  return r.stdout.trim();
}
function aws(...args) {
  return run('aws', [...args, '--region', REGION, '--no-cli-pager', '--output', 'json']);
}
function verifyLocalImage(id, source) {
  const image = JSON.parse(run('docker', ['image', 'inspect', id]))[0];
  check(image.Id === id, 'Loaded image differs from tested image');
  check(image.Config.Labels?.['org.opencontainers.image.revision'] === source, 'Image source mismatch');
  check(image.Config.User === 'node', 'Image must run as node');
}

export function main(command) {
  const source = process.env.GITHUB_SHA;
  if (command === 'record') {
    const identity = { source };
    for (const [target, tag] of Object.entries({ runtime: 'guardian-beta:test', migration: 'guardian-migration:test' })) {
      identity[target] = run('docker', ['image', 'inspect', '--format', '{{.Id}}', tag]);
      verifyLocalImage(identity[target], source);
    }
    validateIdentity(identity, source);
    mkdirSync('artifacts/guardian-release', { recursive: true });
    writeFileSync('artifacts/guardian-release/identity.json', JSON.stringify(identity, null, 2));
  } else if (command === 'publish') {
    check(process.env.GITHUB_REPOSITORY === 'KYRECAi/kyrec-family-guardian', 'Wrong GitHub repository');
    check(process.env.GITHUB_REF === 'refs/heads/main', 'Publishing is restricted to main');
    check(process.env.GITHUB_EVENT_NAME === 'workflow_dispatch', 'Publishing requires manual release');
    check(JSON.parse(aws('sts', 'get-caller-identity')).Account === ACCOUNT, 'Wrong AWS account');
    const repo = JSON.parse(aws('ecr', 'describe-repositories', '--repository-names', REPOSITORY)).repositories[0];
    check(repo.repositoryUri === IMAGE && repo.imageTagMutability === 'IMMUTABLE', 'Expected immutable Guardian ECR repository');
    const identity = validateIdentity(JSON.parse(readFileSync('artifacts/guardian-release/identity.json')), source);
    run('docker', ['load', '--input', 'artifacts/guardian-release/images.tar']);
    for (const target of ['runtime', 'migration']) verifyLocalImage(identity[target], source);
    const password = run('aws', ['ecr', 'get-login-password', '--region', REGION, '--no-cli-pager']);
    run('docker', ['login', '--username', 'AWS', '--password-stdin', REGISTRY], { input: password });
    const release = { source, run: process.env.GITHUB_RUN_ID };
    try {
      for (const target of ['runtime', 'migration']) {
        const tag = [target, source, process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT].join('-');
        check(/^(runtime|migration)-[a-f0-9]{40}-[0-9]+-[0-9]+$/.test(tag), 'Invalid publication tag');
        run('docker', ['tag', identity[target], IMAGE + ':' + tag]);
        run('docker', ['push', IMAGE + ':' + tag]);
        const details = JSON.parse(aws('ecr', 'describe-images', '--repository-name', REPOSITORY, '--image-ids', 'imageTag=' + tag)).imageDetails;
        check(details.length === 1 && digestPattern.test(details[0].imageDigest), 'Cannot verify published digest');
        release[target] = IMAGE + '@' + details[0].imageDigest;
        run('docker', ['pull', release[target]]);
        const remoteId = run('docker', ['image', 'inspect', '--format', '{{.Id}}', release[target]]);
        check(remoteId === identity[target], 'Published image differs from tested image');
      }
    } finally {
      run('docker', ['logout', REGISTRY]);
    }
    writeFileSync('artifacts/guardian-release/release.json', JSON.stringify(release, null, 2));
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY,
      'Verified images for ' + source + '\n\nRuntime: ' + release.runtime + '\n\nMigration: ' + release.migration +
      '\n\nPublished only. No infrastructure, database migration or family activation performed.\n', { flag: 'a' });
  } else if (command === 'prepare') {
    const release = JSON.parse(readFileSync(process.argv[3], 'utf8'));
    const parameters = deploymentParameters(release, {
      secretArn: process.env.GUARDIAN_CONFIG_SECRET_ARN,
      databaseSecurityGroup: process.env.GUARDIAN_ACCOUNT_DATABASE_SG,
    });
    writeFileSync('guardian-runtime-parameters.json', JSON.stringify(parameters, null, 2));
    console.log('Prepared parameters with DesiredCount=0. No AWS calls made.');
  } else throw new Error('Expected record, publish or prepare');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv[2]); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
