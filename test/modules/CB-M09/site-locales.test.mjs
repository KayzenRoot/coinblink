import test from "node:test";
import assert from "node:assert/strict";
const MODEL = "../../../src/modules/CB-M09/site-locales.mjs";
const ORIGIN = "https://coinblink.example";

const page = (overrides = {}) => ({
  pathname: "/en/news", lang: "en", title: "CoinBlink · Fictional news",
  description: "Offline fictional news discovery.", ...overrides,
});

test("M09 P1 site locales are exactly en, pt-br and es and stay frozen", async () => {
  const model = await import(MODEL);
  const locales = model.listSiteLocales();
  assert.equal(Object.isFrozen(locales), true);
  assert.deepEqual([...locales], ["en", "pt-br", "es"]);
  assert.equal(model.DEFAULT_LOCALE, "en");
  assert.equal(model.DEMO_ROBOTS, "noindex, nofollow, noarchive");
});

test("M09 P1 sibling paths exist only for localized routes", async () => {
  const { localeSiblings } = await import(MODEL);
  assert.deepEqual(localeSiblings("/en"), { en: "/en", "pt-br": "/pt-br", es: "/es" });
  assert.deepEqual(localeSiblings("/pt-br/news"),
    { en: "/en/news", "pt-br": "/pt-br/news", es: "/es/news" });
  assert.deepEqual(localeSiblings("/es/news/example-slug"),
    { en: "/en/news/example-slug", "pt-br": "/pt-br/news/example-slug", es: "/es/news/example-slug" });
  for (const pathname of ["/", "", "/demo/sources", "/demo", "/fr/news", "/en/news/"]) {
    assert.equal(localeSiblings(pathname), null,
      `${pathname} must not claim language alternates`);
  }
  assert.equal(localeSiblings(null), null);
  assert.equal(localeSiblings(42), null);
});

test("M09 P1 a configured origin is normalized and a malformed one is refused", async () => {
  const { resolveSiteOrigin } = await import(MODEL);
  for (const absent of [undefined, null, ""]) assert.equal(resolveSiteOrigin(absent), null);
  assert.equal(resolveSiteOrigin(ORIGIN), ORIGIN);
  assert.equal(resolveSiteOrigin("https://coinblink.example:8443"), "https://coinblink.example:8443");
  assert.equal(resolveSiteOrigin("https://localhost"), "https://localhost");
  for (const malformed of ["http://coinblink.example", "https://coinblink.example/",
    "coinblink.example", "https://coinblink.example/?x=1", 42, {}, true]) {
    assert.throws(() => resolveSiteOrigin(malformed), TypeError,
      `must refuse ${JSON.stringify(malformed)}`);
  }
});

test("M09 P1 without an origin the DEMO build emits no absolute URL", async () => {
  const { buildSeoMetadata } = await import(MODEL);
  for (const pathname of ["/en", "/en/news", "/demo/sources"]) {
    const seo = buildSeoMetadata(page({ pathname }));
    assert.ok(Object.isFrozen(seo));
    assert.equal(seo.absolute, false);
    assert.equal(seo.canonical, null);
    assert.deepEqual(seo.alternates, []);
    assert.equal(seo.openGraph.url, null);
    assert.equal(seo.robots, "noindex, nofollow, noarchive");
    assert.equal(seo.openGraph.type, "website");
    assert.equal(seo.openGraph.siteName, "CoinBlink");
    assert.equal(seo.twitter.card, "summary");
    assert.equal(seo.openGraph.title, page().title);
    assert.equal(seo.openGraph.description, page().description);
  }
});

test("M09 P1 with an origin every localized page gets canonical, alternates and locale", async () => {
  const { buildSeoMetadata } = await import(MODEL);
  const expected = { en: "en", "pt-BR": "pt-BR", es: "es" };
  const expectedOg = { en: "en_US", "pt-BR": "pt_BR", es: "es_ES" };
  const pathFor = { en: "/en/news", "pt-BR": "/pt-br/news", es: "/es/news" };
  for (const [lang, bcp47] of Object.entries(expected)) {
    const seo = buildSeoMetadata(page({ pathname: pathFor[lang], lang, origin: ORIGIN }));
    assert.equal(seo.lang, bcp47);
    assert.equal(seo.absolute, true);
    assert.equal(seo.canonical, ORIGIN + pathFor[lang]);
    assert.equal(seo.openGraph.url, seo.canonical);
    assert.equal(seo.openGraph.locale, expectedOg[lang]);
    assert.deepEqual(seo.alternates.map((item) => item.hreflang), ["en", "pt-BR", "es", "x-default"]);
    assert.deepEqual(seo.alternates.map((item) => item.href), [
      ORIGIN + "/en/news", ORIGIN + "/pt-br/news", ORIGIN + "/es/news", ORIGIN + "/en/news",
    ]);
    for (const alternate of seo.alternates) assert.ok(Object.isFrozen(alternate));
  }
  const lab = buildSeoMetadata(page({ pathname: "/demo/sources", origin: ORIGIN }));
  assert.equal(lab.canonical, ORIGIN + "/demo/sources");
  assert.deepEqual(lab.alternates, [], "a non-localized route must not claim language alternates");
});

test("M09 P1 malformed page input fails closed instead of emitting metadata", async () => {
  const { buildSeoMetadata } = await import(MODEL);
  const rejected = [
    page({ pathname: "en/news" }), page({ pathname: null }), page({ lang: "fr" }),
    page({ lang: undefined }), page({ title: "" }), page({ title: "   " }),
    page({ description: 42 }), page({ origin: "http://coinblink.example" }),
    page({ origin: "https://coinblink.example/" }),
  ];
  for (const input of rejected) {
    assert.throws(() => buildSeoMetadata(input), TypeError, `must refuse ${JSON.stringify(input)}`);
  }
  assert.throws(() => buildSeoMetadata(), TypeError);
});

test("M09 P1 shipped layout consumes the tested model and keeps the demo boundary", async () => {
  const { readFileSync } = await import("node:fs");
  const layout = readFileSync("src/layouts/BaseLayout.astro", "utf8");
  assert.match(layout, /from "\.\.\/modules\/CB-M09\/site-locales\.mjs"/u);
  assert.match(layout, /buildSeoMetadata\(/u);
  assert.match(layout, /Astro\.url\.pathname/u);
  assert.match(layout, /import\.meta\.env\.PUBLIC_SITE_ORIGIN/u);
  assert.match(layout, /content=\{seo\.robots\}/u);
  assert.match(layout, /property="og:title"/u);
  assert.match(layout, /property="og:locale" content=\{seo\.openGraph\.locale\}/u);
  assert.match(layout, /name="twitter:card"/u);
  assert.match(layout, /seo\.canonical && <link rel="canonical"/u);
  assert.match(layout, /seo\.alternates\.map/u);
  assert.doesNotMatch(layout, /href="https:\/\//u,
    "the layout must not hardcode an absolute origin");
  assert.doesNotMatch(layout, /noindex, nofollow, noarchive/u,
    "the robots value must come from the model, not a literal");
});
