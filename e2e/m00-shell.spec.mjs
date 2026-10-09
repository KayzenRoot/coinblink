import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const viewports = [
  { name: "desktop-1536x864", width: 1536, height: 864 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];
const evidenceSha = (process.env.EXPECTED_SHA || "local").slice(0, 12);
const screenshotDirectory = join(process.cwd(), "artifacts", "playwright", evidenceSha);

test.describe("CoinBlink M00 local shell", () => {
  for (const viewport of viewports) {
    test(`renders accessibly at ${viewport.name}`, async ({ page }) => {
      const browserErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const response = await page.goto("/en");
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/CoinBlink/);
      await expect(page.getByRole("heading", { level: 1, name: "Crypto news in a blink." })).toBeVisible();
      await expect(page.getByText("DEMO · NO LIVE DATA")).toBeVisible();
      await expect(page.getByText("Not connected · no values are shown")).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasHorizontalOverflow).toBe(false);

      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);

      mkdirSync(screenshotDirectory, { recursive: true });
      await page.screenshot({
        path: join(screenshotDirectory, `${viewport.name}.png`),
        fullPage: false,
        animations: "disabled",
      });

      await page.keyboard.press("Tab");
      const skipLink = page.getByRole("link", { name: "Skip to content" });
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toHaveCSS("outline-style", "solid");
      expect(browserErrors).toEqual([]);
    });
  }

  test("health and preview status expose only sanitized development metadata", async ({ request }) => {
    const healthResponse = await request.get("/health");
    expect(healthResponse.status()).toBe(200);
    expect(healthResponse.headers()["cache-control"]).toBe("no-store");
    const health = await healthResponse.json();
    expect(health).toMatchObject({
      status: "ok",
      service: "coinblink",
      environment: process.env.PUBLIC_BUILD_ENV || "local",
    });
    expect(health.buildSha).toBe(process.env.EXPECTED_SHA || "local");
    expect(Object.keys(health).sort()).toEqual(["buildSha", "environment", "service", "status"]);

    const statusResponse = await request.get("/preview-status");
    expect(statusResponse.status()).toBe(200);
    expect(statusResponse.headers()["cache-control"]).toBe("no-store");
    const previewStatus = await statusResponse.json();
    expect(previewStatus).toEqual({
      status: "demo",
      dataMode: "demonstration-only",
      editorialFeed: "not-connected",
      marketData: "not-connected",
      cloudflarePreview: "not-deployed",
      buildSha: process.env.EXPECTED_SHA || "local",
      environment: process.env.PUBLIC_BUILD_ENV || "local",
    });
    expect(JSON.stringify(previewStatus)).not.toMatch(/secret|password|api.?key/i);
  });

  test("unknown routes return an honest accessible 404", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to home" })).toHaveAttribute("href", "/en");
  });

  test("all application routes include the security response headers", async ({ request }) => {
    for (const path of ["/en", "/health", "/preview-status", "/missing-route"]) {
      const response = await request.get(path);
      const headers = response.headers();
      expect(headers["content-security-policy"]).toContain("default-src 'self'");
      expect(headers["permissions-policy"]).toBe("camera=(), geolocation=(), microphone=()");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
    }
  });
});
