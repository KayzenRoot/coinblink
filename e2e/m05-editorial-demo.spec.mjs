import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicDemoRoutes = [
  ["/demo/editorial", "Article workspace"],
  ["/demo/editorial/articles", "Article workspace"],
  ["/demo/editorial/articles/new", "Draft creation preview"],
  ["/demo/editorial/settings", "Settings overview"],
  ["/demo/editorial/settings/integrations", "Integration catalog"],
];

test.describe("M05 public static editorial demonstration", () => {
  for (const [path, heading] of publicDemoRoutes) {
    test(`renders ${path} as a safe nonprivileged mock`, async ({ page }) => {
      const errors = [];
      const externalRequests = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== "http://127.0.0.1:4321") {
          externalRequests.push(request.url());
        }
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/CoinBlink.*MOCK/);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByText("MOCK / SECURITY DISABLED", { exact: true })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow, noarchive");
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.locator('nav[aria-label="Security mock previews"]')).toHaveCount(0);
      await expect(page.locator("form, input, textarea")).toHaveCount(0);
      const buttons = page.locator(".m05-workspace button");
      for (const button of await buttons.all()) {
        await expect(button).toBeDisabled();
      }
      const navigation = await page.locator('nav[aria-label="Workspace"] a').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      expect(navigation.length).toBe(3);
      expect(navigation.every((href) => href?.startsWith("/demo/editorial/"))).toBe(true);
      expect(await page.evaluate(() => document.cookie)).toBe("");
      expect(errors).toEqual([]);
      expect(externalRequests).toEqual([]);
      expect(response?.headers()["content-security-policy"]).toContain("script-src 'self'");
      expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    });
  }

  test("public mock routes never expose auth, recovery or real admin endpoints", async ({ request }) => {
    for (const path of [
      "/demo/editorial/login",
      "/demo/editorial/setup",
      "/demo/editorial/recovery",
      "/admin",
      "/admin/articles",
      "/admin/login",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
      expect(response.headers()["set-cookie"], path).toBeUndefined();
    }
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`articles are keyboard-accessible at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/demo/editorial/articles");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
      await expect(page.locator('a[href="/demo/editorial/articles/new"]')).toBeVisible();
    });
  }
});
