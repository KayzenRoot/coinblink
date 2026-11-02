import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildFeed, isFeedLocale, rfc822 } from '../../../src/modules/CB-M09/feed.mjs';

const ARTICLES = [
  { locale: 'en', slug: 'bitcoin-etf', title: 'Bitcoin ETF <record>', summary: 'Inflows & outflows', status: 'published', publishedAt: 1790000000 },
  { locale: 'en', slug: 'draft-one', title: 'Hidden draft', summary: 'x', status: 'unpublished', publishedAt: 1790000100 },
];

test('the feed carries only published articles, escaped and linked to their page', () => {
  const xml = buildFeed({ locale: 'en', origin: 'https://coinblink.example/', articles: ARTICLES, nowMs: 1790000200000 });
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/u);
  assert.match(xml, /<link>https:\/\/coinblink.example\/en\/article\/bitcoin-etf<\/link>/u);
  assert.match(xml, /Bitcoin ETF &lt;record&gt;/u);
  assert.match(xml, /Inflows &amp; outflows/u);
  assert.doesNotMatch(xml, /Hidden draft/u, 'unpublished articles never enter the feed');
  assert.match(xml, /<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/u);
  assert.equal((xml.match(/<item>/gu) ?? []).length, 1);
});

test('an empty locale still produces a valid channel', () => {
  const xml = buildFeed({ locale: 'es', origin: 'https://coinblink.example', articles: [] });
  assert.match(xml, /<channel>/u);
  assert.match(xml, /<language>es<\/language>/u);
  assert.doesNotMatch(xml, /<item>/u);
});

test('locales and dates are bounded', () => {
  assert.equal(isFeedLocale('en'), true);
  assert.equal(isFeedLocale('pt-br'), true);
  assert.equal(isFeedLocale('es'), true);
  assert.equal(isFeedLocale('fr'), false);
  assert.match(rfc822(0), /^Thu, 01 Jan 1970 00:00:00 GMT$/u);
  assert.match(rfc822('nonsense'), /1970/u);
});

test('the route, the layout link and the sitemap expose the feed', () => {
  const route = readFileSync('src/pages/[locale]/feed.xml.ts', 'utf8');
  assert.match(route, /buildFeed\(\{ locale, origin, articles \}\)/u);
  assert.match(route, /application\/rss\+xml/u);
  const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
  assert.match(layout, /type="application\/rss\+xml"/u);
  const sitemap = readFileSync('src/pages/sitemap.xml.ts', 'utf8');
  assert.match(sitemap, /"\/newsletter\/editions"/u);
  assert.match(sitemap, /"\/editorial"/u);
  assert.match(sitemap, /"\/legal"/u);
});
