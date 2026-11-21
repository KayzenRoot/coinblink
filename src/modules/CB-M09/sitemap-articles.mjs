import { isIndexablePath } from './seo-policy.mjs';

// One sitemap is limited to 50,000 entries, including the three editorial URLs.
const DEFAULT_MAX_ROWS = 49997;
// A full sitemap fits within the D1 Free limit of 50 queries per invocation.
const DEFAULT_PAGE_SIZE = 1000;

/** Read every published article, or fail without emitting an incomplete sitemap. */
/** @param {{ db?: unknown, pageSize?: number, maxRows?: number }} [options] */
export async function listPublishedSitemapPaths({
  db, pageSize = DEFAULT_PAGE_SIZE, maxRows = DEFAULT_MAX_ROWS,
} = {}) {
  if (!db || typeof db !== 'object' || !('prepare' in db) || typeof db.prepare !== 'function') {
    throw new Error('Sitemap database unavailable');
  }
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 1000
    || !Number.isSafeInteger(maxRows) || maxRows < 1 || maxRows > DEFAULT_MAX_ROWS) {
    throw new RangeError('Invalid sitemap pagination limit');
  }

  const paths = new Set();
  const observedIds = new Set();
  let cursor = null;
  let observedRows = 0;

  for (;;) {
    const where = "FROM cms_articles WHERE status='published'";
    const sql = cursor === null
      ? `SELECT id, locale, slug, published_at ${where} ORDER BY published_at DESC, id DESC LIMIT ?`
      : `SELECT id, locale, slug, published_at ${where} AND (published_at < ? OR (published_at = ? AND id < ?)) ORDER BY published_at DESC, id DESC LIMIT ?`;
    const args = cursor === null
      ? [pageSize] : [cursor.published_at, cursor.published_at, cursor.id, pageSize];
    const result = await db.prepare(sql).bind(...args).all();
    if (result?.success === false || !Array.isArray(result?.results)
      || result.results.length > pageSize) {
      throw new Error('Invalid sitemap database page');
    }

    for (const row of result.results) {
      if (!row || typeof row.id !== 'string' || row.id.length === 0
        || !Number.isSafeInteger(row.published_at)) {
        throw new Error('Invalid sitemap database row');
      }
      if (cursor && (row.published_at > cursor.published_at
        || (row.published_at === cursor.published_at && row.id >= cursor.id))) {
        throw new Error('Sitemap cursor order violation');
      }
      if (observedIds.has(row.id)) throw new Error('Duplicate sitemap cursor id');
      observedIds.add(row.id);
      cursor = { published_at: row.published_at, id: row.id };
      observedRows += 1;
      if (observedRows > maxRows) throw new Error('Sitemap article limit exceeded');

      const path = `/${row.locale}/article/${row.slug}`;
      if (typeof row.locale !== 'string' || typeof row.slug !== 'string'
        || !isIndexablePath(path) || paths.has(path)) {
        throw new Error('Invalid or duplicate published sitemap path');
      }
      paths.add(path);
    }

    if (result.results.length < pageSize) return [...paths];
  }
}
