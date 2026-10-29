import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const LOCALES = ['en', 'pt-br', 'es'];
const pages = LOCALES.map((locale) => ({
  locale,
  source: readFileSync('src/pages/' + locale + '/news/live.astro', 'utf8'),
}));
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');
const reader = readFileSync('src/modules/CB-M03/live-news.mjs', 'utf8');
const parser = readFileSync('src/modules/CB-M03/rss-parse.mjs', 'utf8');
const sources = readFileSync('src/modules/CB-M03/rss-sources.mjs', 'utf8');

test('each locale page is server-rendered, gated and passes its own locale', () => {
  for (const { locale, source } of pages) {
    assert.match(source, /export const prerender = false/u, locale);
    assert.match(source, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u, locale);
    assert.match(source, new RegExp('getLiveNewsCopy\\("' + locale + '"\\)', 'u'), locale);
    assert.match(source, new RegExp('<LiveNewsPanel snapshot=\\{snapshot\\} locale="' + locale + '" />', 'u'), locale);
    assert.doesNotMatch(source, /set:html|is:inline|client:/u, locale);
  }
});

test('the panel escapes feed text and localizes its chrome', () => {
  assert.doesNotMatch(panel, /set:html/u);
  assert.doesNotMatch(panel, /<script[^>]*\bis:inline\b/u);
  assert.ok(panel.includes('import "./saved-searches.client.mjs"'));
  assert.match(panel, /getLiveNewsCopy/u);
  assert.match(panel, /fillLiveNewsCopy/u);
  assert.match(panel, /<a href=\{item\.link\} rel="noreferrer noopener external">\{item\.title\}<\/a>/u);
  assert.match(panel, /<a href=\{item\.sourceHome\} rel="noreferrer noopener external">\{item\.sourceName\}<\/a>/u);
  assert.match(panel, /data-m03-live="disabled"/u);
  assert.match(panel, /data-m03-live="unavailable"/u);
  assert.match(panel, /data-m03-live="live"/u);
  assert.match(panel, /copy\.warning/u);
  assert.match(panel, /copy\.rightsNote/u);
  assert.match(panel, /copy\.undated/u);
  assert.match(panel, /data-m03-live-filter/u);
  assert.match(panel, /data-m03-live-count/u);
  assert.match(panel, /data-m03-live-empty/u);
  assert.match(panel, /filterLiveHeadlines/u);
  assert.match(panel, /method="get"/u);
});

test('filtering is local to the collected snapshot and cannot fetch', () => {
  const filter = readFileSync('src/modules/CB-M03/live-news-filter.mjs', 'utf8');
  assert.match(filter, /export function filterLiveHeadlines/u);
  assert.match(filter, /export function clampLiveSource/u);
  assert.doesNotMatch(filter, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/u);
  assert.match(filter, /LIVE_NEWS_SOURCES/u);
});

test('the news index shows a compact, attributed strip only when live', () => {
  const strip = readFileSync('src/modules/CB-M03/LiveHeadlineStrip.astro', 'utf8');
  assert.doesNotMatch(strip, /set:html|<script/u);
  assert.ok(strip.includes('items.slice(0, 3)'), 'the strip is capped at three headlines');
  assert.ok(strip.includes('rel="noreferrer noopener external"'));
  assert.ok(strip.includes('data-m03-live-strip'));
  assert.ok(strip.includes('/news/live'));
  assert.ok(strip.includes('copy.stripNote'));
  assert.ok(strip.includes('copy.stripAll'));
  const workbench = readFileSync('src/modules/CB-M02/NewsWorkbench.astro', 'utf8');
  assert.ok(workbench.includes('<slot name="live" />'));
  const page = readFileSync('src/modules/CB-M09/LocalizedNewsPage.astro', 'utf8');
  assert.ok(page.includes('readLiveNews({ enabled: import.meta.env.PUBLIC_NEWS_LIVE })'));
  assert.ok(page.includes('<LiveHeadlineStrip slot="live"'));
});

