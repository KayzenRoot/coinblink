import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { inspectSyntheticSource, listSyntheticSources } from "../../../src/modules/CB-M03/source-lab.mjs";

const clientSource = readFileSync(new URL("../../../src/modules/CB-M03/source-lab.client.js", import.meta.url), "utf8");

function makeWorkbench() {
  const listeners = new Map();
  const query = { value: "", addEventListener: (name, handler) => listeners.set("query:" + name, handler) };
  const outcome = { value: "all", addEventListener: (name, handler) => listeners.set("outcome:" + name, handler) };
  const count = { textContent: "3 synthetic source examples" };
  const empty = { hidden: true };
  const left = { value: "" };
  const right = { value: "" };
  const comparison = { textContent: "" };
  const compare = { addEventListener: (name,handler) => listeners.set("compare:" + name, handler) };
  const rows = listSyntheticSources().items.map(row => ({
    dataset: {
      m03Searchable: [row.label, row.originUrl, row.status].join(" ").toLowerCase(),
      m03State: inspectSyntheticSource(row).state,
      m03Id: row.id,
      m03License: row.licensing,
    },
    hidden: false,
    querySelector: selector => selector === "h2" ? { textContent: row.label } : null,
  }));
  const elements = new Map([
    ["[data-m03-query]", query],
    ["[data-m03-state-filter]", outcome],
    ["[data-m03-count]", count],
    ["[data-m03-empty]", empty],
    ["[data-m03-left]", left],
    ["[data-m03-right]", right],
    ["[data-m03-compare]", compare],
    ["[data-m03-comparison]", comparison],
  ]);
  const root = {
    querySelector: selector => elements.get(selector),
    querySelectorAll: selector => selector === "[data-m03-entry]" ? rows : [],
  };
  const document = { querySelector: selector => selector === "[data-m03-root]" ? root : null };
  runInNewContext(clientSource, { document }, { filename: "source-lab.client.js" });
  return {
    query, outcome, count, empty, rows, left, right, comparison,
    onCompare: () => listeners.get("compare:click")(),
    onInput: () => listeners.get("query:input")(),
    onChange: () => listeners.get("outcome:change")(),
  };
}

test("M03 outcome filter matches canonical synthetic inspection result", () => {
  const ui = makeWorkbench();
  ui.outcome.value = "DENIED_RIGHTS";
  ui.onChange();
  assert.deepEqual(ui.rows.map(row => row.hidden), [false, false, true]);
  assert.equal(ui.count.textContent, "2 synthetic source examples");
  ui.outcome.value = "UNAVAILABLE";
  ui.onChange();
  assert.deepEqual(ui.rows.map(row => row.hidden), [true, true, false]);
  assert.equal(ui.count.textContent, "1 synthetic source examples");
});

test("M03 inspection outcome combines with text, empty state and reset", () => {
  const ui = makeWorkbench();
  ui.query.value = "unavailable";
  ui.outcome.value = "DENIED_RIGHTS";
  ui.onInput();
  assert.deepEqual(ui.rows.map(row => row.hidden), [true, true, true]);
  assert.equal(ui.empty.hidden, false);
  assert.equal(ui.count.textContent, "0 synthetic source examples");
  ui.outcome.value = "UNAVAILABLE";
  ui.onChange();
  assert.deepEqual(ui.rows.map(row => row.hidden), [true, true, false]);
  assert.equal(ui.empty.hidden, true);
  ui.query.value = "";
  ui.outcome.value = "all";
  ui.onChange();
  assert.deepEqual(ui.rows.map(row => row.hidden), [false, false, false]);
  assert.equal(ui.count.textContent, "3 synthetic source examples");
});

test("M03 filter remains DOM-only and cannot ingest, persist or publish", () => {
  assert.doesNotMatch(clientSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|\/admin\/|\bimport\b/u);
});

test("M03 comparison is derived only from current known synthetic elements", () => {
  const ui = makeWorkbench();
  ui.onCompare();
  assert.match(ui.comparison.textContent,/Select two different fictional sources/);
  ui.left.value = "demo-source-alpha";
  ui.right.value = "demo-source-alpha";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/Select two different fictional sources/);
  ui.right.value = "demo-source-gamma";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/Fictional protocol bulletin.*DENIED_RIGHTS/u);
  assert.match(ui.comparison.textContent,/Synthetic unavailable provider.*UNAVAILABLE/u);
  assert.match(ui.comparison.textContent,/BOTH BLOCKED.*NO INGESTION.*NO PUBLICATION/u);
  ui.left.value = "demo-source-unknown";
  ui.onCompare();
  assert.match(ui.comparison.textContent,/No evidence was retrieved/u);
});
