import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  addSymbol, consumeLogin, listSymbols, logout, normalizeEmail, normalizeSymbol, readSession,
  readSessionCookie, removeSymbol, requestLogin, sendLoginLink, sessionCookie, TOKEN_TTL_SECONDS,
} from '../../../src/modules/CB-M16/readers.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const ENV = {
  RESEND_API_KEY: ['re', 'test', '12345678'].join('_'),
  COINBLINK_EMAIL_FROM: 'CoinBlink <news@nexlabs.company>',
};

function fakeDb() {
  const readers = [];
  const tokens = [];
  const sessions = [];
  const watchlist = [];
  return {
    readers, tokens, sessions, watchlist,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_readers WHERE email')) return readers.find((row) => row.email === args[0]) ?? null;
          if (sql.includes('FROM cms_reader_tokens WHERE reader_id')) {
            return { total: tokens.filter((row) => row.readerId === args[0] && row.createdAt >= args[1]).length };
          }
          if (sql.includes('FROM cms_reader_tokens WHERE token_digest')) {
            const row = tokens.find((entry) => entry.digest === args[0]);
            return row === undefined ? null : { readerId: row.readerId, expiresAt: row.expiresAt, consumedAt: row.consumedAt };
          }
          if (sql.includes('FROM cms_reader_sessions s JOIN cms_readers r')) {
            const row = sessions.find((entry) => entry.digest === args[0] && entry.revokedAt === null && entry.expiresAt > args[1]);
            if (!row) return null;
            const reader = readers.find((entry) => entry.id === row.readerId);
            return { id: reader.id, email: reader.email, locale: reader.locale };
          }
          if (sql.includes('COUNT(*) AS total FROM cms_watchlist')) {
            return { total: watchlist.filter((row) => row.readerId === args[0]).length };
          }
          if (sql.includes('SELECT symbol FROM cms_watchlist WHERE reader_id = ? AND symbol')) {
            return watchlist.find((row) => row.readerId === args[0] && row.symbol === args[1]) ?? null;
          }
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT INTO cms_readers')) {
            readers.push({ id: args[0], email: args[1], locale: args[2], status: 'pending', confirmedAt: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO cms_reader_tokens')) {
            tokens.push({ digest: args[0], readerId: args[1], expiresAt: args[2], consumedAt: null, createdAt: args[3] });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_reader_tokens SET consumed_at')) {
            const row = tokens.find((entry) => entry.digest === args[1] && entry.consumedAt === null);
            if (!row) return { meta: { changes: 0 } };
            row.consumedAt = args[0];
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO cms_reader_sessions')) {
            sessions.push({ digest: args[0], readerId: args[1], expiresAt: args[3], revokedAt: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_readers SET status')) {
            const row = readers.find((entry) => entry.id === args[2]);
            if (row) { row.status = 'active'; row.confirmedAt = args[0]; }
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_reader_sessions SET revoked_at')) {
            const row = sessions.find((entry) => entry.digest === args[1] && entry.revokedAt === null);
            if (!row) return { meta: { changes: 0 } };
            row.revokedAt = args[0];
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT OR IGNORE INTO cms_watchlist')) {
            if (!watchlist.some((row) => row.readerId === args[0] && row.symbol === args[1])) {
              watchlist.push({ readerId: args[0], symbol: args[1] });
            }
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('DELETE FROM cms_watchlist')) {
            const index = watchlist.findIndex((row) => row.readerId === args[0] && row.symbol === args[1]);
            if (index === -1) return { meta: { changes: 0 } };
            watchlist.splice(index, 1);
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          if (sql.includes('FROM cms_watchlist')) {
            return { results: watchlist.filter((row) => row.readerId === args[0]).map((row) => ({ symbol: row.symbol })) };
          }
          return { results: [] };
        },
      });
      return { bind, all: () => bind().all(), first: () => bind().first() };
    },
  };
}

test('emails and symbols are normalized', () => {
  assert.equal(normalizeEmail('  Reader@Example.COM '), 'reader@example.com');
  assert.equal(normalizeEmail('nope'), null);
  assert.equal(normalizeSymbol(' btc '), 'BTC');
  assert.equal(normalizeSymbol('b'), null);
  assert.equal(normalizeSymbol('btc$'), null);
});

