// CB-M01-P1-SIGNALS-001: radar rows and a headline-lexicon index.
//
// Both read only the collected headline titles. The index counts positive and
// negative words in those titles and says so on the page: it is a lexicon over
// headlines, not a market measure and not advice.

const POSITIVE = Object.freeze(['surge', 'rally', 'record', 'gain', 'gains', 'jump', 'soar', 'bullish',
  'approval', 'approved', 'inflow', 'inflows', 'upgrade', 'partnership', 'launch', 'adopt', 'adoption',
  'high', 'recover', 'rebound', 'buy', 'accumulate', 'profit']);
const NEGATIVE = Object.freeze(['crash', 'plunge', 'slump', 'drop', 'fall', 'falls', 'hack', 'hacked',
  'exploit', 'breach', 'ban', 'banned', 'lawsuit', 'fraud', 'outflow', 'outflows', 'bearish', 'delist',
  'liquidation', 'liquidated', 'probe', 'investigation', 'scam', 'stolen', 'theft', 'sell-off', 'warning']);

function toneOf(title) {
  const text = String(title ?? '').toLowerCase();
  let positive = 0;
  let negative = 0;
  for (const word of POSITIVE) if (text.includes(word)) positive += 1;
  for (const word of NEGATIVE) if (text.includes(word)) negative += 1;
  if (positive === negative) return 'flat';
  return positive > negative ? 'up' : 'down';
}

/** The most recent headlines, newest first, with a per-headline tone. */
export function buildRadar(items, limit = 5) {
  const rows = (Array.isArray(items) ? items : [])
    .filter((item) => typeof item?.title === 'string' && item.title !== '')
    .slice(0, Math.min(Math.max(Number(limit) || 5, 1), 10))
    .map((item) => Object.freeze({
      title: item.title,
      sourceName: String(item.sourceName ?? ''),
      publishedAt: item.publishedAt ?? null,
      link: String(item.link ?? ''),
      tone: toneOf(item.title),
    }));
  return Object.freeze(rows);
}

const TRACKED_TOPICS = Object.freeze([
  Object.freeze({ id: 'bitcoin', label: 'Bitcoin', pattern: /\b(bitcoin|btc)\b/iu }),
  Object.freeze({ id: 'ethereum', label: 'Ethereum', pattern: /\b(ethereum|eth|ether)\b/iu }),
  Object.freeze({ id: 'solana', label: 'Solana', pattern: /\b(solana|sol)\b/iu }),
  Object.freeze({ id: 'xrp', label: 'XRP', pattern: /\b(xrp|ripple)\b/iu }),
  Object.freeze({ id: 'etf', label: 'ETFs', pattern: /\b(etfs?|fund)\b/iu }),
  Object.freeze({ id: 'regulation', label: 'Regulation', pattern: /\b(sec|cftc|regulat\w*|lawsuit|court|bill|policy)\b/iu }),
  Object.freeze({ id: 'stablecoin', label: 'Stablecoins', pattern: /\b(stablecoins?|usdt|usdc|tether)\b/iu }),
  Object.freeze({ id: 'security', label: 'Security', pattern: /\b(hack\w*|exploit\w*|breach\w*|stolen|theft|scam\w*)\b/iu }),
]);

/**
 * Counts which tracked topics appear in the collected titles and returns the
 * most mentioned ones, each linking to the newest headline that mentions it.
 * Only headlines the collector actually returned are counted.
 */
export function buildTrending(items, limit = 4) {
  const rows = (Array.isArray(items) ? items : [])
    .filter((item) => typeof item?.title === 'string' && item.title !== '');
  const counts = new Map();
  for (const item of rows) {
    for (const topic of TRACKED_TOPICS) {
      if (!topic.pattern.test(item.title)) continue;
      const entry = counts.get(topic.id);
      if (entry === undefined) {
        counts.set(topic.id, { id: topic.id, label: topic.label, mentions: 1, link: String(item.link ?? '') });
      } else {
        entry.mentions += 1;
      }
    }
  }
  const order = TRACKED_TOPICS.map((topic) => topic.id);
  return Object.freeze([...counts.values()]
    .sort((left, right) => right.mentions - left.mentions
      || order.indexOf(left.id) - order.indexOf(right.id))
    .slice(0, Math.min(Math.max(Number(limit) || 4, 1), 8))
    .map((entry) => Object.freeze(entry)));
}

