import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync('src/pages/status.astro', 'utf8');

test('the public status surface is no-store, gated and content-free', () => {
  for (const marker of ['readLiveNews', 'buildCoverageStatus', 'buildInfo', 'no-store',
    'data-m14-status-page', 'data-m14-state={stateKey}', 'data-m14-feed={feed.id}',
    '/v1/news/status', '/v1/news/coverage', '/v1/sources', '/v1/openapi.json', '/health']) {
    assert.ok(page.includes(marker), marker);
  }
  assert.doesNotMatch(page, /item\.title|item\.summary|item\.link|set:html|<script/u);
  assert.doesNotMatch(page, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/u);
});

test('the page reads the same gated snapshot and reuses the content-free projection', () => {
  assert.match(page, /readLiveNews\(\{ enabled: import\.meta\.env\.PUBLIC_NEWS_LIVE \}\)/u);
  assert.match(page, /buildCoverageStatus\(snapshot\)/u);
  assert.match(page, /buildInfo\.sha/u);
  assert.match(page, /buildInfo\.environment/u);
  assert.match(page, /LIVE_NEWS_SOURCES\.length/u);
});
