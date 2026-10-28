import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const page = readFileSync('src/pages/demo/news/live.astro', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');
const reader = readFileSync('src/modules/CB-M03/live-news.mjs', 'utf8');
const parser = readFileSync('src/modules/CB-M03/rss-parse.mjs', 'utf8');
const sources = readFileSync('src/modules/CB-M03/rss-sources.mjs', 'utf8');

test('the live page is server-rendered and gated by a deployment variable only', () => {
  assert.match(page, /export const prerender = false/u);
  assert.match(page, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u);
  assert.match(page, /<LiveNewsPanel snapshot=\{snapshot\} \/>/u);
  assert.doesNotMatch(page, /set:html|is:inline|client:/u);
});

test('the panel escapes feed text instead of injecting it', () => {
  assert.doesNotMatch(panel, /set:html/u);
  assert.doesNotMatch(panel, /<script/u);
  assert.match(panel, /<a href=\{item\.link\} rel="noreferrer noopener external">\{item\.title\}<\/a>/u);
  assert.match(panel, /<a href=\{item\.sourceHome\} rel="noreferrer noopener external">\{item\.sourceName\}<\/a>/u);
  assert.match(panel, /data-m03-live="disabled"/u);
  assert.match(panel, /data-m03-live="unavailable"/u);
  assert.match(panel, /data-m03-live="live"/u);
  assert.match(panel, /ATTRIBUTION ONLY/u);
  assert.match(panel, /NO FULL TEXT/u);
  assert.match(panel, /NO REPUBLICATION/u);
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
