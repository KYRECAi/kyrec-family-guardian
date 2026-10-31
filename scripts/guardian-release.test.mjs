import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateIdentity, deploymentParameters, IMAGE } from './guardian-release.mjs';
const source = 'a'.repeat(40);
const digest = 'sha256:' + 'b'.repeat(64);
const identity = { source, runtime: digest, migration: digest };
const release = { source, runtime: IMAGE + '@' + digest, migration: IMAGE + '@' + digest };
const config = { secretArn: 'arn:aws:secretsmanager:ap-southeast-2:149935825388:secret:kyrec-family-guardian-staging/server-config-Ab1234', databaseSecurityGroup: 'sg-1234567890abcdef0' };
test('exact source and both tested image IDs required', () => {
  assert.equal(validateIdentity(identity, source), identity);
  assert.throws(() => validateIdentity(identity, 'c'.repeat(40)));
  assert.throws(() => validateIdentity({ ...identity, migration: undefined }, source));
  assert.throws(() => validateIdentity(identity, 'main'));
});
test('preparation pins images and never activates tasks', () => {
  const v = Object.fromEntries(deploymentParameters(release, config).map(p => [p.ParameterKey, p.ParameterValue]));
  assert.equal(v.DesiredCount, '0');
  assert.equal(v.ImageIdentifier, release.runtime);
  assert.equal(v.SourceCommit, source);
});
test('wrong account, repository, mutable tag and credentials fail closed', () => {
  for (const bad of [release.runtime.replace('149935825388', '542489916965'), IMAGE + ':latest', release.runtime.replace('family-guardian', 'core')]) assert.throws(() => deploymentParameters({ ...release, runtime: bad }, config));
  for (const secretArn of ['sk-secret-value', config.secretArn.replace('149935825388', '542489916965'), config.secretArn.replace('server-config', 'core-config')]) assert.throws(() => deploymentParameters(release, { ...config, secretArn }));
  assert.throws(() => deploymentParameters(release, { ...config, databaseSecurityGroup: 'sg-;echo hello' }));
  assert.throws(() => deploymentParameters({ ...release, migration: IMAGE + ':latest' }, config));
});
test('publisher trust and permissions are Guardian image-only', () => {
  const t = JSON.parse(readFileSync(new URL('../infra/aws-staging/github-publisher.json', import.meta.url)));
  const r = t.Resources.PublisherRole.Properties;
  const trust = r.AssumeRolePolicyDocument.Statement[0].Condition.StringEquals;
  assert.equal(trust['token.actions.githubusercontent.com:sub'], 'repo:KYRECAi/kyrec-family-guardian:environment:guardian-image-publication');
  assert.equal(trust['token.actions.githubusercontent.com:aud'], 'sts.amazonaws.com');
  const p = r.Policies[0].PolicyDocument.Statement;
  assert.deepEqual(p.flatMap(s => s.Action).filter(a => !a.startsWith('ecr:')), []);
  assert.equal(p.filter(s => s.Resource === '*').length, 1);
  assert.deepEqual(p.find(s => s.Resource === '*').Action, ['ecr:GetAuthorizationToken']);
  assert.equal(t.Resources.Repository.Properties.ImageTagMutability, 'IMMUTABLE');
  assert.equal(t.Resources.Repository.DeletionPolicy, 'Retain');
});
