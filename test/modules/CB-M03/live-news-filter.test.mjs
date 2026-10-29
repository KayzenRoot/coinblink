import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_NEWS_ALL_SOURCES, clampLiveSearchQuery, clampLiveSince, clampLiveSource,
  filterLiveHeadlines, matchesLiveHeadline, normalizeLiveSearch,
} from '../../../src/modules/CB-M03/live-news-filter.mjs';
import {
  LIVE_NEWS_MAX_ITEMS, LIVE_NEWS_MAX_PER_SOURCE, LIVE_NEWS_QUERY_MAX, LIVE_NEWS_SINCE_OPTIONS,
  LIVE_NEWS_SOURCES,
} from '../../../src/modules/CB-M03/rss-sources.mjs';
import { normalizeSearchText } from '../../../src/modules/CB-M02/news-filter.mjs';

const item = (over = {}) => ({
  id: 'decrypt:1',
  title: 'Fed Stands Pat, Bitcoin Holds Steady',
  summary: 'A December rate hike is in play.',
  sourceId: 'decrypt',
  sourceName: 'Decrypt',
  sourceHome: 'https://decrypt.co',
  link: 'https://decrypt.co/1',
  publishedAt: null,
  collectedAt: '2026-10-26T12:00:00.000Z',
  ...over,
});

test('search folds accents and case the same way the news catalog does', () => {
  const samples = ['SEGURANCA', 'Segurança', 'Notícias', 'ação', '  padded  ', 'CAFÉ', 'æøå', '', '12345'];
  for (const sample of samples) {
    assert.equal(normalizeLiveSearch(sample), normalizeSearchText(sample), JSON.stringify(sample));
  }
  assert.equal(normalizeLiveSearch(undefined), '');
  assert.equal(normalizeLiveSearch(42), '');
});

test('query and source are clamped to safe values', () => {
  assert.equal(LIVE_NEWS_QUERY_MAX, 80);
  assert.equal(clampLiveSearchQuery('  spread  '), 'spread');
  assert.equal(clampLiveSearchQuery('x'.repeat(120)).length, 80);
  assert.equal(clampLiveSearchQuery(undefined), '');
  assert.equal(clampLiveSearchQuery(42), '');
  for (const value of ['decrypt', 'coindesk', 'bitcoinmagazine']) {
    assert.equal(clampLiveSource(value), value);
  }
  for (const value of ['', 'ALL', 'constructor', '__proto__', 'https://evil.example', undefined, 1]) {
    assert.equal(clampLiveSource(value), LIVE_NEWS_ALL_SOURCES);
  }
});

test('matching covers title, excerpt and publisher, and is accent-insensitive', () => {
  assert.equal(matchesLiveHeadline(item(), { query: 'bitcoin' }), true);
  assert.equal(matchesLiveHeadline(item(), { query: 'DEZEMBRO' }), false);
  assert.equal(matchesLiveHeadline(item({ title: 'Ação regulatória' }), { query: 'acao' }), true);
  // Publisher names are a select, not text: a chip count and a query agree.
  assert.equal(matchesLiveHeadline(item(), { query: 'decrypt' }), false);
  assert.equal(matchesLiveHeadline(item({ title: 'CoinDesk exclusive' }), { query: 'coindesk' }), true);
  assert.equal(matchesLiveHeadline(item(), { query: 'rate hike' }), true);
  assert.equal(matchesLiveHeadline(item(), { query: 'ethereum' }), false);
  assert.equal(matchesLiveHeadline(item(), { query: '', source: 'decrypt' }), true);
  assert.equal(matchesLiveHeadline(item(), { source: 'cointelegraph' }), false);
  assert.equal(matchesLiveHeadline(item(), { query: 'bitcoin', source: 'decrypt' }), true);
  assert.equal(matchesLiveHeadline(null), false);
});

