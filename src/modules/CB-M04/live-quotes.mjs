// CB-M04-P1-LIVE-ADAPTER-001: optional third-party market adapter.
//
// This is deliberately OFF unless the deployment explicitly enables it. The
// offline M04 model requires a verified licence before a quote may be shown
// (rightsStatus NOT_CLEARED); a keyless public endpoint is not that licence, so
// the live path stays behind a switch and carries attribution plus an explicit
// "rights unreviewed" label wherever it is shown.
//
// Pure planning and fetching only: no storage, no trading, no order routing.
export const LIVE_PROVIDER = Object.freeze({
  id: "coingecko",
  label: "CoinGecko",
  url: "https://www.coingecko.com",
  endpoint: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd",
  cacheSeconds: 60,
  attribution: "Market data by CoinGecko",
  // Demo plan: 30 calls per minute and 10,000 per month. The guard below stops
  // at 8,000 so a busy month cannot exhaust the account quota.
  monthlyLimit: 8000,
});

export const LIVE_ASSETS = Object.freeze([
  Object.freeze({ id: "bitcoin", symbol: "BTC" }),
  Object.freeze({ id: "ethereum", symbol: "ETH" }),
  Object.freeze({ id: "solana", symbol: "SOL" }),
]);

const ENABLED_VALUES = new Set(["1", "true", "enabled", "on"]);

/** Only an explicit affirmative value enables the live path. */
export function isLiveEnabled(value) {
  return typeof value === "string" && ENABLED_VALUES.has(value.trim().toLowerCase());
}

function assertTimestamp(asOfUTC) {
  if (typeof asOfUTC !== "string" || !Number.isFinite(Date.parse(asOfUTC)) ||
      new Date(asOfUTC).toISOString() !== asOfUTC) {
    throw new TypeError("asOfUTC must be an exact ISO-8601 UTC timestamp");
  }
}

/** Strict projection of a provider payload. Anything unexpected fails closed. */
export function buildLiveSnapshot(payload, { asOfUTC = new Date().toISOString() } = {}) {
  assertTimestamp(asOfUTC);
  if (payload === null || typeof payload !== "object" || Array.isArray(payload) ||
      Object.getPrototypeOf(payload) !== Object.prototype) {
    throw new TypeError("provider payload must be a plain object");
  }
  const quotes = [];
  for (const asset of LIVE_ASSETS) {
    const quote = payload[asset.id];
    if (quote === null || typeof quote !== "object" || Array.isArray(quote)) {
      throw new TypeError(`provider payload is missing ${asset.id}`);
    }
    const price = quote.usd;
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      throw new TypeError(`provider payload has no usable usd price for ${asset.id}`);
    }
    quotes.push(Object.freeze({
      id: asset.id, symbol: asset.symbol, pair: asset.symbol + "/USD",
      priceUsd: price, source: LIVE_PROVIDER.id,
    }));
  }
  return Object.freeze({
    status: "LIVE_ATTRIBUTED",
    mode: "LIVE_THIRD_PARTY",
    provider: LIVE_PROVIDER.id,
    asOfUTC,
    side: "NO_ORDER_FLOW",
    rightsStatus: "DISPLAY_WITH_ATTRIBUTION_UNREVIEWED",
    commercialUseAllowed: false,
    delayedUpToSeconds: LIVE_PROVIDER.cacheSeconds,
    attribution: LIVE_PROVIDER.attribution,
    attributionUrl: LIVE_PROVIDER.url,
    quotes: Object.freeze(quotes),
  });
}

/** Per-process memo so a burst of requests cannot exhaust the provider quota. */
export function createLiveCache() {
  let at = 0;
  let value = null;
  return {
    read(nowMs) {
      return value !== null && nowMs - at < LIVE_PROVIDER.cacheSeconds * 1000 ? value : null;
    },
    write(nowMs, next) {
      at = nowMs;
      value = next;
    },
  };
}

export const defaultLiveCache = createLiveCache();

/**
 * Fetch one snapshot. Never throws: every failure becomes UNAVAILABLE with a
 * machine-readable reason so the page can stay honest instead of guessing.
 */
/**
 * Claims one call for the current UTC month. Returns false when the budget is
 * spent, so the adapter answers UNAVAILABLE instead of spending the account.
 */
export async function claimProviderCall({ db, provider = LIVE_PROVIDER.id, nowMs = Date.now(), limit = LIVE_PROVIDER.monthlyLimit }) {
  if (db === undefined || db === null) return true;
  const period = new Date(nowMs).toISOString().slice(0, 7);
  try {
    const claimed = await db.prepare(
      'INSERT INTO cms_provider_calls(provider,period,calls,updated_at) VALUES (?,?,1,?) '
      + 'ON CONFLICT(provider,period) DO UPDATE SET calls=calls+1, updated_at=excluded.updated_at WHERE calls < ?',
    ).bind(provider, period, Math.floor(nowMs / 1000), limit).run();
    return claimed?.meta?.changes === 1;
  } catch {
    // A database without the migration must not block the feed.
    return true;
  }
}

export async function readLiveSnapshot(options = {}) {
  const {
    enabled,
    fetchImpl = globalThis.fetch,
    now = () => new Date().toISOString(),
    nowMs = () => Date.now(),
    timeoutMs = 4000,
    cache = defaultLiveCache,
    apiKey = null,
    db = null,
  } = options;
  if (!isLiveEnabled(enabled)) {
    return Object.freeze({ status: "DISABLED", reason: "NOT_ENABLED", quotes: Object.freeze([]) });
  }
  const cached = cache.read(nowMs());
  if (cached !== null) return cached;
  if (typeof fetchImpl !== "function") {
    return Object.freeze({ status: "UNAVAILABLE", reason: "NO_FETCH", quotes: Object.freeze([]) });
  }
  if (!(await claimProviderCall({ db, nowMs: nowMs() }))) {
    return Object.freeze({ status: "UNAVAILABLE", reason: "QUOTA_GUARD", quotes: Object.freeze([]) });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(LIVE_PROVIDER.endpoint, {
      signal: controller.signal,
      headers: typeof apiKey === "string" && apiKey !== ""
        ? { accept: "application/json", "x-cg-demo-api-key": apiKey }
        : { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      return Object.freeze({ status: "UNAVAILABLE", reason: `HTTP_${response.status}`, quotes: Object.freeze([]) });
    }
    const snapshot = buildLiveSnapshot(await response.json(), { asOfUTC: now() });
    cache.write(nowMs(), snapshot);
    return snapshot;
  } catch (error) {
    const reason = error?.name === "AbortError" ? "TIMEOUT" : "NETWORK";
    return Object.freeze({ status: "UNAVAILABLE", reason, quotes: Object.freeze([]) });
  } finally {
    clearTimeout(timer);
  }
}
