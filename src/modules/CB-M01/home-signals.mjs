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

const TRACKED = Object.freeze([
  Object.freeze({ id: 'bitcoin', label: 'Bitcoin', words: ['bitcoin', 'btc'] }),
  Object.freeze({ id: 'ethereum', label: 'Ethereum', words: ['ethereum', 'ether', 'eth'] }),
  Object.freeze({ id: 'solana', label: 'Solana', words: ['solana', 'sol'] }),
  Object.freeze({ id: 'regulation', label: 'Regulation', words: ['regulator', 'sec', 'law', 'policy', 'court'] }),
  Object.freeze({ id: 'etf', label: 'ETF', words: ['etf', 'fund', 'inflow', 'outflow'] }),
  Object.freeze({ id: 'exchange', label: 'Exchanges', words: ['exchange', 'binance', 'coinbase', 'kraken'] }),
  Object.freeze({ id: 'security', label: 'Security', words: ['hack', 'exploit', 'breach', 'stolen', 'theft'] }),
  Object.freeze({ id: 'ai', label: 'AI', words: ['ai', 'artificial intelligence', 'agent'] }),
]);

/**
 * Trending = the tracked topics mentioned most often in the collected titles,
 * each with its newest matching headline. It is a count over the current
 * collection, not a popularity measure across the market.
 */
export function buildTrending(items, limit = 5) {
  const rows = (Array.isArray(items) ? items : []).filter((item) => typeof item?.title === 'string');
  const scored = TRACKED.map((topic) => {
    const matches = rows.filter((row) => topic.words.some((word) => row.title.toLowerCase().includes(word)));
    return Object.freeze({
      id: topic.id,
      label: topic.label,
      mentions: matches.length,
      headline: matches.length === 0 ? null : Object.freeze({
        title: matches[0].title, link: String(matches[0].link ?? ''),
        sourceName: String(matches[0].sourceName ?? ''), publishedAt: matches[0].publishedAt ?? null,
      }),
    });
  }).filter((topic) => topic.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions || a.label.localeCompare(b.label))
    .slice(0, Math.min(Math.max(Number(limit) || 5, 1), 8));
  return Object.freeze(scored);
}
