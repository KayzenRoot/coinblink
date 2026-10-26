// CB-M04 P0 · purely offline readiness analysis of existing invented market specimens.
// No network, quotes, trading advice, storage, provider access or synthetic "LIVE" claims.
import { inspectMockMarket, listMockMarkets } from "./market-lab.mjs";

const unavailable = Object.freeze({ status: "NOT_FOUND", report: null });

export function inspectMockReadiness(asset) {
  if (typeof asset !== "string" || !/^(BTC|ETH|SOL)$/u.test(asset)) return unavailable;
  const item = listMockMarkets().items.find(row => row.asset === asset);
  if (!item) return unavailable;
  const inspection = inspectMockMarket(item);
  const blockers = Object.freeze([
    "RIGHTS_NOT_CLEARED",
    item.observedAtUTC === null ? "NO_CAPTURED_OBSERVATION" : "UNVERIFIED_OBSERVATION",
    item.freshness === "STALE" ? "OUTDATED_ILLUSTRATION" : "NO_ILLUSTRATION_TIMESTAMP",
    "NO_LIVE_FEED",
  ]);
  return Object.freeze({ status: "MOCK_READINESS_ONLY",
    report: Object.freeze({ asset: item.asset, pair: item.pair,
      freshness: item.freshness, inspection: inspection.state,
      blockers, live: false, publiclyUsable: false, numericQuote: null,
      nextStep: "REQUIRES_VERIFIED_LICENSE_AND_REAL_PROVIDER_CONTRACT",
    }) });
}

export function summarizeMockReadiness() {
  const rows = listMockMarkets().items;
  return Object.freeze({
    mode: "MOCK", total: rows.length,
    stale: rows.filter(item => item.freshness === "STALE").length,
    unavailable: rows.filter(item => item.freshness === "UNAVAILABLE").length,
    live: 0, tradable: 0,
  });
}

export function compareMockReadiness(first, second) {
  const left = inspectMockReadiness(first).report;
  const right = inspectMockReadiness(second).report;
  if (!left || !right || left.asset === right.asset) {
    return Object.freeze({ status: "INVALID_PAIR", left: null, right: null });
  }
  const pick = row => Object.freeze({
    asset: row.asset, freshness: row.freshness,
    inspection: row.inspection, blockers: row.blockers,
  });
  return Object.freeze({ status: "MOCK_COMPARISON_NO_PRICES",
    left: pick(left), right: pick(right), bothUnavailable: true,
  });
}
