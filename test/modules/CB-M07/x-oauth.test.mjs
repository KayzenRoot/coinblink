import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  X_SCOPES, X_TOKEN_URL, base64Url, buildAuthorizeUrl, createPkcePair, escapeHtml,
  exchangeCode, fetchViewer, randomBytes, randomToken, readCallback,
} from '../../../src/modules/CB-M07/x-oauth.mjs';

const fixed = (length) => new Uint8Array(length).fill(7);
const start = readFileSync('src/pages/api/oauth/x/start.ts', 'utf8');
const callback = readFileSync('src/pages/api/oauth/x/callback.ts', 'utf8');

test('PKCE is S256 and uses URL-safe values', async () => {
  const pair = await createPkcePair(fixed);
  assert.equal(pair.verifier, base64Url(fixed(32)));
  assert.match(pair.verifier, /^[A-Za-z0-9_-]{43}$/u);
  assert.match(pair.challenge, /^[A-Za-z0-9_-]{43}$/u);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pair.verifier));
  assert.equal(pair.challenge, base64Url(new Uint8Array(digest)));
  assert.equal(Object.isFrozen(pair), true);
  assert.equal(randomToken(fixed, 24), base64Url(fixed(24)));
  assert.throws(() => randomBytes(4), TypeError);
  assert.throws(() => base64Url('nope'), TypeError);
});

test('the authorize URL carries scopes, state and the challenge', () => {
  const url = new URL(buildAuthorizeUrl({
    clientId: 'client', redirectUri: 'https://example.test/api/oauth/x/callback',
    state: 'state-1', challenge: 'challenge-1',
  }));
  assert.equal(url.origin + url.pathname, 'https://twitter.com/i/oauth2/authorize');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('client_id'), 'client');
  assert.equal(url.searchParams.get('scope'), X_SCOPES.join(' '));
  assert.equal(url.searchParams.get('state'), 'state-1');
  assert.equal(url.searchParams.get('code_challenge'), 'challenge-1');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.throws(() => buildAuthorizeUrl({ clientId: '', redirectUri: 'x', state: 's', challenge: 'c' }), TypeError);
});

test('the callback query is normalized without trusting values', () => {
  const ok = readCallback(new URLSearchParams('code=abc&state=xyz'));
  assert.deepEqual(ok, { code: 'abc', state: 'xyz', error: null, errorDescription: null });
  const cancelled = readCallback(new URLSearchParams('error=access_denied&error_description=No'));
  assert.equal(cancelled.error, 'access_denied');
  assert.equal(cancelled.code, null);
  assert.equal(readCallback(null).code, null);
});

test('the token exchange sends the verifier and never exposes the token in errors', async () => {
  let seen = null;
  const fetchImpl = async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify({ access_token: 'secret-token', token_type: 'bearer', scope: 'tweet.read', expires_in: 7200 }), { status: 200 });
  };
  const token = await exchangeCode({
    fetchImpl, clientId: 'client', clientSecret: 'secret', code: 'code-1',
    verifier: 'verifier-1', redirectUri: 'https://example.test/callback',
  });
  assert.equal(token.accessToken, 'secret-token');
  assert.equal(token.expiresIn, 7200);
  assert.equal(seen.url, X_TOKEN_URL);
  assert.equal(seen.options.method, 'POST');
  assert.equal(seen.options.headers.authorization, 'Basic ' + btoa('client:secret'));
  const body = new URLSearchParams(seen.options.body.toString());
  assert.equal(body.get('grant_type'), 'authorization_code');
  assert.equal(body.get('code'), 'code-1');
  assert.equal(body.get('code_verifier'), 'verifier-1');
  await assert.rejects(
    exchangeCode({
      fetchImpl: async () => new Response('nope', { status: 400 }), clientId: 'c', clientSecret: 's',
      code: 'code-1', verifier: 'verifier-1', redirectUri: 'https://example.test/callback',
    }),
    (error) => !error.message.includes('secret-token'),
  );
});

test('the viewer returns only the public handle and name', async () => {
  const fetchImpl = async (url, options) => {
    assert.match(url, /\/2\/users\/me\?user\.fields=username,name$/u);
    assert.equal(options.headers.authorization, 'Bearer token-1');
    return new Response(JSON.stringify({ data: { id: '42', username: 'coinblink', name: 'CoinBlink' } }), { status: 200 });
  };
  const viewer = await fetchViewer({ fetchImpl, accessToken: 'token-1' });
  assert.deepEqual(viewer, { id: '42', username: 'coinblink', name: 'CoinBlink' });
  await assert.rejects(fetchViewer({ fetchImpl: async () => new Response('{}', { status: 200 }), accessToken: 't' }));
  assert.equal(escapeHtml('<script>&"'), '&lt;script&gt;&amp;&quot;');
});

test('the routes keep the secret server-side and store no token', () => {
  for (const source of [start, callback]) {
    assert.match(source, /runtimeEnv\("X_CLIENT_ID"\)/u);
    assert.doesNotMatch(source, /localStorage|sessionStorage|console\.(log|error|warn)|innerHTML/u);
  }
  assert.ok(start.includes('X_VERIFIER_COOKIE'));
  assert.ok(start.includes('httpOnly: true'));
  assert.ok(start.includes('secure: true'));
  assert.ok(start.includes('sameSite: "lax"'));
  assert.ok(callback.includes('runtimeEnv("X_CLIENT_SECRET")'));
  assert.ok(callback.includes('params.state !== state'));
  assert.ok(callback.includes('exchangeCode'));
  assert.ok(callback.includes('fetchViewer'));
  assert.ok(callback.includes('This verification did not store the access or refresh token'));
  assert.doesNotMatch(callback, /token\.accessToken[^)]*page|accessToken.*\+/u);
});
