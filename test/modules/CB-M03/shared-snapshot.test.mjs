import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewsCache, readLiveNews } from '../../../src/modules/CB-M03/live-news.mjs';
import { LIVE_NEWS_SOURCES, LIVE_NEWS_WINDOW_SECONDS } from '../../../src/modules/CB-M03/rss-sources.mjs';
import {
  SHARED_SNAPSHOT_KEY,
  readSharedSnapshot,
  resolveSharedCache,
  writeSharedSnapshot,
} from '../../../src/modules/CB-M03/shared-snapshot.mjs';

const decrypt = LIVE_NEWS_SOURCES.find((source) => source.id === 'decrypt');
const cointelegraph = LIVE_NEWS_SOURCES.find((source) => source.id === 'cointelegraph');
const AT = '2026-10-26T12:00:00.000Z';
const BASE = Date.parse(AT);

function createFakeCache() {
  const entries = new Map();
  return {
    calls: { match: 0, put: 0 },
    async match(key) {
      this.calls.match += 1;
      const entry = entries.get(key);
      return entry === undefined ? undefined : new Response(entry.body, { headers: entry.headers });
    },
    async put(key, response) {
      this.calls.put += 1;
      entries.set(key, {
        body: await response.text(),
        headers: Object.fromEntries(response.headers),
      });
    },
  };
}

const rss = (...items) => '<rss version="2.0"><channel><title>Feed</title>' +
  items.join('') + '</channel></rss>';
const item = (title, link) => '<item><title>' + title + '</title><link>' + link + '</link>' +
  '<description>Short excerpt</description><pubDate>Sat, 25 Oct 2026 10:00:00 GMT</pubDate></item>';

const snapshot = {
  status: 'LIVE_HEADLINES',
  collectedAt: AT,
  itemCount: 1,
  sourcesRead: 1,
  sources: [],
  items: [{ id: 'x', title: 'Headline', link: 'https://example.test/x', sourceId: 'decrypt' }],
};

test('only a cache with match and put is used', () => {
  assert.equal(resolveSharedCache(null), null);
  assert.equal(resolveSharedCache({}), null);
  assert.equal(resolveSharedCache({ match: () => {} }), null);
  const cache = createFakeCache();
  assert.equal(resolveSharedCache(cache), cache);
});

test('a stored snapshot survives the round trip frozen and bounds its TTL', async () => {
  const cache = createFakeCache();
  assert.equal(await writeSharedSnapshot(cache, snapshot, 120), true);
  assert.equal(cache.calls.put, 1);
  const stored = await cache.match(SHARED_SNAPSHOT_KEY);
  assert.equal(stored.headers.get('cache-control'), 'public, max-age=120');
  assert.match(stored.headers.get('content-type'), /application\/json/u);
  const restored = await readSharedSnapshot(cache);
  assert.deepEqual(restored, snapshot);
  assert.equal(Object.isFrozen(restored), true);
  assert.equal(Object.isFrozen(restored.items), true);
  assert.equal(Object.isFrozen(restored.items[0]), true);
});

test('invalid, corrupted or failing caches never break the reader', async () => {
  assert.equal(await readSharedSnapshot(null), null);
  assert.equal(await writeSharedSnapshot(null, snapshot, 120), false);
  const broken = {
    async match() { return new Response('not json', { status: 200 }); },
    async put() { throw new Error('disk full'); },
  };
  assert.equal(await readSharedSnapshot(broken), null);
  assert.equal(await writeSharedSnapshot(broken, snapshot, 120), false);
  const partial = {
    async match() { return new Response(JSON.stringify({ status: 'LIVE_HEADLINES' }), { status: 200 }); },
    async put() {},
  };
  assert.equal(await readSharedSnapshot(partial), null);
  const throwing = {
    async match() { throw new Error('no cache'); },
    async put() {},
  };
  assert.equal(await readSharedSnapshot(throwing), null);
});

test('a second isolate skips the feeds when the shared snapshot is fresh', async () => {
  const bodies = {
    [decrypt.url]: rss(item('Decrypt live', 'https://decrypt.co/one')),
    [cointelegraph.url]: rss(item('Cointelegraph live', 'https://cointelegraph.com/two')),
  };
  let fetchCalls = 0;
  const fetchImpl = async (url) => {
    fetchCalls += 1;
    return bodies[url] === undefined
      ? new Response('', { status: 503 })
      : new Response(bodies[url], { status: 200 });
  };
  const shared = createFakeCache();
  const first = await readLiveNews({
    enabled: 'true', fetchImpl, cache: createNewsCache(), sharedCache: shared,
    now: () => AT, nowMs: () => BASE,
  });
  assert.equal(first.status, 'LIVE_HEADLINES');
  assert.equal(first.items.length, 2);
  assert.equal(shared.calls.put, 1);
  assert.equal(fetchCalls, LIVE_NEWS_SOURCES.length);

  let secondFetches = 0;
  const second = await readLiveNews({
    enabled: 'true',
    fetchImpl: () => { secondFetches += 1; throw new Error('must not fetch'); },
    cache: createNewsCache(), sharedCache: shared,
    now: () => AT, nowMs: () => BASE + 60 * 1000,
  });
  assert.equal(second.status, 'LIVE_HEADLINES');
  assert.equal(second.items.length, 2);
  assert.equal(secondFetches, 0);
});

test('a snapshot outside the window is ignored and a disabled reader never touches the cache', async () => {
  const shared = createFakeCache();
  await writeSharedSnapshot(shared, snapshot, LIVE_NEWS_WINDOW_SECONDS);
  const stale = await readLiveNews({
    enabled: 'true',
    fetchImpl: async () => new Response('', { status: 503 }),
    cache: createNewsCache(), sharedCache: shared,
    now: () => AT, nowMs: () => BASE + (LIVE_NEWS_WINDOW_SECONDS + 60) * 1000,
  });
  assert.equal(stale.status, 'UNAVAILABLE');
  const before = { ...shared.calls };
  const disabled = await readLiveNews({ enabled: '', sharedCache: shared });
  assert.equal(disabled.status, 'DISABLED');
  assert.deepEqual(shared.calls, before);
});
