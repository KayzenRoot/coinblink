import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  MOCK_NEWS_CATEGORIES, MAX_SEARCH_LENGTH, clampSearchCategory, clampSearchQuery,
  countMockNewsMatches, matchesMockNewsFilter, normalizeSearchText,
} from "../../../src/modules/CB-M02/news-filter.mjs";

const entry = (category, searchable) => ({ category, searchable });

test("CB-M02-P1 the search normalizer folds diacritics and case", () => {
  assert.equal(normalizeSearchText("SEGURANÇA"), "seguranca");
  assert.equal(normalizeSearchText("Notícias"), "noticias");
  assert.equal(normalizeSearchText("  Mixed  "), "  mixed  ", "trimming belongs to the clamp, not the normalizer");
  for (const bad of [null, undefined, 42, {}, []]) assert.equal(normalizeSearchText(bad), "");
});

test("CB-M02-P1 queries and categories are clamped before matching", () => {
  assert.equal(clampSearchQuery("  wallet  "), "wallet");
  assert.equal(clampSearchQuery("x".repeat(200)).length, MAX_SEARCH_LENGTH);
  for (const bad of [null, undefined, 42, {}, []]) assert.equal(clampSearchQuery(bad), "");
  for (const known of MOCK_NEWS_CATEGORIES) assert.equal(clampSearchCategory(known), known);
  for (const bad of ["unknown", "", null, 42, {}, ["security"]]) assert.equal(clampSearchCategory(bad), "all");
});

test("CB-M02-P1 the matcher is the single rule for both sides", () => {
  const rows = [
    entry("security", "fictional wallet safety workshop safety"),
    entry("protocol", "imaginary protocol classroom protocol"),
    entry("education", "practice ledger tutorial education"),
  ];
  assert.equal(countMockNewsMatches(rows, { query: "", category: "all" }), 3);
  assert.equal(countMockNewsMatches(rows, { query: "", category: "security" }), 1);
  assert.equal(countMockNewsMatches(rows, { query: "WALLET", category: "all" }), 1);
  assert.equal(countMockNewsMatches(rows, { query: "wallet", category: "protocol" }), 0);
  assert.equal(countMockNewsMatches(rows, { query: "SEGURANCA", category: "all" }), 0,
    "an accented searchable string only matches through the folded text");
  assert.equal(matchesMockNewsFilter(entry("security", "SEGURANÇA"), { query: "seguranca" }), true);
  assert.equal(countMockNewsMatches(rows, { query: "unlikely-query", category: "all" }), 0);
  assert.equal(countMockNewsMatches(null, { query: "x" }), 0);
  assert.equal(matchesMockNewsFilter(null, {}), false);
});

test("CB-M02-P1 an empty or unknown filter never hides everything", () => {
  const rows = [entry("security", "a"), entry("protocol", "b")];
  for (const filter of [{}, { query: "", category: "all" }, { query: null, category: "nope" },
    { query: 42, category: [] }]) {
    assert.equal(countMockNewsMatches(rows, filter), rows.length, JSON.stringify(filter));
  }
});

test("CB-M02-P1 the inline client normalizer cannot drift from the shared module", () => {
  // The news client must stay a classic DOM-only script with no import, so it
  // keeps its own one-line normalizer. This extracts that expression and proves
  // it agrees with the shared module the server uses.
  const source = readFileSync("src/modules/CB-M02/news-workbench.client.js", "utf8");
  const extracted = source.match(/const normalizeSearch = (value => .+);/u);
  assert.ok(extracted, "the client normalizer must remain a single extractable expression");
  const clientNormalize = new Function("return (" + extracted[1] + ");")();
  const samples = ["SEGURANCA", "Segurança", "Notícias fictícias", "Wallet Safety", "ação",
    "  padded  ", "CAFÉ", "æøå", "", "12345"];
  for (const sample of samples) {
    assert.equal(clientNormalize(sample), normalizeSearchText(sample), JSON.stringify(sample));
  }
  assert.doesNotMatch(source, /import\s*\(|fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/u,
    "the news client stays a classic script without network, module loading or persistence");
});
