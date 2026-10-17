import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  HOME_PRODUCER_CONTRACT_VERSION, HOME_PRODUCER_POLICY, getHomeProducerBoundary,
} from "../../../src/modules/CB-M01/home-producer-boundary.mjs";

const producers = [
  ["news", "CB-M02", "latest-news"],
  ["sources", "CB-M03", "official-sources"],
  ["markets", "CB-M04", "market-overview"],
];

test("all module producer seams default offline with no live content or implicit admission", () => {
  const result = getHomeProducerBoundary();
  assert.equal(result.contractVersion, HOME_PRODUCER_CONTRACT_VERSION);
  assert.equal(result.policy, HOME_PRODUCER_POLICY);
  assert.equal(result.publicationEnabled, false);
  assert.equal(result.advertisingEnabled, false);
  assert.ok(Object.isFrozen(result));
  for (const [key, producer, section] of producers) {
    assert.deepEqual(result[key], {
      producer, section, mode: "MOCK", status: "NOT_CONNECTED",
      fixtureCount: 0, liveEligible: false,
    });
    assert.ok(Object.isFrozen(result[key]));
  }
});

test("valid synthetic fixtures expose counts only, not stories, prices or external sources", () => {
  const inputs = {
    news: { contractVersion: "0.1-draft", mode: "MOCK",
      items: [{ id: "fixture-one", demo: true, title: "Unverified example", url: "https://untrusted.example" }] },
    sources: { contractVersion: "0.1-draft", mode: "MOCK", items: [] },
    markets: { contractVersion: "0.1-draft", mode: "MOCK",
      items: [{ id: "btc-demo", demo: true, price: 999999999 }] },
  };
  const result = getHomeProducerBoundary(inputs);
  assert.equal(result.news.status, "SYNTHETIC_FIXTURE_ONLY");
  assert.equal(result.sources.status, "EMPTY_SYNTHETIC_FIXTURE");
  assert.equal(result.markets.status, "SYNTHETIC_FIXTURE_ONLY");
  assert.equal(result.news.fixtureCount, 1);
  assert.equal(result.markets.fixtureCount, 1);
  const publicJson = JSON.stringify(result);
  assert.doesNotMatch(publicJson, /Unverified example|untrusted|999999999|https?:\/\//u);
  assert.equal(result.publicationEnabled, false);
  assert.equal(result.advertisingEnabled, false);
});

test("unapproved LIVE inputs are rejected even if they include source and freshness claims", () => {
  const forged = { contractVersion: "0.1-draft", mode: "LIVE",
    items: [{ id: "live-one", demo: true, title: "Trusted", sourceId: "primary",
      licenseRef: "claim-only", asOf: "2026-10-16T18:00:00Z" }] };
  for (const [key] of producers) {
    const x = getHomeProducerBoundary({ [key]: forged });
    assert.equal(x[key].status, "REJECTED_LIVE_UNAUTHORIZED");
    assert.equal(x[key].fixtureCount, 0);
    assert.equal(x[key].liveEligible, false);
    assert.equal(x[key].mode, "MOCK");
  }
});

test("invalid, duplicate and oversized producer envelopes fail closed", () => {
  const good = { contractVersion: "0.1-draft", mode: "MOCK",
    items: [{ id: "same", demo: true }] };
  const invalid = [
    { ...good, contractVersion: "0.2" }, { ...good, mode: "UNKNOWN" },
    { ...good, items: "not-an-array" }, { ...good, items: [{ id: "not demo", demo: true }] },
    { ...good, items: [{ id: "same", demo: false }] },
    { ...good, items: [{ id: "same", demo: true, mode: "LIVE" }] },
    { ...good, items: [{ id: "same", demo: true }, { id: "same", demo: true }] },
    { ...good, items: Array.from({ length: 9 }, (_, i) => ({ id: "item-" + i, demo: true })) },
    "MOCK", [], 14,
  ];
  for (const sample of invalid) {
    const result = getHomeProducerBoundary({ news: sample });
    assert.equal(result.news.status, "REJECTED_INVALID_INPUT");
    assert.equal(result.news.fixtureCount, 0);
  }
  assert.equal(getHomeProducerBoundary(null).markets.status, "NOT_CONNECTED");
  assert.equal(getHomeProducerBoundary([]).news.status, "NOT_CONNECTED");
});

test("throwing getters fail closed per producer instead of crashing the Home", () => {
  const badNews = {};
  Object.defineProperty(badNews, "mode", { get() { throw new Error("provider getter crashed"); } });
  const badItem = { id: "sample" };
  Object.defineProperty(badItem, "demo", { get() { throw new Error("item getter crashed"); } });
  const inputs = {
    news: badNews,
    sources: { contractVersion: "0.1-draft", mode: "MOCK", items: [badItem] },
    markets: { contractVersion: "0.1-draft", mode: "MOCK",
      items: [{ id: "known-demo", demo: true }] },
  };
  let result;
  assert.doesNotThrow(() => { result = getHomeProducerBoundary(inputs); });
  assert.equal(result.news.status, "REJECTED_INVALID_INPUT");
  assert.equal(result.sources.status, "REJECTED_INVALID_INPUT");
  assert.equal(result.markets.status, "SYNTHETIC_FIXTURE_ONLY");
  assert.equal(result.news.fixtureCount, 0);
  assert.equal(result.sources.liveEligible, false);
});

test("revoked proxies, getters and prototype traps cannot turn a bad feed into LIVE or crash", () => {
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  const badRoot = new Proxy({}, { getPrototypeOf() { throw new Error("bad prototype"); } });
  for (const candidate of [
    { news: revoked.proxy },
    { news: new Proxy({}, { getPrototypeOf() { throw new Error("bad item"); } }) },
    badRoot,
  ]) {
    let result;
    assert.doesNotThrow(() => { result = getHomeProducerBoundary(candidate); });
    assert.equal(result.news.status, "REJECTED_INVALID_INPUT");
    assert.equal(result.news.fixtureCount, 0);
    assert.equal(result.news.liveEligible, false);
    assert.equal(result.publicationEnabled, false);
    assert.equal(result.advertisingEnabled, false);
  }
  const root = {};
  Object.defineProperty(root, "news", { get() { throw new Error("load failure"); } });
  assert.equal(getHomeProducerBoundary(root).news.status, "REJECTED_INVALID_INPUT");
  assert.equal(getHomeProducerBoundary(root).markets.status, "NOT_CONNECTED");
});

test("integrated GoldenHome uses the source-boundary statuses without altering DEMO visual copy", () => {
  const home = readFileSync(resolve("src/modules/CB-M01/GoldenHome.astro"), "utf8");
  assert.match(home, /import \{ getHomeProducerBoundary \} from "\.\/home-producer-boundary\.mjs"/u);
  assert.match(home, /const homeProducerBoundary = getHomeProducerBoundary\(safeProducerFeeds\)/u);
  assert.match(home, /data-m01-news-source-state=\{homeProducerBoundary\.news\.status\}/u);
  assert.match(home, /data-m01-source-feed-state=\{homeProducerBoundary\.sources\.status\}/u);
  assert.match(home, /data-m01-market-source-state=\{homeProducerBoundary\.markets\.status\}/u);
  for (const label of ["DEMO · NO STORIES CONNECTED", "Market data feed is not connected.",
    "ORIGINAL PUBLISHERS · EXTERNAL LINKS"]) assert.ok(home.includes(label));
  assert.doesNotMatch(home, /fetch\s*\(|\bmode:\s*"LIVE"/u);
});

test("isolated Astro fixtures exercise mock and refused LIVE consumer states without a shared route", () => {
  const mock = readFileSync(resolve("test/modules/CB-M01/fixture/src/pages/mock-producers.astro"), "utf8");
  const denied = readFileSync(resolve("test/modules/CB-M01/fixture/src/pages/denied-producers.astro"), "utf8");
  const visual = readFileSync(resolve("test/modules/CB-M01/visual-check.mjs"), "utf8");
  for (const code of [mock, denied]) {
    assert.match(code, /<GoldenHome producerFeeds=\{producerFeeds\}/u);
    assert.match(code, /<BaseLayout /u);
    assert.doesNotMatch(code, /\bfetch\s*\(|\bimport\s*\([^)]*https?:\/\//u);
  }
  assert.match(mock, /mode: "MOCK"/u);
  assert.match(denied, /mode: "LIVE"/u);
  assert.match(visual, /\/mock-producers/u);
  assert.match(visual, /\/denied-producers/u);
  assert.match(visual, /REJECTED_LIVE_UNAUTHORIZED/u);
  assert.match(visual, /data-m01-news-source-state/u);
  assert.match(visual, /externalRequests/u);
});

test("visual runner executes in default Node suite with real Astro, Chromium and aborted egress", { timeout: 180_000 }, async () => {
  const child = spawn(process.execPath, [resolve("test/modules/CB-M01/visual-check.mjs")], {
    cwd: resolve("."), windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => { output = (output + String(chunk)).slice(-6_000); });
  }
  const timeout = setTimeout(() => child.kill(), 160_000);
  try {
    const [exitCode, signal] = await once(child, "close");
    assert.equal(signal, null, "isolated Astro/Chromium runner must exit normally: " + output);
    assert.equal(exitCode, 0, "M01 real-browser producer fixture failed: " + output);
    assert.match(output, /"externalRequests": \[\]/u, "fixture must make zero external requests");
  } finally {
    clearTimeout(timeout);
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
});
