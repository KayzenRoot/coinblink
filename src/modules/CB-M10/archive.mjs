// CB-M10-P1-EDITIONS-001: the public archive of sent editions.
//
// Only editions that were actually sent are listed, and only articles that are
// still published appear inside them. A missing table yields an empty list
// instead of a broken page.

import { listEditions, readEdition, resolveArticles } from './editions.mjs';

/**
 * @param {{db?: any, limit?: number}} [options]
 * @returns {Promise<ReadonlyArray<Readonly<{id: string, locale: string, subject: string,
 *   intro: string, sentAt: number | null, articles: ReadonlyArray<Readonly<{slug: string,
 *   title: string, summary: string, href: string}>>}>>>}
 */
export async function listArchive({ db, limit = 20 } = {}) {
  let editions;
  try {
    editions = await listEditions({ db, limit });
  } catch {
    return Object.freeze([]);
  }
  const rows = [];
  for (const edition of editions) {
    if (edition.status !== 'sent') continue;
    const detail = await readEdition({ db, id: edition.id });
    if (detail === null) continue;
    const articles = await resolveArticles({ db, locale: detail.locale, articleIds: detail.articleIds });
    if (articles.length === 0) continue;
    rows.push(Object.freeze({
      id: detail.id,
      locale: detail.locale,
      subject: detail.subject,
      intro: detail.intro,
      sentAt: detail.sentAt,
      articles: Object.freeze(articles.map((article) => Object.freeze({
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        href: '/' + detail.locale + '/article/' + article.slug,
      }))),
    }));
  }
  return Object.freeze(rows);
}
