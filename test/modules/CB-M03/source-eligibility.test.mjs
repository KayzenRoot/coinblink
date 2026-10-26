import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSourceEligibility } from '../../../src/modules/CB-M03/ingestion/source-eligibility.mjs';

const sources = Object.freeze([
  Object.freeze({ id: 'publisher-one', origin: 'https://publisher.example.com', pathPrefix: '/articles/',
    active: true, intakePermission: 'PRIVATE_REVIEW_INTAKE', rightsRef: 'RIGHTS-INTAKE-001' }),
  Object.freeze({ id: 'publisher-two', origin: 'https://bulletin.example.com', pathPrefix: '/news/',
    active: true, intakePermission: 'PRIVATE_REVIEW_INTAKE', rightsRef: 'RIGHTS-INTAKE-002' }),
]);
const candidate = Object.freeze({
  sourceId: 'publisher-one', externalId: 'bulletin-2026-42',
  originUrl: 'https://publisher.example.com/articles/42?lang=en',
  title: 'Protocol upgrade announces a new public release',
  publishedAt: '2026-10-24T12:30:00Z',
});
const check = (item = candidate, registry = sources) => evaluateSourceEligibility(item, registry);

test('source gate admits only a private review candidate; never publishes or authorizes X', () => {
  const result = check();
  assert.equal(result.status, 'PRIVATE_REVIEW_ONLY');
  assert.equal(result.mode, 'PRIVATE_REVIEW_INTAKE');
  assert.equal(result.publiclyUsable, false);
  assert.equal(result.canPublish, false);
  assert.equal(result.canPostToX, false);
  assert.equal(result.sourceId, 'publisher-one');
  assert.equal(result.rightsRef, 'RIGHTS-INTAKE-001');
  assert.equal(result.originUrl, candidate.originUrl);
  assert.equal(result.publishedAt, candidate.publishedAt);
  assert.equal(Object.isFrozen(result), true);
});

test('idempotency identity stays stable for equivalent input and varies for distinct article/source', () => {
  const first = check();
  assert.equal(first.identityKey, check({...candidate}).identityKey);
  assert.equal(first.identityKey, check({...candidate, originUrl: 'https://publisher.example.com/articles/42?lang=pt'}).identityKey);
  assert.notEqual(first.identityKey, check({...candidate, externalId: 'bulletin-2026-43'}).identityKey);
  const second = check({ ...candidate, sourceId: 'publisher-two', originUrl: 'https://bulletin.example.com/news/42' });
  assert.equal(second.status, 'PRIVATE_REVIEW_ONLY');
  assert.notEqual(first.identityKey, second.identityKey);
});

test('source identity, availability and trusted rights are fail-closed', () => {
  assert.equal(check({...candidate, sourceId: 'unknown'}).status, 'DENIED');
  assert.equal(check(candidate, []).status, 'DENIED');
  assert.equal(check(candidate, [{...sources[0], active: false}]).status, 'DENIED');
  assert.equal(check(candidate, [{...sources[0], intakePermission: 'NOT_CLEARED'}]).status, 'DENIED');
  assert.equal(check(candidate, [{...sources[0], rightsRef: ''}]).status, 'DENIED');
  assert.equal(check(candidate, [{...sources[0], rightsRef: 'UNVERIFIED'}]).status, 'DENIED');
  assert.equal(check(candidate, [sources[0], sources[0]]).status, 'DENIED');
  assert.equal(check(candidate, null).status, 'DENIED');
});

test('candidate cannot grant itself licensing, approval, publication or provider capabilities', () => {
  for (const injected of [
    {rightsRef: 'RIGHTS-INTAKE-001'}, {intakePermission: 'PRIVATE_REVIEW_INTAKE'},
    {licensing: 'APPROVED'}, {approved: true}, {mode: 'LIVE'},
    {published: true}, {canPublish: true}, {canPostToX: true},
    {ownerApproved: true}, {providerToken: 'do-not-accept'},
  ]) assert.equal(check({...candidate, ...injected}).status, 'DENIED', JSON.stringify(injected));
});

test('mock and test fixtures are never eligible to be treated as real news', () => {
  for (const url of ['https://feed.example.test/articles/42','https://localhost/articles/42',
    'https://127.0.0.1/articles/42','http://publisher.example.com/articles/42',
    'file:///etc/passwd','https://publisher.example.com:8443/articles/42']) {
    assert.equal(check({...candidate, originUrl: url}).status, 'DENIED', url);
  }
});

test('source URLs must match exact trusted origin and the canonical article path prefix', () => {
  for (const url of [
    'https://publisher.example.com.evil.org/articles/42',
    'https://user:pass@publisher.example.com/articles/42',
    'https://publisher.example.com/admin/42',
    'https://publisher.example.com/articlesevil/42',
    'https://publisher.example.com/articles/42#fragment',
    'https://publisher.example.com/articles/%2Fadmin',
    'https://publisher.example.com/articles/%5cadmin',
    'https://publisher.example.com/articles/../admin/42',
    'https://bulletin.example.com/news/42',
  ]) assert.equal(check({...candidate, originUrl: url}).status, 'DENIED', url);
});

test('invalid timestamps, IDs, titles, and malformed objects are rejected', () => {
  for (const publishedAt of [null, '', 'tomorrow', '2026-02-30T12:30:00Z',
    '2026-10-24', '2026-10-24T12:30:00+00:00']) {
    assert.equal(check({...candidate, publishedAt}).status, 'DENIED', String(publishedAt));
  }
  for (const externalId of [null, '', '   ', '\nkey', 'x'.repeat(257)]) {
    assert.equal(check({...candidate, externalId}).status, 'DENIED', String(externalId));
  }
  for (const title of [null, '<img src=x>', 'a', 'x'.repeat(241), 'Attack\nheadline']) {
    assert.equal(check({...candidate, title}).status, 'DENIED', String(title));
  }
  for (const input of [null, [], 'text', Object.create(null)]) {
    assert.equal(check(input).status, 'DENIED');
  }
});

test('invalid and dangerous allowlist configurations fail closed', () => {
  for (const source of [
    {...sources[0], origin: 'http://publisher.example.com'},
    {...sources[0], origin: 'https://localhost'},
    {...sources[0], origin: 'https://publisher.example.com/article'},
    {...sources[0], pathPrefix: '/'},
    {...sources[0], pathPrefix: '/../'},
    {...sources[0], id: 'other'},
    {...sources[0], rightsRef: 'x\nattack'},
  ]) assert.equal(check(candidate, [source]).status, 'DENIED', JSON.stringify(source));
});

test('source policy does not mutate registry or candidate', () => {
  const beforeSources = structuredClone(sources);
  const beforeCandidate = structuredClone(candidate);
  check();
  assert.deepEqual(sources, beforeSources);
  assert.deepEqual(candidate, beforeCandidate);
});

test('prototype pollution and accessor input cannot influence eligibility', () => {
  const item = Object.assign(Object.create(null), candidate);
  assert.equal(check(item).status, 'DENIED');
  const malicious = { ...candidate };
  Object.defineProperty(malicious, 'title', {get() {throw new Error('accessor called');}, enumerable: true});
  assert.doesNotThrow(() => check(malicious));
  assert.equal(check(malicious).status, 'DENIED');
});
