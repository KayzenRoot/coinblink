import { readFileSync } from "node:fs";
import { parseMockResearchTransfer, canonicalMockResearchTransfers } from "../src/modules/CB-M08/research-transfer.mjs";
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

test("M08 downloads an exact canonical MOCK file with no network or publish side effects", async ({ page }) => {
  const external = [], writes = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") &&
        !request.url().startsWith("data:")) external.push(request.url());
    if (!["GET","HEAD"].includes(request.method())) writes.push(request.url());
  });
  await page.goto("/demo/research");
  const button = page.locator('[data-m08-export]');
  await expect(button).toBeHidden();
  await page.locator('[data-m08-source]').selectOption('demo-source-beta');
  await page.locator('[data-m08-market]').selectOption('ETH');
  await page.locator('[data-m08-run]').click();
  await expect(button).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
  expect(download.suggestedFilename()).toBe('coinblink-m08-demo-source-beta-eth.json');
  const body = readFileSync(await download.path(), 'utf8');
  const restored = parseMockResearchTransfer(body, canonicalMockResearchTransfers());
  expect(restored).not.toBeNull();
  expect(restored.sourceId).toBe('demo-source-beta');
  expect(restored.asset).toBe('ETH');
  expect(restored.blockerCount).toBe(8);
  expect(restored.rights).toBe('NOT_CLEARED');
  expect(restored.quote).toBeNull();
  expect(restored.published).toBe(false);
  await page.locator('[data-m08-market]').selectOption('BTC');
  await expect(button).toBeHidden();
  await button.evaluate(node => { if (node instanceof HTMLButtonElement) node.click(); });
  await expect(page.locator('[data-m08-export-status]')).toContainText('No valid current offline brief');
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
});
