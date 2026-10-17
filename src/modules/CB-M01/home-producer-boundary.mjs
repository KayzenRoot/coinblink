// M01 P0/P1 seam for future M02/M03/M04 inputs. Pure local validation only.
// It NEVER authorizes LIVE data, rendering, external requests, or publishing.
// Consumers see readiness/status metadata, never unverified producer payloads.
export const HOME_PRODUCER_CONTRACT_VERSION = "0.1-draft";
export const HOME_PRODUCER_POLICY = "DEMO_ONLY_LIVE_NOT_ADMITTED";
const FEEDS = Object.freeze([
  Object.freeze({ key: "news", producer: "CB-M02", section: "latest-news" }),
  Object.freeze({ key: "sources", producer: "CB-M03", section: "official-sources" }),
  Object.freeze({ key: "markets", producer: "CB-M04", section: "market-overview" }),
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function classify(candidate) {
  if (candidate === undefined || candidate === null) {
    return { status: "NOT_CONNECTED", fixtureCount: 0 };
  }
  if (!isRecord(candidate)) return { status: "REJECTED_INVALID_INPUT", fixtureCount: 0 };
  // Never downgrade a real-mode candidate to a DEMO fixture or display its values.
  if (candidate.mode === "LIVE") return { status: "REJECTED_LIVE_UNAUTHORIZED", fixtureCount: 0 };
  if (candidate.contractVersion !== HOME_PRODUCER_CONTRACT_VERSION
      || candidate.mode !== "MOCK"
      || !Array.isArray(candidate.items) || candidate.items.length > 8) {
    return { status: "REJECTED_INVALID_INPUT", fixtureCount: 0 };
  }
  const ids = new Set();
  for (const item of candidate.items) {
    if (!isRecord(item) || item.demo !== true
        || typeof item.id !== "string" || !/^[a-z0-9-]{1,48}$/u.test(item.id)
        || ids.has(item.id) || item.mode === "LIVE") {
      return { status: "REJECTED_INVALID_INPUT", fixtureCount: 0 };
    }
    ids.add(item.id);
  }
  return { status: candidate.items.length ? "SYNTHETIC_FIXTURE_ONLY" : "EMPTY_SYNTHETIC_FIXTURE", fixtureCount: candidate.items.length };
}

/**
 * Fail-closed metadata projection for authorized MOCK producer fixtures.
 * `feeds` is a local candidate input, not a browser/API endpoint or a promise.
 * No candidate field or payload item is copied into this public read-model.
 */
export function getHomeProducerBoundary(feeds = {}) {
  const input = isRecord(feeds) ? feeds : {};
  const result = {
    contractVersion: HOME_PRODUCER_CONTRACT_VERSION,
    policy: HOME_PRODUCER_POLICY,
    publicationEnabled: false,
    advertisingEnabled: false,
  };
  for (const feed of FEEDS) {
    const classified = classify(input[feed.key]);
    result[feed.key] = Object.freeze({
      producer: feed.producer,
      section: feed.section,
      mode: "MOCK",
      status: classified.status,
      fixtureCount: classified.fixtureCount,
      liveEligible: false,
    });
  }
  return Object.freeze(result);
}
