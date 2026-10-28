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
    await expect(page.locator('[data-m03-live="live"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: locale.back })).toHaveAttribute("href", locale.news);
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, locale.path).toEqual([]);
    // A filtered address must not crash the disabled page or wake the reader.
    const filtered = await page.goto(locale.path + "?q=bitcoin&source=unknown");
    expect(filtered?.status(), locale.path + " filtered").toBe(200);
    await expect(page.locator('[data-m03-live="disabled"]')).toBeVisible();
    await expect(page.locator("[data-m03-live-filter]")).toHaveCount(0);
    await expect(page.locator("[data-m03-live-topics]")).toHaveCount(0);
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
});
