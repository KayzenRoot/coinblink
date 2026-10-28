import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Live headlines are off by default, so this contract proves the safe default:
// the page renders, explains itself, and makes no third-party request at all.
test("M03 live headlines stay inert until a deployment enables them", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  const response = await page.goto("/demo/news/live");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Live headlines from public feeds" })).toBeVisible();
  const disabled = page.locator('[data-m03-live="disabled"]');
  await expect(disabled).toBeVisible();
  await expect(disabled).toContainText("LIVE NEWS DISABLED");
  await expect(disabled).toContainText("No request was made.");
  await expect(page.locator("[data-m03-live-item]")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "← Source lab" })).toHaveAttribute("href", "/demo/sources");
  expect(foreign).toEqual([]);
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
});

test("M03 demo index advertises the live reader without claiming it is on", async ({ page }) => {
  const response = await page.goto("/demo");
  expect(response?.status()).toBe(200);
  const link = page.locator('.labs__list a[href="/demo/news/live"]');
  await expect(link).toHaveText("Live headlines");
  await expect(page.locator(".labs__note")).toContainText("opt-in live readers");
  await expect(page.locator(".labs__note")).toContainText("by default they make no request");
});
