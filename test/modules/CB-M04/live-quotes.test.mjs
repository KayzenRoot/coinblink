import test from "node:test";
import assert from "node:assert/strict";
import {
  LIVE_ASSETS, LIVE_PROVIDER, buildLiveSnapshot, createLiveCache, isLiveEnabled, readLiveSnapshot,
} from "../../../src/modules/CB-M04/live-quotes.mjs";

const PAYLOAD = Object.freeze({
  bitcoin: Object.freeze({ usd: 101.5 }),
  ethereum: Object.freeze({ usd: 2.25 }),
  solana: Object.freeze({ usd: 0.75 }),
  binancecoin: Object.freeze({ usd: 605.21 }),
  ripple: Object.freeze({ usd: 0.5243 }),
});
const AT = "2026-10-28T12:00:00.000Z";
const okFetch = (payload = PAYLOAD, status = 200) => async () => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
});

test("CB-M04-P1 the live path is off unless a deployment says otherwise", () => {
  for (const value of [undefined, null, "", "0", "false", "no", "disabled", 1, true, {}]) {
    assert.equal(isLiveEnabled(value), false, JSON.stringify(value));
  }
  for (const value of ["1", "true", "ENABLED", " on "]) assert.equal(isLiveEnabled(value), true, value);
  assert.equal(LIVE_PROVIDER.cacheSeconds > 0, true);
  assert.equal(LIVE_ASSETS.length, 5);
});

test("CB-M04-P1 a valid provider payload becomes an attributed, order-free snapshot", () => {
  const snapshot = buildLiveSnapshot(PAYLOAD, { asOfUTC: AT });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(snapshot.status, "LIVE_ATTRIBUTED");
  assert.equal(snapshot.mode, "LIVE_THIRD_PARTY");
  assert.equal(snapshot.side, "NO_ORDER_FLOW");
  assert.equal(snapshot.rightsStatus, "DISPLAY_WITH_ATTRIBUTION_UNREVIEWED");
  assert.equal(snapshot.commercialUseAllowed, false);
  assert.equal(snapshot.attribution, LIVE_PROVIDER.attribution);
  assert.equal(snapshot.attributionUrl, LIVE_PROVIDER.url);
  assert.deepEqual(snapshot.quotes.map((quote) => quote.pair), ["BTC/USD", "ETH/USD", "SOL/USD", "BNB/USD", "XRP/USD"]);
  assert.deepEqual(snapshot.quotes.map((quote) => quote.priceUsd), [101.5, 2.25, 0.75, 605.21, 0.5243]);
  assert.ok(Object.isFrozen(snapshot.quotes) && Object.isFrozen(snapshot.quotes[0]));
});

test("CB-M04-P1 a malformed provider payload never becomes a price", () => {
  const bad = [
    null, undefined, "text", 42, [], {},
    { bitcoin: { usd: 1 } },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: {} },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: { usd: "1" } },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: { usd: 0 } },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: { usd: -2 } },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: { usd: Number.NaN } },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: { usd: Number.POSITIVE_INFINITY } },
    { bitcoin: { usd: 1 }, ethereum: { usd: 1 }, binancecoin: { usd: 1 }, ripple: { usd: 1 }, solana: null },
    { bitcoin: { usd: 1 }, ethereum: [], solana: { usd: 1 } },
  ];
  for (const payload of bad) {
    assert.throws(() => buildLiveSnapshot(payload, { asOfUTC: AT }), TypeError, JSON.stringify(payload));
  }
  assert.throws(() => buildLiveSnapshot(PAYLOAD, { asOfUTC: "not-a-date" }), TypeError);
  assert.throws(() => buildLiveSnapshot(PAYLOAD, { asOfUTC: "2026-10-28T12:00:00Z" }), TypeError);
});

test("CB-M04-P1 the reader fails closed on every provider problem", async () => {
  for (const enabled of [undefined, "0", "false"]) {
    const result = await readLiveSnapshot({ enabled, fetchImpl: okFetch() });
    assert.equal(result.status, "DISABLED");
    assert.equal(result.reason, "NOT_ENABLED");
    assert.deepEqual(result.quotes, []);
  }
  const network = await readLiveSnapshot({
    enabled: "enabled", fetchImpl: async () => { throw new Error("boom"); }, cache: createLiveCache(),
  });
  assert.equal(network.status, "UNAVAILABLE");
  assert.equal(network.reason, "NETWORK");
  const http = await readLiveSnapshot({ enabled: "enabled", fetchImpl: okFetch(PAYLOAD, 429), cache: createLiveCache() });
  assert.equal(http.reason, "HTTP_429");
  const malformed = await readLiveSnapshot({ enabled: "enabled", fetchImpl: okFetch({ bitcoin: { usd: 1 } }), cache: createLiveCache() });
  assert.equal(malformed.status, "UNAVAILABLE");
  assert.equal(malformed.reason, "NETWORK");
  const timeout = await readLiveSnapshot({
    enabled: "enabled",
    timeoutMs: 5,
    cache: createLiveCache(),
    fetchImpl: (_url, init) => new Promise((_, reject) => {
      init.signal.addEventListener("abort", () => {
        reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      });
    }),
  });
  assert.equal(timeout.reason, "TIMEOUT");
  const noFetch = await readLiveSnapshot({ enabled: "enabled", fetchImpl: null, cache: createLiveCache() });
  assert.equal(noFetch.reason, "NO_FETCH");
});

test("CB-M04-P1 a successful read is cached so a burst cannot exhaust the quota", async () => {
  const cache = createLiveCache();
  let calls = 0;
  let clock = 1000;
  const fetchImpl = async () => { calls += 1; return { ok: true, status: 200, json: async () => PAYLOAD }; };
  const options = { enabled: "1", fetchImpl, cache, nowMs: () => clock, now: () => AT };
  const first = await readLiveSnapshot(options);
  assert.equal(first.status, "LIVE_ATTRIBUTED");
  assert.equal(calls, 1);
  const second = await readLiveSnapshot(options);
  assert.equal(second, first, "within the window the cached snapshot is returned");
  assert.equal(calls, 1);
  clock += LIVE_PROVIDER.cacheSeconds * 1000 + 1;
  await readLiveSnapshot(options);
  assert.equal(calls, 2, "after the window the provider is asked again");
});
