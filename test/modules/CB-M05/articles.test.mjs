import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  articlesAdminSection, listArticles, normalizeTags, publishDraft, readArticle, slugify,
  unpublishArticle, validLocale,
} from '../../../src/modules/CB-M05/p1-production/articles.mjs';

const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const DRAFT = {
  id: 'draft-1', title: 'Bitcoin ETF inflows accelerate in October',
  summary: 'Owner-written summary of the October flow data with the numbers checked.',
  body: 'First paragraph.\n\nSecond paragraph.', sourceUrl: 'https://example.com/source',
  authorLabel: 'CoinBlink',
};

function fakeDb({ drafts = [DRAFT], articles = [] } = {}) {
  const rows = articles;
  return {
    rows,
    prepare(sql) {
      const bind = (...args) => ({
        async first() {
          if (sql.includes('FROM cms_drafts')) return drafts.find((draft) => draft.id === args[0]) ?? null;
          if (sql.includes('SELECT id, revision FROM cms_articles WHERE draft_id')) {
            return rows.find((row) => row.draft_id === args[0] && row.locale === args[1]) ?? null;
          }
          if (sql.includes('SELECT id FROM cms_articles WHERE locale')) {
            return rows.find((row) => row.locale === args[0] && row.slug === args[1]) ?? null;
          }
          if (sql.includes('FROM cms_articles WHERE locale=? AND slug=?')) {
            return rows.find((row) => row.locale === args[0] && row.slug === args[1]) ?? null;
          }
          return null;
        },
        async run() {
          if (sql.startsWith('INSERT INTO cms_articles')) {
            rows.push({
              id: args[0], draft_id: args[1], locale: args[2], slug: args[3], title: args[4],
              summary: args[5], body: args[6], tags: args[7], authorLabel: args[8], sourceUrl: args[9],
              provenanceNote: args[10], revision: 1, status: 'published', publishedAt: args[11], updatedAt: args[12],
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('UPDATE cms_articles SET slug=')) {
            const row = rows.find((entry) => entry.id === args[10]);
            if (!row) return { meta: { changes: 0 } };
            Object.assign(row, {
              slug: args[0], title: args[1], summary: args[2], body: args[3], tags: args[4],
              authorLabel: args[5], sourceUrl: args[6], provenanceNote: args[7], revision: args[8],
              status: 'published', updatedAt: args[9],
            });
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith("UPDATE cms_articles SET status='unpublished'")) {
            const row = rows.find((entry) => entry.id === args[1]);
            if (!row || row.status !== 'published') return { meta: { changes: 0 } };
            row.status = 'unpublished';
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 1 } };
        },
        async all() {
          const filtered = rows.filter((row) => (sql.includes("status='published'") ? row.status === 'published' : true));
          return { results: filtered.slice(0, args.at(-1) ?? 50) };
        },
      });
      return { bind, all: () => bind().all(), first: () => bind().first() };
    },
  };
}

test('slugs are ascii, bounded and stable', () => {
  assert.equal(slugify('Bitcoin ETF inflows accelerate in October'), 'bitcoin-etf-inflows-accelerate-in-october');
  assert.equal(slugify('Regulação de cripto no Brasil'), 'regulacao-de-cripto-no-brasil');
  assert.equal(slugify('  --Hello,   World!--  '), 'hello-world');
  assert.equal(slugify('ab'), '');
});

test('tags are normalized, deduplicated and bounded', () => {
  assert.deepEqual(normalizeTags('Bitcoin,  Regulation , bitcoin'), ['bitcoin', 'regulation']);
  assert.equal(normalizeTags('a,b,c,d,e,f,g,h').length, 6);
  assert.equal(normalizeTags('').length, 0);
  assert.equal(validLocale('pt-br'), true);
  assert.equal(validLocale('fr'), false);
});

test('publishing snapshots the draft and appends a revision', async () => {
  const db = fakeDb();
  const result = await publishDraft({
    db, draftId: 'draft-1', locale: 'en', tags: 'Bitcoin, ETF',
    provenanceNote: 'Owner-authored; source checked 2026-10-31', nowMs: NOW,
  });
  assert.equal(result.status, 'published');
  assert.equal(result.article.created, true);
  assert.equal(db.rows.length, 1);
  assert.equal(db.rows[0].slug, 'bitcoin-etf-inflows-accelerate-in-october');
  assert.equal(db.rows[0].tags, 'bitcoin,etf');
  assert.equal(db.rows[0].status, 'published');
});

test('publishing refuses a missing draft, a bad locale or a thin provenance note', async () => {
  const db = fakeDb();
  assert.equal((await publishDraft({ db, draftId: 'nope', locale: 'en', provenanceNote: 'x'.repeat(12) })).status, 'missing');
  assert.equal((await publishDraft({ db, draftId: 'draft-1', locale: 'fr', provenanceNote: 'x'.repeat(12) })).status, 'invalid');
  assert.equal((await publishDraft({ db, draftId: 'draft-1', locale: 'en', provenanceNote: 'short' })).status, 'invalid');
});

test('republishing updates the same row and bumps the revision', async () => {
  const db = fakeDb();
  const first = await publishDraft({ db, draftId: 'draft-1', locale: 'en', provenanceNote: 'Owner-authored note', nowMs: NOW });
  const second = await publishDraft({ db, draftId: 'draft-1', locale: 'en', provenanceNote: 'Owner-authored note v2', nowMs: NOW + 1000 });
  assert.equal(second.article.id, first.article.id);
  assert.equal(second.article.revision, 2);
  assert.equal(db.rows.length, 1);
});

test('unpublishing keeps the row so the URL can answer 410', async () => {
  const db = fakeDb();
  const published = await publishDraft({ db, draftId: 'draft-1', locale: 'en', provenanceNote: 'Owner-authored note', nowMs: NOW });
  assert.equal(await unpublishArticle({ db, id: published.article.id, nowMs: NOW }), true);
  assert.equal(await unpublishArticle({ db, id: published.article.id, nowMs: NOW }), false);
  assert.equal(db.rows[0].status, 'unpublished');
  const article = await readArticle({ db, locale: 'en', slug: 'bitcoin-etf-inflows-accelerate-in-october' });
  assert.equal(article.status, 'unpublished');
  assert.deepEqual(await listArticles({ db }), []);
  assert.equal((await listArticles({ db, includeAll: true })).length, 1);
});

test('the owner screen offers the publish form and the unpublish action', () => {
  const html = articlesAdminSection({
    articles: [{
      id: 'a1', locale: 'en', slug: 'hello-world', title: 'Hello world article', status: 'published',
      revision: 2, publishedAt: 1_800_000_000, tags: [], summary: 's', body: 'b', authorLabel: '',
      sourceUrl: 'https://example.com', provenanceNote: 'note', updatedAt: 1_800_000_000,
    }],
    drafts: [{ id: 'draft-1', title: 'Draft title', revision: 3 }],
    csrf: 'c'.repeat(64),
  });
  assert.match(html, /action="\/admin\/articles\/publish"/u);
  assert.match(html, /name="provenance_note" required/u);
  assert.match(html, /action="\/admin\/articles\/unpublish"/u);
  assert.match(html, /href="\/en\/article\/hello-world"/u);
  assert.doesNotMatch(html, /<script/iu);
});

test('the public page and the API expose only metadata', () => {
  const component = readFileSync('src/modules/CB-M05/ArticlePage.astro', 'utf8');
  for (const marker of ['article.provenanceNote', 'article.sourceUrl', 'revision {article.revision}']) {
    assert.ok(component.includes(marker), marker);
  }
  for (const locale of ['en', 'pt-br', 'es']) {
    const route = readFileSync('src/pages/' + locale + '/article/[slug].astro', 'utf8');
    for (const marker of ['readArticle', 'Astro.response.status = 404', 'Astro.response.status = 410']) {
      assert.ok(route.includes(marker), locale + ' ' + marker);
    }
  }
  const api = readFileSync('src/pages/v1/articles.ts', 'utf8');
  for (const marker of ['consumeQuota', 'QUOTA_EXCEEDED', 'redistribution', 'canonical', 'INVALID_LOCALE']) {
    assert.ok(api.includes(marker), marker);
  }
  assert.doesNotMatch(api, /article\.body/u);
  const route = readFileSync('src/pages/admin/[...route].js', 'utf8');
  for (const marker of ["path === '/admin/articles'", '/admin/articles/publish', '/admin/articles/unpublish']) {
    assert.ok(route.includes(marker), marker);
  }
});
