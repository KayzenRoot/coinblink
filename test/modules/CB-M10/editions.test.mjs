import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createEdition, editionsAdminSection, listEditions, readEdition, resolveArticles, sendEdition,
} from '../../../src/modules/CB-M10/editions.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const ENV = {
  RESEND_API_KEY: ['re', 'test', '12345678'].join('_'),
  COINBLINK_EMAIL_FROM: 'CoinBlink <news@nexlabs.company>',
};

function fakeDb({ articles = [], subscribers = ['founder@nexlabs.company'] } = {}) {
  const editions = [];
  const sends = [];
  return {
    editions,
    sends,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_settings')) return null;
          if (sql.includes('FROM cms_newsletter_editions WHERE id=')) {
            return editions.find((edition) => edition.id === args[0]) ?? null;
          }
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT INTO cms_newsletter_editions')) {
            editions.push({
              id: args[0], locale: args[1], subject: args[2], intro: args[3], articleIds: args[4],
              status: 'draft', recipients: 0, createdAt: args[5], sentAt: null,
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_newsletter_subscribers')) return { meta: { changes: 1 } };
          if (sql.startsWith('INSERT OR IGNORE INTO cms_newsletter_sends')) {
            sends.push({ editionId: args[0], email: args[1], status: args[2], detail: args[3] });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE cms_newsletter_editions SET status='sent'")) {
            const edition = editions.find((entry) => entry.id === args[2]);
            if (edition) {
              edition.status = 'sent';
              edition.recipients = args[0];
              edition.sentAt = args[1];
            }
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          if (sql.includes('FROM cms_articles')) {
            return { results: articles.filter((article) => article.status === 'published' && article.locale === args[0]) };
          }
          if (sql.includes('FROM cms_newsletter_subscribers')) {
            return { results: subscribers.map((email) => ({ email })) };
          }
          if (sql.includes('FROM cms_newsletter_editions')) {
            return { results: editions.slice().reverse().slice(0, args[0]) };
          }
          return { results: [] };
        },
      });
      return { bind, all: () => bind().all(), first: () => bind().first() };
    },
  };
}

const ARTICLES = [
  { id: 'a1', locale: 'en', slug: 'bitcoin-etf-inflows', title: 'Bitcoin ETF inflows', summary: 'Owner summary.', status: 'published' },
  { id: 'a2', locale: 'en', slug: 'regulation-week', title: 'Regulation week', summary: 'Owner summary 2.', status: 'published' },
  { id: 'a3', locale: 'pt-br', slug: 'outro', title: 'Outro', summary: 'Resumo.', status: 'published' },
  { id: 'a4', locale: 'en', slug: 'draft-only', title: 'Draft', summary: 'Draft.', status: 'draft' },
];

test('only published articles of the chosen locale can enter an edition', async () => {
  const db = fakeDb({ articles: ARTICLES });
  const resolved = await resolveArticles({ db, locale: 'en', articleIds: ['a1', 'a3', 'a4', 'a1', 'missing'] });
  assert.deepEqual(resolved.map((article) => article.id), ['a1']);
  assert.deepEqual(await resolveArticles({ db, locale: 'pt-br', articleIds: ['a1'] }), []);
});

test('creating a draft edition validates subject and articles', async () => {
  const db = fakeDb({ articles: ARTICLES });
  assert.equal((await createEdition({ db, locale: 'en', subject: 'ab', articleIds: ['a1'], nowMs: NOW })).status, 'invalid');
  assert.equal((await createEdition({ db, locale: 'fr', subject: 'Weekly digest', articleIds: ['a1'], nowMs: NOW })).status, 'invalid');
  assert.equal((await createEdition({ db, locale: 'en', subject: 'Weekly digest', articleIds: [], nowMs: NOW })).status, 'invalid');
  const created = await createEdition({
    db, locale: 'en', subject: 'Weekly digest', intro: 'Two things worth your time.',
    articleIds: ['a1', 'a2'], nowMs: NOW,
  });
  assert.equal(created.status, 'draft');
  assert.equal(db.editions.length, 1);
  assert.equal(db.editions[0].articleIds, 'a1,a2');
});

