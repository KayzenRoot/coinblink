// M04 P0: deterministic labels for a no-feed market workbench. Zero quotes or provider requests.
export const MARKET_DEMO_POLICY = "P0_OFFLINE_NO_LIVE_QUOTES";
const observations = Object.freeze([
  Object.freeze({ asset: "BTC", pair: "BTC/USD", quoteCurrency: "USD", unit: "USD_PER_BTC",
    numericValue: null, asOfUTC: "2025-01-01T00:00:00Z", observedAtUTC: null,
    provider: "synthetic-market.example.test", rightsStatus: "NOT_CLEARED",
    freshness: "STALE", mode: "MOCK", isTradable: false }),
  Object.freeze({ asset: "ETH", pair: "ETH/USD", quoteCurrency: "USD", unit: "USD_PER_ETH",
    numericValue: null, asOfUTC: null, observedAtUTC: null,
    provider: "synthetic-market.example.test", rightsStatus: "NOT_CLEARED",
    freshness: "UNAVAILABLE", mode: "MOCK", isTradable: false }),
  Object.freeze({ asset: "SOL", pair: "SOL/USD", quoteCurrency: "USD", unit: "USD_PER_SOL",
    numericValue: null, asOfUTC: null, observedAtUTC: null,
    provider: "synthetic-market.example.test", rightsStatus: "NOT_CLEARED",
    freshness: "UNAVAILABLE", mode: "MOCK", isTradable: false }),
]);
const SUPPORTED = new Set(["BTC", "ETH", "SOL"]);

export function listMockMarkets({ query = "" } = {}) {
  if (typeof query !== "string" || query.length > 32) {
    return { state: "BAD_REQUEST", mode: "MOCK", items: [] };
  }
  const q = query.trim().toUpperCase();
  const items = observations.filter(item => [item.asset, item.pair, item.freshness].some(value => value.includes(q)));
  return { state: items.length ? "MOCK_RESULTS" : "EMPTY", mode: "MOCK", items };
}

/** Defensive gate for P0 UI: never render numeric data as real, even with forged input. */
export function inspectMockMarket(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !SUPPORTED.has(value.asset) || value.pair !== value.asset + "/USD"
    || value.quoteCurrency !== "USD" || value.unit !== "USD_PER_" + value.asset) {
    return { state: "BAD_REQUEST", displayQuote: null, live: false };
  }
  if (value.mode !== "MOCK" || value.isTradable !== false) {
    return { state: "DENIED_LIVE", displayQuote: null, live: false };
  }
  if (value.numericValue !== null && (typeof value.numericValue !== "number"
    || !Number.isFinite(value.numericValue) || value.numericValue < 0)) {
    return { state: "BAD_QUOTE", displayQuote: null, live: false };
  }
  if (value.rightsStatus !== "APPROVED") {
    return { state: "DENIED_RIGHTS", displayQuote: null, live: false };
  }
  if (!value.asOfUTC || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/u.test(value.asOfUTC)
    || !Number.isFinite(Date.parse(value.asOfUTC))) {
    return { state: "UNAVAILABLE", displayQuote: null, live: false };
  }
  if (value.freshness !== "FRESH") {
    return { state: "STALE", displayQuote: null, live: false };
  }
  // Never emit numerical quotes or LIVE flags in the P0 layer.
  return { state: "DEMO_ONLY", displayQuote: null, live: false };
}
