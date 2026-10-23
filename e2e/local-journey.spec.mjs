import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const viewports = [
  { width: 1536, height: 864 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

for (const locale of ["en", "pt-br"]) {
  const pt = locale === "pt-br";
  const navigationLabel = pt ? "Jornada demonstrativa CoinBlink" : "CoinBlink demo journey";
  const newsName = pt ? "Notícias fictícias" : "Fictional news";
  const sourcesName = pt ? "Fontes demonstrativas (EN)" : "Source lab";
  const marketsName = "Market lab";
  const editorialName = "Editorial demo";

  for (const viewport of viewports) {
    test(`safe demo journey in ${locale} at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      const foreignRequests = [];
      page.on("request", r => {
        if (!r.url().startsWith("http://127.0.0.1:4321/") && !r.url().startsWith("data:")) {
          foreignRequests.push(r.url());
        }
      });
      await page.goto("/" + locale);
      let journey = page.getByRole("navigation", { name: navigationLabel });
      await expect(journey).toBeVisible();
      await expect(journey.getByRole("link", { name: pt ? "Início" : "Home" })).toHaveAttribute("aria-current", "page");
      await journey.getByRole("link", { name: newsName }).click();
      await expect(page).toHaveURL(new RegExp("/" + locale + "/news$"));
      journey = page.getByRole("navigation", { name: navigationLabel });
      await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
      await expect(journey).toContainText(pt ? "Preços indisponíveis" : "No market quotes");
      await journey.getByRole("link", { name: sourcesName }).click();
      await expect(page).toHaveURL(/\/demo\/sources$/);
      journey = page.getByRole("navigation", { name: "CoinBlink demo journey" });
      await expect(page.locator("[data-m03-entry]")).toHaveCount(3);
      await expect(journey.getByRole("link", { name: "Source lab" })).toHaveAttribute("aria-current", "page");
      await journey.getByRole("link", { name: marketsName }).click();
      await expect(page).toHaveURL(/\/demo\/markets$/);
      journey = page.getByRole("navigation", { name: "CoinBlink demo journey" });
      await expect(page.locator("[data-m04-entry]")).toHaveCount(3);
      await expect(page.getByText("UNAVAILABLE · NO LIVE DATA")).toBeVisible();
      await journey.getByRole("link", { name: editorialName }).click();
      await expect(page).toHaveURL(/\/demo\/editorial\/articles$/);
      await expect(page.locator(".m05-safety")).toContainText("MOCK / SECURITY DISABLED");
      await expect(page.locator("a.m05-brand")).toHaveAttribute("href", "/en");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      expect(foreignRequests).toEqual([]);
    });
  }
  test(`news journey is keyboard reachable and accessible in ${locale}`, async ({ page }) => {
    await page.goto("/" + locale + "/news");
    const journey = page.getByRole("navigation", { name: navigationLabel });
    await expect(journey.getByRole("link", { name: newsName })).toHaveAttribute("aria-current", "page");
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    expect(scan.violations).toEqual([]);
  });
}
test("real Owner /admin remains blocked after local demo integration", async ({ page }) => {
  for (const route of ["/admin", "/admin/login", "/admin/articles"]) {
    const result = await page.goto(route);
    expect(result?.status()).toBeGreaterThanOrEqual(400);
  }
});
