import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_NEWS_CLUSTER_MAX_OTHERS,
  buildCoverageIndex,
  clusterLiveHeadlines,
  clustersForSource,
  coverageOthers,
  coveragePublishers,
  tokenizeLiveTitle,
  topCoverageClusters,
} from '../../../src/modules/CB-M03/live-clusters.mjs';

const item = (id, sourceId, title, publishedAt = '2026-10-29T10:00:00.000Z', sourceName = sourceId) => ({
  id,
  sourceId,
  sourceName,
  language: 'en',
  title,
  link: 'https://' + sourceId + '.example/' + id,
  publishedAt,
  summary: 'ignored',
});

const bitcoinA = item('a1', 'coindesk', 'Bitcoin ETF inflows hit a record high this week');
const bitcoinB = item('b1', 'theblock', 'Record highs for bitcoin ETFs as inflows accelerate', '2026-10-29T11:00:00.000Z');
const ethereum = item('e1', 'decrypt', 'Ethereum developers schedule the next network upgrade');
const solana = item('s1', 'cointelegraph', 'Solana validators vote on a fee change');
const dogeA = item('d1', 'bitcoinmagazine', 'Dogecoin rally attracts retail buyers again');
const dogeB = item('d2', 'theblock', 'Retail buyers return as dogecoin rally continues', '2026-10-29T09:00:00.000Z');

test('titles are reduced to significant words without stemming', () => {
  assert.deepEqual([...tokenizeLiveTitle('Bitcoin ETF inflows hit a record high this week')].sort(),
    ['bitcoin', 'etf', 'high', 'hit', 'inflow', 'record']);
  assert.deepEqual([...tokenizeLiveTitle('Criptomoedas: regulação avança')].sort(),
    ['avanca', 'criptomoeda', 'regulacao']);
  assert.equal(tokenizeLiveTitle(null).size, 0);
  assert.equal(tokenizeLiveTitle('').size, 0);
  // Business and analysis keep their "s": only a plain trailing plural is folded.
  assert.ok(tokenizeLiveTitle('Business analysis').has('business'));
  assert.ok(tokenizeLiveTitle('Business analysis').has('analysis'));
});

test('the same story from two publishers forms one cluster', () => {
  assert.deepEqual(clusterLiveHeadlines([bitcoinA]), []);
  const clusters = clusterLiveHeadlines([bitcoinA, bitcoinB]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].coverage, 2);
  assert.equal(clusters[0].members.length, 2);
  // Newest first, deterministic.
  assert.deepEqual(clusters[0].members.map((member) => member.id), ['b1', 'a1']);
  assert.equal(clusters[0].latestAt, '2026-10-29T11:00:00.000Z');
  assert.equal(Object.isFrozen(clusters), true);
  assert.equal(Object.isFrozen(clusters[0]), true);
  assert.equal(Object.isFrozen(clusters[0].members), true);
  assert.equal(Object.isFrozen(clusters[0].members[0]), true);
  assert.equal(clusters[0].members[0].language, 'en');
  const withoutLanguage = clusterLiveHeadlines([bitcoinA, { ...bitcoinB, language: undefined }]);
  assert.equal(withoutLanguage[0].members[0].language, null);
});

test('unrelated stories and same-publisher duplicates never cluster', () => {
  assert.deepEqual(clusterLiveHeadlines([bitcoinA, ethereum, solana]), []);
  assert.deepEqual(clusterLiveHeadlines([bitcoinA, { ...bitcoinA, id: 'a2' }]), []);
  // A title with fewer than four significant words is skipped, even when equal.
  const shortA = item('x1', 'coindesk', 'Bitcoin hits high');
  const shortB = item('x2', 'theblock', 'Bitcoin hits high');
  assert.deepEqual(clusterLiveHeadlines([shortA, shortB]), []);
});

test('a cluster spans every publisher and the option can tighten the match', () => {
  const third = item('c1', 'decrypt', 'Bitcoin ETF inflows reach a record high');
  const clusters = clusterLiveHeadlines([bitcoinA, bitcoinB, third]);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].coverage, 3);
  assert.deepEqual(clusterLiveHeadlines([bitcoinA, bitcoinB], { minShared: 6 }), []);
  assert.deepEqual(clusterLiveHeadlines([bitcoinA, bitcoinB], { minSimilarity: 0.99 }), []);
});

