import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M14 public status reports measured state without content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  const response = await page.goto("/status");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1, name: "Service status" })).toBeVisible();
  await expect(page.locator("[data-m14-status-page]")).toBeVisible();
  await expect(page.locator('[data-m14-state="disabled"]')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Open the health JSON" })).toHaveAttribute("href", "/health");
  await expect(page.getByRole("link", { name: "Collection status JSON" }))
    .toHaveAttribute("href", "/v1/news/status");
  await expect(page.getByRole("link", { name: "Coverage counts JSON" }))
    .toHaveAttribute("href", "/v1/news/coverage");
  await expect(page.locator("[data-m14-feed]")).toHaveCount(0);
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  expect(foreign).toEqual([]);
});
