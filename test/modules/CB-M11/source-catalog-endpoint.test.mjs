import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync('src/pages/v1/sources.ts', 'utf8');
const model = readFileSync('src/modules/CB-M03/source-catalog.mjs', 'utf8');
const page = readFileSync('src/pages/developers.astro', 'utf8');

test('the catalog endpoint is read-only, cached and CORS-open', () => {
  assert.ok(route.includes('export const GET'));
  assert.ok(route.includes('export const OPTIONS'));
  assert.ok(route.includes('export const ALL'));
  assert.ok(route.includes('"cache-control": "public, max-age=3600, s-maxage=60"'));
  assert.ok(route.includes('"access-control-allow-origin": "*"'));
  assert.ok(route.includes('"x-robots-tag": "noindex"'));
  assert.ok(route.includes('UNSUPPORTED_QUERY'));
  assert.ok(route.includes('allow: "GET"'));
  assert.ok(route.includes('buildSourceCatalog'));
  assert.ok(route.includes('conditionalResponse'));
  assert.doesNotMatch(route, /localStorage|sessionStorage|innerHTML/u);
});

test('the catalog projection carries metadata only', () => {
  assert.doesNotMatch(model, /item\.title|item\.summary|\.items/u);
  assert.doesNotMatch(model, /fetch\s*\(|localStorage|sessionStorage/u);
  assert.ok(model.includes('PUBLIC_METADATA'));
  assert.ok(model.includes('ATTRIBUTION_ONLY'));
});

test('the developer page documents the catalog', () => {
  assert.ok(page.includes('Publisher catalog (real, metadata only)'));
  assert.ok(page.includes('href="/v1/sources"'));
  assert.ok(page.includes('GET /v1/sources'));
});
