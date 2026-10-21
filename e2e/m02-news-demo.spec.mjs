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
    await expect(page.locator("[data-m02-topic]")).toHaveCount(3);
    await page.locator('[data-m02-topic="education"]').click();
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("education");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator('[data-m02-topic="security"]').click();
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("security");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.getByRole("button", { name: locale === "pt-br" ? "Limpar filtros" : "Clear filters" }).click();
    // Browser-level verification of accent-insensitive search and accessible reset.
    await page.locator("[data-m02-search]").fill(locale === "pt-br" ? "SEGURANCA" : "SAFETY");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-category-select]").selectOption("protocol");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(0);
    await expect(page.locator("[data-m02-empty]")).toBeVisible();
    await page.getByRole("button", { name: locale === "pt-br" ? "Limpar filtros" : "Clear filters" }).click();
    await expect(page.locator("[data-m02-search]")).toHaveValue("");
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("all");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(3);
    await expect(page.locator("[data-m02-empty]")).toBeHidden();
    await expect(page.locator("[data-m02-search]")).toBeFocused();
    await page.locator("[data-m02-search]").fill("unlikely-query-for-demo");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(0);
    await expect(page.locator("[data-m02-empty]")).toBeVisible();
    await page.locator("[data-m02-search]").fill(query);
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-search]").fill("");
    await page.locator("[data-m02-category-select]").selectOption("protocol");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-category-select]").selectOption("all");
    await page.getByRole("link", { name: /Read fictional example|Ler exemplo fictício/u }).first().click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-wallet-safety$"));
    await expect(page.getByRole("heading", { name: sample })).toBeVisible();
    const journey = page.getByRole("navigation", { name: locale === "pt-br" ? "Percurso de leitura fictícia" : "Fictional reading path" });
    await expect(journey).toContainText(locale === "pt-br" ? "Exemplo 1 de 3" : "Example 1 of 3");
    await journey.getByRole("link", { name: /Próximo exemplo fictício|Next fictional example/u }).click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-protocol-classroom$"));
    await expect(page.getByRole("navigation", { name: locale === "pt-br" ? "Percurso de leitura fictícia" : "Fictional reading path" })).toContainText(locale === "pt-br" ? "Exemplo 2 de 3" : "Example 2 of 3");
    await page.getByRole("link", { name: /Exemplo fictício anterior|Previous fictional example/u }).click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-wallet-safety$"));
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
