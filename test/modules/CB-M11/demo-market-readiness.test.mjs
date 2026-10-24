import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listMockMarkets } from "../../../src/modules/CB-M04/market-lab.mjs";
import { inspectMockReadiness } from "../../../src/modules/CB-M04/market-readiness.mjs";

const MODEL_URL = "../../../src/modules/CB-M11/demo-market-readiness.mjs";

test("M11/M04 RED: canonical no-network market sandbox implementation and GET-only route exist", () => {
  const model = readFileSync("src/modules/CB-M11/demo-market-readiness.mjs", "utf8");
  const route = readFileSync("src/pages/v1/demo/market-readiness.ts", "utf8");
  const docs = readFileSync("src/pages/developers.astro", "utf8");
  const workflow = readFileSync(".github/workflows/m11-developer-demo.yml", "utf8");
  assert.match(model, /listMockMarkets/u);
  assert.match(model, /inspectMockReadiness/u);
  assert.match(route, /export const GET/u);
  assert.match(route, /export const ALL/u);
  assert.match(route, /no-store/u);
  assert.match(route, /nosniff/u);
  assert.match(docs, /\/v1\/demo\/market-readiness/u);
  for (const required of [
    "src/modules/CB-M04/market-lab.mjs",
    "src/modules/CB-M04/market-readiness.mjs",
    "e2e/m11-developer-market-demo.spec.mjs",
    "test/modules/CB-M11/",
    "src/pages/v1/demo/market-readiness.ts",
  ]) assert.ok(workflow.includes(required), required);
  for (const source of [model, route]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|process\.env|API_KEY|innerHTML|https?:\/\/[a-z]/iu);
  }
});

test("M11/M04 RED: public response is a frozen metadata-only projection of canonical M04 blockers", async () => {
  const { buildDemoMarketReadiness } = await import(MODEL_URL);
  const canonical = listMockMarkets();
  assert.equal(canonical.mode, "MOCK");
  assert.deepEqual(canonical.items.map(x => x.asset), ["BTC", "ETH", "SOL"]);
  const data = buildDemoMarketReadiness();
  assert.deepEqual([data.status, data.mode, data.live, data.redistributable],
    ["BLOCKED_DEMO", "SYNTHETIC", false, false]);
  assert.equal(Object.isFrozen(data), true);
  assert.equal(Object.isFrozen(data.items), true);
  assert.equal(data.items.length, 3);
  assert.deepEqual(data.items.map(x => x.asset), ["BTC", "ETH", "SOL"]);
  for (const row of data.items) {
    const canonicalReport = inspectMockReadiness(row.asset).report;
    assert.deepEqual(Object.keys(row).sort(),
      ["asset", "blockers", "freshness", "numericQuote", "pair", "publiclyUsable", "rights"].sort());
    assert.equal(row.pair, canonicalReport.pair);
    assert.equal(row.freshness, canonicalReport.freshness);
    assert.equal(row.rights, "NOT_CLEARED");
    assert.equal(row.numericQuote, null);
    assert.equal(row.publiclyUsable, false);
    assert.deepEqual(row.blockers, canonicalReport.blockers);
    assert.equal(row.blockers.length, 4);
    assert.ok(row.blockers.includes("RIGHTS_NOT_CLEARED"));
    assert.ok(row.blockers.includes("NO_LIVE_FEED"));
    assert.equal(Object.isFrozen(row), true);
    assert.equal(Object.isFrozen(row.blockers), true);
  }
  const json = JSON.stringify(data);
  for (const forbidden of ["numericValue", "provider", "asOfUTC", "observedAtUTC",
    "price", "timestamp", "apiKey", "accessToken", "isTradable", "sourceUrl"]) {
    assert.equal(json.includes('"' + forbidden + '"'), false, forbidden);
  }
});

test("M11/M04 RED: modified fixture rights, numeric quote, mode, metadata and status all fail closed", async () => {
  const { buildDemoMarketReadiness } = await import(MODEL_URL);
  const base = listMockMarkets();
  const make = edit => ({ ...base, items: base.items.map((row, i) => i === 0 ? edit(row) : row) });
  const cases = [null, {}, { ...base, mode: "LIVE" }, { ...base, state: "UNAVAILABLE" },
    { ...base, items: [] }, { ...base, items: [base.items[0], base.items[0], base.items[2]] },
    { ...base, items: [...base.items].reverse() },
    make(row => ({ ...row, numericValue: 1 })),
    make(row => ({ ...row, rightsStatus: "APPROVED" })),
    make(row => ({ ...row, mode: "LIVE" })),
    make(row => ({ ...row, isTradable: true })),
    make(row => ({ ...row, provider: "external.example" })),
    make(row => ({ ...row, observedAtUTC: "2026-01-01T00:00:00Z" })),
    make(row => ({ ...row, freshness: "FRESH" })),
    make(row => ({ ...row, private_notes: "never disclose" })),
    make(row => ({ ...row, asset: "XRP" })),
  ];
  for (const bad of cases) {
    const result = buildDemoMarketReadiness(bad);
    assert.deepEqual([result.status, result.mode, result.live, result.redistributable],
      ["UNAVAILABLE", "SYNTHETIC", false, false]);
    assert.deepEqual(result.items, []);
    assert.ok(Object.isFrozen(result));
  }
});
