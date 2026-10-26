import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listMockNews } from "../../../src/modules/CB-M02/news-workbench.mjs";

const MODEL_URL = "../../../src/modules/CB-M11/demo-articles.mjs";

test("M11 RED: independent synthetic source exists and has no I/O", () => {
  const src = readFileSync("src/modules/CB-M11/demo-articles.mjs", "utf8");
  assert.match(src, /listMockNews/u);
  assert.match(src, /SYNTHETIC_NOT_LICENSED_NEWS/u);
  assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|\/admin\b|process\.env/u);
});

test("M11 RED: developer documentation and explicit GET-only sandbox handler", () => {
  const doc = readFileSync("src/pages/developers.astro", "utf8");
  const route = readFileSync("src/pages/v1/demo/articles.ts", "utf8");
  assert.match(doc, /<BaseLayout/u);
  assert.match(doc, /\/v1\/demo\/articles/u);
  assert.match(doc, /DEMO/u);
  assert.match(route, /export const GET/u);
  assert.match(route, /export const ALL/u);
  assert.match(route, /no-store/u);
  assert.match(route, /nosniff/u);
  for (const source of [doc, route]) {
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|innerHTML/u);
  }
});

test("M11 RED: projection is only canonical unpublished M02 metadata", async () => {
  const { buildDemoArticles } = await import(MODEL_URL);
  const result = buildDemoArticles(), canonical = listMockNews();
  assert.equal(canonical.status, "MOCK_RESULTS");
  assert.deepEqual([result.status, result.mode, result.live, result.redistributable],
    ["DEMO_ONLY", "SYNTHETIC", false, false]);
  assert.equal(result.items.length, 3);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.items));
  assert.deepEqual(result.items.map(x => x.id), canonical.items.map(x => x.id));
  assert.equal(new Set(result.items.map(x => x.id)).size, 3);
  for (const [i, item] of result.items.entries()) {
    assert.deepEqual(Object.keys(item).sort(),
      ["category", "id", "published", "rights", "slug", "summary", "title"]);
    assert.equal(item.id, canonical.items[i].id);
    assert.equal(item.title, canonical.items[i].title);
    assert.equal(item.summary, canonical.items[i].summary);
    assert.equal(item.published, false);
    assert.equal(item.rights, "SYNTHETIC_NOT_LICENSED_NEWS");
    assert.ok(Object.isFrozen(item));
    assert.equal(JSON.stringify(item).includes(canonical.items[i].body), false);
  }
});

test("M11 RED: polluted, published, forged or denied input fails closed", async () => {
  const { buildDemoArticles } = await import(MODEL_URL);
  const base = listMockNews();
  const bad = [
    null, {}, { ...base, mode: "LIVE" }, { ...base, status: "DENIED_RIGHTS" },
    { ...base, items: [] }, { ...base, items: [base.items[0], base.items[0], base.items[2]] },
    { ...base, items: base.items.map((row, i) => i ? row : { ...row, published: true }) },
    { ...base, items: base.items.map((row, i) => i ? row : { ...row, rights: "APPROVED" }) },
    { ...base, items: base.items.map((row, i) => i ? row : { ...row, private_notes: "do not leak" }) },
    { ...base, items: base.items.map((row, i) => i ? row : { ...row, body: "forged text" }) },
  ];
  for (const candidate of bad) {
    const result = buildDemoArticles(candidate);
    assert.deepEqual([result.status, result.mode, result.live, result.redistributable],
      ["UNAVAILABLE", "SYNTHETIC", false, false]);
    assert.deepEqual(result.items, []);
  }
});


test("M11 P1 developer docs show only canonical synthetic API snapshots in native accessible disclosure controls", () => {
  const docs = readFileSync("src/pages/developers.astro", "utf8");
  assert.match(docs, /import \{ buildDemoArticles \} from/u);
  assert.match(docs, /import \{ buildDemoMarketReadiness \} from/u);
  assert.match(docs, /data-m11-example="articles"/u);
  assert.match(docs, /data-m11-example="market-readiness"/u);
  assert.match(docs, /<details[^>]*data-m11-example/u);
  assert.match(docs, /<summary>Show (?:fictional|synthetic)/u);
  assert.match(docs, /JSON\.stringify\(articleExample,\s*null,\s*2\)/u);
  assert.match(docs, /JSON\.stringify\(marketExample,\s*null,\s*2\)/u);
  assert.match(docs, /developers-inspector\.css\?url&no-inline/u);
  assert.doesNotMatch(docs, /<script|window\.|document\.|fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|type="email"|<form/u);
  const css = readFileSync("src/pages/developers-inspector.css", "utf8");
  assert.match(css, /overflow-wrap:\s*anywhere/u);
  assert.match(css, /white-space:\s*pre-wrap/u);
  assert.match(css, /:focus-visible/u);
  assert.doesNotMatch(css, /word-break\s*:\s*break-word/u);
});
