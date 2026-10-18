// CB-M04 P0: invented numbers for interface testing, never market observations.
// No external providers, licensing, trade instructions, polling or live quotes.
export const MARKET_POLICY = "P0_OFFLINE_SYNTHETIC_NOT_TRADABLE";
const ROWS = Object.freeze([
  Object.freeze({ id: "demo-btc", asset: "BTC", pair: "BTC/USD",
    imaginaryValue: 12345, currency: "USD", unit: "USD_PER_BTC",
    asOf: "2025-01-01T00:00:00Z", freshness: "STALE",
    source: "FICTIONAL_DATASET", licenseStatus: "NOT_CLEARED", mode: "MOCK", isTradable: false }),
  Object.freeze({ id: "demo-eth", asset: "ETH", pair: "ETH/USD",
    imaginaryValue: 321, currency: "USD", unit: "USD_PER_ETH",
    asOf: "2025-01-01T00:00:00Z", freshness: "STALE",
    source: "FICTIONAL_DATASET", licenseStatus: "NOT_CLEARED", mode: "MOCK", isTradable: false }),
  Object.freeze({ id: "demo-sol", asset: "SOL", pair: "SOL/USD",
    imaginaryValue: 42, currency: "USD", unit: "USD_PER_SOL",
    asOf: "2025-01-01T00:00:00Z", freshness: "STALE",
    source: "FICTIONAL_DATASET", licenseStatus: "NOT_CLEARED", mode: "MOCK", isTradable: false }),
]);

/** @param {{ search?: unknown, state?: unknown }} [options] */
export function listMockMarkets(options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options)
    || typeof (options.search ?? "") !== "string" || options.search?.length > 40
    || !["OFFLINE", "UNAVAILABLE", "COST_GATE", "DENIED_RIGHTS"].includes(options.state ?? "OFFLINE")) {
    return { status: "BAD_REQUEST", items: [], mode: "MOCK", tradable: false };
  }
  const state = options.state ?? "OFFLINE";
  if (state !== "OFFLINE") return { status: state, items: [], mode: "MOCK", tradable: false };
  const term = (options.search ?? "").trim().toUpperCase();
  const items = ROWS.filter(x => x.asset.includes(term) || x.pair.includes(term));
  return { status: items.length ? "SYNTHETIC_STALE_ONLY" : "EMPTY",
    items, mode: "MOCK", tradable: false };
}

/** @param {unknown} input */
export function classifyMockObservation(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "BAD_REQUEST";
  try {
    if (input.mode === "LIVE") return "LIVE_NOT_ADMITTED";
    if (input.mode !== "MOCK" || input.isTradable !== false) return "BAD_REQUEST";
    if (input.licenseStatus !== "NOT_CLEARED") return "DENIED_RIGHTS";
    if (input.freshness !== "STALE" || input.asOf !== "2025-01-01T00:00:00Z") return "NOT_CURRENT";
    if (!Number.isFinite(input.imaginaryValue)) return "NO_QUOTE";
    return "DISPLAY_FICTIONAL_STALE_ONLY";
  } catch { return "BAD_REQUEST"; }
}
