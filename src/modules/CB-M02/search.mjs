// CB-M02-P1-SEARCH-001: server-side search over our articles and the collected
// headlines.
//
// It is a plain GET form: no script, no index and no query stored. Our articles
// come from D1 and link to their page; collected headlines keep their publisher
// link and are never treated as ours.

export const SEARCH_MAX_QUERY = 80;

export function normalizeQuery(value) {
  return String(value ?? '').trim().slice(0, SEARCH_MAX_QUERY);
}

export function searchContent({ articles = [], headlines = [], query = '', limit = 20 } = {}) {
  const clean = normalizeQuery(query);
  const bounded = Math.min(Math.max(Number(limit) || 20, 1), 50);
  if (clean === '') {
    return Object.freeze({ query: '', articles: Object.freeze([]), headlines: Object.freeze([]) });
  }
  const needle = clean.toLocaleLowerCase();
  const matches = (text) => String(text ?? '').toLocaleLowerCase().includes(needle);
  const ours = (Array.isArray(articles) ? articles : [])
    .filter((article) => typeof article?.slug === 'string' && (matches(article.title) || matches(article.summary)))
    .slice(0, bounded);
  const theirs = (Array.isArray(headlines) ? headlines : [])
    .filter((item) => matches(item?.title))
    .slice(0, bounded);
  return Object.freeze({
    query: clean,
    articles: Object.freeze(ours.map((article) => Object.freeze({
      title: article.title,
      summary: article.summary,
      href: '/' + article.locale + '/article/' + article.slug,
    }))),
    headlines: Object.freeze(theirs.map((item) => Object.freeze({
      title: item.title,
      sourceName: String(item.sourceName ?? ''),
      link: String(item.link ?? ''),
      publishedAt: item.publishedAt ?? null,
    }))),
  });
}
