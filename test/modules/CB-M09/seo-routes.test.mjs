import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
const middleware = readFileSync('src/middleware.ts', 'utf8');
const sitemap = readFileSync('src/pages/sitemap.xml.ts', 'utf8');
const robots = readFileSync('src/pages/robots.txt.ts', 'utf8');

test('the layout and middleware use the robots directive requested by the route', () => {
  assert.match(layout, /requested: Astro\.locals\.seoRobotsRequested/u);
  assert.match(middleware, /requested: context\.locals\.seoRobotsRequested/u);
  assert.match(layout, /resolveRobotsDirective\(/u);
  assert.match(layout, /content=\{robotsDirective\}/u);
});

test('editorials and published articles request indexing before rendering', () => {
  for (const locale of ['en', 'pt-br', 'es']) {
    const origin = 'src/pages/' + locale;
    const article = readFileSync(origin + '/article/[slug].astro', 'utf8');
    const editorial = readFileSync(origin + '/editorial.astro', 'utf8');
    assert.match(article.split('---')[1], /if \(article === null\) Astro\.response\.status = 404;\s*else if \(article\.status !== "published"\) Astro\.response\.status = 410;\s*else Astro\.locals\.seoRobotsRequested = INDEX_DIRECTIVE;/u);
    assert.match(editorial.split('---')[1], /Astro\.locals\.seoRobotsRequested = INDEX_DIRECTIVE;/u);
  }
});

test('the sitemap lists approved editorials and published articles only after production opt-in', () => {
  for (const marker of ['"en", "pt-br", "es"', 'publicIndexingEnabled(config)',
    '"/editorial"', 'listPublishedSitemapPaths({ db })', 'new Set<string>()']) {
    assert.ok(sitemap.includes(marker), marker);
  }
  for (const forbidden of ['"/news"', '"/legal"', '"/newsletter"', 'listArticles({ db, limit: 200 })']) {
    assert.ok(!sitemap.includes(forbidden), forbidden);
  }
  assert.match(sitemap, /status: 503/u);
  assert.match(sitemap, /cache-control": "no-store"/u);
  assert.match(sitemap, /application\/xml/u);
  assert.match(sitemap, /replaceAll\("&", "&amp;"\)/u);
});

test('robots.txt uses the production opt-in policy for crawling and sitemap discovery', () => {
  assert.match(robots, /const config = seoIndexingConfig\(request\)/u);
  assert.match(robots, /buildRobotsText\(config\)/u);
  assert.match(robots, /publicIndexingEnabled\(config\) \? "public, max-age=3600" : "no-store"/u);
  assert.match(robots, /text\/plain/u);
});

test('the weekly cost report is the only scheduled workflow with a secret', () => {
  const workflow = readFileSync('.github/workflows/cost-report.yml', 'utf8');
  assert.match(workflow, /schedule:/u);
  assert.match(workflow, /# owner-authorized-schedule/u);
  assert.match(workflow, /contents: read/u);
  assert.doesNotMatch(workflow, /contents: write/u);
});

test('no static robots.txt shadows the route that carries the sitemap', () => {
  assert.equal(existsSync('public/robots.txt'), false);
});
