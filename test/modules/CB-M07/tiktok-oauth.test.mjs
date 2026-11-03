import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TT_TOKEN_URL, buildAuthorizeUrl, exchangeCode, fetchAccount, readCallback, refreshToken,
} from '../../../src/modules/CB-M07/tiktok-oauth.mjs';

const start = readFileSync('src/pages/api/oauth/tiktok/start.ts', 'utf8');
const callback = readFileSync('src/pages/api/oauth/tiktok/callback.ts', 'utf8');

test('the consent URL carries the publishing scopes and the state', () => {
  const url = new URL(buildAuthorizeUrl({
    clientKey: 'client-key-1', redirectUri: 'https://example.test/api/oauth/tiktok/callback', state: 'state-1',
  }));
  assert.equal(url.origin + url.pathname, 'https://www.tiktok.com/v2/auth/authorize/');
  assert.equal(url.searchParams.get('client_key'), 'client-key-1');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), 'video.publish,video.upload,user.info.basic');
  assert.equal(url.searchParams.get('state'), 'state-1');
  assert.throws(() => buildAuthorizeUrl({ clientKey: '', redirectUri: 'x', state: 's' }), TypeError);
});

test('the callback query is normalized without trusting values', () => {
  assert.deepEqual(readCallback(new URLSearchParams('code=abc&state=xyz')),
    { code: 'abc', state: 'xyz', error: null, errorDescription: null });
  assert.equal(readCallback(new URLSearchParams('error=access_denied')).error, 'access_denied');
  assert.equal(readCallback(null).code, null);
});

test('the token exchange posts the confidential-client form and keeps the open id', async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify({
      access_token: 'act.token-1', refresh_token: 'rft.token-1', open_id: 'open-id-1',
      expires_in: 86400, refresh_expires_in: 31536000, scope: 'video.publish,user.info.basic', token_type: 'Bearer',
    }), { status: 200 });
  };
  const token = await exchangeCode({
    fetchImpl, clientKey: 'client-key-1', clientSecret: 'client-secret', code: 'code-1',
    redirectUri: 'https://example.test/api/oauth/tiktok/callback',
  });
  assert.equal(token.accessToken, 'act.token-1');
  assert.equal(token.refreshToken, 'rft.token-1');
  assert.equal(token.openId, 'open-id-1');
  assert.equal(token.expiresIn, 86400);
  assert.equal(seen.url, TT_TOKEN_URL);
  assert.equal(seen.options.method, 'POST');
  const body = new URLSearchParams(seen.options.body.toString());
  assert.equal(body.get('client_key'), 'client-key-1');
  assert.equal(body.get('client_secret'), 'client-secret');
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.equal(body.get('code'), 'code-1');
  assert.equal(body.get('redirect_uri'), 'https://example.test/api/oauth/tiktok/callback');
  await assert.rejects(exchangeCode({
    fetchImpl: async () => new Response('{}', { status: 401 }), clientKey: 'k', clientSecret: 's',
    code: 'c', redirectUri: 'https://example.test/cb',
  }), (error) => error.message.includes('401') && !error.message.includes('client-secret'));
  await assert.rejects(exchangeCode({
    fetchImpl: async () => new Response(JSON.stringify({ access_token: 'a', open_id: '' }), { status: 200 }),
    clientKey: 'k', clientSecret: 's', code: 'c', redirectUri: 'https://example.test/cb',
  }), /open id/u);
});

test('the profile call is authenticated and falls back to the display name', async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url: new URL(url), options };
    return new Response(JSON.stringify({
      data: { user: { open_id: 'open-id-1', display_name: 'CoinBlink' } },
    }), { status: 200 });
  };
  const account = await fetchAccount({ fetchImpl, accessToken: 'act.token-1', openId: 'open-id-1' });
  assert.deepEqual(account, { id: 'open-id-1', username: 'CoinBlink', name: 'CoinBlink' });
  assert.equal(seen.options.headers.authorization, 'Bearer act.token-1');
  assert.equal(seen.url.searchParams.get('fields'), 'open_id,username,display_name');
  const named = await fetchAccount({
    fetchImpl: async () => new Response(JSON.stringify({
      data: { user: { open_id: 'open-id-2', username: 'coinblink', display_name: 'CoinBlink' } },
    }), { status: 200 }),
    accessToken: 't',
  });
  assert.equal(named.username, 'coinblink');
  await assert.rejects(fetchAccount({ fetchImpl: async () => new Response('{}', { status: 500 }), accessToken: 't' }));
  await assert.rejects(fetchAccount({
    fetchImpl: async () => new Response(JSON.stringify({ data: null }), { status: 200 }), accessToken: 't',
  }));
});

test('the refresh grant replaces the pair before the 24h token expires', async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify({
      access_token: 'act.fresh', refresh_token: 'rft.fresh', expires_in: 86400, scope: 'video.publish',
    }), { status: 200 });
  };
  const next = await refreshToken({
    fetchImpl, clientKey: 'client-key-1', clientSecret: 'client-secret', refreshToken: 'rft.old',
  });
  assert.equal(next.accessToken, 'act.fresh');
  assert.equal(next.refreshToken, 'rft.fresh');
  assert.equal(next.expiresIn, 86400);
  assert.equal(seen.url, TT_TOKEN_URL);
  const body = new URLSearchParams(seen.options.body.toString());
  assert.equal(body.get('grant_type'), 'refresh_token');
  assert.equal(body.get('refresh_token'), 'rft.old');
  assert.equal(body.get('client_key'), 'client-key-1');
  await assert.rejects(refreshToken({
    fetchImpl: async () => new Response('{}', { status: 400 }), clientKey: 'k', clientSecret: 's',
    refreshToken: 'r',
  }), (error) => error.message.includes('400') && !error.message.includes('client-secret'));
});

test('the routes keep both secrets server-side and render no token', () => {
  for (const source of [start, callback]) {
    assert.doesNotMatch(source, /localStorage|sessionStorage|console\.(log|error|warn)|innerHTML/u);
  }
  assert.ok(start.includes('TIKTOK_CLIENT_KEY'));
  assert.ok(start.includes('authorize(request'));
  assert.ok(start.includes('createOauthState'));
  assert.ok(start.includes('httpOnly: true'));
  assert.ok(start.includes('sameSite: "lax"'));
  assert.ok(start.includes('M05_OWNER_ENABLED'));
  assert.ok(callback.includes('TIKTOK_CLIENT_SECRET'));
  assert.ok(callback.includes('params.state !== state'));
  assert.ok(callback.includes('consumeOauthState'));
  assert.ok(callback.includes('storeSocialAccount'));
  assert.ok(callback.includes('provider: "tiktok"'));
  assert.ok(callback.includes('oauthConnected("TikTok"'));
  assert.ok(callback.includes('oauthNotConfigured("TikTok"'));
  assert.doesNotMatch(callback, /token\.accessToken \+/u);
});
