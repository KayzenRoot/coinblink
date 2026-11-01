import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
const copy = readFileSync('src/modules/CB-M01/home-copy.mjs', 'utf8');
const css = readFileSync('src/modules/CB-M01/golden-home.css', 'utf8');

test('the home reads the real collection behind the deployment switch', () => {
  assert.match(home, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u);
  assert.match(home, /liveNews\.status === "LIVE_HEADLINES"/u);
  assert.match(home, /liveItems: LiveHeadline\[\]/u);
});

test('live headlines are attributed and link out, never copied', () => {
  assert.match(home, /<div class="news-cards news-cards--live">/u);
  assert.match(home, /data-news-card data-category-value=\{category\}/u);
  assert.match(home, /<EditorialArtwork variant=\{artwork\} \/>/u);
  assert.match(home, /href=\{item\.link\} rel="noreferrer noopener external"/u);
  assert.match(home, /\{item\.sourceName\}/u);
  assert.match(home, /<time datetime=\{item\.publishedAt/u);
  assert.doesNotMatch(home, /item\.description|item\.content/u);
});

test('the panel keeps the reviewed placeholders when the collection is off', () => {
  assert.ok(home.includes(') : ('), 'ternary fallback');
  assert.ok(home.includes('<div class="news-cards">'), 'demo cards');
  assert.match(home, /DEMO · NO STORIES CONNECTED/u);
});

test('the copy states which mode is on, in three locales', () => {
  assert.match(home, /liveOn \? t\("LIVE · ATTRIBUTED HEADLINES"\)/u);
  assert.match(home, /liveOn \? t\("Attributed headlines from public feeds · no market data"\)/u);
  for (const key of ['"LIVE · ATTRIBUTED HEADLINES"', 'headlines:', '"LIVE HEADLINES"',
    '"Attributed headlines from public feeds · no market data"']) {
    assert.ok(copy.includes(key), key);
  }
  assert.equal((copy.match(/Manchetes|manchetes|Titulares|titulares/gu) ?? []).length > 2, true);
});

test('the live list has its own styles', () => {
  assert.match(css, /\.cb-home \.news-live\{/u);
  assert.match(css, /\.cb-home \.news-live b\{/u);
});
