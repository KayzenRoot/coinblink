import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The coverage page is the shareable home of the cross-publisher groups. Live
// feeds are off by default, so this contract proves the inert state in all
// three locales: the page renders, explains itself and makes no external call.
const LOCALES = [
  { path: "/en/news/coverage", news: "/en/news", live: "/en/news/live", lang: "en",
    back: "← News", h1: "Stories covered by several publishers", liveLink: "Back to live headlines" },
  { path: "/pt-br/news/coverage", news: "/pt-br/news", live: "/pt-br/news/live", lang: "pt-BR",
    back: "← Notícias", h1: "Histórias cobertas por vários veículos", liveLink: "Voltar para as manchetes ao vivo" },
  { path: "/es/news/coverage", news: "/es/news", live: "/es/news/live", lang: "es",
    back: "← Noticias", h1: "Historias cubiertas por varios medios", liveLink: "Volver a los titulares en vivo" },
];

test("M03 coverage page stays inert in every locale until a deployment enables live news", async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 390, height: 844 });
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  for (const locale of LOCALES) {
    const response = await page.goto(locale.path);
    expect(response?.status(), locale.path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale.lang);
    await expect(page.getByRole("heading", { level: 1, name: locale.h1 })).toBeVisible();
    await expect(page.locator('[data-m03-coverage="disabled"]')).toBeVisible();
    await expect(page.locator("[data-m03-coverage-item]")).toHaveCount(0);
    await expect(page.locator('[data-m03-coverage="live"]')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: locale.back })).toHaveAttribute("href", locale.news);
    await expect(page.getByRole("link", { name: locale.liveLink })).toHaveAttribute("href", locale.live);
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations, locale.path).toEqual([]);
  }
  expect(foreign).toEqual([]);
});
