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
  assert.doesNotMatch(panel, /<script/u);
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
});

test('the demo lab no longer serves the live reader', () => {
  assert.equal(existsSync('src/pages/demo/news/live.astro'), false);
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
