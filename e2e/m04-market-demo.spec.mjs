import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("M04 market radar is offline, accessible and has no quotes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const outside = [];
  page.on("request", r => {
    if (!r.url().startsWith("http://127.0.0.1:4321/") && !r.url().startsWith("data:")) outside.push(r.url());
  });
  const response = await page.goto("/demo/markets");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Market & radar demonstration" })).toBeVisible();
  await expect(page.locator("[data-m04-entry]")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Radar 24h" })).toBeVisible();
  await expect(page.getByText("UNAVAILABLE · NO LIVE DATA")).toBeVisible();
  await page.locator("[data-m04-query]").fill("eth");
  await expect(page.locator("[data-m04-entry]:visible")).toHaveCount(1);
  await page.locator("[data-m04-query]").fill("not-listed");
  await expect(page.locator("[data-m04-empty]")).toBeVisible();
  await page.locator("[data-m04-query]").fill("");
  await expect(page.locator("[data-m04-entry]:visible")).toHaveCount(3);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(outside).toEqual([]);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
});
