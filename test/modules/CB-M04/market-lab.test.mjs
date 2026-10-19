import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MARKET_DEMO_POLICY, inspectMockMarket, listMockMarkets } from "../../../src/modules/CB-M04/market-lab.mjs";
test("M04 data is fixed, MOCK, unlicensed and never a quote", () => {
  assert.equal(MARKET_DEMO_POLICY, "P0_OFFLINE_NO_LIVE_QUOTES");
  const result = listMockMarkets();
  assert.equal(result.items.length, 3);
  assert.equal(result.mode, "MOCK");
  for (const row of result.items) {
    assert.ok(Object.isFrozen(row));
    assert.equal(row.numericValue, null);
    assert.equal(row.isTradable, false);
    assert.equal(row.rightsStatus, "NOT_CLEARED");
    assert.equal(inspectMockMarket(row).state, "DENIED_RIGHTS");
    assert.equal(inspectMockMarket(row).displayQuote, null);
  }
});
test("M04 rejects forged LIVE and malformed values and never emits numeric quotes", () => {
  const base = { ...listMockMarkets().items[0], rightsStatus: "APPROVED", freshness: "FRESH" };
  for (const value of [{...base,mode:"LIVE"},{...base,isTradable:true}]) {
    assert.equal(inspectMockMarket(value).state, "DENIED_LIVE");
  }
  for (const numericValue of [NaN, Infinity, -3, "12345", undefined]) {
    assert.equal(inspectMockMarket({...base,numericValue}).state, "BAD_QUOTE");
  }
  assert.equal(inspectMockMarket({...base,asOfUTC:null}).state, "UNAVAILABLE");
  assert.deepEqual(inspectMockMarket({...base,numericValue: 12345}),{state:"DEMO_ONLY",displayQuote:null,live:false});
  assert.equal(listMockMarkets({query:"unlikely-ticker"}).state, "EMPTY");
  assert.equal(listMockMarkets({query:5}).state, "BAD_REQUEST");
  assert.equal(inspectMockMarket({}).state, "BAD_REQUEST");
});
test("M04 workbench is no-fetch/no-storage and price display is unavailable", () => {
  for (const file of ["src/modules/CB-M04/market-lab.mjs","src/modules/CB-M04/MarketWorkbench.astro",
    "src/modules/CB-M04/market-lab.client.js","src/pages/demo/markets.astro"]) {
    const content = readFileSync(file,"utf8");
    assert.doesNotMatch(content,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\/admin\/|\.wrangler/iu,file);
  }
  const page = readFileSync("src/modules/CB-M04/MarketWorkbench.astro","utf8");
  assert.match(page,/Price unavailable/u);
  assert.match(page,/NO LIVE QUOTES/u);
});
