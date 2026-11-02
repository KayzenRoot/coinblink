import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeQuery, searchContent } from '../../../src/modules/CB-M02/search.mjs';

const ARTICLES = [
  { locale: 'en', slug: 'bitcoin-etf', title: 'Bitcoin ETF inflows', summary: 'Inflows into spot funds', tags: [] },
  { locale: 'en', slug: 'sec-probe', title: 'SEC opens a probe', summary: 'Regulator action', tags: [] },
];
const HEADLINES = [
  { title: 'Bitcoin ETF volumes rise', sourceName: 'CoinDesk', link: 'https://a.example/1', publishedAt: '2026-11-01T10:00:00Z' },
  { title: 'Ethereum upgrade ships', sourceName: 'Cointelegraph', link: 'https://b.example/2', publishedAt: null },
];

test('the query is bounded and empty input searches nothing', () => {
  assert.equal(normalizeQuery('  bitcoin  '), 'bitcoin');
  assert.equal(normalizeQuery('x'.repeat(200)).length, 80);
  const empty = searchContent({ articles: ARTICLES, headlines: HEADLINES, query: '   ' });
  assert.equal(empty.query, '');
  assert.deepEqual(empty.articles, []);
  assert.deepEqual(empty.headlines, []);
});

test('articles link to our page and headlines keep the publisher link', () => {
  const result = searchContent({ articles: ARTICLES, headlines: HEADLINES, query: 'bitcoin' });
  assert.equal(result.articles.length, 1);
  assert.equal(result.articles[0].href, '/en/article/bitcoin-etf');
  assert.equal(result.headlines.length, 1);
  assert.equal(result.headlines[0].link, 'https://a.example/1');
  assert.equal(searchContent({ articles: ARTICLES, headlines: HEADLINES, query: 'ethereum' }).articles.length, 0);
  assert.equal(searchContent({ articles: ARTICLES, headlines: HEADLINES, query: 'nothing-here' }).headlines.length, 0);
});

test('the page is a GET form with no script and localized copy', () => {
  const page = readFileSync('src/pages/[locale]/search.astro', 'utf8');
  assert.match(page, /method="get"/u);
  assert.match(page, /action=\{`\/\$\{localeKey\}\/search`\}/u);
  assert.match(page, /role="search"/u);
  assert.match(page, /Buscar no CoinBlink/u);
  assert.match(page, /Buscar en CoinBlink/u);
  assert.doesNotMatch(page, /<script/iu);
  const article = readFileSync('src/modules/CB-M05/ArticlePage.astro', 'utf8');
  assert.match(article, /\/search`\}/u);
});