test('sending reaches confirmed subscribers once with an unsubscribe link', async () => {
  const db = fakeDb({ articles: ARTICLES, subscribers: ['a@nexlabs.company', 'b@nexlabs.company'] });
  const created = await createEdition({ db, locale: 'en', subject: 'Weekly digest', articleIds: ['a1'], nowMs: NOW });
  const seen = [];
  const result = await sendEdition({
    db, secret: 'a'.repeat(64), env: ENV, id: created.edition.id, nowMs: NOW,
    origin: 'https://coinblink.example',
    fetchImpl: async (url, options) => {
      seen.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ id: 'mail_1' }), { status: 200 });
    },
  });
  assert.equal(result.status, 'sent');
  assert.equal(result.sent, 2);
  assert.equal(seen.length, 2);
  assert.equal(seen[0].to[0], 'a@nexlabs.company');
  assert.match(seen[0].text, /Bitcoin ETF inflows/u);
  assert.match(seen[0].text, /https:\/\/coinblink\.example\/en\/article\/bitcoin-etf-inflows/u);
  assert.match(seen[0].text, /Unsubscribe: https:\/\/coinblink\.example\/newsletter\/confirm\?action=unsubscribe&token=/u);
  assert.equal(new Set(seen.map((mail) => mail.text.split('token=')[1])).size, 2);
  assert.equal(db.sends.length, 2);
  assert.equal(db.editions[0].status, 'sent');
  assert.equal(db.editions[0].recipients, 2);
});

test('a draft sends only once and reports a missing edition', async () => {
  const db = fakeDb({ articles: ARTICLES });
  const created = await createEdition({ db, locale: 'en', subject: 'Weekly digest', articleIds: ['a1'], nowMs: NOW });
  await sendEdition({ db, secret: 'a'.repeat(64), env: ENV, id: created.edition.id, nowMs: NOW, origin: 'https://x.example' });
  assert.equal((await sendEdition({ db, secret: 'a'.repeat(64), env: ENV, id: created.edition.id, nowMs: NOW, origin: 'https://x.example' })).status, 'already_sent');
  assert.equal((await sendEdition({ db, secret: 'a'.repeat(64), env: ENV, id: 'nope', nowMs: NOW, origin: 'https://x.example' })).status, 'missing');
});

test('a provider failure is recorded per address and does not stop the run', async () => {
  const db = fakeDb({ articles: ARTICLES, subscribers: ['a@nexlabs.company', 'b@nexlabs.company'] });
  const created = await createEdition({ db, locale: 'en', subject: 'Weekly digest', articleIds: ['a1'], nowMs: NOW });
  let call = 0;
  const result = await sendEdition({
    db, secret: 'a'.repeat(64), env: ENV, id: created.edition.id, nowMs: NOW, origin: 'https://x.example',
    fetchImpl: async () => {
      call += 1;
      return call === 1
        ? new Response(JSON.stringify({ message: 'rejected' }), { status: 422 })
        : new Response(JSON.stringify({ id: 'mail_2' }), { status: 200 });
    },
  });
  assert.equal(result.sent, 1);
  assert.equal(result.failed, 1);
  assert.deepEqual(db.sends.map((send) => send.status).sort(), ['failed', 'sent']);
});

test('sending without settings fails closed', async () => {
  const db = fakeDb({ articles: ARTICLES });
  const created = await createEdition({ db, locale: 'en', subject: 'Weekly digest', articleIds: ['a1'], nowMs: NOW });
  const result = await sendEdition({ db, secret: 'a'.repeat(64), env: {}, id: created.edition.id, nowMs: NOW, origin: 'https://x.example' });
  assert.equal(result.status, 'not_configured');
});

test('the owner screen lists editions, the composer and the send action', async () => {
  const db = fakeDb({ articles: ARTICLES });
  await createEdition({ db, locale: 'en', subject: 'Weekly digest', articleIds: ['a1'], nowMs: NOW });
  const editions = await listEditions({ db });
  const html = editionsAdminSection({
    editions, articles: ARTICLES.filter((article) => article.status === 'published'),
    csrf: 'c'.repeat(64),
  });
  assert.match(html, /action="\/admin\/editions\/create"/u);
  assert.match(html, /name="article_ids"/u);
  assert.match(html, /action="\/admin\/editions\/send"/u);
  assert.doesNotMatch(html, /<script/iu);
  assert.equal((await readEdition({ db, id: editions[0].id })).status, 'draft');
});

test('the admin route wires the three edition endpoints', () => {
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/editions'", '/admin/editions/create', '/admin/editions/send', 'sendEdition']) {
    assert.ok(route.includes(marker), marker);
  }
  const nav = readFileSync('src/modules/CB-M05/p1-production/owner-auth.mjs', 'utf8');
  assert.match(nav, /'\/admin\/editions'/u);
});
