import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  IG_SCOPES, IG_TOKEN_URL, buildAuthorizeUrl, exchangeCode, fetchAccount, readCallback,
} from '../../../src/modules/CB-M07/instagram-oauth.mjs';
import { oauthNotConfigured, oauthPage } from '../../../src/modules/CB-M07/oauth-page.mjs';

const start = readFileSync('src/pages/api/oauth/instagram/start.ts', 'utf8');
const callback = readFileSync('src/pages/api/oauth/instagram/callback.ts', 'utf8');

test('the consent URL carries the three publishing scopes and the state', () => {
  const url = new URL(buildAuthorizeUrl({
    appId: '1234567890', redirectUri: 'https://example.test/api/oauth/instagram/callback', state: 'state-1',
  }));
  assert.equal(url.origin + url.pathname, 'https://www.facebook.com/v21.0/dialog/oauth');
  assert.equal(url.searchParams.get('client_id'), '1234567890');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), 'instagram_basic,instagram_content_publish,pages_show_list');
  assert.equal(url.searchParams.get('scope'), IG_SCOPES.join(','));
  assert.equal(url.searchParams.get('state'), 'state-1');
  assert.throws(() => buildAuthorizeUrl({ appId: '', redirectUri: 'x', state: 's' }), TypeError);
});

test('the callback query is normalized, including the Meta error names', () => {
  assert.deepEqual(readCallback(new URLSearchParams('code=abc&state=xyz')),
    { code: 'abc', state: 'xyz', error: null, errorDescription: null });
  const denied = readCallback(new URLSearchParams('error=access_denied&error_message=No'));
  assert.equal(denied.error, 'access_denied');
  assert.equal(denied.errorDescription, 'No');
  assert.equal(denied.code, null);
  assert.equal(readCallback(null).code, null);
});

test('the code is exchanged for a long-lived token and no token leaks in errors', async () => {
  const seen = [];
  const fetchImpl = async (url) => {
    seen.push(new URL(url));
    const access = seen.length === 1 ? 'short-token' : 'long-token';
    return new Response(JSON.stringify({ access_token: access, token_type: 'bearer', expires_in: 5184000 }), { status: 200 });
  };
  const token = await exchangeCode({
    fetchImpl, appId: '1234567890', appSecret: 'app-secret', code: 'code-1',
    redirectUri: 'https://example.test/api/oauth/instagram/callback',
  });
  assert.equal(token.accessToken, 'long-token');
  assert.equal(token.refreshToken, null);
  assert.equal(token.expiresIn, 5184000);
  assert.equal(seen[0].origin + seen[0].pathname, IG_TOKEN_URL);
  assert.equal(seen[0].searchParams.get('code'), 'code-1');
  assert.equal(seen[0].searchParams.get('client_secret'), 'app-secret');
  assert.equal(seen[1].searchParams.get('grant_type'), 'fb_exchange_token');
  assert.equal(seen[1].searchParams.get('fb_exchange_token'), 'short-token');
  await assert.rejects(exchangeCode({
    fetchImpl: async () => new Response('{}', { status: 400 }), appId: '1234567890',
    appSecret: 'app-secret', code: 'code-1', redirectUri: 'https://example.test/cb',
  }), (error) => !error.message.includes('app-secret') && error.message.includes('400'));
});

test('account discovery returns the professional account and its Page token', async () => {
  let seen = null;
  const fetchImpl = async (url) => {
    seen = new URL(url);
    return new Response(JSON.stringify({
      data: [
        { name: 'Page without IG', access_token: 'page-0' },
        {
          name: 'CoinBlink Page',
          access_token: 'page-token-1',
          instagram_business_account: { id: '17841400000000000', username: 'coinblink' },
        },
      ],
    }), { status: 200 });
  };
  const account = await fetchAccount({ fetchImpl, accessToken: 'user-token' });
  assert.deepEqual(account, {
    id: '17841400000000000', username: 'coinblink', name: 'CoinBlink Page', pageToken: 'page-token-1',
  });
  assert.equal(seen.searchParams.get('access_token'), 'user-token');
  assert.match(seen.searchParams.get('fields'), /instagram_business_account/u);
  await assert.rejects(fetchAccount({
    fetchImpl: async () => new Response(JSON.stringify({ data: [{ name: 'Only a Page' }] }), { status: 200 }),
    accessToken: 'user-token',
  }), /no professional account/u);
  await assert.rejects(fetchAccount({ fetchImpl: async () => new Response('{}', { status: 400 }), accessToken: 't' }));
});

test('the routes keep both secrets server-side and render no token', () => {
  for (const source of [start, callback]) {
    assert.doesNotMatch(source, /localStorage|sessionStorage|console\.(log|error|warn)|innerHTML/u);
  }
  assert.ok(start.includes('META_APP_ID'));
  assert.ok(start.includes('authorize(request'));
  assert.ok(start.includes('createOauthState'));
  assert.ok(start.includes('httpOnly: true'));
  assert.ok(start.includes('secure: true'));
  assert.ok(start.includes('sameSite: "lax"'));
  assert.ok(start.includes('M05_OWNER_ENABLED'));
  assert.ok(callback.includes('META_APP_SECRET'));
  assert.ok(callback.includes('params.state !== state'));
  assert.ok(callback.includes('consumeOauthState'));
  assert.ok(callback.includes('storeSocialAccount'));
  assert.ok(callback.includes('fetchAccount'));
  assert.ok(callback.includes('provider: "instagram"'));
  assert.ok(callback.includes('oauthConnected("Instagram"'));
  assert.ok(callback.includes('oauthNotConfigured("Instagram"'));
  assert.doesNotMatch(callback, /pageToken \+/u);
});

test('the shared callback page escapes the title and stays no-store', async () => {
  const response = oauthPage(400, '<script>', '<p>Body</p>');
  assert.equal(response.status, 400);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  const body = await response.text();
  assert.doesNotMatch(body, /<script>/u);
  assert.match(body, /&lt;script&gt;/u);
  const notConfigured = await oauthNotConfigured('Instagram', 'Meta app credentials').text();
  assert.match(notConfigured, /no Meta app credentials/u);
});
