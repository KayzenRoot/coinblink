import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const clientSource = readFileSync(new URL("../../../src/modules/CB-M02/news-workbench.client.js", import.meta.url), "utf8");

function makeWorkbench() {
  const listeners = new Map();
  const search = { value: "", addEventListener: (name, callback) => listeners.set("search:" + name, callback) };
  const category = { value: "all", addEventListener: (name, callback) => listeners.set("category:" + name, callback) };
  const count = { textContent: "3 exemplos fictícios", dataset: { m02CountLabel: "exemplos fictícios" } };
  const empty = { hidden: true };
  const entries = [
    { dataset: { m02Category: "security", m02Searchable: "Oficina fictícia de segurança" }, hidden: false },
    { dataset: { m02Category: "protocol", m02Searchable: "Sala de aula imaginária sobre protocolos" }, hidden: false },
    { dataset: { m02Category: "education", m02Searchable: "Tutorial de registros fictícios" }, hidden: false },
  ];
  const elements = new Map([
    ["[data-m02-search]", search],
    ["[data-m02-category-select]", category],
    ["[data-m02-result-count]", count],
    ["[data-m02-empty]", empty],
  ]);
  const root = {
    querySelector: key => elements.get(key),
    querySelectorAll: key => key === "[data-m02-entry]" ? entries : [],
  };
  const document = { querySelectorAll: key => key === "[data-m02-root]" ? [root] : [] };
  runInNewContext(clientSource, { globalThis: { document } }, { filename: "news-workbench.client.js" });
  return { search, category, count, empty, entries, onInput: () => listeners.get("search:input")(), onChange: () => listeners.get("category:change")() };
}

test("M02 fictional localized search folds diacritics and case without network", () => {
  const ui = makeWorkbench();
  ui.search.value = "  SEGURANCA ";
  ui.onInput();
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, true, true]);
  assert.equal(ui.count.textContent, "1 exemplos fictícios");
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
  ui.search.value = "";
  ui.category.value = "all";
  ui.onInput();
  assert.deepEqual(ui.entries.map(x => x.hidden), [false, false, false]);
  assert.equal(ui.empty.hidden, true);
});

test("M02 filter remains a DOM-only classic script without network or persistence", () => {
  assert.doesNotMatch(clientSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|window\.location|\bimport\b/u);
});
