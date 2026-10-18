import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { CMS_TEST_ORIGIN } from '../../../src/modules/CB-M05/p1c-local/local-cms.mjs';
import { createLocalAdminRouter } from '../../../src/modules/CB-M05/p1c-local/local-admin-router.mjs';

const key = 'bb'.repeat(32);
const token = 'c1'.repeat(32);
const now = () => 1_700_000_000_000;
const sessionDigest = createHmac('sha256', Buffer.from(key, 'hex')).update(token).digest('hex');
const seen = [];
const db = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() {
            seen.push({ operation: 'first', statement: sql.split(' ')[0], parameters: values.length });
            if (sql.includes('FROM cms_sessions')) return values[0] === sessionDigest
              ? { session_digest: sessionDigest, csrf_digest: 'ab'.repeat(32), credential_id: 'test-device', device_kind: 'primary' }
              : null;
            if (sql.includes('COUNT(*)')) return { n: 0 };
            return null;
          },
          async all() {
            seen.push({ operation: 'all', statement: sql.split(' ')[0], parameters: values.length });
            return { results: [] };
          },
        };
      },
      async all() { seen.push({ operation: 'all', statement: sql.split(' ')[0] }); return { results: [] }; },
      async first() { seen.push({ operation: 'first', statement: sql.split(' ')[0] }); return { n: 0 }; },
    };
  },
};
const env = { CB_M05_LOCAL_TEST_ONLY: 'true', CMS_D1_LOCAL: db, CMS_TEST_HMAC_KEY: key };
const handler = createLocalAdminRouter({ now });
const request = (pathname, options = {}) => new Request(CMS_TEST_ORIGIN + pathname, {
  headers: { 'sec-fetch-site': 'same-origin', ...options.headers },
  method: options.method ?? 'GET',
  ...(options.body ? { body: options.body } : {}),
});
test('M05 C1 /admin gate denies unapproved env, arbitrary origins and fake session headers', async () => {
  seen.length = 0;
  assert.equal((await handler(request('/admin/login'), {})).status, 404);
  assert.equal((await handler(request('/admin/login'), { ...env, CB_M05_LOCAL_TEST_ONLY: 'false' })).status, 404);
  assert.equal((await handler(new Request('https://untrusted.example.test/admin/login'), env)).status, 404);
  assert.equal((await handler(request('/admin/irrelevant'), env)).status, 404);
  assert.equal((await handler(request('/admin/articles', { headers: { 'x-owner-role': 'admin' } }), env)).status, 401);
  assert.equal(seen.some(x => x.operation === 'all'), false, 'unauthenticated read must never reach private rows');
});
test('M05 C1 existing nonce-CSP WebAuthn UI can call the restricted /admin adapter', async () => {
  const response = await handler(request('/admin/login'), env);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy') || '', /script-src 'nonce-[0-9a-f]{64}'/);
  const html = await response.text();
  assert.match(html, /Local CMS Test Workspace/);
  assert.match(html, /\/admin\/articles/);
  assert.doesNotMatch(html, /\/local\/articles/);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
});
test('M05 C1 privileged /admin HTML + draft API are session-bound and keep synthetic data local', async () => {
  seen.length = 0;
  const denied = await handler(request('/admin/workspace'), env);
  assert.equal(denied.status, 401);
  assert.doesNotMatch(await denied.text(), /Authenticated synthetic Owner session/);
  const cookie = '__Host-cb_m05_local=' + token;
  const headers = { cookie };
  const ok = await handler(request('/admin/workspace', { headers }), env);
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /Authenticated synthetic Owner session/);
  const rows = await handler(request('/admin/articles', { headers }), env);
  assert.equal(rows.status, 200);
  assert.deepEqual((await rows.json()).drafts, []);
  assert.ok(seen.some(x => x.operation === 'all'));
  assert.equal((await handler(request('/admin/articles', { method: 'POST', headers, body: '{}' }), env)).status, 403,
    'CSRF-less mutations must be denied, even with a session');
});
test('M05 C1 public Astro dispatch refuses privileged routes in non-development bundles', () => {
  const source = readFileSync(new URL('../../../src/pages/admin/[...route].js', import.meta.url), 'utf8');
  assert.match(source, /!import\.meta\.env\.DEV/);
  assert.match(source, /env\?\.CB_M05_LOCAL_TEST_ONLY !== 'true'/);
  assert.doesNotMatch(source, /return Astro\.redirect|production.*enable/i);
});
