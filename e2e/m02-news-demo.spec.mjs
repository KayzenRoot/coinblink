import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const [locale, title, sample, query] of [
  ["en", "Fictional news discovery", "Fictional wallet safety workshop", "wallet"],
  ["pt-br", "Explorar notícias fictícias", "Oficina fictícia de segurança de carteiras", "carteiras"],
]) {
  test("M02 fictional news list, search, category, detail and 404 stay safe: " + locale, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const external = [];
    page.on("request", request => {
      if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) external.push(request.url());
    });
    const index = await page.goto("/" + locale + "/news");
    expect(index?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
    await expect(page.getByText(sample, { exact: true })).toBeVisible();
    await page.locator("[data-m02-search]").fill("unlikely-query-for-demo");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(0);
    await expect(page.locator("[data-m02-empty]")).toBeVisible();
    await page.locator("[data-m02-search]").fill(query);
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-search]").fill("");
    await page.locator("[data-m02-category]").selectOption("protocol");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-category]").selectOption("all");
    await page.getByRole("link", { name: /Read fictional example|Ler exemplo fictício/u }).first().click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-wallet-safety$"));
    await expect(page.getByRole("heading", { name: sample })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("body")).not.toContainText("synthetic-article-001");
    expect(external).toEqual([]);
    const missing = await page.goto("/" + locale + "/news/non-existent-demo");
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /Back to fictional stories|Voltar às histórias fictícias/u })).toBeVisible();
  });
  test("M02 listing has no serious WCAG violations: " + locale, async ({ page }) => {
    await page.goto("/" + locale + "/news");
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}
test("M01 links to the separate M02 fictitious news workbench in both locales", async ({ page }) => {
  for (const locale of ["en", "pt-br"]) {
    await page.goto("/" + locale);
    const handoff = page.locator("[data-m02-news-link] a");
    await expect(handoff).toHaveAttribute("href", "/" + locale + "/news");
  }
});
