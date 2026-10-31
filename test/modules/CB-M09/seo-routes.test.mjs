import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
const component = readFileSync('src/modules/CB-M05/ArticlePage.astro', 'utf8');
const sitemap = readFileSync('src/pages/sitemap.xml.ts', 'utf8');
const robots = readFileSync('src/pages/robots.txt.ts', 'utf8');

test('a page can override the robots directive, defaulting to noindex', () => {
  assert.match(layout, /robots\?: string;/u);
  assert.match(layout, /content=\{robots \?\? seo\.robots\}/u);
});

test('only a published article becomes indexable', () => {
  for (const locale of ['en', 'pt-br', 'es']) {
    const route = readFileSync('src/pages/' + locale + '/article/[slug].astro', 'utf8');
    assert.match(route, /robots=\{article && article\.status === "published" \? "index, follow" : "noindex, nofollow"\}/u,
      locale);
  }
  assert.match(component, /robots=\{robots\}/u);
});

test('the sitemap lists every locale route and every published article', () => {
  for (const marker of ['"en", "pt-br", "es"', '"/news"', 'base + "/developers"', 'base + "/status"',
    'base + "/newsletter"', 'listArticles({ db, limit: 200 })', '"/article/" + article.slug']) {
    assert.ok(sitemap.includes(marker), marker);
  }
  assert.match(sitemap, /application\/xml/u);
  assert.match(sitemap, /replaceAll\("&", "&amp;"\)/u);
});

test('robots.txt points at the sitemap and allows crawling', () => {
  assert.match(robots, /User-agent: \*\\nAllow: \//u);
  assert.match(robots, /Sitemap: " \+ base \+ "\/sitemap\.xml/u);
  assert.match(robots, /text\/plain/u);
});

test('the weekly cost report is the only scheduled workflow with a secret', () => {
  const workflow = readFileSync('.github/workflows/cost-report.yml', 'utf8');
  assert.match(workflow, /schedule:/u);
  assert.match(workflow, /# owner-authorized-schedule/u);
  assert.match(workflow, /contents: read/u);
  assert.doesNotMatch(workflow, /contents: write/u);
});
