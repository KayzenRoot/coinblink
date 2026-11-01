import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRadar, headlineMood } from '../../../src/modules/CB-M01/home-signals.mjs';

const ITEMS = [
  { title: 'Bitcoin surges to a record high as inflows jump', sourceName: 'CoinDesk', publishedAt: '2026-11-01T10:00:00Z', link: 'https://a.example/1' },
  { title: 'Exchange hacked and funds stolen in breach', sourceName: 'Cointelegraph', publishedAt: '2026-11-01T09:00:00Z', link: 'https://b.example/2' },
  { title: 'Regulators publish new guidance for exchanges', sourceName: 'CryptoSlate', publishedAt: null, link: 'https://c.example/3' },
];

test('radar rows keep the headline, source, time and a tone', () => {
  const rows = buildRadar(ITEMS, 2);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].sourceName, 'CoinDesk');
  assert.equal(rows[0].tone, 'up');
  assert.equal(rows[1].tone, 'down');
  assert.equal(buildRadar([], 5).length, 0);
  assert.equal(buildRadar(ITEMS, 99).length, 3);
});

test('the mood index counts words in the titles and says how many it saw', () => {
  const mood = headlineMood(ITEMS);
  assert.equal(mood.total, 3);
  assert.equal(mood.positive, 1);
  assert.equal(mood.negative, 1);
  assert.equal(mood.score, 50);
  assert.equal(mood.bucket.label, 'Neutral');
  const percentages = Object.values(mood.counts).reduce((sum, value) => sum + value, 0);
  assert.equal(percentages, 3);
});

test('an empty or tiny collection yields no index at all', () => {
  assert.equal(headlineMood([]).score, null);
  const single = headlineMood([ITEMS[0]]);
  assert.equal(single.total, 1);
  assert.ok(single.score > 50);
});

test('the home renders both blocks from the collection and labels the index', () => {
  const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
  assert.ok(home.includes('buildRadar(liveNews.status === "LIVE_HEADLINES" ? liveNews.items : [], 5)'));
  assert.ok(home.includes('headlineMood(liveNews.status === "LIVE_HEADLINES" ? liveNews.items : [])'));
  assert.ok(home.includes('t("HEADLINE LEXICON")'));
  assert.ok(home.includes('Not a market measure and not advice.'));
  assert.ok(home.includes('radarRows.length > 0 ? t("LATEST COLLECTED")'));
  const css = readFileSync('src/modules/CB-M01/golden-home.css', 'utf8');
  assert.ok(css.includes('.cb-home .radar-row'));
});

test('trending counts only the tracked topics the titles actually mention', async () => {
  const { buildTrending } = await import('../../../src/modules/CB-M01/home-signals.mjs');
  const items = [
    { title: 'Bitcoin ETF inflows accelerate', link: 'https://a.example/1' },
    { title: 'Bitcoin and Ethereum ETFs break records', link: 'https://a.example/2' },
    { title: 'SEC opens a probe into an exchange hack', link: 'https://a.example/3' },
    { title: 'A quiet week for NFTs', link: 'https://a.example/4' },
  ];
  const rows = buildTrending(items, 3);
  assert.deepEqual(rows.map((row) => row.id), ['bitcoin', 'etf', 'ethereum']);
  assert.equal(rows[0].mentions, 2);
  assert.equal(rows[0].link, 'https://a.example/1', 'the link is the newest matching headline');
  assert.equal(buildTrending([], 4).length, 0);
  assert.equal(buildTrending([{ title: 'no tracked topic here' }], 4).length, 0);
  assert.equal(buildTrending(items, 99).length, 5, 'the limit never exceeds the tracked catalog');
});

test('the home renders trending from the collection and keeps the placeholder fallback', () => {
  const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
  assert.ok(home.includes('buildTrending(liveNews.status === "LIVE_HEADLINES" ? liveNews.items : [], 4)'));
  assert.ok(home.includes('t("Trending in the collection")'));
  assert.ok(home.includes('href={topic.link}'));
  assert.ok(home.includes('t("Trending demo")'));
});

test('collected headlines map to a canonical category and a decorative variant', async () => {
  const { artworkForCategory, headlineCategory } = await import('../../../src/modules/CB-M01/home-signals.mjs');
  assert.equal(headlineCategory('Bitcoin ETF inflows accelerate'), 'Bitcoin');
  assert.equal(headlineCategory('Ethereum validators earn a windfall'), 'Ethereum');
  assert.equal(headlineCategory('SEC opens a probe into an exchange'), 'Regulation');
  assert.equal(headlineCategory('Solana DeFi liquidity grows'), 'DeFi');
  assert.equal(headlineCategory('A quiet week for NFT mints'), 'NFTs');
  assert.equal(headlineCategory('Dogecoin holders wait'), 'Altcoins');
  assert.equal(headlineCategory('Analysts weigh the week ahead'), 'Market Analysis');
  assert.equal(headlineCategory(null), 'Market Analysis');
  assert.equal(artworkForCategory('Bitcoin'), 'bitcoin');
  assert.equal(artworkForCategory('Ethereum'), 'ethereum');
  assert.equal(artworkForCategory('Regulation'), 'policy');
  assert.equal(artworkForCategory('Market Analysis'), 'ecosystem');
});

test('live cards carry the artwork, the category and the publisher link', () => {
  const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
  assert.ok(home.includes('data-news-kind={homeArticlesOn ? "article" : liveOn ? "headline" : "placeholder"}'));
  assert.ok(home.includes('const category = headlineCategory(item.title)'));
  assert.ok(home.includes('<EditorialArtwork variant={artwork} />'));
  assert.ok(home.includes('rel="noreferrer noopener external">{item.title}</a>'));
  const script = readFileSync('public/home-demo.js', 'utf8');
  assert.ok(script.includes('dataset.newsKind'));
  assert.ok(script.includes('newsKind === "headline"'));
  assert.ok(script.includes('messages.liveCountMany'));
});
