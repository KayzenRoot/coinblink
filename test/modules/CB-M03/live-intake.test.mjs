import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_INTAKE_GATE_DENIED, LIVE_INTAKE_NO_SOURCE, buildLiveIntakeReview,
} from '../../../src/modules/CB-M03/live-intake.mjs';

const item = (over = {}) => ({
  id: 'decrypt:https://decrypt.co/story-1',
  title: 'Bitcoin ETF inflows reach a new record',
  summary: '',
  link: 'https://decrypt.co/story-1',
  sourceId: 'decrypt',
  sourceName: 'Decrypt',
  sourceHome: 'https://decrypt.co',
  publishedAt: '2026-10-28T12:00:00.000Z',
  collectedAt: '2026-10-29T00:00:00.000Z',
  ...over,
});
const snapshot = (items) => ({
  status: 'LIVE_HEADLINES', items, sources: [], collectedAt: '2026-10-29T00:00:00.000Z',
});
const registered = Object.freeze([Object.freeze({
  id: 'decrypt', origin: 'https://decrypt.co', pathPrefix: '/news/',
  active: true, intakePermission: 'PRIVATE_REVIEW_INTAKE', rightsRef: 'RIGHTS-INTAKE-001',
})]);

test('with no approved rights reference every dated candidate stays denied', () => {
  const review = buildLiveIntakeReview(snapshot([
    item(),
    item({ link: 'https://decrypt.co/story-2' }),
    item({ link: 'https://decrypt.co/story-3', publishedAt: null }),
  ]));
  assert.equal(review.status, 'INTAKE_GATE_MEASURED');
  assert.equal(review.mode, 'PRIVATE_REVIEW_INTAKE');
  assert.equal(review.registrySize, 0);
  assert.equal(review.evaluated, 2);
  assert.equal(review.admitted, 0);
  assert.equal(review.denied, 2);
  assert.equal(review.skippedUndated, 1);
  assert.equal(review.publicationAllowed, false);
  assert.equal(review.storageAllowed, false);
  assert.equal(review.rightsStatus, 'NO_RIGHTS_REFERENCE_APPROVED');
  assert.deepEqual(review.items.map((entry) => entry.reason), [LIVE_INTAKE_NO_SOURCE, LIVE_INTAKE_NO_SOURCE]);
  assert.deepEqual(review.items.map((entry) => entry.decision), ['DENIED', 'DENIED']);
  assert.equal(Object.isFrozen(review), true);
  assert.equal(Object.isFrozen(review.items), true);
  assert.equal(Object.isFrozen(review.items[0]), true);
});

test('a trusted registry with a rights reference admits only to private review', () => {
  const review = buildLiveIntakeReview(snapshot([
    item({ link: 'https://decrypt.co/news/story-1' }),
  ]), { registry: registered });
  assert.equal(review.registrySize, 1);
  assert.equal(review.evaluated, 1);
  assert.equal(review.admitted, 1);
  assert.equal(review.denied, 0);
  const [entry] = review.items;
  assert.equal(entry.decision, 'PRIVATE_REVIEW_ONLY');
  assert.equal(entry.reason, null);
  assert.equal(entry.rightsRef, 'RIGHTS-INTAKE-001');
  assert.equal(entry.externalId, 'news-story-1');
  assert.equal(review.publicationAllowed, false);
  assert.equal(review.sources[0].registered, true);
});

test('a registered source with the wrong path prefix still fails the gate', () => {
  const newsOnly = Object.freeze([Object.freeze({
    id: 'decrypt', origin: 'https://decrypt.co', pathPrefix: '/news/',
    active: true, intakePermission: 'PRIVATE_REVIEW_INTAKE', rightsRef: 'RIGHTS-INTAKE-001',
  })]);
  const review = buildLiveIntakeReview(snapshot([
    item({ link: 'https://decrypt.co/other/story-1' }),
  ]), { registry: newsOnly });
  assert.equal(review.admitted, 0);
  assert.equal(review.denied, 1);
  assert.equal(review.items[0].reason, LIVE_INTAKE_GATE_DENIED);
  assert.equal(review.items[0].rightsRef, null);
});

test('the gate refuses to measure anything that is not a live collection', () => {
  assert.throws(() => buildLiveIntakeReview(null), TypeError);
  assert.throws(() => buildLiveIntakeReview({ status: 'DISABLED', items: [] }), TypeError);
  assert.throws(() => buildLiveIntakeReview({ status: 'LIVE_HEADLINES', items: 'x' }), TypeError);
  assert.throws(() => buildLiveIntakeReview(snapshot([]), { registry: 'x' }), TypeError);
});
