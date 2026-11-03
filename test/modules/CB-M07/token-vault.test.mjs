import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  consumeOauthState, createOauthState, decryptToken, encryptToken, listSocialAccounts,
  readSocialToken, revokeSocialAccount, socialPage, storeSocialAccount,
} from '../../../src/modules/CB-M07/token-vault.mjs';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;
const STATE = 'state-token-0123456789abcdef';

function fakeDb({ changes = 1 } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const result = {
        run: async () => ({ meta: { changes } }),
        all: async () => {
          calls.push({ sql, args: [] });
          return { results: [{ provider: 'x', accountId: '42', username: 'coinblink' }] };
        },
      };
      return {
        ...result,
        bind(...args) {
          calls.push({ sql, args });
          return result;
        },
      };
    },
  };
}

test('tokens round-trip through AES-GCM and a wrong key or tampering fails', async () => {
  const encrypted = await encryptToken({ secret: SECRET, plaintext: 'access-token-1' });
  assert.notEqual(encrypted.ciphertext, 'access-token-1');
  assert.match(encrypted.iv, /^[A-Za-z0-9_-]{16}$/u);
  assert.equal(await decryptToken({ secret: SECRET, ...encrypted }), 'access-token-1');
  await assert.rejects(decryptToken({ secret: 'b'.repeat(64), ...encrypted }));
  await assert.rejects(decryptToken({ secret: SECRET, ciphertext: encrypted.ciphertext.slice(0, -2) + 'AA', iv: encrypted.iv }));
  await assert.rejects(encryptToken({ secret: SECRET, plaintext: '' }));
  await assert.rejects(encryptToken({ secret: 'short', plaintext: 'x' }));
});

test('the account row stores only ciphertext and the public profile', async () => {
  const db = fakeDb();
  const result = await storeSocialAccount({
    db, secret: SECRET, provider: 'x',
    account: { id: '42', username: 'coinblink', name: 'CoinBlink' },
    token: { accessToken: 'access-secret', refreshToken: 'refresh-secret', scope: 'tweet.read', expiresIn: 7200 },
    nowMs: NOW,
  });
  assert.equal(result.status, 'stored');
  assert.equal(db.calls.length, 1);
  const args = db.calls[0].args;
  assert.equal(args.includes('access-secret'), false);
  assert.equal(args.includes('refresh-secret'), false);
  assert.equal(args[1], '42');
  assert.equal(args[2], 'coinblink');
  assert.equal(await decryptToken({ secret: SECRET, ciphertext: args[5], iv: args[6] }), 'access-secret');
  assert.equal(await decryptToken({ secret: SECRET, ciphertext: args[7], iv: args[8] }), 'refresh-secret');
  assert.equal(args[9], Math.floor(NOW / 1000) + 7200);
});

test('invalid providers and missing tokens are refused before any write', async () => {
  const db = fakeDb();
  assert.equal((await storeSocialAccount({
    db, secret: SECRET, provider: 'meta', account: { id: '1', username: 'x' }, token: { accessToken: 't' }, nowMs: NOW,
  })).status, 'invalid');
  assert.equal((await storeSocialAccount({
    db, secret: SECRET, provider: 'x', account: { id: '', username: 'x' }, token: { accessToken: 't' }, nowMs: NOW,
  })).status, 'invalid');
  assert.equal((await storeSocialAccount({
    db, secret: SECRET, provider: 'x', account: { id: '1', username: 'x' }, token: {}, nowMs: NOW,
  })).status, 'invalid');
  assert.equal(db.calls.length, 0);
});

test('the OAuth state is one-use and bounded', async () => {
  assert.equal(await createOauthState({ db: fakeDb(), state: STATE, nowMs: NOW }), true);
  assert.equal(await createOauthState({ db: fakeDb(), state: 'short', nowMs: NOW }), false);
  assert.equal(await consumeOauthState({ db: fakeDb({ changes: 1 }), state: STATE, nowMs: NOW }), true);
  assert.equal(await consumeOauthState({ db: fakeDb({ changes: 0 }), state: STATE, nowMs: NOW }), false);
  assert.equal(await consumeOauthState({ db: fakeDb(), state: 'bad state', nowMs: NOW }), false);
});

