import test from 'node:test';
import assert from 'node:assert/strict';
import { listPublishedSitemapPaths } from '../../../src/modules/CB-M09/sitemap-articles.mjs';

function fakeDb(rows, { failOnPage = 0, repeatCursor = false } = {}) {
  let page = 0;
  return {
    prepare(sql) {
      assert.match(sql, /status\s*=\s*'published'/u);
      assert.match(sql, /ORDER BY published_at DESC,\s*id DESC/u);
      return {
        bind(...args) {
          return {
            async all() {
              page += 1;
              if (page === failOnPage) throw new Error('simulated D1 outage');
              const filtered = rows.filter((row) => row.status === 'published')
                .sort((a, b) => b.published_at - a.published_at || b.id.localeCompare(a.id));
              const cursor = args.length === 4 ? { published_at: args[0], id: args[2] } : null;
              const eligible = cursor
                ? filtered.filter((row) => row.published_at < cursor.published_at
                  || (row.published_at === cursor.published_at && row.id < cursor.id)) : filtered;
              if (repeatCursor && page === 2) return { results: filtered.slice(0, args.at(-1)), success: true };
              return { results: eligible.slice(0, args.at(-1)), success: true };
            },
          };
        },
      };
    },
  };
}

function article(n, props = {}) {
  return { id: String(n).padStart(5, '0'), published_at: 1700000000, locale: 'en',
    slug: 'article-' + n, status: 'published', ...props };
}

test('M09 sitemap enumerates all published articles past page 200 without losing equal-timestamp rows', async () => {
  const rows = Array.from({ length: 245 }, (_, i) => article(i + 1));
  rows.push(article(900, { status: 'unpublished' }));
  const paths = await listPublishedSitemapPaths({ db: fakeDb(rows), pageSize: 200 });
  assert.equal(paths.length, 245);
  assert.equal(new Set(paths).size, 245);
  assert.ok(paths.includes('/en/article/article-245'));
  assert.ok(!paths.includes('/en/article/article-900'));
});

test('M09 sitemap rejects missing DB, intermediate query failures and repeated pages', async () => {
  await assert.rejects(listPublishedSitemapPaths({ db: undefined }), /database/i);
  const rows = Array.from({ length: 220 }, (_, i) => article(i + 1));
  await assert.rejects(listPublishedSitemapPaths({ db: fakeDb(rows, { failOnPage: 2 }), pageSize: 200 }), /simulated D1 outage/u);
  await assert.rejects(listPublishedSitemapPaths({ db: fakeDb(rows, { repeatCursor: true }), pageSize: 200 }), /cursor|order|duplicate/i);
});

test('M09 sitemap includes CMS collision slugs and enforces the maximum', async () => {
  const collisionSlug = 'a'.repeat(75) + '--2';
  const rows = [article(1), article(2, { locale: 'es', slug: collisionSlug }), article(4, { locale: 'es' })];
  const paths = await listPublishedSitemapPaths({ db: fakeDb(rows), pageSize: 2 });
  assert.deepEqual(new Set(paths), new Set(['/en/article/article-1', '/es/article/article-4', '/es/article/' + collisionSlug]));
  await assert.rejects(listPublishedSitemapPaths({ db: fakeDb(rows), pageSize: 2, maxRows: 2 }),
    /limit|too many/i);
});

test('M09 sitemap rejects a malformed published path after a valid page', async () => {
  const rows = [article(1, { slug: 'unexpected&character' }), article(2), article(3)];
  await assert.rejects(listPublishedSitemapPaths({ db: fakeDb(rows), pageSize: 2 }), /invalid.*path/i);
});
