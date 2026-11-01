// CB-M09-P1-FEED-001: the RSS feed of our own published articles.
//
// The feed carries only articles CoinBlink published, in their own locale, with
// the article page as the link. Collected headlines are not syndicated here:
// they belong to the publishers and are never redistributed.

export const FEED_LOCALES = Object.freeze(['en', 'pt-br', 'es']);
const FEED_LIMIT = 50;

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

/** RFC 822 date, the format RSS 2.0 expects. */
export function rfc822(seconds) {
  const date = new Date(Number(seconds) * 1000);
  return Number.isNaN(date.getTime()) ? new Date(0).toUTCString() : date.toUTCString();
}

export function isFeedLocale(locale) {
  return FEED_LOCALES.includes(locale);
}

/** Builds the RSS document from already-loaded published articles. */
export function buildFeed({ locale, origin, articles, nowMs = Date.now() }) {
  const base = String(origin ?? '').replace(/\/$/u, '');
  const items = (Array.isArray(articles) ? articles : [])
    .filter((article) => article?.status === 'published' && typeof article.slug === 'string')
    .slice(0, FEED_LIMIT);
  const title = 'CoinBlink · ' + locale;
  const link = base + '/' + locale;
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '  <title>' + escapeXml(title) + '</title>',
    '  <link>' + escapeXml(link) + '</link>',
    '  <description>' + escapeXml('Original articles published by CoinBlink in ' + locale + '.') + '</description>',
    '  <language>' + escapeXml(locale) + '</language>',
    '  <lastBuildDate>' + rfc822(Math.floor(nowMs / 1000)) + '</lastBuildDate>',
    '  <atom:link href="' + escapeXml(base + '/' + locale + '/feed.xml') + '" rel="self" type="application/rss+xml"/>',
  ];
  for (const article of items) {
    const url = base + '/' + locale + '/article/' + article.slug;
    lines.push(
      '  <item>',
      '    <title>' + escapeXml(article.title) + '</title>',
      '    <link>' + escapeXml(url) + '</link>',
      '    <guid isPermaLink="true">' + escapeXml(url) + '</guid>',
      '    <pubDate>' + rfc822(article.publishedAt) + '</pubDate>',
      '    <description>' + escapeXml(article.summary) + '</description>',
      '  </item>',
    );
  }
  lines.push('</channel>', '</rss>', '');
  return lines.join('\n');
}