test('a login link is single use, expires and opens a session', async () => {
  const db = fakeDb();
  const requested = await requestLogin({ db, email: 'reader@example.com', locale: 'pt-br', nowMs: NOW });
  assert.equal(requested.status, 'sent');
  assert.match(requested.token, /^[0-9a-f]{64}$/u);
  assert.equal(db.tokens[0].digest === requested.token, false, 'the token is stored as a digest');
  const consumed = await consumeLogin({ db, token: requested.token, nowMs: NOW });
  assert.equal(consumed.status, 'ok');
  assert.match(consumed.session, /^[0-9a-f]{64}$/u);
  assert.equal((await consumeLogin({ db, token: requested.token, nowMs: NOW })).status, 'used');
  const session = await readSession({ db, token: consumed.session, nowMs: NOW });
  assert.equal(session.email, 'reader@example.com');
  assert.equal(session.locale, 'pt-br');
  assert.equal(await readSession({ db, token: consumed.session, nowMs: NOW + 31 * 86_400_000 }), null);
});

test('an expired or unknown token never opens a session', async () => {
  const db = fakeDb();
  const requested = await requestLogin({ db, email: 'reader@example.com', nowMs: NOW });
  const late = NOW + (TOKEN_TTL_SECONDS + 1) * 1000;
  assert.equal((await consumeLogin({ db, token: requested.token, nowMs: late })).status, 'expired');
  assert.equal((await consumeLogin({ db, token: 'a'.repeat(64), nowMs: NOW })).status, 'invalid');
  assert.equal((await consumeLogin({ db, token: 'short', nowMs: NOW })).status, 'invalid');
});

test('login requests are throttled per reader per hour', async () => {
  const db = fakeDb();
  for (let index = 0; index < 5; index += 1) {
    assert.equal((await requestLogin({ db, email: 'reader@example.com', nowMs: NOW })).status, 'sent');
  }
  assert.equal((await requestLogin({ db, email: 'reader@example.com', nowMs: NOW })).status, 'throttled');
});

test('the watchlist is bounded, deduplicated and removable', async () => {
  const db = fakeDb();
  const requested = await requestLogin({ db, email: 'reader@example.com', nowMs: NOW });
  const { readerId } = await consumeLogin({ db, token: requested.token, nowMs: NOW });
  assert.equal((await addSymbol({ db, readerId, symbol: 'btc', nowMs: NOW })).status, 'added');
  assert.equal((await addSymbol({ db, readerId, symbol: 'BTC', nowMs: NOW })).status, 'added');
  assert.deepEqual(await listSymbols({ db, readerId }), ['BTC']);
  assert.equal(await removeSymbol({ db, readerId, symbol: 'btc' }), true);
  assert.equal(await removeSymbol({ db, readerId, symbol: 'btc' }), false);
  for (let index = 0; index < 25; index += 1) await addSymbol({ db, readerId, symbol: 'S' + index, nowMs: NOW });
  assert.equal((await listSymbols({ db, readerId })).length, 20);
  assert.equal((await addSymbol({ db, readerId, symbol: 'OVER', nowMs: NOW })).status, 'full');
});

test('logout revokes the session and the cookie is scoped', async () => {
  const db = fakeDb();
  const requested = await requestLogin({ db, email: 'reader@example.com', nowMs: NOW });
  const { session } = await consumeLogin({ db, token: requested.token, nowMs: NOW });
  assert.match(sessionCookie(session), /HttpOnly; SameSite=Lax/u);
  assert.equal(await logout({ db, token: session, nowMs: NOW }), true);
  assert.equal(await readSession({ db, token: session, nowMs: NOW }), null);
  assert.equal(readSessionCookie({ headers: { get: () => 'a=1; cb_reader=abc; b=2' } }), 'abc');
});

test('the magic link email carries the one-use link', async () => {
  const db = fakeDb();
  const seen = [];
  const result = await sendLoginLink({
    db, secret: 'a'.repeat(64), env: ENV, email: 'reader@example.com', token: 'f'.repeat(64),
    origin: 'https://coinblink.example',
    fetchImpl: async (_url, options) => {
      seen.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ id: 'mail_1' }), { status: 200 });
    },
  });
  assert.equal(result.status, 'sent');
  assert.match(seen[0].text, /https:\/\/coinblink\.example\/reader\/login\?token=f{64}/u);
  assert.match(seen[0].text, /expires in 15 minutes/u);
});

test('the routes wire the account flow and check the origin on writes', () => {
  const login = readFileSync('src/pages/api/reader/login.ts', 'utf8');
  for (const marker of ['requestLogin', 'sendLoginLink', '202', '/reader/signin?sent=1']) {
    assert.ok(login.includes(marker), marker);
  }
  const consume = readFileSync('src/pages/reader/login.ts', 'utf8');
  assert.ok(consume.includes('sessionCookie(result.session)'));
  const watchlist = readFileSync('src/pages/reader/watchlist.ts', 'utf8');
  assert.ok(watchlist.includes('origin !== url.origin'));
  const page = readFileSync('src/pages/reader/index.ts', 'utf8');
  assert.ok(page.includes('readerPage('));
});
