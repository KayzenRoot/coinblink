import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Live headlines are off by default. This contract proves the safe default in
// every locale: the page renders, explains itself and makes no external request.
const LOCALES = [
  { path: "/en/news/live", news: "/en/news", lang: "en", back: "← News",
    h1: "Live headlines from public feeds" },
  { path: "/pt-br/news/live", news: "/pt-br/news", lang: "pt-BR", back: "← Notícias",
    h1: "Manchetes ao vivo de feeds públicos" },
  { path: "/es/news/live", news: "/es/news", lang: "es", back: "← Noticias",
    h1: "Titulares en vivo de fuentes públicas" },
];

test("M03 live headlines stay inert in every locale until a deployment enables them", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 390, height: 844 });
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  for (const locale of LOCALES) {
    const response = await page.goto(locale.path);
    expect(response?.status(), locale.path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale.lang);
    await expect(page.getByRole("heading", { level: 1, name: locale.h1 })).toBeVisible();
    const disabled = page.locator('[data-m03-live="disabled"]');
    await expect(disabled, locale.path).toBeVisible();
    await expect(page.locator("[data-m03-live-item]")).toHaveCount(0);
    await expect(page.locator("[data-m03-live-list]")).toHaveCount(0);
    await expect(page.locator("[data-m03-new-status]")).toHaveCount(0);
    await expect(page.locator('[data-m03-live="live"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: locale.back })).toHaveAttribute("href", locale.news);
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, locale.path).toEqual([]);
    // A filtered address must not crash the disabled page or wake the reader.
    const filtered = await page.goto(locale.path + "?q=bitcoin&source=unknown&since=3h");
    expect(filtered?.status(), locale.path + " filtered").toBe(200);
    await expect(page.locator('[data-m03-live="disabled"]')).toBeVisible();
    await expect(page.locator("[data-m03-live-filter]")).toHaveCount(0);
    await expect(page.locator("[data-m03-live-topics]")).toHaveCount(0);
    await expect(page.locator("[data-m03-live-since]")).toHaveCount(0);
    await expect(page.locator("[data-m03-saved-searches]")).toHaveCount(0);
    await expect(page.locator("[data-m03-live-item]")).toHaveCount(0);
  }
  expect(foreign).toEqual([]);
});

test("M03 the news section links to live headlines in each locale", async ({ page }) => {
  for (const locale of LOCALES) {
    const response = await page.goto(locale.news);
    expect(response?.status(), locale.news).toBe(200);
    const link = page.locator(".m02-live a");
    await expect(link).toHaveAttribute("href", locale.path);
    await expect(link).toContainText("RSS");
    // With the reader off, the index must not render a strip or wake a feed.
    await expect(page.locator("[data-m03-live-strip]")).toHaveCount(0);
  }
});

test("M03 the demo index no longer advertises the live reader", async ({ page }) => {
  const response = await page.goto("/demo");
  expect(response?.status()).toBe(200);
  await expect(page.locator('.labs__list a[href="/en/news/live"]')).toHaveCount(0);
  await expect(page.locator(".labs__note")).toContainText("/en/news/live");
  await expect(page.locator('.labs__list a[href="/demo/intake"]')).toHaveCount(1);
});

test("M03 private intake gate stays closed and inert while the reader is off", async ({ page }) => {
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  const response = await page.goto("/demo/intake");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Private intake gate" })).toBeVisible();
  await expect(page.locator('[data-m03-intake-state="disabled"]')).toBeVisible();
  await expect(page.locator("[data-m03-intake-item]")).toHaveCount(0);
  await expect(page.locator("[data-m03-intake]")).toContainText("Nothing here is stored");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  expect(foreign).toEqual([]);
});

const PUBLISHER_PAGES = [
  { path: "/en/news/source/coindesk", lang: "en" },
  { path: "/pt-br/news/source/coindesk", lang: "pt-BR" },
  { path: "/es/news/source/coindesk", lang: "es" },
];

