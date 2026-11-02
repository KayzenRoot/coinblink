import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CAPTION_LIMIT, buildCaption, dailyQuota, planDay, utcDay,
} from '../../../src/modules/CB-M07/social-queue.mjs';

function db({ articles = [], existing = 0, inserts = [] } = {}) {
  return {
    inserts,
    prepare(sql) {
      const bind = (...args) => ({
        async first() { return { n: existing }; },
        async all() {
          if (sql.includes('FROM cms_articles')) return { results: articles.slice(0, Number(args[1])) };
          return { results: [] };
        },
        async run() { inserts.push(args); return { meta: { changes: 1 } }; },
      });
      return { bind, first: () => bind().first(), all: () => bind().all(), run: () => bind().run() };
    },
  };
}

const ARTICLES = [
  { id: 'a1', locale: 'en', slug: 'hong-kong', title: 'Hong Kong expands settlement', summary: 'Hong Kong is taking tokenized settlement to a 24/7 schedule.' },
  { id: 'a2', locale: 'en', slug: 'bitcoin-etf', title: 'Bitcoin ETF', summary: 'Inflows reached a record.' },
];

test('the quota is bounded and defaults to zero', () => {
  assert.deepEqual(dailyQuota({}), { instagram: 0, tiktok: 0 });
  assert.deepEqual(dailyQuota({ M07_IG_PER_DAY: '10', M07_TIKTOK_PER_DAY: '3' }), { instagram: 10, tiktok: 3 });
  assert.deepEqual(dailyQuota({ M07_IG_PER_DAY: '99', M07_TIKTOK_PER_DAY: '-1' }), { instagram: 20, tiktok: 0 });
  assert.deepEqual(dailyQuota({ M07_IG_PER_DAY: 'abc' }), { instagram: 0, tiktok: 0 });
});

test('the caption is our own summary plus the article link', () => {
  const caption = buildCaption({ summary: 'Short summary.', title: 'T', href: 'https://cb.example/en/article/x' });
  assert.ok(caption.endsWith('https://cb.example/en/article/x'));
  assert.ok(caption.startsWith('Short summary.'));
  const long = buildCaption({ summary: 'word '.repeat(200), title: 'T', href: 'https://cb.example/en/article/x' });
  assert.ok(long.includes('…'));
  assert.ok(long.split('\n').at(-1) === 'https://cb.example/en/article/x');
  assert.ok(long.length <= CAPTION_LIMIT + 'https://cb.example/en/article/x'.length + 1);
});

test('the planner fills each network up to its remaining quota', async () => {
  const database = db({ articles: ARTICLES });
  const plan = await planDay({
    db: database, nowMs: Date.UTC(2026, 10, 2, 12), quota: { instagram: 2, tiktok: 0 },
    origin: 'https://cb.example',
  });
  assert.equal(plan.length, 2);
  assert.ok(plan.every((row) => row.network === 'instagram'));
  assert.equal(plan[0].caption.includes('https://cb.example/en/article/hong-kong'), true);
  assert.equal(database.inserts.length, 2, 'planned rows are written');
  assert.equal(plan[0].day, '2026-11-02');
});

test('a dry run writes nothing and an exhausted quota plans nothing', async () => {
  const database = db({ articles: ARTICLES });
  const plan = await planDay({
    db: database, quota: { instagram: 2, tiktok: 0 }, origin: 'https://cb.example', dryRun: true,
  });
  assert.equal(plan.length, 2);
  assert.equal(database.inserts.length, 0);
  const full = await planDay({ db: db({ articles: ARTICLES, existing: 2 }), quota: { instagram: 2, tiktok: 0 } });
  assert.equal(full.length, 0);
});

test('the owner screen exposes the quotas and the two plan actions', () => {
  const page = readFileSync('src/modules/CB-M07/token-vault.mjs', 'utf8');
  assert.match(page, /Preview today plan/u);
  assert.match(page, /Plan today/u);
  assert.match(page, /action="\/admin\/social\/plan"/u);
  const settings = readFileSync('src/modules/CB-M05/p1-production/settings.mjs', 'utf8');
  assert.match(settings, /M07_IG_PER_DAY/u);
  assert.match(settings, /M07_TIKTOK_PER_DAY/u);
  assert.equal(utcDay(Date.UTC(2026, 10, 2, 23)), '2026-11-02');
});

test('a hot topic outranks a slightly fresher quiet one', async () => {
  const { relevanceScore, trendingCounts } = await import('../../../src/modules/CB-M07/social-queue.mjs');
  const nowMs = Date.UTC(2026, 10, 2, 12);
  const trending = trendingCounts([
    { title: 'Bitcoin ETF inflows rise' }, { title: 'Bitcoin breaks a record' },
    { title: 'Bitcoin miners sell' }, { title: 'Solana upgrade ships' },
  ]);
  assert.equal(trending.Bitcoin, 3);
  assert.equal(trending.Altcoins, 1);
  const hot = relevanceScore({ article: { publishedAt: nowMs / 1000 - 3600, topic: 'Bitcoin' }, nowMs, trending });
  const quiet = relevanceScore({ article: { publishedAt: nowMs / 1000 - 100, topic: 'Guides' }, nowMs, trending });
  assert.ok(hot > quiet, 'coverage heat beats 50 minutes of recency');
  const older = relevanceScore({ article: { publishedAt: nowMs / 1000 - 72 * 3600, topic: 'Bitcoin' }, nowMs, trending });
  assert.ok(hot > older);
});

test('the social tick plans the day only when a quota exists', async () => {
  const { socialTick } = await import('../../../src/modules/CB-M07/social-queue.mjs');
  const settings = () => ({ prepare() { return { bind: () => ({ first: async () => null, all: async () => ({ results: [] }) }) }; } });
  const off = await socialTick({ db: settings({}), secret: 's', env: {} });
  assert.equal(off.status, 'no_quota');
  const database = db({ articles: ARTICLES });
  const planned = await socialTick({
    db: database, secret: 's', env: { M07_IG_PER_DAY: '1' }, nowMs: Date.UTC(2026, 10, 2, 12),
    origin: 'https://cb.example', items: [{ title: 'Bitcoin ETF inflows' }],
  });
  assert.equal(planned.status, 'planned');
  assert.equal(planned.planned, 1);
});
