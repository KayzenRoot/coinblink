import test from 'node:test';
import assert from 'node:assert/strict';
import { startSocialOAuth } from '../../../src/modules/CB-M07/oauth-start.mjs';

const SECRET = 'a'.repeat(64);

function fakeDb(changes = 1) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return { run: async () => ({ meta: { changes } }) };
        },
      };
    },
  };
}

function fakeCookies() {
  const entries = [];
  return { entries, set: (name, value, options) => entries.push({ name, value, options }) };
}

function options(overrides = {}) {
  return {
    request: new Request('https://cb.test/api/oauth/instagram/start'),
    url: new URL('https://cb.test/api/oauth/instagram/start'),
    cookies: fakeCookies(),
    db: fakeDb(),
    secret: SECRET,
    ownerEnabled: 'true',
    clientId: 'client-1',
    provider: 'Instagram',
    missing: 'Meta app credentials',
    cookieName: 'cb_ig_state',
    cookiePath: '/api/oauth/instagram',
    callbackPath: '/api/oauth/instagram/callback',
    authorizeUrl: ({ redirectUri, state }) => 'https://provider.test/auth?state=' + state
      + '&redirect_uri=' + encodeURIComponent(redirectUri),
    authorizeSession: async () => ({ digest: 'd' }),
    ...overrides,
  };
}

test('an anonymous start is an indistinguishable 404 with no cookie', async () => {
  const cookies = fakeCookies();
  const response = await startSocialOAuth(options({ cookies, authorizeSession: async () => null }));
  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not found');
  assert.equal(cookies.entries.length, 0);
});

test('a missing app or a disabled owner is a 503 and never redirects', async () => {
  for (const overrides of [
    { clientId: null },
    { clientId: '' },
    { ownerEnabled: '' },
    { db: null },
    { secret: '' },
  ]) {
    const cookies = fakeCookies();
    const response = await startSocialOAuth(options({ ...overrides, cookies }));
    assert.equal(response.status, 503, JSON.stringify(overrides));
    assert.match(await response.text(), /not configured/u);
    assert.equal(response.headers.get('location'), null);
    assert.equal(cookies.entries.length, 0);
  }
});

test('the start stores a one-use state and a locked cookie, then redirects', async () => {
  const cookies = fakeCookies();
  const db = fakeDb();
  const response = await startSocialOAuth(options({ cookies, db }));
  assert.equal(response.status, 302);
  assert.equal(cookies.entries.length, 1);
  const [cookie] = cookies.entries;
  assert.equal(cookie.name, 'cb_ig_state');
  assert.match(cookie.value, /^[A-Za-z0-9_-]{32}$/u);
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(cookie.options.sameSite, 'lax');
  assert.equal(cookie.options.path, '/api/oauth/instagram');
  assert.equal(cookie.options.maxAge, 600);
  assert.equal(db.calls.length, 1);
  assert.match(db.calls[0].sql, /INSERT INTO cms_social_oauth_states/u);
  assert.equal(db.calls[0].args.includes(cookie.value), false);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.searchParams.get('state'), cookie.value);
  assert.equal(location.searchParams.get('redirect_uri'), 'https://cb.test/api/oauth/instagram/callback');
});

test('a state that cannot be stored is a 503 with no cookie', async () => {
  const cookies = fakeCookies();
  const response = await startSocialOAuth(options({ cookies, db: fakeDb(0) }));
  assert.equal(response.status, 503);
  assert.match(await response.text(), /one-use state could not be stored/u);
  assert.equal(cookies.entries.length, 0);
});
