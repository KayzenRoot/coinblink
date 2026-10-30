import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  bootstrapChallenge, equalHex, escapeHtml, keyedDigest, loginChallenge, ownerExists, readConfig,
  sameOrigin, toBase64Url,
} from '../../../src/modules/CB-M05/p1-production/owner-auth.mjs';

const SECRET = 'a'.repeat(64);
const CONFIG = { secret: SECRET, origin: 'https://example.test', rpId: 'example.test' };
const fakeDb = (row = null) => ({
  prepare: () => ({ first: async () => row, bind: () => ({ first: async () => row, run: async () => ({ meta: { changes: 0 } }) }) }),
});

test('the production owner environment is required as a whole', () => {
  const base = {
    M05_OWNER_ENABLED: 'true', CMS_DB: { prepare() {} }, M05_SESSION_SECRET: SECRET,
    M05_RP_ID: 'example.test', M05_ORIGIN: 'https://example.test',
  };
  assert.ok(readConfig(base));
  assert.equal(readConfig(null), null);
  assert.equal(readConfig({ ...base, M05_OWNER_ENABLED: 'false' }), null);
  assert.equal(readConfig({ ...base, CMS_DB: null }), null);
  assert.equal(readConfig({ ...base, M05_SESSION_SECRET: 'short' }), null);
  assert.equal(readConfig({ ...base, M05_RP_ID: '' }), null);
  assert.equal(readConfig({ ...base, M05_ORIGIN: '' }), null);
});

test('HMAC and hex helpers are deterministic and constant-time comparable', async () => {
  const first = await keyedDigest(SECRET, 'ticket');
  const second = await keyedDigest(SECRET, 'ticket');
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/u);
  assert.notEqual(first, await keyedDigest(SECRET, 'other'));
  assert.equal(equalHex(first, second), true);
  assert.equal(equalHex(first, first.slice(0, -1) + '0'), false);
  assert.equal(equalHex(first, 'short'), false);
  assert.equal(toBase64Url(new Uint8Array([1, 2, 3])), 'AQID');
  assert.equal(escapeHtml('<b>&"'), '&lt;b&gt;&amp;&quot;');
});

test('the origin check rejects cross-site writes', () => {
  const get = new Request('https://example.test/admin/login');
  assert.equal(sameOrigin(get, 'https://example.test'), true);
  assert.equal(sameOrigin(get, 'https://other.test'), false);
  const post = new Request('https://example.test/admin/login', {
    method: 'POST', headers: { origin: 'https://example.test', 'sec-fetch-site': 'same-origin' },
  });
  assert.equal(sameOrigin(post, 'https://example.test'), true);
  const cross = new Request('https://example.test/admin/login', {
    method: 'POST', headers: { origin: 'https://evil.test', 'sec-fetch-site': 'cross-site' },
  });
  assert.equal(sameOrigin(cross, 'https://example.test'), false);
  const missing = new Request('https://example.test/admin/login', { method: 'POST' });
  assert.equal(sameOrigin(missing, 'https://example.test'), false);
});

test('bootstrap and login fail closed without a valid ticket or owner', async () => {
  assert.equal(await ownerExists(fakeDb(null)), false);
  const bootstrap = await bootstrapChallenge({
    db: fakeDb(null), config: CONFIG, ticket: 'b'.repeat(64), now: 1000,
  });
  assert.equal(bootstrap.status, 403);
  const login = await loginChallenge({ db: fakeDb(null), config: CONFIG, now: 1000 });
  assert.equal(login.status, 404);
});

test('the route and client keep secrets out of HTML and use same-origin WebAuthn', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  const auth = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  const client = readFileSync('public/admin-auth.js', 'utf8');
  const css = readFileSync('public/admin.css', 'utf8');
  assert.ok(route.includes('productionAdmin'));
  assert.ok(route.includes('cloudflare:workers'));
  assert.ok(route.includes('readConfig'));
  assert.ok(auth.includes('M05_OWNER_ENABLED'));
  assert.doesNotMatch(route, /console\.(log|warn|error)/u);
  assert.doesNotMatch(auth, /console\.(log|warn|error)|localStorage|sessionStorage/u);
  assert.ok(client.includes('navigator.credentials.create'));
  assert.ok(client.includes('navigator.credentials.get'));
  assert.doesNotMatch(client, /https?:\/\//u);
  assert.match(css, /admin__facts/u);
  assert.ok(auth.includes('__Host-cb_owner'));
  assert.ok(auth.includes('HttpOnly'));
});