test('coverage lists one link per other publisher and excludes the item itself', () => {
  const third = item('c1', 'decrypt', 'Bitcoin ETF inflows reach a record high');
  const clusters = clusterLiveHeadlines([bitcoinA, bitcoinB, third]);
  const cluster = clusters[0];
  const others = coverageOthers(cluster, 'a1');
  assert.deepEqual(others.map((member) => member.sourceId), ['theblock', 'decrypt']);
  assert.equal(coverageOthers(cluster, 'a1', 1).length, 1);
  assert.equal(coverageOthers(cluster, 'a1', 0).length, 2, 'an invalid limit falls back');
  assert.deepEqual(coverageOthers(cluster, 'missing'), []);
  assert.deepEqual(coverageOthers(null, 'a1'), []);
  assert.equal(coverageOthers(cluster, 'a1').length <= LIVE_NEWS_CLUSTER_MAX_OTHERS, true);
});

test('clusters are ordered by coverage, then recency, and capped', () => {
  const third = item('c1', 'decrypt', 'Bitcoin ETF inflows reach a record high');
  const fourth = item('c2', 'cointelegraph', 'Bitcoin ETF record highs as inflows accelerate');
  const clusters = clusterLiveHeadlines([dogeA, dogeB, bitcoinA, bitcoinB, third, fourth]);
  assert.equal(clusters.length, 2);
  assert.equal(clusters[0].coverage, 4);
  assert.equal(clusters[1].coverage, 2);
  assert.equal(clusterLiveHeadlines([dogeA, dogeB, bitcoinA, bitcoinB, third, fourth], { maxClusters: 1 }).length, 1);
});

test('malformed items are skipped and input order does not change the result', () => {
  const broken = [null, 42, 'title', { id: '', title: 'x', link: 'y', sourceId: 'z' },
    { id: 'q', title: 'Bitcoin ETF inflows hit a record high this week', link: '', sourceId: 'coindesk' }];
  assert.deepEqual(clusterLiveHeadlines(broken), []);
  assert.deepEqual(clusterLiveHeadlines(null), []);
  assert.deepEqual(clusterLiveHeadlines('nope'), []);
  const forward = clusterLiveHeadlines([bitcoinA, bitcoinB, dogeA, dogeB]);
  const backward = clusterLiveHeadlines([dogeB, dogeA, bitcoinB, bitcoinA]);
  assert.deepEqual(forward.map((cluster) => cluster.id), backward.map((cluster) => cluster.id));
});

test('the coverage index maps every clustered headline to its cluster', () => {
  const clusters = clusterLiveHeadlines([bitcoinA, bitcoinB]);
  const index = buildCoverageIndex(clusters);
  assert.equal(index.size, 2);
  assert.equal(index.get('a1'), clusters[0]);
  assert.equal(index.get('b1'), clusters[0]);
  assert.equal(index.get('unknown'), undefined);
  assert.equal(buildCoverageIndex(null).size, 0);
  assert.equal(buildCoverageIndex([{ members: [null, { id: '' }] }]).size, 0);
});

test('the highlight strip picks the most covered stories and one link per publisher', () => {
  const third = item('c1', 'decrypt', 'Bitcoin ETF inflows reach a record high');
  const fourth = item('c2', 'cointelegraph', 'Bitcoin ETF record highs as inflows accelerate');
  const clusters = clusterLiveHeadlines([dogeA, dogeB, bitcoinA, bitcoinB, third, fourth]);
  const top = topCoverageClusters(clusters);
  assert.equal(top.length, 2);
  assert.equal(top[0].coverage, 4);
  assert.equal(topCoverageClusters(clusters, 1).length, 1);
  assert.deepEqual(topCoverageClusters(null), []);
  assert.deepEqual(topCoverageClusters([{ coverage: 1, members: [] }]), []);
  assert.equal(Object.isFrozen(top), true);
  assert.deepEqual(coveragePublishers(top[0]).map((member) => member.sourceId),
    ['theblock', 'coindesk', 'decrypt', 'cointelegraph']);
  assert.equal(coveragePublishers({ members: [bitcoinA, { ...bitcoinA, id: 'a2' }] }).length, 1);
  assert.deepEqual(coveragePublishers(null), []);
});

test('a publisher filter keeps whole stories, including the other publishers', () => {
  const third = item('c1', 'decrypt', 'Bitcoin ETF inflows reach a record high');
  const clusters = clusterLiveHeadlines([dogeA, dogeB, bitcoinA, bitcoinB, third]);
  const bitcoinOnly = clustersForSource(clusters, 'coindesk');
  assert.equal(bitcoinOnly.length, 1);
  assert.equal(bitcoinOnly[0].members.length, 3);
  assert.deepEqual(bitcoinOnly[0].members.map((member) => member.sourceId),
    ['theblock', 'coindesk', 'decrypt']);
  assert.equal(clustersForSource(clusters, 'unknown').length, 0);
  assert.deepEqual(clustersForSource(null, 'coindesk'), []);
  assert.deepEqual(clustersForSource(clusters, ''), []);
  assert.equal(Object.isFrozen(bitcoinOnly), true);
});