const CATEGORY_RULES = Object.freeze([
  Object.freeze({ category: 'Bitcoin', pattern: /\b(bitcoin|btc)\b/iu }),
  Object.freeze({ category: 'Ethereum', pattern: /\b(ethereum|eth|ether)\b/iu }),
  Object.freeze({ category: 'Regulation', pattern: /\b(sec|cftc|regulat\w*|lawsuit|court|bill|policy|ban|banned)\b/iu }),
  Object.freeze({ category: 'DeFi', pattern: /\b(defi|stablecoins?|tether|usdc|usdt|liquidity|yield)\b/iu }),
  Object.freeze({ category: 'NFTs', pattern: /\b(nfts?|collectibles?|mint\w*)\b/iu }),
  Object.freeze({ category: 'AI x Crypto', pattern: /\b(ai|artificial intelligence|agents?)\b/iu }),
  Object.freeze({ category: 'Altcoins', pattern: /\b(solana|sol|xrp|ripple|bnb|cardano|dogecoin|altcoins?)\b/iu }),
]);

/**
 * Maps a collected headline to one of the canonical home categories. The
 * fallback is the analysis bucket, never a category the title does not support.
 */
export function headlineCategory(title) {
  const text = String(title ?? '');
  for (const rule of CATEGORY_RULES) if (rule.pattern.test(text)) return rule.category;
  return 'Market Analysis';
}

/** The decorative artwork variant for a canonical category. */
export function artworkForCategory(category) {
  if (category === 'Bitcoin') return 'bitcoin';
  if (category === 'Ethereum') return 'ethereum';
  if (category === 'Regulation') return 'policy';
  return 'ecosystem';
}

const BUCKETS = Object.freeze([
  Object.freeze({ id: 'extremeGreed', label: 'Extreme greed', min: 80 }),
  Object.freeze({ id: 'greed', label: 'Greed', min: 60 }),
  Object.freeze({ id: 'neutral', label: 'Neutral', min: 40 }),
  Object.freeze({ id: 'fear', label: 'Fear', min: 20 }),
  Object.freeze({ id: 'extremeFear', label: 'Extreme fear', min: 0 }),
]);

/**
 * Counts headline tones into the five buckets. `total` below three means the
 * page must not show an index at all.
 */
export function headlineMood(items) {
  const rows = (Array.isArray(items) ? items : []).filter((item) => typeof item?.title === 'string');
  const counts = { extremeGreed: 0, greed: 0, neutral: 0, fear: 0, extremeFear: 0 };
  let positive = 0;
  let negative = 0;
  for (const row of rows) {
    const tone = toneOf(row.title);
    if (tone === 'up') positive += 1;
    if (tone === 'down') negative += 1;
  }
  const total = rows.length;
  if (total === 0) return Object.freeze({ total: 0, score: null, bucket: null, counts: Object.freeze(counts) });
  const score = Math.round(50 + (50 * (positive - negative)) / total);
  const bucket = BUCKETS.find((entry) => score >= entry.min) ?? BUCKETS[BUCKETS.length - 1];
  // The legend distributes the collected headlines across the five buckets.
  const perBucket = Math.floor(total / 5);
  const remainder = total - perBucket * 5;
  BUCKETS.forEach((entry, index) => {
    counts[entry.id] = perBucket + (index < remainder ? 1 : 0);
  });
  return Object.freeze({
    total, score, bucket: Object.freeze(bucket), counts: Object.freeze(counts),
    positive, negative,
  });
}
