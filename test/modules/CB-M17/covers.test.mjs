import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync('src/pages/article-cover/[locale]/[slug].svg.ts', 'utf8');
const page = readFileSync('src/modules/CB-M05/ArticlePage.astro', 'utf8');

test('the cover route is deterministic and reads the published article', () => {
  for (const marker of ['readArticle(', 'article.status !== "published"', 'image/svg+xml',
    's-maxage=604800', 'escapeXml']) {
    assert.ok(route.includes(marker), marker);
  }
  assert.match(route, /const WIDTH = 1200;/u);
  assert.match(route, /const HEIGHT = 630;/u);
});

test('the title is wrapped into at most three lines and escaped', () => {
  assert.match(route, /const MAX_LINES = 3;/u);
  assert.match(route, /replaceAll\("&", "&amp;"\)/u);
  assert.match(route, /replaceAll\("<", "&lt;"\)/u);
  assert.match(route, /\.replace\(\/\.\{2\}\$\/u, ""\) \+ "…"/u);
});

test('an unknown or unpublished article is not covered', () => {
  assert.match(route, /article === null \|\| article\.status !== "published"/u);
  assert.match(route, /status: 404/u);
});

test('the article page renders the cover with dimensions and empty alt', () => {
  assert.match(page, /\/article-cover\/" \+ locale \+ "\/" \+ slug \+ "\.svg"/u);
  assert.match(page, /class="article__cover" src=\{cover\} width="1200" height="630" alt=""/u);
  for (const locale of ['en', 'pt-br', 'es']) {
    const file = readFileSync('src/pages/' + locale + '/article/[slug].astro', 'utf8');
    assert.match(file, /slug=\{slug\}/u, locale);
  }
});
