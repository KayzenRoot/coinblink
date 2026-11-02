// CB-M02-P1-TOPICS-001: the canonical topic pages.
//
// A topic is a stable slug with a label and the home category it maps to, so an
// article tag and a collected headline land on the same page. Unknown slugs
// never render a page.

import { headlineCategory } from '../CB-M01/home-signals.mjs';

export const TOPICS = Object.freeze([
  Object.freeze({ slug: 'bitcoin', label: 'Bitcoin', category: 'Bitcoin' }),
  Object.freeze({ slug: 'ethereum', label: 'Ethereum', category: 'Ethereum' }),
  Object.freeze({ slug: 'altcoins', label: 'Altcoins', category: 'Altcoins' }),
  Object.freeze({ slug: 'defi', label: 'DeFi', category: 'DeFi' }),
  Object.freeze({ slug: 'nfts', label: 'NFTs', category: 'NFTs' }),
  Object.freeze({ slug: 'regulation', label: 'Regulation', category: 'Regulation' }),
  Object.freeze({ slug: 'ai-crypto', label: 'AI x Crypto', category: 'AI x Crypto' }),
  Object.freeze({ slug: 'market-analysis', label: 'Market Analysis', category: 'Market Analysis' }),
]);

const BY_SLUG = new Map(TOPICS.map((topic) => [topic.slug, topic]));

export function topicBySlug(slug) {
  return BY_SLUG.get(String(slug ?? '')) ?? null;
}

/** Maps a free-form article tag to a topic slug, when one exists. */
export function topicSlugForTag(tag) {
  const slug = String(tag ?? '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '');
  if (slug === 'ai-x-crypto' || slug === 'ai') return 'ai-crypto';
  if (slug === 'regulation' || slug === 'regulatory') return 'regulation';
  if (slug === 'market-analysis' || slug === 'analysis') return 'market-analysis';
  return BY_SLUG.has(slug) ? slug : null;
}

/** Published article cards for the topic. */
export function articlesForTopic(articles, topic) {
  if (topic === null) return Object.freeze([]);
  return Object.freeze((Array.isArray(articles) ? articles : [])
    .filter((article) => typeof article?.slug === 'string' && headlineCategory(article.title) === topic.category));
}

/** Collected headlines for the topic, keeping the publisher attribution. */
export function headlinesForTopic(items, topic) {
  if (topic === null) return Object.freeze([]);
  return Object.freeze((Array.isArray(items) ? items : [])
    .filter((item) => typeof item?.title === 'string' && headlineCategory(item.title) === topic.category));
}
