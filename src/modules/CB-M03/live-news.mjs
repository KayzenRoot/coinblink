// CB-M03-P1-LIVE-RSS-001: keyless live headline reader.
//
// Display contract: headline, short excerpt, publisher, timestamp and an
// outbound link. No article body is stored, no feed is republished, and every
// card names its publisher. RSS carries no vendor quota, so the only resource
// guard needed is time: at most one collection per source per window.
import {
  LIVE_NEWS_FAILURE_RETRY_SECONDS, LIVE_NEWS_MAX_ITEMS, LIVE_NEWS_MAX_PER_SOURCE, LIVE_NEWS_SOURCES,
  LIVE_NEWS_STALE_MAX_SECONDS, LIVE_NEWS_TIMEOUT_MS, LIVE_NEWS_WINDOW_SECONDS,
} from "./rss-sources.mjs";
import { parseRssFeed } from "./rss-parse.mjs";

const ENABLED_VALUES = new Set(["1", "true", "enabled", "on"]);

/** Only an explicit affirmative value enables live headlines. */
export function isLiveNewsEnabled(value) {
  return typeof value === "string" && ENABLED_VALUES.has(value.trim().toLowerCase());
}

/**
 * Per-process memo: bounds egress to one collection per source per window and
 * remembers the last good collection so a short outage can serve stale data.
 */
export function createNewsCache() {
  let expiresAt = 0;
  let value = null;
  let lastGood = null;
  let lastGoodAt = 0;
  return {
    read(nowMs) {
      return value !== null && nowMs < expiresAt ? value : null;
    },
    write(nowMs, next, ttlSeconds) {
      expiresAt = nowMs + ttlSeconds * 1000;
      value = next;
      // A stale or failed snapshot never extends the life of the last good one.
      if (next.status === "LIVE_HEADLINES" && next.stale !== true) {
        lastGood = next;
        lastGoodAt = nowMs;
      }
    },
    stale(nowMs, maxAgeMs) {
      return lastGood !== null && nowMs - lastGoodAt <= maxAgeMs ? lastGood : null;
    },
  };
}

export const defaultNewsCache = createNewsCache();

async function collectSource(source, { fetchImpl, collectedAt, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(source.url, {
      signal: controller.signal,
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9",
        "user-agent": "CoinBlink/1.0 (live headline reader; attribution only)",
      },
      cache: "no-store",
    });
    if (!response.ok) return { source, status: "UNAVAILABLE", reason: `HTTP_${response.status}`, items: [] };
    const items = parseRssFeed(await response.text(), { source, collectedAt, limit: LIVE_NEWS_MAX_PER_SOURCE });
    if (items.length === 0) return { source, status: "UNAVAILABLE", reason: "NO_USABLE_ITEMS", items: [] };
    return { source, status: "OK", reason: null, items };
  } catch (error) {
    const reason = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    return { source, status: "UNAVAILABLE", reason, items: [] };
  } finally {
    clearTimeout(timer);
  }
}

function headlineSort(a, b) {
  return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
}

function succeeded(results) {
  return results.filter((result) => result.status === "OK").length;
}

function summaryOf(results) {
  return results.map((result) => Object.freeze({
    id: result.source.id,
    name: result.source.name,
    home: result.source.home,
    status: result.status,
    reason: result.reason,
    itemCount: result.items.length,
  }));
}

/**
 * Read every whitelisted feed in parallel. Never throws: each source fails
 * alone, and a wholly failed collection is cached briefly so a dead publisher
 * cannot turn into a request storm.
 */
export async function readLiveNews(options = {}) {
  const {
    enabled,
    sources = LIVE_NEWS_SOURCES,
    fetchImpl = globalThis.fetch,
    now = () => new Date().toISOString(),
    nowMs = () => Date.now(),
    timeoutMs = LIVE_NEWS_TIMEOUT_MS,
    cache = defaultNewsCache,
  } = options;
  if (!isLiveNewsEnabled(enabled)) {
    return Object.freeze({ status: "DISABLED", reason: "NOT_ENABLED", items: Object.freeze([]), sources: Object.freeze([]) });
  }
  const cached = cache.read(nowMs());
  if (cached !== null) return cached;
  if (typeof fetchImpl !== "function") {
    return Object.freeze({ status: "UNAVAILABLE", reason: "NO_FETCH", items: Object.freeze([]), sources: Object.freeze([]) });
  }
  const collectedAt = now();
  const results = await Promise.all(sources.map((source) =>
    collectSource(source, { fetchImpl, collectedAt, timeoutMs })));
  const readable = summaryOf(results);
  const items = Object.freeze(results
    .flatMap((result) => result.items)
    .sort(headlineSort)
    .slice(0, LIVE_NEWS_MAX_ITEMS));
  if (items.length === 0) {
    const lastGood = typeof cache.stale === "function"
      ? cache.stale(nowMs(), LIVE_NEWS_STALE_MAX_SECONDS * 1000)
      : null;
    if (lastGood !== null) {
      const stale = Object.freeze({ ...lastGood, stale: true, refreshFailedAt: now() });
      cache.write(nowMs(), stale, LIVE_NEWS_FAILURE_RETRY_SECONDS);
      return stale;
    }
    const failed = Object.freeze({
      status: "UNAVAILABLE", reason: "ALL_SOURCES_FAILED", collectedAt,
      items, sources: readable,
    });
    cache.write(nowMs(), failed, LIVE_NEWS_FAILURE_RETRY_SECONDS);
    return failed;
  }
  const snapshot = Object.freeze({
    status: "LIVE_HEADLINES",
    mode: "LIVE_THIRD_PARTY",
    collectedAt,
    stale: false,
    rightsStatus: "HEADLINES_WITH_ATTRIBUTION_ONLY",
    commercialUseAllowed: false,
    fullTextStored: false,
    itemCount: items.length,
    sourcesRead: succeeded(results),
    sources: Object.freeze(readable),
    items,
  });
  cache.write(nowMs(), snapshot, LIVE_NEWS_WINDOW_SECONDS);
  return snapshot;
}
