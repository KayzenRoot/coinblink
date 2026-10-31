import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync('src/modules/CB-M05/PublishedArticles.astro', 'utf8');
const newsPage = readFileSync('src/modules/CB-M09/LocalizedNewsPage.astro', 'utf8');
const home = readFileSync('src/modules/CB-M01/GoldenHome.astro', 'utf8');
const css = readFileSync('src/styles/global.css', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

test('the news index lists published owner articles per locale', () => {
  for (const marker of ['listArticles(', 'locale, limit: 12', 'data-cb-published',
    'href={`/${locale}/article/${article.slug}`}', 'article.summary', 'article.authorLabel']) {
    assert.ok(component.includes(marker), marker);
  }
  assert.match(newsPage, /<PublishedArticles locale=\{locale\} \/>/u);
  // The list renders on the index branch only, never for an article detail.
  assert.match(newsPage, /detail\s*\?\s*<NewsArticle/u);
  assert.equal((newsPage.match(/<PublishedArticles locale=\{locale\} \/>/gu) ?? []).length, 1);
});

test('the empty state is stated per locale instead of an empty box', () => {
  assert.match(component, /Nothing published in this language yet/u);
  assert.match(component, /Nada publicado neste idioma ainda/u);
  assert.match(component, /Todavía no hay nada publicado/u);
});

test('the published list has its own styles', () => {
  assert.match(css, /\.published__list\{/u);
  assert.match(css, /\.published__list a\{/u);
});

test('the home footer links to the newsletter', () => {
  assert.match(home, /<a href="\/newsletter">\{t\("Newsletter"\)\}<\/a>/u);
});

test('minimatch is forced above the patched version', () => {
  assert.equal(pkg.overrides.minimatch, '^11.0.1');
});
