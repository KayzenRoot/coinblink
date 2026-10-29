import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const route = readFileSync('src/pages/v1/news/coverage.ts', 'utf8');
const model = readFileSync('src/modules/CB-M03/coverage-status.mjs', 'utf8');
const page = readFileSync('src/pages/developers.astro', 'utf8');

test('the coverage endpoint is read-only, aggregate-only and documented', () => {
  const required = [
    'export const GET',
    'export const OPTIONS',
    'export const ALL',
    'publicJsonHeaders("public, max-age=60")',
    'readLiveNews',
    'buildCoverageStatus',
    'publicJsonEndpoint',
  ];
  assert.deepEqual(required.filter((marker) => !route.includes(marker)), [], 'route wiring');
  assert.doesNotMatch(route, /localStorage|sessionStorage|innerHTML/u);
  assert.doesNotMatch(model, /item\.title|item\.summary|item\.link|source\.name|fetch\s*\(/u);
  assert.ok(model.includes('no headline text'));
  assert.ok(page.includes('Coverage counts (content-free)'));
  assert.ok(page.includes('href="/v1/news/coverage"'));
});