test("M03 publisher pages are attributed and inert while the reader is off", async ({ page }) => {
  test.slow();
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  for (const publisher of PUBLISHER_PAGES) {
    const response = await page.goto(publisher.path);
    expect(response?.status(), publisher.path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", publisher.lang);
    await expect(page.getByRole("heading", { level: 1, name: "CoinDesk" })).toBeVisible();
    await expect(page.locator('[data-m03-source-state="DISABLED"]')).toBeVisible();
    await expect(page.locator("[data-m03-source-item]")).toHaveCount(0);
    await expect(page.locator("[data-m03-source-empty]")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: "https://www.coindesk.com" }))
      .toHaveAttribute("rel", "noreferrer noopener external");
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, publisher.path).toEqual([]);
  }
  const missing = await page.goto("/en/news/source/unknown-source");
  expect(missing?.status()).toBe(404);
  await expect(page.locator("[data-m03-source-missing]")).toBeVisible();
  const badLocale = await page.goto("/fr/news/source/coindesk");
  expect(badLocale?.status()).toBe(404);
  expect(foreign).toEqual([]);
});

const DIRECTORY_PAGES = [
  { path: "/en/news/sources", lang: "en", h1: "News sources" },
  { path: "/pt-br/news/sources", lang: "pt-BR", h1: "Fontes de notícias" },
  { path: "/es/news/sources", lang: "es", h1: "Fuentes de noticias" },
];

test("M03 source directory lists every publisher and stays inert while the reader is off", async ({ page }) => {
  test.slow();
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  for (const directory of DIRECTORY_PAGES) {
    const response = await page.goto(directory.path);
    expect(response?.status(), directory.path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", directory.lang);
    await expect(page.getByRole("heading", { level: 1, name: directory.h1 })).toBeVisible();
    await expect(page.locator('[data-m03-sources-state="DISABLED"]')).toBeVisible();
    await expect(page.locator("[data-m03-sources-item]")).toHaveCount(5);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const localePrefix = directory.path.split("/")[1];
    await expect(page.locator('[data-m03-sources-item="coindesk"] a').first())
      .toHaveAttribute("href", "/" + localePrefix + "/news/source/coindesk");
    await expect(page.locator('[data-m03-sources-item="coindesk"] a').nth(1))
      .toHaveAttribute("rel", "noreferrer noopener external");
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, directory.path).toEqual([]);
  }
  expect(foreign).toEqual([]);
});

test("M06 system pulse reports only measured state while the reader is off", async ({ page }) => {
  const response = await page.goto("/demo/pulse");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "System pulse" })).toBeVisible();
  const pulse = page.locator("[data-m06-pulse]");
  await expect(pulse).toHaveAttribute("data-m06-pulse-reader", "DISABLED");
  await expect(pulse).toHaveAttribute("data-m06-pulse-build", "local");
  await expect(page.locator("[data-m06-pulse-state]")).toContainText("No request was made");
  await expect(page.locator('[data-m06-pulse-intake="not-measured"]')).toBeVisible();
  await expect(page.locator("[data-m06-pulse-source]")).toHaveCount(0);
  await expect(page.locator('[data-m06-pulse-editorial="LOCAL_ONLY"]')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("M03 the reader language switch keeps the path and its filters", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/en/news/live?q=bitcoin&since=24");
  expect(response?.status()).toBe(200);
  const nav = page.locator("[data-m03-locale-switch]");
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "English" }))
    .toHaveAttribute("href", "/en/news/live?q=bitcoin&since=24");
  await expect(nav.getByRole("link", { name: "Português (Brasil)" }))
    .toHaveAttribute("href", "/pt-br/news/live?q=bitcoin&since=24");
  await expect(nav.getByRole("link", { name: "Español" }))
    .toHaveAttribute("href", "/es/news/live?q=bitcoin&since=24");
  await expect(nav.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Português (Brasil)" }).click();
  await expect(page).toHaveURL(/\/pt-br\/news\/live\?q=bitcoin&since=24$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.getByRole("heading", { level: 1, name: "Manchetes ao vivo de feeds públicos" })).toBeVisible();
});

test("M03 the source directory exports the public feeds as OPML", async ({ request, page }) => {
  const response = await request.get("/sources.opml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/x-opml");
  expect(response.headers()["cache-control"]).toContain("max-age=3600");
  const body = await response.text();
  expect((body.match(/<outline /g) ?? []).length).toBe(5);
  expect(body).toContain('xmlUrl="https://cointelegraph.com/rss"');
  const etag = response.headers()["etag"];
  expect(etag).toBeTruthy();
  expect((await request.get("/sources.opml", { headers: { "if-none-match": etag } })).status()).toBe(304);
  expect((await request.get("/sources.opml?x=1")).status()).toBe(400);
  expect((await request.post("/sources.opml")).status()).toBe(405);
  await page.goto("/en/news/sources");
  await expect(page.getByRole("link", { name: "Subscribe to all feeds (OPML)" }))
    .toHaveAttribute("href", "/sources.opml");
});