test('filtering preserves order, is frozen and never mutates its input', () => {
  const items = Object.freeze([
    item({ id: 'a', sourceId: 'decrypt' }),
    item({ id: 'b', sourceId: 'cointelegraph', sourceName: 'Cointelegraph', title: 'ETF inflows' }),
    item({ id: 'c', sourceId: 'decrypt', title: 'Stablecoin supply' }),
  ]);
  const all = filterLiveHeadlines(items, {});
  assert.deepEqual(all.map((entry) => entry.id), ['a', 'b', 'c']);
  assert.equal(Object.isFrozen(all), true);
  assert.deepEqual(filterLiveHeadlines(items, { source: 'decrypt' }).map((entry) => entry.id), ['a', 'c']);
  assert.deepEqual(filterLiveHeadlines(items, { query: 'stablecoin' }).map((entry) => entry.id), ['c']);
  assert.deepEqual(filterLiveHeadlines(items, { source: 'coindesk' }), []);
  assert.deepEqual(filterLiveHeadlines(null), []);
});

test('the collection keeps a per-source limit and a larger total budget', () => {
  assert.equal(LIVE_NEWS_MAX_PER_SOURCE, 20);
  assert.equal(LIVE_NEWS_MAX_ITEMS, 60);
  assert.ok(LIVE_NEWS_MAX_ITEMS > LIVE_NEWS_MAX_PER_SOURCE);
  assert.equal(LIVE_NEWS_SOURCES.length * LIVE_NEWS_MAX_PER_SOURCE >= LIVE_NEWS_MAX_ITEMS, true);
});

test('only the reviewed time windows are accepted', () => {
  assert.deepEqual([...LIVE_NEWS_SINCE_OPTIONS], [3, 12, 24]);
  assert.equal(clampLiveSince('3'), 3);
  assert.equal(clampLiveSince(12), 12);
  assert.equal(clampLiveSince('24'), 24);
  for (const value of ['2', '48', '', 'all', undefined, null, 'constructor', 7]) {
    assert.equal(clampLiveSince(value), 0);
  }
});

test('a time window hides old and undated headlines without reordering', () => {
  const nowMs = Date.parse('2026-10-29T12:00:00Z');
  const items = [
    item({ id: 'fresh', publishedAt: '2026-10-29T10:00:00.000Z' }),
    item({ id: 'old', publishedAt: '2026-10-29T02:00:00.000Z' }),
    item({ id: 'undated', publishedAt: null }),
  ];
  assert.deepEqual(filterLiveHeadlines(items, { sinceHours: 3, nowMs }).map((entry) => entry.id), ['fresh']);
  assert.deepEqual(filterLiveHeadlines(items, { sinceHours: 12, nowMs }).map((entry) => entry.id),
    ['fresh', 'old']);
  assert.deepEqual(filterLiveHeadlines(items, { sinceHours: 24, nowMs }).map((entry) => entry.id),
    ['fresh', 'old']);
  assert.deepEqual(filterLiveHeadlines(items, { nowMs }).map((entry) => entry.id),
    ['fresh', 'old', 'undated']);
});

test('query, publisher and window combine in one pass', () => {
  const nowMs = Date.parse('2026-10-29T12:00:00Z');
  const items = [
    item({ id: 'a', title: 'Bitcoin ETF inflows', sourceId: 'decrypt',
      publishedAt: '2026-10-29T11:00:00.000Z' }),
    item({ id: 'b', title: 'Bitcoin miners', sourceId: 'coindesk',
      publishedAt: '2026-10-29T11:00:00.000Z' }),
    item({ id: 'c', title: 'Ethereum upgrade', sourceId: 'decrypt',
      publishedAt: '2026-10-29T11:00:00.000Z' }),
    item({ id: 'd', title: 'Bitcoin ETF history', sourceId: 'decrypt',
      publishedAt: '2026-10-28T11:00:00.000Z' }),
  ];
  assert.deepEqual(filterLiveHeadlines(items, {
    query: 'bitcoin', source: 'decrypt', sinceHours: 3, nowMs,
  }).map((entry) => entry.id), ['a']);
});
