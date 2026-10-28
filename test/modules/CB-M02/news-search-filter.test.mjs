import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const clientSource = readFileSync(new URL("../../../src/modules/CB-M02/news-workbench.client.js", import.meta.url), "utf8");

function makeWorkbench() {
  const listeners = new Map();
  const search = { value: "", focused: false, focus() { this.focused = true; }, addEventListener: (name, callback) => listeners.set("search:" + name, callback) };
  const category = { value: "all", addEventListener: (name, callback) => listeners.set("category:" + name, callback) };
  const reset = { addEventListener: (name, callback) => listeners.set("reset:" + name, callback) };
  const topics = ["security", "protocol", "education"].map(value => ({
    dataset: { m02Topic: value },
    addEventListener: (name, callback) => listeners.set("topic:" + value + ":" + name, callback),
  }));
  const count = {
    textContent: "3 exemplos fictícios",
    dataset: { m02CountLabelSingular: "exemplo fictício", m02CountLabelPlural: "exemplos fictícios" },
  };
  const empty = { hidden: true };
  const entries = [
    { dataset: { m02Category: "security", m02Searchable: "Oficina fictícia de segurança" }, hidden: false },
    { dataset: { m02Category: "protocol", m02Searchable: "Sala de aula imaginária sobre protocolos" }, hidden: false },
    { dataset: { m02Category: "education", m02Searchable: "Tutorial de registros fictícios" }, hidden: false },
  ];
  const elements = new Map([
    ["[data-m02-search]", search],
    ["[data-m02-category-select]", category],
    ["[data-m02-reset]", reset],
    ["[data-m02-result-count]", count],
    ["[data-m02-empty]", empty],
  ]);
  const root = {
    querySelector: key => elements.get(key),
    querySelectorAll: key => key === "[data-m02-entry]" ? entries : key === "[data-m02-topic]" ? topics : [],
  };
  const document = { querySelectorAll: key => key === "[data-m02-root]" ? [root] : [] };
  runInNewContext(clientSource, { globalThis: { document } }, { filename: "news-workbench.client.js" });
  return { search, category, count, empty, entries, onInput: () => listeners.get("search:input")(), onChange: () => listeners.get("category:change")(), onReset: () => listeners.get("reset:click")(), onTopic: value => listeners.get("topic:" + value + ":click")() };
}

test("M02 fictional localized search folds diacritics and case without network", () => {
  const ui = makeWorkbench();
  ui.search.value = "  SEGURANCA ";
  ui.onInput();
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, true, true]);
  assert.equal(ui.count.textContent, "1 exemplo fictício");
  assert.equal(ui.empty.hidden, true);
  ui.search.value = "ficticios";
  ui.onInput();
  assert.deepEqual(ui.entries.map(x => x.hidden), [true, true, false]);
  ui.search.value = "IMAGINARIA";
  ui.onInput();
  assert.deepEqual(ui.entries.map(x => x.hidden), [true, false, true]);
});

test("M02 category filtering, empty results and reset remain local", () => {
  const ui = makeWorkbench();
  ui.search.value = "sEgUrAnÇa";
  ui.category.value = "protocol";
  ui.onChange();
  assert.deepEqual(ui.entries.map(x => x.hidden), [true, true, true]);
  assert.equal(ui.count.textContent, "0 exemplos fictícios");
  assert.equal(ui.empty.hidden, false);
  ui.category.value = "security";
  ui.onChange();
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, true, true]);
  ui.onReset();
  assert.equal(ui.search.value, "");
  assert.equal(ui.category.value, "all");
  assert.equal(ui.search.focused, true);
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, false, false]);
  assert.equal(ui.count.textContent, "3 exemplos fictícios");
  assert.equal(ui.empty.hidden, true);
});

test("M02 filter remains a DOM-only classic script without network or persistence", () => {
  assert.doesNotMatch(clientSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|window\.location|\bimport\b/u);
});

test("M02 topic chooser filters fictitious examples without navigation or requests", () => {
  const ui = makeWorkbench();
  ui.search.value = "UNRELATED";
  ui.onTopic("education");
  assert.equal(ui.search.value, "");
  assert.equal(ui.category.value, "education");
  assert.deepEqual(ui.entries.map(x => x.hidden), [true, true, false]);
  ui.onTopic("security");
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, true, true]);
  ui.onReset();
  assert.equal(ui.category.value, "all");
  assert.equal(ui.count.textContent, "3 exemplos fictícios");
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, false, false]);
});
