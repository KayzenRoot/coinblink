import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  confirm, listSubscribers, normalizeEmail, normalizeLocale, subscribe, subscriberCounts,
  subscribersSection, unsubscribe,
} from '../../../src/modules/CB-M10/newsletter.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);

function fakeDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.startsWith('SELECT status FROM cms_newsletter_subscribers')) {
            const row = rows.get(args[0]);
            return row === undefined ? null : { status: row.status };
          }
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT INTO cms_newsletter_subscribers')) {
            rows.set(args[0], { locale: args[1], status: 'pending', token: args[2], createdAt: args[3], confirmedAt: null });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE cms_newsletter_subscribers SET status='confirmed'")) {
            for (const row of rows.values()) {
              if (row.status === 'pending' && row.token === args[1]) {
                row.status = 'confirmed';
                row.confirmedAt = args[0];
                return { meta: { changes: 1 } };
              }
            }
            return { meta: { changes: 0 } };
          }
          if (sql.startsWith("UPDATE cms_newsletter_subscribers SET status='unsubscribed'")) {
            for (const row of rows.values()) {
              if (row.status === 'confirmed' && row.token === args[1]) {
                row.status = 'unsubscribed';
                return { meta: { changes: 1 } };
              }
            }
            return { meta: { changes: 0 } };
          }
          return { meta: { changes: 0 } };
        },
        async all() {
          if (sql.includes('GROUP BY status')) {
            const counts = new Map();
            for (const row of rows.values()) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
            return { results: [...counts].map(([status, total]) => ({ status, total })) };
          }
          return {
            results: [...rows].slice(0, args[0]).map(([email, row]) => ({
              email, locale: row.locale, status: row.status,
              createdAt: row.createdAt, confirmedAt: row.confirmedAt,
            })),
          };
        },
      });
      return {
        bind,
        all: () => bind().all(),
        first: () => bind().first(),
        run: () => bind().run(),
      };
    },
  };
}

test('emails are normalized and locales are restricted', () => {
  assert.equal(normalizeEmail('  Founder@NexLabs.Company '), 'founder@nexlabs.company');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(normalizeEmail(''), null);
  assert.equal(normalizeEmail('a@b.c'), null);
  assert.equal(normalizeLocale('pt-br'), 'pt-br');
  assert.equal(normalizeLocale('fr'), 'en');
});

test('a new address becomes pending with a one-time token', async () => {
  const db = fakeDb();
  const first = await subscribe({ db, email: 'founder@nexlabs.company', locale: 'pt-br', nowMs: NOW });
  assert.equal(first.status, 'created');
  assert.match(first.token, /^[0-9a-f]{64}$/u);
  assert.equal(db.rows.get('founder@nexlabs.company').status, 'pending');
  assert.equal(db.rows.get('founder@nexlabs.company').locale, 'pt-br');
  assert.notEqual(db.rows.get('founder@nexlabs.company').token, first.token);
});

test('a confirmed address is not re-subscribed and keeps its state', async () => {
  const db = fakeDb();
  const created = await subscribe({ db, email: 'founder@nexlabs.company', nowMs: NOW });
  assert.equal((await confirm({ db, token: created.token, nowMs: NOW })).status, 'confirmed');
  const again = await subscribe({ db, email: 'founder@nexlabs.company', nowMs: NOW });
  assert.equal(again.status, 'existing');
  assert.equal(db.rows.get('founder@nexlabs.company').status, 'confirmed');
  assert.equal((await subscribe({ db, email: 'bad', nowMs: NOW })).status, 'invalid');
});

test('confirmation is single use and unsubscription needs a confirmed row', async () => {
  const db = fakeDb();
  const created = await subscribe({ db, email: 'founder@nexlabs.company', nowMs: NOW });
  assert.equal((await confirm({ db, token: 'z'.repeat(64), nowMs: NOW })).status, 'invalid');
  assert.equal((await confirm({ db, token: created.token, nowMs: NOW })).status, 'confirmed');
  assert.equal((await confirm({ db, token: created.token, nowMs: NOW })).status, 'unknown');
  assert.equal((await unsubscribe({ db, token: created.token, nowMs: NOW })).status, 'unsubscribed');
  assert.equal((await unsubscribe({ db, token: created.token, nowMs: NOW })).status, 'unknown');
});

test('counts and listing report every state', async () => {
  const db = fakeDb();
  const a = await subscribe({ db, email: 'a@nexlabs.company', nowMs: NOW });
  await subscribe({ db, email: 'b@nexlabs.company', nowMs: NOW });
  await confirm({ db, token: a.token, nowMs: NOW });
  const counts = await subscriberCounts({ db });
  assert.deepEqual(counts, { pending: 1, confirmed: 1, unsubscribed: 0 });
  const rows = await listSubscribers({ db });
  assert.equal(rows.length, 2);
  assert.equal(rows.some((row) => row.status === 'confirmed'), true);
});

test('the owner section renders counts and rows without tokens', async () => {
  const db = fakeDb();
  const created = await subscribe({ db, email: 'founder@nexlabs.company', nowMs: NOW });
  const html = subscribersSection({
    subscribers: await listSubscribers({ db }),
    counts: await subscriberCounts({ db }),
  });
  assert.match(html, /founder@nexlabs\.company/u);
  assert.match(html, /Pending<\/dt><dd>1/u);
  assert.equal(html.includes(created.token), false);
  assert.doesNotMatch(html, /<script/iu);
});

test('the public endpoints and the admin route expose the contract', () => {
  const subscribeRoute = readFileSync('src/pages/api/newsletter/subscribe.ts', 'utf8');
  for (const marker of ['subscribe(', 'sendEmail', 'email_failed', 'invalid_email', '202']) {
    assert.ok(subscribeRoute.includes(marker), marker);
  }
  const confirmPage = readFileSync('src/pages/newsletter/confirm.ts', 'utf8');
  for (const marker of ['confirm(', 'unsubscribe(', 'no-store', 'form-action \'none\'']) {
    assert.ok(confirmPage.includes(marker), marker);
  }
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  assert.ok(route.includes("path === '/admin/newsletter'"));
  const dashboard = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  assert.match(dashboard, /'\/admin\/newsletter'/u);
});

test('the public page renders a no-JS form and the JSON clients keep their envelope', () => {
  const page = readFileSync('src/pages/newsletter/index.astro', 'utf8');
  for (const marker of ['action="/api/newsletter/subscribe"', 'method="post"', 'name="email"',
    'name="locale"', 'type="email"', 'Double opt-in', 'unsubscribe link']) {
    assert.ok(page.includes(marker), marker);
  }
  const route = readFileSync('src/pages/api/newsletter/subscribe.ts', 'utf8');
  assert.ok(route.includes('wantsHtml'));
  assert.ok(route.includes('/newsletter?status=accepted'));
  assert.ok(route.includes('/newsletter?status=invalid'));
  assert.match(route, /reply\(202/u);
});
