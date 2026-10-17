import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NEWS_MOCK_POLICY, listMockNews, resolveMockNews } from "../../../src/modules/CB-M02/news-workbench.mjs";

test("M02 lists only fictional unpublished fixtures and never a private draft", () => {
  assert.equal(NEWS_MOCK_POLICY, "P0_OFFLINE_MOCK_ONLY");
  const state = listMockNews();
  assert.equal(state.status, "MOCK_RESULTS");
  assert.equal(state.items.length, 3);
  assert.ok(state.items.every(item => item.demo === true && item.published === false
    && item.rights === "SYNTHETIC_NOT_LICENSED_NEWS" && Object.isFrozen(item)));
  assert.ok(state.items.every(item => !("originalUrl" in item) && !("price" in item)));
});
test("M02 category/search and details behave deterministically and fail closed", () => {
  assert.equal(listMockNews({ category: "security" }).items.length, 1);
  assert.equal(listMockNews({ query: "classroom" }).items[0].category, "protocol");
  assert.equal(listMockNews({ query: "unlikely query" }).status, "EMPTY");
  for (const state of ["LOADING", "UNAVAILABLE", "DENIED_RIGHTS"]) {
    assert.deepEqual(listMockNews({ state }).items, []);
  }
  for (const input of [{ category: "secret" }, { query: "x".repeat(81) }, null, { state: "LIVE" }]) {
    assert.equal(listMockNews(input).status, "BAD_REQUEST");
  }
  assert.equal(resolveMockNews("demo-wallet-safety").status, "MOCK_DETAIL_NOT_PUBLISHED");
  assert.equal(resolveMockNews("other").status, "NOT_FOUND");
  assert.equal(resolveMockNews("../admin").status, "BAD_REQUEST");
});
test("M02 Astro workbench offers accessible offline real filters without requests", () => {
  const page = readFileSync(resolve("src/modules/CB-M02/NewsWorkbench.astro"), "utf8");
  const client = readFileSync(resolve("src/modules/CB-M02/news-workbench.client.js"), "utf8");
  assert.match(page, /data-m02-search/u);
  assert.match(page, /data-m02-category/u);
  assert.match(page, /aria-live="polite"/u);
  assert.match(page, /MOCK \/ FICTIONAL \/ NOT PUBLISHED/u);
  assert.match(client, /addEventListener\("input"/u);
  assert.match(client, /addEventListener\("change"/u);
  assert.doesNotMatch(page + client, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|\bimport\s*\(.*https?:/u);
});
