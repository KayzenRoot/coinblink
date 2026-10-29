import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LIVE_NEWS_COPY } from "../src/modules/CB-M03/live-news-copy.mjs";

// The coverage page is the shareable home of the cross-publisher groups. Live
// feeds are off by default, so this contract proves the inert state in all
// three locales and reads its labels from the same copy table the page uses.
const LOCALES = ["en", "pt-br", "es"];
const BACK = { en: "← News", "pt-br": "← Notícias", es: "← Noticias" };

test.use({ viewport: { width: 390, height: 844 } });

test("M03 every locale renders the coverage page and makes no external request", async ({ page }) => {
  test.slow();
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  for (const locale of LOCALES) {
    const copy = LIVE_NEWS_COPY[locale];
    const path = "/" + locale + "/news/coverage";
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", copy.lang);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.coverageH1);
    await expect(page.locator('[data-m03-coverage="disabled"]')).toBeVisible();
    await expect(page.locator('[data-m03-coverage="live"]')).toHaveCount(0);
    await expect(page.locator("[data-m03-coverage-item]")).toHaveCount(0);
    await expect(page.locator("[data-m03-coverage-filter]")).toHaveCount(0);
    await expect(page.locator("[data-m03-coverage-since]")).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: BACK[locale] }))
      .toHaveAttribute("href", "/" + locale + "/news");
    await expect(page.getByRole("link", { name: copy.coverageLiveLink }))
      .toHaveAttribute("href", "/" + locale + "/news/live");
    expect(await page.locator("body").innerText()).not.toContain("See all");
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, path).toEqual([]);
  }
  expect(foreign).toEqual([]);
});
