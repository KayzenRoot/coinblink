// CB-M03-P1-LIVE-TOPICS-001: frequent words in one collected snapshot.
//
// This is deliberately not a topic model. It counts in how many of the current
// headlines a word appears, so a reader can jump to a filter. No inference, no
// network, no storage. The label on screen says exactly that.
export const LIVE_NEWS_TOPIC_LIMIT = 8;
export const LIVE_NEWS_TOPIC_MIN_COUNT = 2;
const MIN_LENGTH = 3;
const MAX_LENGTH = 40;

// Function words in the three site languages. Anything else is counted as-is:
// the reader sees a frequency list, not an editorial classification.
// Cross-coverage reuses the same list so both features agree on what is noise.
const STOPWORDS = new Set([
  "about", "above", "according", "across", "ademas", "after", "again", "against",
  "ahead", "ahora", "ainda", "algo", "algun", "alguna", "along", "also",
  "amid", "among", "and", "another", "antes", "any", "aos", "apos",
  "aquel", "aquela", "aquele", "aquella", "are", "around", "asi", "aunque",
  "back", "bajo", "because", "been", "before", "being", "below", "between",
  "beyond", "but", "cada", "can", "com", "como", "con", "contra",
  "could", "cual", "cuando", "das", "day", "days", "del", "depois",
  "desde", "desta", "deste", "donde", "dos", "down", "due", "durante",
  "during", "early", "entre", "essa", "esse", "esta", "estas", "este",
  "estos", "even", "every", "first", "for", "foram", "from", "fue",
  "hace", "hacia", "had", "has", "hasta", "have", "hay", "her",
  "here", "his", "how", "into", "its", "just", "las", "last",
  "late", "later", "like", "los", "made", "mais", "make", "many",
  "mas", "may", "mediante", "menos", "mesmo", "mientras", "might", "mismo",
  "month", "more", "most", "much", "mucha", "mucho", "muito", "must",
  "muy", "nada", "nao", "near", "need", "new", "news", "next",
  "not", "now", "num", "numa", "off", "once", "one", "only",
  "onto", "other", "otra", "otro", "our", "out", "over", "para",
  "pela", "pelo", "per", "pero", "poco", "pode", "por", "puede",
  "qual", "quando", "que", "quem", "quien", "said", "sao", "says",
  "segun", "ser", "seu", "seus", "should", "sin", "since", "sobre",
  "solo", "some", "son", "soon", "sua", "suas", "such", "sus",
  "tambem", "tambien", "tan", "tem", "than", "that", "the", "their",
  "them", "then", "there", "these", "they", "this", "those", "though",
  "through", "tiene", "toda", "today", "todo", "todos", "told", "too",
  "tras", "two", "uma", "umas", "under", "uno", "unos", "uns",
  "until", "upon", "vai", "very", "vez", "via", "want", "was",
  "week", "were", "what", "when", "where", "which", "while", "who",
  "why", "will", "with", "would", "ya", "year", "years", "yet",
  "you", "your",
  "appeared", "continue", "continues", "credit", "image", "magazine", "originally", "photo", "post", "posts", "published", "read", "reads", "stories", "story",
]);

/** True when the word carries no subject in en, pt-br or es. */
export function isLiveNewsStopword(word) {
  return STOPWORDS.has(word);
}

function words(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLocaleLowerCase("en")
    .match(/\p{L}[\p{L}\p{N}]*/gu) ?? [];
}

/**
 * Fold a plural into its singular only when the collection contains both
 * forms. This is not stemming: without the singular present, the surface form
 * is kept exactly as published.
 * @param {Map<string, number>} counts
 */
function foldPlurals(counts) {
  for (const [term, count] of [...counts.entries()]) {
    if (term.length < 5) continue;
    let singular = null;
    if (term.endsWith("ies") && counts.has(term.slice(0, -3) + "y")) {
      singular = term.slice(0, -3) + "y";
    } else if (term.endsWith("es") && counts.has(term.slice(0, -2))) {
      singular = term.slice(0, -2);
    } else if (term.endsWith("s") && counts.has(term.slice(0, -1))) {
      singular = term.slice(0, -1);
    }
    if (singular === null) continue;
    counts.set(singular, counts.get(singular) + count);
    counts.delete(term);
  }
}

/**
 * Document frequency of words across headline titles and excerpts.
 * @param {unknown} items
 * @param {{limit?: number, minCount?: number}} [options]
 */
export function extractLiveTopics(items, options = {}) {
  if (!Array.isArray(items)) return Object.freeze([]);
  const { limit, minCount } = options ?? {};
  const safeLimit = Number.isSafeInteger(limit) && limit > 0
    ? Math.min(limit, 20) : LIVE_NEWS_TOPIC_LIMIT;
  const safeMin = Number.isSafeInteger(minCount) && minCount > 0 ? minCount : LIVE_NEWS_TOPIC_MIN_COUNT;
  const counts = new Map();
  for (const item of items) {
    if (item === null || typeof item !== "object") continue;
    const text = [item.title, item.summary].filter((value) => typeof value === "string").join(" ");
    const seen = new Set();
    for (const word of words(text)) {
      if (word.length < MIN_LENGTH || word.length > MAX_LENGTH) continue;
      if (STOPWORDS.has(word) || seen.has(word)) continue;
      seen.add(word);
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  foldPlurals(counts);
  const topics = [...counts.entries()]
    .filter(([, count]) => count >= safeMin)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, safeLimit)
    .map(([term, count]) => Object.freeze({ term, count }));
  return Object.freeze(topics);
}
