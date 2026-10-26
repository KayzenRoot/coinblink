import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { listSyntheticSources } from "../src/modules/CB-M03/source-lab.mjs";
import { parseMockSourceTransfer } from "../src/modules/CB-M03/source-transfer.mjs";
test("M03 synthetic sources are accessible, filter locally and never ingest", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const network = [];
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:4321/") && !req.url().startsWith("data:")) network.push(req.url());
  });
  const r = await page.goto("/demo/sources");
  expect(r?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Sources & provenance lab" })).toBeVisible();
  await expect(page.locator("[data-m03-entry]")).toHaveCount(3);
  await expect(page.getByText("No capture occurred.", { exact: false }).first()).toBeVisible();
  const outcome = page.getByRole("combobox", { name: "Inspection outcome" });
  await outcome.selectOption("DENIED_RIGHTS");
  await expect(page.locator("[data-m03-entry]:visible")).toHaveCount(2);
  await page.locator("[data-m03-query]").fill("unavailable");
  await expect(page.locator("[data-m03-entry]:visible")).toHaveCount(0);
  await expect(page.locator("[data-m03-empty]")).toBeVisible();
  await outcome.selectOption("UNAVAILABLE");
  await expect(page.locator("[data-m03-entry]:visible")).toHaveCount(1);
  await expect(page.locator("[data-m03-empty]")).toBeHidden();
  await page.locator("[data-m03-query]").fill("no-match-111");
  await expect(page.locator("[data-m03-empty]")).toBeVisible();
  await page.locator("[data-m03-query]").fill("");
  await expect(page.locator("[data-m03-entry]:visible")).toHaveCount(1);
  await outcome.selectOption("all");
  await expect(page.locator("[data-m03-entry]:visible")).toHaveCount(3);
  await expect(page.locator("[data-m03-count]")).toContainText("3 synthetic source examples");
  await expect(page.getByRole("heading", { name: "Source evidence readiness · DEMO" })).toBeVisible();
  await expect(page.locator(".m03-evidence-summary")).toContainText("0 approved for public use");
  const firstReport = page.locator("[data-m03-entry]").first().locator(".m03-report");
  await firstReport.locator("summary").click();
  await expect(firstReport).toHaveAttribute("open", "");
  await expect(firstReport).toContainText("NOT_CAPTURED");
  await expect(firstReport).toContainText("NO_DIGEST");
  await expect(firstReport).toContainText("Reuse remains BLOCKED");
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(page.locator("[data-m03-comparison]")).toContainText("Select two different fictional sources");
  await page.locator("[data-m03-left]").selectOption("demo-source-alpha");
  await page.locator("[data-m03-right]").selectOption("demo-source-alpha");
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(page.locator("[data-m03-comparison]")).toContainText("No evidence was retrieved");
  await page.locator("[data-m03-right]").selectOption("demo-source-gamma");
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(page.locator("[data-m03-comparison]")).toContainText("DENIED_RIGHTS");
  await expect(page.locator("[data-m03-comparison]")).toContainText("UNAVAILABLE");
  await expect(page.locator("[data-m03-comparison]")).toContainText("BOTH BLOCKED · NO INGESTION · NO PUBLICATION");
  const details = page.locator("[data-m03-compare-details]");
  await expect(details).toBeVisible();
  await expect(details).toContainText("Matching fictional checks: URL: SYNTHETIC_ONLY, RIGHTS: NOT_CLEARED, CAPTURE: NOT_CAPTURED, DIGEST: NO_DIGEST");
  await expect(details).toContainText("Different fictional checks: none");
  await expect(details).toContainText("Inspection outcomes: different (DENIED_RIGHTS / UNAVAILABLE)");
  await expect(details).toContainText("Neither record proves rights");
  await page.locator("[data-m03-right]").selectOption("demo-source-beta");
  await expect(details).toBeHidden();
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(details).toContainText("License labels: different (NOT_CLEARED / UNKNOWN)");
  await page.locator("[data-m03-right]").selectOption("demo-source-alpha");
  await expect(details).toBeHidden();
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(details).toBeHidden();
  // CB-P0-FILTER-COMPARISON-VISIBILITY-001: filtered-out rows must not retain claims.
  await page.locator("[data-m03-right]").selectOption("demo-source-gamma");
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(details).toBeVisible();
  await outcome.selectOption("DENIED_RIGHTS");
  await expect(details).toBeHidden();
  await expect(details).toHaveText("");
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(details).toBeHidden();
  await expect(page.locator("[data-m03-comparison]")).toContainText("visible under current filters");
  await outcome.selectOption("all");
  await page.getByRole("button", { name: "Compare evidence gaps" }).click();
  await expect(details).toBeVisible();
  for (const width of [390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.locator(".m03-comparison").boundingBox();
    expect(bounds).toBeTruthy();
    expect(bounds.x).toBeGreaterThanOrEqual(-1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
  }

  await expect(page.locator("[data-m03-empty]")).toBeHidden();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  expect(network).toEqual([]);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(audit.violations).toEqual([]);
});

test("M03 browser exports only a fictional unlicensed source report without network calls", async ({ page }) => {
  const outside = [], writes = [];
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:4321/") && !req.url().startsWith("data:")) outside.push(req.url());
    if (!["GET", "HEAD"].includes(req.method())) writes.push(req.url());
  });
  await page.goto("/demo/sources");
  const first = page.locator('[data-m03-entry][data-m03-id="demo-source-alpha"]');
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    first.locator('[data-m03-export]').click(),
  ]);
  expect(download.suggestedFilename()).toBe("coinblink-m03-demo-source-alpha.json");
  const payload = readFileSync(await download.path(), "utf8");
  const verified = parseMockSourceTransfer(payload, listSyntheticSources().items);
  expect(verified?.id).toBe("demo-source-alpha");
  expect(verified?.rights).toBe("NOT_CLEARED");
  await expect(page.locator("[data-m03-export-status]")).toContainText("NOT_CLEARED");
  expect(outside).toEqual([]);
  expect(writes).toEqual([]);
});
