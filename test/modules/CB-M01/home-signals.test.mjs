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
