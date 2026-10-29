import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/[locale]/news/source/[source].astro', 'utf8');
const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');
const copy = readFileSync('src/modules/CB-M03/source-page-copy.mjs', 'utf8');

test('the publisher page is validated, gated and escaped', () => {
  assert.match(page, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u);
  assert.match(page, /Astro\.response\.status = 404/u);
  assert.match(page, /LIVE_NEWS_SOURCES\.find/u);
  assert.match(page, /data-m03-source-page/u);
  assert.doesNotMatch(page, /set:html|<script|<form/u);
  assert.match(page, /rel="noreferrer noopener external"/u);
  assert.ok(page.includes('item.sourceId === source.id'));
  assert.ok(page.includes('known ? await readLiveNews'));
});

test('the live feed table links to the publisher page and keeps the official site', () => {
  assert.ok(panel.includes('"/" + locale + "/news/source/" + source.id'));
  assert.ok(panel.includes('copy.officialSite'));
});

test('the source copy module is key-major and has no I/O', () => {
  assert.match(copy, /SOURCE_PAGE_COPY/u);
  assert.doesNotMatch(copy, /fetch\s*\(|localStorage|sessionStorage|indexedDB/u);
});
