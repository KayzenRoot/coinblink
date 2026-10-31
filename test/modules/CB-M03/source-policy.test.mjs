import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  filterSnapshot, hiddenSourceIds, listPolicy, setPolicy, sourcesAdminSection,
} from '../../../src/modules/CB-M03/source-policy.mjs';
import { storeManualAccount } from '../../../src/modules/CB-M07/token-vault.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

function policyDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      const bind = (...args) => ({
        async run() {
          if (sql.startsWith('INSERT INTO cms_source_policy')) {
            rows.set(args[0], { hidden: args[1], note: args[2] });
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          return { results: [...rows].map(([sourceId, row]) => ({ sourceId, hidden: row.hidden, note: row.note })) };
        },
      });
      return { bind, all: () => bind().all(), first: async () => null };
    },
  };
}

test('a source can be hidden and shown again, and the policy is read back', async () => {
  const db = policyDb();
  assert.equal(await setPolicy({ db, sourceId: 'coindesk', hidden: true, note: 'license review', nowMs: NOW }), true);
  assert.deepEqual(await hiddenSourceIds({ db }), ['coindesk']);
  assert.equal((await listPolicy({ db }))[0].note, 'license review');
  await setPolicy({ db, sourceId: 'coindesk', hidden: false, nowMs: NOW });
  assert.deepEqual(await hiddenSourceIds({ db }), []);
  assert.equal(await setPolicy({ db, sourceId: 'Bad Id!', hidden: true, nowMs: NOW }), false);
});

test('a database without the migration hides nothing', async () => {
  const broken = { prepare() { throw new Error('no such table: cms_source_policy'); } };
  assert.deepEqual(await listPolicy({ db: broken }), []);
  assert.deepEqual(await hiddenSourceIds({ db: broken }), []);
});

test('filtering removes hidden items and sources but keeps the rest', () => {
  const snapshot = {
    status: 'LIVE_HEADLINES',
    items: [
      { title: 'a', sourceId: 'coindesk', link: 'https://a.example/1' },
      { title: 'b', sourceId: 'cointelegraph', link: 'https://b.example/2' },
    ],
    sources: [{ id: 'coindesk' }, { id: 'cointelegraph' }],
  };
  const filtered = filterSnapshot(snapshot, ['coindesk']);
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0].sourceId, 'cointelegraph');
  assert.equal(filtered.sources.length, 1);
  assert.equal(filterSnapshot(snapshot, []).items.length, 2);
  assert.equal(filterSnapshot(null, ['x']), null);
});

test('the owner screen lists every collector with a toggle', () => {
  const html = sourcesAdminSection({
    sources: [{ id: 'coindesk', name: 'CoinDesk', language: 'en' }, { id: 'cointelegraph', name: 'Cointelegraph', language: 'en' }],
    policy: [{ sourceId: 'coindesk', hidden: true, note: 'license review' }],
    csrf: 'c'.repeat(64),
  });
  assert.match(html, /action="\/admin\/sources\/toggle"/u);
  assert.match(html, /<code>coindesk<\/code>/u);
  assert.match(html, /hidden<\/td>/u);
  assert.match(html, />Show</u);
  assert.match(html, />Hide</u);
  assert.doesNotMatch(html, /<script/iu);
});

function vaultDb() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      const bind = (...args) => ({
        async run() {
          if (sql.startsWith('INSERT INTO cms_social_accounts')) {
            rows.push({ provider: args[0], accountId: args[1], username: args[2], ciphertext: args[5], iv: args[6] });
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
      });
      return { bind, first: async () => null, all: async () => ({ results: [] }) };
    },
  };
}

test('a pasted Instagram or TikTok token is encrypted and never stored in clear', async () => {
  const db = vaultDb();
  const secret = 'a'.repeat(64);
  const token = 'IGQVJ' + 'x'.repeat(60);
  const stored = await storeManualAccount({ db, secret, provider: 'instagram', username: '@coinblink', token, nowMs: NOW });
  assert.equal(stored.status, 'stored');
  assert.equal(stored.username, 'coinblink');
  assert.equal(db.rows[0].accountId, 'manual:coinblink');
  assert.equal(db.rows[0].ciphertext.includes(token), false);
  assert.equal(await storeManualAccount({ db, secret, provider: 'facebook', username: 'x', token, nowMs: NOW }).then((r) => r.reason), 'provider');
  assert.equal(await storeManualAccount({ db, secret, provider: 'tiktok', username: 'a b', token, nowMs: NOW }).then((r) => r.reason), 'username');
  assert.equal(await storeManualAccount({ db, secret, provider: 'tiktok', username: 'coinblink', token: 'short', nowMs: NOW }).then((r) => r.reason), 'token');
});

test('the admin wires the source policy and the manual social token', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/sources'", '/admin/sources/toggle', '/admin/social/manual', 'storeManualAccount', 'sourcesAdminSection']) {
    assert.ok(route.includes(marker), marker);
  }
  const nav = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  assert.match(nav, /'\/admin\/sources'/u);
  const panel = readFileSync('src/modules/CB-M03/LiveNewsPanel.astro', 'utf8');
  assert.match(panel, /filterSnapshot\(/u);
});
