import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNewsStatus } from '../../../src/modules/CB-M03/news-status.mjs';

const live = {
  status: 'LIVE_HEADLINES',
  collectedAt: '2026-10-29T12:00:00.000Z',
  sourcesRead: 2,
  itemCount: 3,
  rightsStatus: 'HEADLINES_WITH_ATTRIBUTION_ONLY',
  sources: [
    { id: 'decrypt', name: 'Decrypt', home: 'https://decrypt.co', status: 'OK', reason: null, itemCount: 2 },
    { id: 'coindesk', name: 'CoinDesk', home: 'https://www.coindesk.com', status: 'UNAVAILABLE',
      reason: 'HTTP_503', itemCount: 0 },
  ],
  items: [{ title: 'A headline that must never appear' }],
};

test('a live status reports counts and feed state without any content', () => {
  const payload = buildNewsStatus(live, { windowSeconds: 900 });
  assert.equal(payload.status, 'ok');
  assert.equal(payload.stale, false);
  assert.equal(payload.mode, 'LIVE_THIRD_PARTY');
  assert.equal(payload.collectedAt, '2026-10-29T12:00:00.000Z');
  assert.equal(payload.feedsRead, 2);
  assert.equal(payload.feedsTotal, 2);
  assert.equal(payload.items, 3);
  assert.equal(payload.rights, 'HEADLINES_WITH_ATTRIBUTION_ONLY');
  assert.equal(payload.attribution.required, true);
  assert.equal(payload.attribution.path, '/en/news/sources');
  assert.deepEqual(payload.feeds.map((feed) => feed.id), ['decrypt', 'coindesk']);
  assert.deepEqual(payload.feeds.map((feed) => feed.status), ['OK', 'UNAVAILABLE']);
  assert.deepEqual(Object.keys(payload.feeds[0]).sort(), ['id', 'itemCount', 'reason', 'status']);
  assert.equal(Object.isFrozen(payload), true);
  assert.equal(Object.isFrozen(payload.feeds), true);
  assert.equal(Object.isFrozen(payload.feeds[0]), true);
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('A headline that must never appear'), false);
  assert.equal(serialized.includes('Decrypt'), false);
});

test('disabled and unavailable collections expose no feed data', () => {
  const disabled = buildNewsStatus({ status: 'DISABLED', reason: 'NOT_ENABLED' });
  assert.equal(disabled.status, 'disabled');
  assert.equal(disabled.reason, 'NOT_ENABLED');
  assert.equal(disabled.feedsTotal, 5);
  assert.deepEqual(disabled.feeds, []);
  assert.equal(disabled.rights, 'NO_CONTENT');
  assert.equal(disabled.stale, false);
  assert.equal(disabled.windowSeconds, 900);

  const unavailable = buildNewsStatus({ status: 'UNAVAILABLE', reason: 'ALL_SOURCES_FAILED' }, { windowSeconds: 60 });
  assert.equal(unavailable.status, 'unavailable');
  assert.equal(unavailable.reason, 'ALL_SOURCES_FAILED');
  assert.equal(unavailable.windowSeconds, 60);
  assert.deepEqual(unavailable.feeds, []);
});

test('a stale snapshot is flagged and carries the failed refresh time', () => {
  const stale = buildNewsStatus({ ...live, stale: true, refreshFailedAt: '2026-10-29T12:30:00.000Z' });
  assert.equal(stale.status, 'ok');
  assert.equal(stale.stale, true);
  assert.equal(stale.refreshFailedAt, '2026-10-29T12:30:00.000Z');
});

test('invalid snapshots fail closed', () => {
  assert.throws(() => buildNewsStatus(null), TypeError);
  assert.throws(() => buildNewsStatus({}), TypeError);
  assert.throws(() => buildNewsStatus({ status: 'SOMETHING_ELSE' }), TypeError);
  assert.equal(buildNewsStatus(live, { windowSeconds: 0 }).windowSeconds, 900);
});
