import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRssFeed, stripMarkup, decodeEntities } from '../../../src/modules/CB-M03/rss-parse.mjs';
import {
  LIVE_NEWS_SOURCES, LIVE_NEWS_TITLE_MAX, LIVE_NEWS_WINDOW_SECONDS,
} from '../../../src/modules/CB-M03/rss-sources.mjs';
import { createNewsCache, isLiveNewsEnabled, readLiveNews } from '../../../src/modules/CB-M03/live-news.mjs';

const AT = '2026-10-26T12:00:00.000Z';
const decrypt = LIVE_NEWS_SOURCES.find((source) => source.id === 'decrypt');
const cointelegraph = LIVE_NEWS_SOURCES.find((source) => source.id === 'cointelegraph');

const rss = (...items) => '<rss version="2.0"><channel><title>Feed</title>' +
  items.join('') + '</channel></rss>';
const item = ({ title = 'A headline', link = 'https://decrypt.co/1', date = 'Sat, 25 Oct 2026 10:00:00 GMT',
  description = '' } = {}) => '<item><title>' + title + '</title><link>' + link + '</link>' +
  '<description>' + description + '</description><pubDate>' + date + '</pubDate></item>';

const collect = (xml, source = decrypt, limit) => parseRssFeed(xml, { source, collectedAt: AT, limit });

test('feed projection keeps text, strips markup and bounds every field', () => {
  const [entry] = collect(rss(item({
    title: '  <b>Bitcoin</b> &amp; ether   move  ',
    description: '<p>First&nbsp;line</p><script>alert(1)</script><p>Second &lt;safe&gt; line</p>',
  })));
  assert.equal(entry.title, 'Bitcoin & ether move');
  assert.equal(entry.summary, 'First line alert(1) Second <safe> line');
  assert.equal(entry.publishedAt, '2026-10-25T10:00:00.000Z');
  assert.equal(entry.sourceId, 'decrypt');
  assert.equal(entry.sourceName, 'Decrypt');
  assert.equal(entry.sourceHome, 'https://decrypt.co');
  assert.equal(entry.collectedAt, AT);
  assert.equal(Object.isFrozen(entry), true);
  assert.equal(entry.link, 'https://decrypt.co/1');
});

test('feed projection clips long text and decodes entities', () => {
  const [entry] = collect(rss(item({
    title: 'x'.repeat(400),
    description: '&#39;quoted&#39; ' + 'y'.repeat(500),
  })));
  assert.equal(entry.title.length, LIVE_NEWS_TITLE_MAX);
  assert.equal(entry.title.endsWith('\u2026'), true);
  assert.equal(entry.summary.length, 280);
  assert.equal(entry.summary.startsWith("'quoted' "), true);
  assert.equal(decodeEntities('a &amp; b &unknown; c'), 'a & b &unknown; c');
  assert.equal(stripMarkup('<![CDATA[<i>kept</i>]]>'), 'kept');
});

test('every link must be https on the publisher host, and duplicates collapse', () => {
  const entries = collect(rss(
    item({ link: 'http://decrypt.co/plain-http' }),
    item({ link: 'https://evil.example/decrypt.co/story' }),
    item({ link: 'https://decrypt.co/story#section' }),
    item({ link: 'https://decrypt.co/story' }),
    item({ title: '   ', link: 'https://decrypt.co/blank-title' }),
    item({ link: 'https://decrypt.co/valid' }),
  ));
  assert.deepEqual(entries.map((entry) => entry.link), ['https://decrypt.co/story', 'https://decrypt.co/valid']);
});

