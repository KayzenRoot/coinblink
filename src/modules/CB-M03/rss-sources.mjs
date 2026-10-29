// CB-M03-P1-LIVE-RSS-001: keyless public news sources.
// RSS needs no API key and carries no monthly vendor quota, which is the only
// way this project can show real headlines without a paid plan. The budget we
// do respect is our own: one collection per source per window.
export const LIVE_NEWS_WINDOW_SECONDS = 900;
export const LIVE_NEWS_MAX_ITEMS = 60;
export const LIVE_NEWS_MAX_PER_SOURCE = 20;
export const LIVE_NEWS_TITLE_MAX = 200;
export const LIVE_NEWS_SUMMARY_MAX = 280;
export const LIVE_NEWS_TIMEOUT_MS = 5000;
export const LIVE_NEWS_QUERY_MAX = 80;
export const LIVE_NEWS_SINCE_OPTIONS = Object.freeze([3, 12, 24]);

export const LIVE_NEWS_SOURCES = Object.freeze([
  Object.freeze({
    id: "cointelegraph", name: "Cointelegraph", url: "https://cointelegraph.com/rss",
    home: "https://cointelegraph.com", hosts: Object.freeze(["cointelegraph.com"]),
  }),
  Object.freeze({
    id: "decrypt", name: "Decrypt", url: "https://decrypt.co/feed",
    home: "https://decrypt.co", hosts: Object.freeze(["decrypt.co"]),
  }),
  Object.freeze({
    id: "coindesk", name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss",
    home: "https://www.coindesk.com", hosts: Object.freeze(["coindesk.com", "www.coindesk.com"]),
  }),
  Object.freeze({
    id: "cryptoslate", name: "CryptoSlate", url: "https://cryptoslate.com/feed/",
    home: "https://cryptoslate.com", hosts: Object.freeze(["cryptoslate.com"]),
  }),
  Object.freeze({
    id: "bitcoinmagazine", name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/feed",
    home: "https://bitcoinmagazine.com", hosts: Object.freeze(["bitcoinmagazine.com"]),
  }),
]);