test('listing selects no ciphertext and revocation is owner-scoped', async () => {
  const db = fakeDb();
  const accounts = await listSocialAccounts(db);
  assert.equal(accounts[0].username, 'coinblink');
  assert.doesNotMatch(db.calls[0].sql, /ciphertext/iu);
  const revokeDb = fakeDb();
  assert.equal((await revokeSocialAccount({ db: revokeDb, provider: 'x', accountId: '42' })).status, 'revoked');
  assert.equal((await revokeSocialAccount({ db: fakeDb(), provider: 'x', accountId: '' })).status, 'invalid');
  assert.match(revokeDb.calls.at(-1).sql, /DELETE FROM cms_social_accounts WHERE provider=\? AND account_id=\? AND owner_id=1/u);
});

test('the page lists the handle and offers the three owner-initiated flows', async () => {
  const response = socialPage({
    accounts: [{ provider: 'x', accountId: '42', username: 'coinblink', scopes: 'tweet.read' }],
    csrf: 'c'.repeat(64),
  });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /@coinblink/u);
  assert.match(body, /Connect X/u);
  assert.match(body, /href="\/api\/oauth\/instagram\/start"/u);
  assert.match(body, /href="\/api\/oauth\/tiktok\/start"/u);
  assert.match(body, /action="\/admin\/social\/revoke"/u);
  assert.doesNotMatch(body, /access-secret|refresh-secret/u);
});

test('the plan offers an owner-triggered send and shows the recorded detail', async () => {
  const response = socialPage({
    accounts: [], csrf: 'c'.repeat(64), quota: { instagram: 2, tiktok: 2 },
    plan: [{ network: 'instagram', slug: 'gold-rises', caption: 'Gold', status: 'planned', detail: 'instagram:error:500:gold-rises' }],
  });
  const body = await response.text();
  assert.match(body, /action="\/admin\/social\/send"/u);
  assert.match(body, /Send today plan/u);
  assert.match(body, /instagram:error:500:gold-rises/u);
  assert.match(body, /nothing is posted until you send/u);
});

test('instagram and tiktok accounts are storable, meta is not', async () => {
  const db = fakeDb();
  for (const provider of ['instagram', 'tiktok']) {
    const result = await storeSocialAccount({
      db, secret: SECRET, provider,
      account: { id: '1784', username: 'coinblink', name: 'CoinBlink' },
      token: { accessToken: 'token-' + provider, scope: 's', expiresIn: 7200 }, nowMs: NOW,
    });
    assert.equal(result.status, 'stored', provider);
    assert.equal(db.calls.at(-1).args.includes('token-' + provider), false);
  }
  assert.equal((await storeSocialAccount({
    db, secret: SECRET, provider: 'meta', account: { id: '1', username: 'x' },
    token: { accessToken: 't' }, nowMs: NOW,
  })).status, 'invalid');
});

test('readSocialToken decrypts the newest connected row and skips manual tokens', async () => {
  const sealed = await encryptToken({ secret: SECRET, plaintext: 'page-token-1' });
  const calls = [];
  const db = {
    prepare(sql) {
      const row = {
        accountId: '1784', username: 'coinblink',
        accessCiphertext: sealed.ciphertext, accessIv: sealed.iv,
        refreshCiphertext: null, refreshIv: null, expiresAt: null,
      };
      return {
        bind(...args) {
          calls.push({ sql, args });
          return { first: async () => row };
        },
      };
    },
  };
  const token = await readSocialToken({ db, secret: SECRET, provider: 'instagram' });
  assert.equal(token.status, 'ok');
  assert.equal(token.accessToken, 'page-token-1');
  assert.equal(token.refreshToken, null);
  assert.match(calls[0].sql, /NOT LIKE 'manual:%'/u);
  assert.equal((await readSocialToken({ db, secret: SECRET, provider: 'meta' })).status, 'invalid');
  assert.equal((await readSocialToken({
    db: { prepare: () => ({ bind: () => ({ first: async () => null }) }) }, secret: SECRET, provider: 'tiktok',
  })).status, 'missing');
});

test('the admin route exposes the owner-triggered send', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ['/admin/social', 'listSocialAccounts', 'revokeSocialAccount', 'socialPage', 'sendDay', "'/admin/social/send'"]) {
    assert.ok(route.includes(marker), marker);
  }
  // Publishing is owner-triggered only; nothing schedules or auto-publishes.
  assert.doesNotMatch(route, /schedule/iu);
});
