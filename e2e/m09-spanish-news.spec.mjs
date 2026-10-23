import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M09 Spanish news supports safe search, detail, three-language switching and axe", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const foreign = [], writes = [];
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:4321/") && !req.url().startsWith("data:")) foreign.push(req.url());
    if (!["GET", "HEAD"].includes(req.method())) writes.push(req.url());
  });
  const result = await page.goto("/es/news");
  expect(result?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { name: "Explorar noticias ficticias" })).toBeVisible();
  await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
  await expect(page.getByText("SOLO DEMOSTRACIÓN", { exact: false }).first()).toBeVisible();
  const choices = page.locator("[data-m09-language-nav]");
  await expect(choices.getByRole("link", { name: "Español" })).toHaveAttribute("aria-current", "page");
  await expect(choices.getByRole("link", { name: "English" })).toHaveAttribute("href", "/en/news");
  await page.locator("[data-m02-search]").fill("BILLETERAS");
  await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
  await page.locator("[data-m02-search]").fill("PROTOCOLOS");
  await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
  await page.getByRole("button", { name: "Borrar filtros" }).click();
  await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(3);
  await page.getByRole("link", { name: /Leer ejemplo ficticio/u }).first().click();
  await expect(page).toHaveURL(/\/es\/news\/demo-wallet-safety$/u);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("heading", { name: "Taller ficticio sobre seguridad de billeteras" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Ruta de lectura ficticia" })).toBeVisible();
  await expect(page.locator("[data-m09-language-nav]").getByRole("link", { name: "Português (Brasil)" }))
    .toHaveAttribute("href", "/pt-br/news/demo-wallet-safety");
  await page.locator("[data-m09-language-nav]").getByRole("link", { name: "Português (Brasil)" }).click();
  await expect(page).toHaveURL(/\/pt-br\/news\/demo-wallet-safety$/u);
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await expect(page.locator("[data-m09-language-nav]").getByRole("link", { name: "Español" }))
    .toHaveAttribute("href", "/es/news/demo-wallet-safety");
  await page.locator("[data-m09-language-nav]").getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es\/news\/demo-wallet-safety$/u);
  const missing = await page.goto("/es/news/not-found-example");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Ejemplo ficticio no encontrado" })).toBeVisible();
  await expect(page.locator("[data-m09-language-nav]").getByRole("link", { name: "English" }))
    .toHaveAttribute("href", "/en/news");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/u);
  await page.goto("/es/news");
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  expect(foreign).toEqual([]);
  expect(writes).toEqual([]);
});

test("M09 language navigation stays visible in EN and PT without exposing the CMS", async ({ page }) => {
  for (const locale of ["en", "pt-br"]) {
    await page.goto("/" + locale + "/news");
    const name = locale === "en" ? "Demo language" : "Idioma desta demonstração";
    const languages = page.getByRole("navigation", { name });
    await expect(languages.getByRole("link", { name: "Español" })).toHaveAttribute("href", "/es/news");
    await expect(languages.getByRole("link", { name: locale === "en" ? "English" : "Português (Brasil)" }))
      .toHaveAttribute("aria-current", "page");
  }
});
