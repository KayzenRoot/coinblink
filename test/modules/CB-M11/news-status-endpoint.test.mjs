import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync('src/pages/v1/news/status.ts', 'utf8');
const model = readFileSync('src/modules/CB-M03/news-status.mjs', 'utf8');
const page = readFileSync('src/pages/developers.astro', 'utf8');

test('the status endpoint is read-only, cached briefly and CORS-open', () => {
  assert.ok(route.includes('export const GET'));
  assert.ok(route.includes('export const OPTIONS'));
  assert.ok(route.includes('export const ALL'));
  assert.ok(route.includes('publicJsonHeaders("public, max-age=60")'));
  assert.ok(route.includes('readLiveNews'));
  assert.ok(route.includes('buildNewsStatus'));
  assert.ok(route.includes('publicJsonEndpoint'));
  assert.doesNotMatch(route, /localStorage|sessionStorage|innerHTML/u);
});

test('the projection never carries headline text', () => {
  assert.doesNotMatch(model, /item\.title|item\.summary|source\.name/u);
  assert.doesNotMatch(model, /fetch\s*\(|localStorage|sessionStorage/u);
  assert.ok(model.includes('no headline text'));
});

test('the developer page documents the real status endpoint', () => {
  assert.ok(page.includes('Live collection status (content-free)'));
  assert.ok(page.includes('href="/v1/news/status"'));
  assert.ok(page.includes('GET /v1/news/status'));
});
