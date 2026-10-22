import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { listMockMarkets } from "../../../src/modules/CB-M04/market-lab.mjs";

const clientSource = readFileSync(new URL("../../../src/modules/CB-M04/market-lab.client.js", import.meta.url), "utf8");

function makeWorkbench() {
  const listeners = new Map();
  const search = { value: "", addEventListener: (event, callback) => listeners.set("search:" + event, callback) };
  const freshness = { value: "all", addEventListener: (event, callback) => listeners.set("freshness:" + event, callback) };
  const count = { textContent: "3 unavailable example assets" };
  const empty = { hidden: true };
  const first = { value: "" };
  const second = { value: "" };
  const comparison = { textContent: "" };
  const compare = { addEventListener: (event, callback) => listeners.set("compare:" + event, callback) };
  const rows = listMockMarkets().items.map(item => ({
    dataset: {
      m04Searchable: [item.asset, item.pair, item.freshness].join(" ").toLowerCase(),
      m04Freshness: item.freshness,
      m04Asset: item.asset,
    },
    hidden: false,
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
  ]);
  const root = {
    querySelector: selector => elements.get(selector),
    querySelectorAll: selector => selector === "[data-m04-entry]" ? rows : [],
  };
  const document = { querySelector: selector => selector === "[data-m04-root]" ? root : null };
  runInNewContext(clientSource, { document }, { filename: "market-lab.client.js" });
  return {
    search, freshness, count, empty, rows, first, second, comparison,
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
  ui.second.value="UNKNOWN";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/No market data was fetched/u);
});
