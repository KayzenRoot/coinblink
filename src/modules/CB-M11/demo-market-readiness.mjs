// CB-M11-P0-MARKET-READINESS-API-001. Synthetic M04 *unavailability* only.
// No network, storage, real quote, historical prices, provider rights or trading advice.
import { listMockMarkets } from "../CB-M04/market-lab.mjs";
import { inspectMockReadiness } from "../CB-M04/market-readiness.mjs";

const ASSETS = Object.freeze(["BTC", "ETH", "SOL"]);
const EXPECTED_FRESHNESS = Object.freeze(["STALE", "UNAVAILABLE", "UNAVAILABLE"]);
const MARKET_KEYS = Object.freeze(["asset", "pair", "quoteCurrency", "unit", "numericValue",
  "asOfUTC", "observedAtUTC", "provider", "rightsStatus", "freshness", "mode", "isTradable"]);
const SAFE_BLOCKERS = new Set(["RIGHTS_NOT_CLEARED", "NO_CAPTURED_OBSERVATION",
  "UNVERIFIED_OBSERVATION", "OUTDATED_ILLUSTRATION", "NO_ILLUSTRATION_TIMESTAMP",
  "NO_LIVE_FEED"]);
const EMPTY = Object.freeze({
  mode: "SYNTHETIC", status: "UNAVAILABLE", live: false,
  redistributable: false, items: Object.freeze([]),
});

function canonicalRow(row, expected, asset, freshness) {
  if (!row || typeof row !== "object" || Array.isArray(row) ||
      Object.getPrototypeOf(row) !== Object.prototype ||
      Object.keys(row).length !== MARKET_KEYS.length ||
      !MARKET_KEYS.every(key => Object.hasOwn(row, key)) ||
      !MARKET_KEYS.every(key => row[key] === expected?.[key]) ||
      row.asset !== asset || row.pair !== asset + "/USD" ||
      row.quoteCurrency !== "USD" || row.unit !== "USD_PER_" + asset ||
      row.mode !== "MOCK" || row.numericValue !== null ||
      row.observedAtUTC !== null || row.isTradable !== false ||
      row.rightsStatus !== "NOT_CLEARED" ||
      row.freshness !== freshness) return false;
  // The provider is never contacted or exposed; this field is a synthetic label.
  return row.provider === "synthetic-market.example.test" &&
    (row.asOfUTC === null || row.asOfUTC === "2025-01-01T00:00:00Z");
}

function safeReport(report, asset, row) {
  if (!report || typeof report !== "object" || Array.isArray(report) ||
      report.asset !== asset || report.pair !== asset + "/USD" ||
      report.freshness !== row.freshness ||
      report.inspection !== "DENIED_RIGHTS" ||
      report.live !== false || report.publiclyUsable !== false ||
      report.numericQuote !== null ||
      report.nextStep !== "REQUIRES_VERIFIED_LICENSE_AND_REAL_PROVIDER_CONTRACT" ||
      !Array.isArray(report.blockers) || report.blockers.length !== 4 ||
      !report.blockers.every(value => SAFE_BLOCKERS.has(value)) ||
      report.blockers[0] !== "RIGHTS_NOT_CLEARED" ||
      report.blockers[1] !== "NO_CAPTURED_OBSERVATION" ||
      report.blockers[2] !== (row.freshness === "STALE"
        ? "OUTDATED_ILLUSTRATION" : "NO_ILLUSTRATION_TIMESTAMP") ||
      report.blockers[3] !== "NO_LIVE_FEED") return false;
  return true;
}

/** 
 * Strictly projection-only. Argument injection is reserved for testing data-tamper
 * failure. This is not a provider or licensing integration.
 * @param {unknown} [input]
 */
export function buildDemoMarketReadiness(input = listMockMarkets()) {
  const canonical = listMockMarkets();
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.getPrototypeOf(input) !== Object.prototype ||
      Object.keys(input).length !== 3 ||
      !["state", "mode", "items"].every(key => Object.hasOwn(input, key)) ||
      input.state !== "MOCK_RESULTS" || input.mode !== "MOCK" ||
      !Array.isArray(input.items) || input.items.length !== 3 ||
      canonical.state !== "MOCK_RESULTS" || canonical.mode !== "MOCK" ||
      canonical.items?.length !== 3) return EMPTY;
  const items = [];
  for (const [index, asset] of ASSETS.entries()) {
    const row = input.items[index];
    if (!canonicalRow(row, canonical.items[index], asset, EXPECTED_FRESHNESS[index])) return EMPTY;
    const inspected = inspectMockReadiness(asset);
    if (inspected.status !== "MOCK_READINESS_ONLY" ||
        !safeReport(inspected.report, asset, row)) return EMPTY;
    items.push(Object.freeze({
      asset, pair: inspected.report.pair, freshness: inspected.report.freshness,
      rights: "NOT_CLEARED", numericQuote: null, publiclyUsable: false,
      blockers: Object.freeze([...inspected.report.blockers]),
    }));
  }
  return Object.freeze({
    mode: "SYNTHETIC", status: "BLOCKED_DEMO", live: false,
    redistributable: false, items: Object.freeze(items),
  });
}
