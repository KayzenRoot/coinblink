import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { listMockNews, resolveMockNews } from "../../../src/modules/CB-M02/news-workbench.mjs";
import { newsCopy, localizeMockNews } from "../../../src/modules/CB-M02/news-i18n.mjs";

test("M09 Spanish localizes exactly the three canonical fictional news specimens", () => {
  const en = listMockNews().items;
  assert.equal(en.length, 3);
  for (const row of en) {
    const es = localizeMockNews(row, "es");
    assert.equal(es.slug, row.slug);
    assert.equal(es.id, row.id);
    assert.equal(es.category, row.category);
    assert.equal(es.demo, true);
    assert.equal(es.published, false);
    assert.equal(es.rights, row.rights);
    assert.notEqual(es.title, row.title);
    assert.notEqual(es.summary, row.summary);
    assert.notEqual(es.body, row.body);
    assert.equal(resolveMockNews(es.slug).item, row);
    assert.equal(localizeMockNews(row, "de"), row);
  }
  assert.deepEqual(Object.keys(newsCopy("es")).sort(), Object.keys(newsCopy("en")).sort());
  assert.match(newsCopy("es").disclaimer, /NO PUBLICADAS/u);
  assert.equal(newsCopy("pt-br").resetFilters, "Limpar filtros");
});

test("M09 Spanish route and switcher preserve noindex and validate slugs", () => {
  const listing = readFileSync("src/pages/es/news.astro", "utf8");
  const detail = readFileSync("src/pages/es/news/[slug].astro", "utf8");
  const component = readFileSync("src/modules/CB-M09/NewsLocaleSwitch.astro", "utf8");
  const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
  const workbench = readFileSync("src/modules/CB-M02/NewsWorkbench.astro", "utf8");
  assert.match(listing, /locale="es"/u);
  assert.match(detail, /locale="es"/u);
  const page = readFileSync("src/modules/CB-M09/LocalizedNewsPage.astro", "utf8");
  assert.ok(page.includes("lang={copy.lang}"));
  assert.match(page, /lang: "es"/u);
  assert.match(detail, /Astro\.response\.status = 404/u);
  assert.match(component, /resolveMockNews\(slug\)\.item/u);
  assert.match(component, /aria-current/u);
  assert.match(component, /data-m09-language-nav/u);
  assert.match(workbench, /locale !== "es" && <LocalArticlePreview/u);
  assert.match(layout, /noindex, nofollow, noarchive/u);
  for (const text of [listing, detail, component, workbench]) {
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|indexedDB|\/admin\/api|innerHTML/u);
  }
});


// CB-M09-ES-ENTRY-A11Y-001: contract-first RED against the unmodified product.
test("M09 ES entry: a first-class Spanish DEMO page exists and is never LIVE", () => {
  const entry = readFileSync("src/pages/es.astro", "utf8");
  assert.match(entry, /<BaseLayout/u);
  assert.match(entry, /lang="es"/u);
  assert.match(entry, /href="\/es\/news"/u);
  assert.match(entry, /href="\/en"/u);
  assert.match(entry, /href="\/pt-br"/u);
  assert.match(entry, /DEMO/u);
  assert.match(entry, /<main[^>]+id="main"/u);
  assert.doesNotMatch(entry, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|indexedDB|\/admin\/api|innerHTML|https?:\/\//u);
});

test("M09 ES a11y: Spanish skip label keeps EN and PT-BR unchanged", () => {
  const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
  assert.match(layout, /lang === "es"\s*\?\s*"Saltar al contenido"/u);
  assert.match(layout, /lang === "pt-BR"\s*\?\s*"Pular para o conteúdo"/u);
  assert.match(layout, /"Skip to content"/u);
  assert.match(layout, /noindex, nofollow, noarchive/u);
});

test("M09 ES navigation: Spanish demo articles offer a return to the ES entry", () => {
  const nav = readFileSync("src/modules/CB-M09/NewsLocaleSwitch.astro", "utf8");
  assert.match(nav, /locale === "es"[\s\S]*?href="\/es"/u);
  assert.match(nav, /Volver al inicio/u);
  assert.match(nav, /resolveMockNews\(slug\)\.item/u);
});