test('topics are counted locally and link back into the filter', () => {
  const topics = readFileSync('src/modules/CB-M03/live-news-topics.mjs', 'utf8');
  assert.match(topics, /export function extractLiveTopics/u);
  assert.doesNotMatch(topics, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/u);
  assert.ok(panel.includes('extractLiveTopics'));
  assert.ok(panel.includes('data-m03-live-topics'));
  assert.ok(panel.includes('const topicHref = (term: string) => viewHref(term, source, sinceHours)'));
  assert.ok(panel.includes('copy.topicsTitle'));
  assert.ok(panel.includes('copy.topicsNote'));
});

test('the demo lab no longer serves the live reader', () => {
  assert.equal(existsSync('src/pages/demo/news/live.astro'), false);
});

test('no checked-in document still advertises the retired route', () => {
  const files = [
    'docs/automation/env.example', 'docs/automation/CLOUDFLARE_DEPLOYMENT.md',
    'docs/product/CB-M03-P1-LIVE-RSS-001.md', '.github/workflows/cloudflare-production.yml',
  ];
  for (const file of files) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /\/demo\/news\/live/u, file);
  }
});

test('the news index links to the live page in every locale', () => {
  const workbench = readFileSync('src/modules/CB-M02/NewsWorkbench.astro', 'utf8');
  assert.match(workbench, /base \+ "\/live"/u);
  assert.match(workbench, /copy\.liveHeadlines/u);
  const i18n = readFileSync('src/modules/CB-M02/news-i18n.mjs', 'utf8');
  assert.equal([...i18n.matchAll(/liveHeadlines:/gu)].length, LOCALES.length);
});

test('the reader keeps I/O, parsing and policy in separate layers', () => {
  assert.match(sources, /export const LIVE_NEWS_SOURCES/u);
  assert.doesNotMatch(sources, /fetch\s*\(/u);
  assert.doesNotMatch(parser, /fetch\s*\(|XMLHttpRequest|new Function|\beval\s*\(/u);
  assert.match(reader, /from "\.\/rss-sources\.mjs"/u);
  assert.match(reader, /from "\.\/rss-parse\.mjs"/u);
  assert.doesNotMatch(reader, /new Function|\beval\s*\(/u);
  assert.doesNotMatch(reader, /localStorage|sessionStorage|indexedDB|caches\.(open|put)/u);
  assert.doesNotMatch(reader, /setInterval/u);
});

test('no other M03 module gained network or storage access', () => {
  const files = readdirSync('src/modules/CB-M03', { recursive: true })
    .filter((name) => name.endsWith('.mjs') && name !== 'live-news.mjs');
  for (const file of files) {
    const source = readFileSync('src/modules/CB-M03/' + file, 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(/u, file + ' must stay offline');
  }
});

test('the live page offers a local, shareable time window', () => {
  assert.ok(panel.includes('data-m03-live-since'));
  assert.ok(panel.includes('clampLiveSince'));
  assert.ok(panel.includes('name="since"'));
  assert.ok(panel.includes('LIVE_NEWS_SINCE_OPTIONS'));
  assert.ok(panel.includes('sinceHours, nowMs'));
});

test('saved searches stay browser-local and escaped', () => {
  const client = readFileSync('src/modules/CB-M03/saved-searches.client.mjs', 'utf8');
  assert.ok(panel.includes('data-m03-saved-searches'));
  assert.ok(panel.includes('saved-searches.client.mjs'));
  assert.ok(panel.includes('data-m03-save-current'));
  assert.ok(panel.includes('hidden'));
  assert.doesNotMatch(client, /fetch\s*\(|XMLHttpRequest|document\.cookie|sessionStorage|innerHTML/u);
  assert.ok(client.includes('window.localStorage'));
  assert.ok(client.includes('textContent'));
});

test('a stale collection is labelled in the panel', () => {
  assert.ok(panel.includes('data-m03-live-stale'));
  assert.ok(panel.includes('copy.staleWarning'));
  assert.ok(panel.includes('snapshot.stale === true'));
});
