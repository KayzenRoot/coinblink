import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NEWS_MOCK_POLICY, listMockNews, resolveMockNews } from "../../../src/modules/CB-M02/news-workbench.mjs";
import { newsCopy, localizeMockNews } from "../../../src/modules/CB-M02/news-i18n.mjs";
test("M02 localizes exactly the same 3 invented, unpublished rows", () => {
  const rows = listMockNews().items;
  assert.equal(NEWS_MOCK_POLICY, "P0_OFFLINE_MOCK_ONLY");
  assert.equal(rows.length, 3);
  for (const row of rows) {
    const pt = localizeMockNews(row, "pt-br");
    assert.equal(pt.slug, row.slug);
    assert.equal(pt.published, false);
    assert.equal(pt.demo, true);
    assert.equal(pt.rights, "SYNTHETIC_NOT_LICENSED_NEWS");
    assert.notEqual(pt.title, row.title);
    assert.equal(resolveMockNews(pt.slug).item, row);
  }
  assert.match(newsCopy("pt-br").disclaimer, /NÃO PUBLICADAS/u);
  assert.equal(newsCopy("de").disclaimer, newsCopy("en").disclaimer);
});
test("M02 public routes never import drafts, provider secrets or external sources", () => {
  for (const file of [
    "src/modules/CB-M02/NewsWorkbench.astro",
    "src/modules/CB-M02/NewsArticle.astro",
    "src/modules/CB-M02/news-workbench.client.js",
    "src/pages/en/news.astro", "src/pages/pt-br/news.astro",
    "src/pages/en/news/[slug].astro", "src/pages/pt-br/news/[slug].astro",
  ]) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\.wrangler|\bpublish\s*\(|\/admin\/api|import\s*\(.*https?:/u, file);
  }
});
