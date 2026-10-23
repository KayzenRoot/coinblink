import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { listMockMarkets } from "../../../src/modules/CB-M04/market-lab.mjs";
import { inspectMockReadiness } from "../../../src/modules/CB-M04/market-readiness.mjs";

const clientSource = readFileSync(new URL("../../../src/modules/CB-M04/market-lab.client.js", import.meta.url), "utf8");

function makeWorkbench() {
  const listeners = new Map();
  const search = { value: "", addEventListener: (event, callback) => listeners.set("search:" + event, callback) };
  const freshness = { value: "all", addEventListener: (event, callback) => listeners.set("freshness:" + event, callback) };
  const count = { textContent: "3 unavailable example assets" };
  const empty = { hidden: true };
  const first = { value: "", addEventListener: (event, callback) => listeners.set("first:" + event, callback) };
  const second = { value: "", addEventListener: (event, callback) => listeners.set("second:" + event, callback) };
  const comparison = { textContent: "" };
  const gaps = { hidden: true, textContent: "" };
  const compare = { addEventListener: (event, callback) => listeners.set("compare:" + event, callback) };
  const rows = listMockMarkets().items.map(item => ({
    dataset: {
      m04Searchable: [item.asset, item.pair, item.freshness].join(" ").toLowerCase(),
      m04Freshness: item.freshness,
      m04Asset: item.asset,
    },
    hidden: false,
    querySelectorAll: selector => selector === ".m04-readiness-detail li"
      ? inspectMockReadiness(item.asset).report.blockers.map(name => ({ textContent: name }))
      : [],
  }));
  const elements = new Map([
    ["[data-m04-query]", search],
    ["[data-m04-freshness]", freshness],
    ["[data-m04-count]", count],
    ["[data-m04-empty]", empty],
    ["[data-m04-first]", first],
    ["[data-m04-second]", second],
    ["[data-m04-compare]", compare],
    ["[data-m04-comparison]", comparison],
    ["[data-m04-comparison-gaps]", gaps],
  ]);
  const root = {
    querySelector: selector => elements.get(selector),
    querySelectorAll: selector => selector === "[data-m04-entry]" ? rows : [],
  };
  const document = { querySelector: selector => selector === "[data-m04-root]" ? root : null };
  runInNewContext(clientSource, { document }, { filename: "market-lab.client.js" });
  return {
    search, freshness, count, empty, rows, first, second, comparison, gaps,
    changeFirst: () => listeners.get("first:change")(),
    changeSecond: () => listeners.get("second:change")(),
    onCompare: () => listeners.get("compare:click")(),
    input: () => listeners.get("search:input")(),
    change: () => listeners.get("freshness:change")(),
  };
}

test("M04 display-only freshness selector separates stale example from unavailable timestamps", () => {
  const ui = makeWorkbench();
  ui.freshness.value = "STALE";
  ui.change();
  assert.deepEqual(ui.rows.map(row => row.hidden), [false, true, true]);
  assert.equal(ui.count.textContent, "1 unavailable example assets");
  ui.freshness.value = "UNAVAILABLE";
  ui.change();
  assert.deepEqual(ui.rows.map(row => row.hidden), [true, false, false]);
  assert.equal(ui.count.textContent, "2 unavailable example assets");
});

test("M04 query combines with freshness and recovers empty state without network", () => {
  const ui = makeWorkbench();
  ui.search.value = "ETH";
  ui.freshness.value = "STALE";
  ui.input();
  assert.deepEqual(ui.rows.map(row => row.hidden), [true, true, true]);
  assert.equal(ui.count.textContent, "0 unavailable example assets");
  assert.equal(ui.empty.hidden, false);
  ui.freshness.value = "UNAVAILABLE";
  ui.change();
  assert.deepEqual(ui.rows.map(row => row.hidden), [true, false, true]);
  assert.equal(ui.empty.hidden, true);
  ui.search.value = "";
  ui.freshness.value = "all";
  ui.change();
  assert.deepEqual(ui.rows.map(row => row.hidden), [false, false, false]);
  assert.equal(ui.count.textContent, "3 unavailable example assets");
});

test("M04 UI is DOM-only and does not request prices, store sessions or access admin", () => {
  assert.doesNotMatch(clientSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|\/admin\/|\bimport\b/u);
});

test("M04 DOM-only comparison rejects invalid and same-symbol inputs", () => {
  const ui=makeWorkbench();
  ui.onCompare();
  assert.match(ui.comparison.textContent,/Choose two different offline examples/u);
  ui.first.value="BTC";
  ui.second.value="BTC";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/Choose two different offline examples/u);
  ui.second.value="ETH";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/BTC \(STALE\) and ETH \(UNAVAILABLE\)/u);
  assert.match(ui.comparison.textContent,/BOTH NOT LIVE · NO QUOTES · NO TRADING/u);
  assert.equal(ui.gaps.hidden,false);
  assert.match(ui.gaps.textContent,/Shared blockers: RIGHTS_NOT_CLEARED, NO_CAPTURED_OBSERVATION, NO_LIVE_FEED/u);
  assert.match(ui.gaps.textContent,/BTC only: OUTDATED_ILLUSTRATION/u);
  assert.match(ui.gaps.textContent,/ETH only: NO_ILLUSTRATION_TIMESTAMP/u);
  ui.second.value="BTC";
  ui.changeSecond();
  assert.equal(ui.gaps.hidden,true);
  assert.equal(ui.gaps.textContent,"");
  ui.onCompare();
  assert.equal(ui.gaps.hidden,true);
  ui.second.value="ETH";
  ui.onCompare();
  assert.equal(ui.gaps.hidden,false);
  ui.second.value="UNKNOWN";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/No market data was fetched/u);
  assert.equal(ui.gaps.hidden,true);
});
