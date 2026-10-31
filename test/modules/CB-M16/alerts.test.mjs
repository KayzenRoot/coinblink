import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  alertsAdminSection, buildDigests, keywordsFor, previewDigests, sendDigests,
} from '../../../src/modules/CB-M16/alerts.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const ENV = {
  RESEND_API_KEY: ['re', 'test', '12345678'].join('_'),
  COINBLINK_EMAIL_FROM: 'CoinBlink <news@nexlabs.company>',
};
const SNAPSHOT = {
  status: 'LIVE_HEADLINES',
  items: [
    { title: 'Bitcoin ETF inflows accelerate', link: 'https://news.example/btc-1', sourceName: 'CoinDesk', publishedAt: '2026-10-31T10:00:00Z' },
    { title: 'Ethereum upgrade ships next week', link: 'https://news.example/eth-1', sourceName: 'Cointelegraph', publishedAt: '2026-10-31T09:00:00Z' },
    { title: 'Regulators publish new guidance', link: 'https://news.example/reg-1', sourceName: 'CryptoSlate', publishedAt: '2026-10-31T08:00:00Z' },
  ],
};

function fakeDb({ readers = [], watchlist = [], sends = [] } = {}) {
  return {
    sends,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_settings')) return null;
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT OR IGNORE INTO cms_reader_alert_sends')) {
            if (sends.some((row) => row.readerId === args[0] && row.day === args[1])) {
              return { meta: { changes: 0 } };
            }
            sends.push({ readerId: args[0], day: args[1], status: 'empty' });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_reader_alert_sends')) {
            const row = sends.find((entry) => entry.readerId === args[2] && entry.day === args[3]);
            if (row) row.status = args[0];
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          if (sql.includes('FROM cms_readers r')) {
            return {
              results: watchlist
                .filter((row) => readers.some((reader) => reader.id === row.readerId))
                .map((row) => ({ id: row.readerId, email: readers.find((reader) => reader.id === row.readerId).email, symbol: row.symbol })),
            };
          }
          if (sql.includes('FROM cms_reader_alert_sends WHERE day')) {
            return { results: sends.filter((row) => row.day === args[0]).map((row) => ({ readerId: row.readerId })) };
          }
          return { results: [] };
        },
      });
      return { bind, all: () => bind().all(), first: () => bind().first() };
    },
  };
}

const READERS = [{ id: 'r1', email: 'a@example.com' }, { id: 'r2', email: 'b@example.com' }];
const WATCHLIST = [{ readerId: 'r1', symbol: 'BTC' }, { readerId: 'r1', symbol: 'ETH' }, { readerId: 'r2', symbol: 'SOL' }];

test('symbols map to topic words and match only their own headlines', async () => {
  assert.deepEqual(keywordsFor('BTC'), ['bitcoin', 'btc']);
  assert.deepEqual(keywordsFor('xyz'), ['xyz']);
  const db = fakeDb({ readers: READERS, watchlist: WATCHLIST });
  const digests = await buildDigests({ db, snapshot: SNAPSHOT, nowMs: NOW });
  assert.equal(digests.length, 1, 'only the reader with a match gets a digest');
  assert.equal(digests[0].email, 'a@example.com');
  assert.deepEqual(digests[0].symbols, ['BTC', 'ETH']);
  assert.equal(digests[0].headlines.length, 2);
});

test('a reader gets at most one digest per UTC day', async () => {
  const db = fakeDb({ readers: READERS, watchlist: WATCHLIST });
  const seen = [];
  const first = await sendDigests({
    db, secret: 'a'.repeat(64), env: ENV, snapshot: SNAPSHOT, nowMs: NOW,
    fetchImpl: async (_url, options) => {
      seen.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ id: 'm1' }), { status: 200 });
    },
  });
  assert.equal(first.sent, 1);
  assert.equal(seen[0].to[0], 'a@example.com');
  assert.match(seen[0].text, /Your symbols: BTC, ETH/u);
  assert.match(seen[0].text, /https:\/\/news\.example\/btc-1/u);
  const second = await sendDigests({
    db, secret: 'a'.repeat(64), env: ENV, snapshot: SNAPSHOT, nowMs: NOW + 3600_000,
    fetchImpl: async () => new Response(JSON.stringify({ id: 'm2' }), { status: 200 }),
  });
  assert.equal(second.sent, 0);
  assert.equal(second.skipped, 1);
});

test('no configuration sends nothing and says so', async () => {
  const db = fakeDb({ readers: READERS, watchlist: WATCHLIST });
  const result = await sendDigests({ db, secret: 'a'.repeat(64), env: {}, snapshot: SNAPSHOT, nowMs: NOW });
  assert.equal(result.status, 'not_configured');
  assert.equal(result.sent, 0);
});

test('the preview counts readers and headlines without sending', async () => {
  const db = fakeDb({ readers: READERS, watchlist: WATCHLIST });
  const preview = await previewDigests({ db, snapshot: SNAPSHOT, nowMs: NOW });
  assert.equal(preview.day, '2026-10-31');
  assert.equal(preview.readers, 1);
  assert.equal(preview.headlines, 2);
  assert.equal(preview.alreadySent, 0);
  assert.equal(preview.sample[0].email, 'a@example.com');
});

test('the owner screen shows the preview and the send action', async () => {
  const db = fakeDb({ readers: READERS, watchlist: WATCHLIST });
  const html = alertsAdminSection({
    preview: await previewDigests({ db, snapshot: SNAPSHOT, nowMs: NOW }),
    csrf: 'c'.repeat(64),
  });
  assert.match(html, /Readers with a match<\/dt><dd>1/u);
  assert.match(html, /action="\/admin\/alerts\/send"/u);
  assert.match(html, /a@example\.com/u);
  assert.doesNotMatch(html, /<script/iu);
});

test('the admin route wires the preview and the send', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/alerts'", '/admin/alerts/send', 'previewDigests', 'sendDigests']) {
    assert.ok(route.includes(marker), marker);
  }
  const nav = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  assert.match(nav, /'\/admin\/alerts'/u);
});
