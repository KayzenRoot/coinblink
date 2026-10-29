import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync('src/pages/v1/openapi.json.ts', 'utf8');
const model = readFileSync('src/modules/CB-M11/openapi.mjs', 'utf8');
const page = readFileSync('src/pages/developers.astro', 'utf8');

test('the OpenAPI endpoint is read-only, cached and conditional', () => {
  assert.ok(route.includes('export const GET'));
  assert.ok(route.includes('export const OPTIONS'));
  assert.ok(route.includes('export const ALL'));
  assert.ok(route.includes('publicJsonHeaders("public, max-age=3600, s-maxage=60")'));
  assert.ok(route.includes('publicJsonEndpoint'));
  assert.ok(route.includes('buildOpenApiDocument'));
  assert.doesNotMatch(route, /localStorage|sessionStorage|innerHTML/u);
});

test('the schema is static and content-free', () => {
  assert.match(model, /openapi: "3\.1\.0"/u);
  assert.doesNotMatch(model, /item\.title|item\.summary/u);
  assert.doesNotMatch(model, /fetch\s*\(|localStorage|sessionStorage/u);
  assert.ok(model.includes('No article text'));
});

test('the developer page links to the OpenAPI document', () => {
  assert.ok(page.includes('OpenAPI 3.1 contract'));
  assert.ok(page.includes('href="/v1/openapi.json"'));
});
