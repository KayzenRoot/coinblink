import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  analyticsPage, localeForPath, normalizePageviewPath, recordPageview,
} from '../../../src/modules/CB-M06/pageview.mjs';

test('only bounded public paths are accepted', () => {
  assert.equal(normalizePageviewPath('/en/news/live'), '/en/news/live');
  assert.equal(normalizePageviewPath('/pt-br/news/coverage?x=1'), null);
  assert.equal(normalizePageviewPath('/admin'), null);
  assert.equal(normalizePageviewPath('/admin/security'), null);
  assert.equal(normalizePageviewPath('/api/analytics/pageview'), null);
  assert.equal(normalizePageviewPath('/v1/sources'), null);
  assert.equal(normalizePageviewPath('/health'), null);
  assert.equal(normalizePageviewPath('//evil.example'), null);
  assert.equal(normalizePageviewPath('/' + 'a'.repeat(201)), null);
  assert.equal(normalizePageviewPath(null), null);
});

test('the locale is derived from the path or the explicit request', () => {
  assert.equal(localeForPath('/pt-br/news/live'), 'pt-br');
  assert.equal(localeForPath('/es'), 'es');
  assert.equal(localeForPath('/developers'), 'other');
  assert.equal(localeForPath('/en/news/live', 'es'), 'es');
  assert.equal(localeForPath('/en/news/live', 'xx'), 'en');
});

test('the counter upserts and fails closed', async () => {
  let bindArgs = null;
  const db = {
    prepare: () => ({
      bind: (...args) => {
        bindArgs = args;
        return { run: async () => ({ meta: { changes: 1 } }) };
      },
    }),
  };
  assert.equal(await recordPageview({ db, path: '/en/news/live', day: '2026-10-30' }), true);
  assert.deepEqual(bindArgs, ['2026-10-30', '/en/news/live', 'en']);
  assert.equal(await recordPageview({ db, path: '/admin', day: '2026-10-30' }), false);
  assert.equal(await recordPageview({ db: { prepare: () => { throw new Error('down'); } }, path: '/en', day: '2026-10-30' }), false);
});

test('the analytics page renders totals and top paths', async () => {
  let first = 0;
  let all = 0;
  const db = {
    prepare: () => ({
      bind: () => ({
        first: async () => {
          first += 1;
          return { total: first === 1 ? 12 : 4 };
        },
        all: async () => {
          all += 1;
          return { results: all === 1 ? [{ path: '/en/news/live', views: 9 }] : [{ day: '2026-10-30', views: 4 }] };
        },
      }),
    }),
  };
  const response = await analyticsPage({ db, nowMs: Date.parse('2026-10-30T12:00:00Z'), csrf: 'a'.repeat(64) });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Views today/u);
  assert.match(body, /Views, last 7 days/u);
  assert.match(body, /\/en\/news\/live/u);
  assert.match(body, /no cookie, IP, user agent/u);
});

test('the beacon and endpoint are same-origin and identifier-free', () => {
  const route = readFileSync('src/pages/api/analytics/pageview.ts', 'utf8');
  const client = readFileSync('public/analytics.js', 'utf8');
  const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
  assert.ok(route.includes('sec-fetch-site') && route.includes('normalizePageviewPath'));
  assert.doesNotMatch(route, /document\.cookie|user-agent|referer|\bip\b/iu);
  assert.ok(client.includes('sendBeacon') && client.includes('/api/analytics/pageview'));
  assert.doesNotMatch(client, /document\.cookie|localStorage|sessionStorage/u);
  assert.ok(layout.includes('/analytics.js'));
});
