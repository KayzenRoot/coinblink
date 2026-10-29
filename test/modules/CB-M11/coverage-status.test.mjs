import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCoverageStatus } from '../../../src/modules/CB-M03/coverage-status.mjs';

const item = (id, sourceId, title) => ({
  id,
  sourceId,
  sourceName: sourceId,
  title,
  link: 'https://' + sourceId + '.example/' + id,
  publishedAt: '2026-10-29T10:00:00.000Z',
  summary: 'ignored',
});

const ITEMS = [
  item('a1', 'coindesk', 'Bitcoin ETF inflows hit a record high this week'),
  item('b1', 'cryptoslate', 'Record highs for bitcoin ETFs as inflows accelerate'),
  item('c1', 'decrypt', 'Solana validators vote on a fee change'),
];

const snapshot = () => ({
  status: 'LIVE_HEADLINES',
  collectedAt: '2026-10-29T10:15:00.000Z',
  sourcesRead: 2,
  itemCount: ITEMS.length,
  rightsStatus: 'ATTRIBUTION_ONLY',
  items: ITEMS,
});

test('the projection reports only counts and publisher ids', () => {
  const result = buildCoverageStatus(snapshot());
  assert.equal(result.status, 'ok');
  assert.equal(result.mode, 'LIVE_THIRD_PARTY');
  assert.equal(result.stories, 1);
  assert.equal(result.headlines, 3);
  assert.equal(result.rights, 'ATTRIBUTION_ONLY');
  assert.deepEqual(result.publishers.map((row) => row.id),
    ['coindesk', 'cryptoslate', 'bitcoinmagazine', 'cointelegraph', 'decrypt']);
  assert.deepEqual(result.publishers.slice(0, 2).map((row) => row.stories), [1, 1]);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.publishers), true);
  assert.equal(Object.isFrozen(result.publishers[0]), true);
});

test('the payload never leaks a headline, link or article timestamp', () => {
  const serialized = JSON.stringify(buildCoverageStatus(snapshot()));
  for (const forbidden of ['Bitcoin ETF', 'Record highs', 'Solana validators',
    'https://', 'coindesk.example', '"title"', '"link"', '"summary"', '"publishedAt"']) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.equal(serialized.includes('"collectedAt"'), true, 'the collection time is metadata');
});

test('disabled and unavailable snapshots still answer with counts only', () => {
  const disabled = buildCoverageStatus({ status: 'DISABLED', reason: 'NOT_ENABLED' });
  assert.equal(disabled.status, 'disabled');
  assert.equal(disabled.stories, 0);
  assert.deepEqual(disabled.publishers, []);
  assert.equal(disabled.rights, 'NO_CONTENT');
  const unavailable = buildCoverageStatus({ status: 'UNAVAILABLE', reason: 'TIMEOUT' });
  assert.equal(unavailable.status, 'unavailable');
  assert.equal(unavailable.reason, 'TIMEOUT');
});

test('invalid snapshots are rejected instead of guessed', () => {
  assert.throws(() => buildCoverageStatus(null), TypeError);
  assert.throws(() => buildCoverageStatus('live'), TypeError);
  assert.throws(() => buildCoverageStatus({ status: 'UNKNOWN' }), TypeError);
});
