import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MARKET_POLICY, listMockMarkets, classifyMockObservation } from "../../../src/modules/CB-M04/market-workbench.mjs";

test("M04 contains ONLY invented stale values with no trade or cleared licensing", () => {
  assert.equal(MARKET_POLICY, "P0_OFFLINE_SYNTHETIC_NOT_TRADABLE");
  const result = listMockMarkets();
  assert.equal(result.status, "SYNTHETIC_STALE_ONLY");
  assert.equal(result.items.length, 3);
  assert.equal(result.tradable, false);
  assert.ok(result.items.every(item => item.mode === "MOCK" && item.freshness === "STALE"
    && item.licenseStatus === "NOT_CLEARED" && item.isTradable === false
    && item.source === "FICTIONAL_DATASET" && Object.isFrozen(item)));
});
test("M04 search and denied provider/budget states never turn into live quotes", () => {
  assert.equal(listMockMarkets({ search: "eth" }).items.length, 1);
  assert.equal(listMockMarkets({ search: "impossible" }).status, "EMPTY");
  for (const state of ["UNAVAILABLE", "COST_GATE", "DENIED_RIGHTS"]) {
    assert.deepEqual(listMockMarkets({ state }).items, []);
  }
  for (const bad of [{ state: "LIVE" }, { search: 12 }, null, { search: "X".repeat(41) }]) {
    assert.equal(listMockMarkets(bad).status, "BAD_REQUEST");
  }
});
test("M04 rejects forged live, missing, unlicensed and wrong-time market observations", () => {
  const good = listMockMarkets().items[0];
  assert.equal(classifyMockObservation(good), "DISPLAY_FICTIONAL_STALE_ONLY");
  assert.equal(classifyMockObservation({ ...good, mode: "LIVE" }), "LIVE_NOT_ADMITTED");
  assert.equal(classifyMockObservation({ ...good, freshness: "CURRENT" }), "NOT_CURRENT");
  assert.equal(classifyMockObservation({ ...good, licenseStatus: "CLAIMED" }), "DENIED_RIGHTS");
  assert.equal(classifyMockObservation({ ...good, imaginaryValue: null }), "NO_QUOTE");
  assert.equal(classifyMockObservation({ ...good, isTradable: true }), "BAD_REQUEST");
  assert.equal(classifyMockObservation(null), "BAD_REQUEST");
});
test("M04 accessible module-only market search never accesses exchange endpoints", () => {
  const page = readFileSync(resolve("src/modules/CB-M04/MarketsWorkbench.astro"), "utf8");
  const script = readFileSync(resolve("src/modules/CB-M04/market-workbench.client.js"), "utf8");
  assert.match(page, /data-m04-search/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /FICTIONAL PRICES/);
  assert.match(script, /addEventListener\("input"/u);
  assert.doesNotMatch(page + script, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage/u);
});