test('atom entries are supported and dates sort newest first with undated last', () => {
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom"><entry>' +
    '<title>Atom story</title><link href="https://cointelegraph.com/atom-1"/>' +
    '<summary>From the atom feed</summary><published>2026-10-26T08:00:00Z</published></entry>' +
    '<entry><title>No date</title><link href="https://cointelegraph.com/atom-2"/></entry></feed>';
  const entries = parseRssFeed(atom, { source: cointelegraph, collectedAt: AT });
  assert.deepEqual(entries.map((entry) => entry.title), ['Atom story', 'No date']);
  assert.equal(entries[0].publishedAt, '2026-10-26T08:00:00.000Z');
  assert.equal(entries[1].publishedAt, null);
  const ordered = collect(rss(
    item({ title: 'older', link: 'https://decrypt.co/a', date: 'Fri, 24 Oct 2026 10:00:00 GMT' }),
    item({ title: 'broken', link: 'https://decrypt.co/b', date: 'not a date' }),
    item({ title: 'newer', link: 'https://decrypt.co/c', date: 'Sun, 26 Oct 2026 10:00:00 GMT' }),
  ));
  assert.deepEqual(ordered.map((entry) => entry.title), ['newer', 'older', 'broken']);
});

test('the parser refuses input it cannot attribute and never invents items', () => {
  assert.deepEqual(collect(''), []);
  assert.deepEqual(collect(undefined), []);
  assert.throws(() => parseRssFeed(rss(), { collectedAt: AT }), TypeError);
  assert.throws(() => parseRssFeed(rss(), { source: { id: 'x' }, collectedAt: AT }), TypeError);
  assert.deepEqual(collect('<rss><channel><title>empty</title></channel></rss>'), []);
});

test('the source whitelist is https, uniquely identified and self-consistent', () => {
  assert.equal(LIVE_NEWS_SOURCES.length >= 3, true);
  assert.equal(new Set(LIVE_NEWS_SOURCES.map((source) => source.id)).size, LIVE_NEWS_SOURCES.length);
  for (const source of LIVE_NEWS_SOURCES) {
    for (const url of [source.url, source.home]) {
      assert.equal(new URL(url).protocol, 'https:');
    }
    assert.equal(source.hosts.includes(new URL(source.url).hostname), true);
    assert.equal(source.hosts.includes(new URL(source.home).hostname), true);
    assert.equal(Object.isFrozen(source), true);
    assert.equal(Object.isFrozen(source.hosts), true);
  }
});

test('only an explicit affirmative value enables live headlines', () => {
  for (const value of ['1', 'true', 'ENABLED', ' on ']) assert.equal(isLiveNewsEnabled(value), true);
  for (const value of ['', '0', 'false', 'off', 'yes', undefined, null, 1, true]) {
    assert.equal(isLiveNewsEnabled(value), false);
  }
});

const okFetch = (bodies) => {
  const calls = [];
  const impl = async (url) => {
    calls.push(url);
    const body = bodies[url];
    if (body === undefined) return { ok: false, status: 503, text: async () => '' };
    return { ok: true, status: 200, text: async () => body };
  };
  impl.calls = calls;
  return impl;
};

test('disabled live news makes no request at all', async () => {
  const fetchImpl = okFetch({});
  const snapshot = await readLiveNews({ enabled: '', fetchImpl, cache: createNewsCache() });
  assert.equal(snapshot.status, 'DISABLED');
  assert.equal(snapshot.reason, 'NOT_ENABLED');
  assert.deepEqual(snapshot.items, []);
  assert.equal(fetchImpl.calls.length, 0);
});

