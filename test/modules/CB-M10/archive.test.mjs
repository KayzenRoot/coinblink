import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { listArchive } from '../../../src/modules/CB-M10/archive.mjs';

function db({ editions = [], articles = [] } = {}) {
  return {
    prepare(sql) {
      const bind = (...args) => ({
        async all() {
          if (sql.includes('FROM cms_newsletter_editions')) return { results: editions };
          if (sql.includes('FROM cms_articles')) {
            return { results: articles.filter((row) => row.locale === args[0]) };
          }
          return { results: [] };
        },
        async first() {
          if (sql.includes('FROM cms_newsletter_editions')) {
            return editions.find((row) => row.id === args[0]) ?? null;
          }
          return null;
        },
      });
      return { bind, all: () => bind().all(), first: () => bind().first() };
    },
  };
}

const EDITION = {
  id: 'e1', locale: 'en', subject: 'CoinBlink weekly', intro: 'Three stories.',
  status: 'sent', recipients: 10, createdAt: 1000, sentAt: 2000,
  articleIds: 'a1,a2',
};
const ARTICLES = [
  { id: 'a1', locale: 'en', slug: 'bitcoin-etf', title: 'Bitcoin ETF', summary: 'Summary' },
  { id: 'a2', locale: 'en', slug: 'sec-probe', title: 'SEC probe', summary: 'Summary' },
];

test('only sent editions with published articles appear in the archive', async () => {
  const archive = await listArchive({ db: db({ editions: [EDITION], articles: ARTICLES }) });
  assert.equal(archive.length, 1);
  assert.equal(archive[0].subject, 'CoinBlink weekly');
  assert.equal(archive[0].articles[0].href, '/en/article/bitcoin-etf');
  const draft = await listArchive({ db: db({ editions: [{ ...EDITION, status: 'draft' }], articles: ARTICLES }) });
  assert.deepEqual(draft, []);
  const empty = await listArchive({ db: db({ editions: [EDITION], articles: [] }) });
  assert.deepEqual(empty, [], 'an edition whose articles are unpublished is hidden');
});

test('a database without the migration renders an empty archive', async () => {
  const broken = { prepare() { throw new Error('no such table: cms_newsletter_editions'); } };
  assert.deepEqual(await listArchive({ db: broken }), []);
});

test('the public page lists the archive and links the articles', () => {
  const page = readFileSync('src/pages/newsletter/editions.astro', 'utf8');
  assert.match(page, /listArchive\(\{ db: runtimeBinding\("CMS_DB"\)/u);
  assert.match(page, /<a href=\{article\.href\}>/u);
  assert.doesNotMatch(page, /<script/iu);
  const subscribe = readFileSync('src/pages/newsletter/index.astro', 'utf8');
  assert.match(subscribe, /href="\/newsletter\/editions"/u);
});
