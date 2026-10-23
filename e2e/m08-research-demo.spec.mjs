import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M08 research preview is local, evidence-grounded, accessible and clears stale briefs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const external = [], writes = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) external.push(request.url());
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });
  const response = await page.goto("/demo/research");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Research & evidence desk" })).toBeVisible();
  await expect(page.locator("[data-m08-report]")).toBeHidden();
  const source = page.locator("[data-m08-source]");
  const market = page.locator("[data-m08-market]");
  const generate = page.getByRole("button", { name: "Generate local review checklist" });
  await generate.click();
  await expect(page.locator("[data-m08-status]")).toContainText("No data was fetched");
  await source.selectOption("demo-source-alpha");
  await market.selectOption("BTC");
  await generate.click();
  const report = page.locator("[data-m08-report]");
  await expect(report).toBeVisible();
  await expect(report.locator("[data-m08-blockers] li")).toHaveCount(8);
  await expect(report).toContainText("DENIED_RIGHTS");
  await expect(report).toContainText("NO_LIVE_FEED");
  await expect(report).toContainText("NOT VERIFIED");
  await expect(report).toContainText("0 live quotes");
  await expect(report).not.toContainText("price prediction");
  await market.selectOption("ETH");
  await expect(report).toBeHidden();
  await expect(page.locator("[data-m08-blockers] li")).toHaveCount(0);
  await generate.click();
  await expect(report).toContainText("ETH/USD");
  await source.selectOption("");
  await expect(report).toBeHidden();
  await generate.click();
  await expect(page.locator("[data-m08-status]")).toContainText("Choose a valid fictional source");
  await page.reload();
  await expect(page.locator("[data-m08-report]")).toBeHidden();
  await expect(page.locator("[data-m08-source]")).toHaveValue("");
  await expect(page.locator("[data-m08-market]")).toHaveValue("");
  for (const width of [390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.locator(".m08-panel").boundingBox();
    expect(bounds).toBeTruthy();
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
  }
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/u);
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
});

test("M08 demo is discoverable from existing M03 and M04 journeys, never the production admin", async ({ page }) => {
  for (const location of ["/demo/sources", "/demo/markets"]) {
    await page.goto(location);
    const nav = page.getByRole("navigation", { name: "CoinBlink demo journey" });
    await nav.getByRole("link", { name: "Research lab" }).click();
    await expect(page).toHaveURL(/\/demo\/research$/u);
    await expect(page.getByText("NO AI EXECUTION", { exact: false }).first()).toBeVisible();
  }
});
