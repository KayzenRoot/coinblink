import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LOCALES = [
  { slug: "en", path: "/en/about", lang: "en", h1: "How CoinBlink works",
    live: "/en/news/live", sources: "/en/news/sources", home: "/en", back: "← Live headlines" },
  { slug: "pt-br", path: "/pt-br/about", lang: "pt-BR", h1: "Como o CoinBlink funciona",
    live: "/pt-br/news/live", sources: "/pt-br/news/sources", home: "/pt-br", back: "← Manchetes ao vivo" },
  { slug: "es", path: "/es/about", lang: "es", h1: "Cómo funciona CoinBlink",
    live: "/es/news/live", sources: "/es/news/sources", home: "/es", back: "← Titulares en vivo" },
];

test("M09 explanation page is localized, transparent and inert", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 390, height: 844 });
  const foreign = [];
  const crashes = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  page.on("pageerror", (error) => crashes.push(error.message));
  for (const locale of LOCALES) {
    const response = await page.goto(locale.path);
    expect(response?.status(), locale.path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale.lang);
    await expect(page.getByRole("heading", { level: 1, name: locale.h1 })).toBeVisible();
    await expect(page.locator("[data-about-page]")).toHaveAttribute("data-about-page", locale.slug);
    await expect(page.getByRole("link", { name: locale.back })).toHaveAttribute("href", locale.live);
    await expect(page.locator('a[href="' + locale.sources + '"]').first()).toBeVisible();
    await expect(page.locator('a[href="' + locale.home + '"]').first()).toBeVisible();
    await expect(page.locator('a[href="/demo/intake"]')).toBeVisible();
    await expect(page.locator('a[href="/developers"]')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByText("What is not connected")).toHaveCount(locale.slug === "en" ? 1 : 0);
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, locale.path).toEqual([]);
    await page.goto(locale.live);
    await expect(page.locator('a[href="' + locale.path + '"]')).toBeVisible();
  }
  expect(foreign).toEqual([]);
  expect(crashes).toEqual([]);
});
