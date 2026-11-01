import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The Spanish homepage used to be a stub. This contract proves it renders the
// shared Golden Home with Spanish chrome, working client interactions and no
// external request at any viewport.
for (const viewport of [
  { name: "desktop", width: 1536, height: 864 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`Spanish homepage is translated and accessible at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const foreign = [];
    const crashes = [];
    page.on("request", (request) => {
      if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
        foreign.push(request.url());
      }
    });
    page.on("pageerror", (error) => crashes.push(error.message));
    const response = await page.goto("/es");
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator(".cb-home")).toHaveAttribute("data-locale", "es");
    await expect(page.locator("#hero-title")).toContainText("Mercado de Bitcoin,");
    await expect(page.getByRole("heading", { level: 2, name: "Últimas noticias" })).toBeVisible();
    await expect(page.locator("[data-result-count]")).toHaveText("4 ejemplos");
    await expect(page.locator(".demo-banner")).toContainText("fuentes externas conectadas");
    await expect(page.getByRole("link", { name: "Switch to English" })).toHaveAttribute("href", "/en");
    await expect(page.getByRole("link", { name: "Mudar para português" })).toHaveAttribute("href", "/pt-br");

    // Client interactions: category filter, learning search and the newsletter form.
    await page.locator('[data-category="Regulation"]').click();
    await expect(page.locator("[data-result-count]")).toHaveText("1 ejemplo");
    await expect(page.locator("[data-news-filter-summary]")).toContainText("Regulación");
    await page.locator("[data-clear-filters]").click();
    await expect(page.locator("[data-result-count]")).toHaveText("4 ejemplos");
    await page.locator("#learn [data-learning-query]").fill("frase de recuperación");
    await expect(page.locator("[data-learning-status]")).toHaveText("1 guía encontrada.");
    await expect(page.locator("#newsletter form")).toHaveAttribute("action", "/api/newsletter/subscribe");
    await expect(page.locator("#newsletter input[name=locale]")).toHaveValue("es");
    await expect(page.locator("#newsletter")).toContainText("Confirma el enlace");

    // Server-rendered and injected controls both use Spanish.
    await expect(page.locator(".official-sources__filter")).toHaveAttribute("aria-label", "Filtrar fuentes oficiales");
    await expect(page.locator("#m01-official-source-query")).toHaveAttribute("placeholder", "Nombre, tema o dominio");
    await expect(page.locator("[data-m01-local-draft-preview]")).toContainText("NO PUBLICADO");
    await expect(page.locator("#chain-lookup")).toContainText("Solo lectura");

    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations).toEqual([]);
    expect(foreign).toEqual([]);
    expect(crashes).toEqual([]);
  });
}

test("Spanish language links reach both other locales", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: "Mudar para português" }).click();
  await expect(page).toHaveURL(/\/pt-br$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await page.goto("/es");
  await page.getByRole("link", { name: "Switch to English" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