test('one broken publisher never empties a healthy collection', async () => {
  const bodies = {
    [decrypt.url]: rss(item({ title: 'Decrypt live', description: 'Short excerpt' })),
    [cointelegraph.url]: rss(item({ title: 'Cointelegraph live', link: 'https://cointelegraph.com/x' })),
  };
  const snapshot = await readLiveNews({
    enabled: 'enabled', fetchImpl: okFetch(bodies), now: () => AT, nowMs: () => 1000,
    cache: createNewsCache(),
  });
  assert.equal(snapshot.status, 'LIVE_HEADLINES');
  assert.equal(snapshot.mode, 'LIVE_THIRD_PARTY');
  assert.equal(snapshot.rightsStatus, 'HEADLINES_WITH_ATTRIBUTION_ONLY');
  assert.equal(snapshot.commercialUseAllowed, false);
  assert.equal(snapshot.fullTextStored, false);
  assert.equal(snapshot.collectedAt, AT);
  assert.equal(snapshot.sourcesRead, 2);
  assert.deepEqual(snapshot.items.map((entry) => entry.title).sort(), ['Cointelegraph live', 'Decrypt live']);
  const down = snapshot.sources.filter((source) => source.status === 'UNAVAILABLE');
  assert.deepEqual(down.map((source) => source.reason), ['HTTP_503', 'HTTP_503', 'HTTP_503']);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.items), true);
  for (const entry of snapshot.items) {
    assert.equal(typeof entry.link, 'string');
    assert.equal(new URL(entry.link).protocol, 'https:');
    assert.equal('body' in entry, false);
    assert.equal('content' in entry, false);
  }
});

test('a cached collection is reused inside the window and refreshed after it', async () => {
  const bodies = { [decrypt.url]: rss(item({ title: 'One' })) };
  const fetchImpl = okFetch(bodies);
  const cache = createNewsCache();
  let clock = 0;
  const options = { enabled: 'true', fetchImpl, now: () => AT, nowMs: () => clock, cache };
  const first = await readLiveNews(options);
  assert.equal(fetchImpl.calls.length, LIVE_NEWS_SOURCES.length);
  clock += (LIVE_NEWS_WINDOW_SECONDS - 1) * 1000;
  const second = await readLiveNews(options);
  assert.equal(fetchImpl.calls.length, LIVE_NEWS_SOURCES.length);
  assert.equal(second, first);
  clock += 2000;
  const third = await readLiveNews(options);
  assert.equal(fetchImpl.calls.length, LIVE_NEWS_SOURCES.length * 2);
  assert.notEqual(third, first);
});

test('a wholly failed collection is unavailable and briefly cached', async () => {
  const fetchImpl = okFetch({});
  const cache = createNewsCache();
  let clock = 0;
  const options = { enabled: 'on', fetchImpl, now: () => AT, nowMs: () => clock, cache };
  const first = await readLiveNews(options);
  assert.equal(first.status, 'UNAVAILABLE');
  assert.equal(first.reason, 'ALL_SOURCES_FAILED');
  assert.deepEqual(first.items, []);
  assert.equal(first.sources.length, LIVE_NEWS_SOURCES.length);
  clock += 61 * 1000;
  await readLiveNews(options);
  assert.equal(fetchImpl.calls.length, LIVE_NEWS_SOURCES.length * 2);
});

test('timeouts and missing fetch degrade to a reason instead of throwing', async () => {
  const hanging = (_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  const slow = await readLiveNews({
    enabled: '1', fetchImpl: hanging, timeoutMs: 10, now: () => AT, nowMs: () => 0, cache: createNewsCache(),
  });
  assert.equal(slow.status, 'UNAVAILABLE');
  assert.deepEqual(slow.sources.map((source) => source.reason), LIVE_NEWS_SOURCES.map(() => 'TIMEOUT'));

  const noFetch = await readLiveNews({ enabled: '1', fetchImpl: null, cache: createNewsCache() });
  assert.equal(noFetch.status, 'UNAVAILABLE');
  assert.equal(noFetch.reason, 'NO_FETCH');

  const rejecting = async () => { throw new Error('offline'); };
  const networked = await readLiveNews({
    enabled: '1', fetchImpl: rejecting, now: () => AT, nowMs: () => 0, cache: createNewsCache(),
  });
  assert.equal(networked.reason, 'ALL_SOURCES_FAILED');
  assert.deepEqual(networked.sources.map((source) => source.reason), LIVE_NEWS_SOURCES.map(() => 'NETWORK'));
});
