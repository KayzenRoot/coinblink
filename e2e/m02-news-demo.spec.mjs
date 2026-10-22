import { prepareLocalDraft, draftToMarkdown } from "../public/m05-draft-preview.js";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const [locale, title, sample, query] of [
  ["en", "Fictional news discovery", "Fictional wallet safety workshop", "wallet"],
  ["pt-br", "Explorar notícias fictícias", "Oficina fictícia de segurança de carteiras", "carteiras"],
]) {
  test("M02 fictional news list, search, category, detail and 404 stay safe: " + locale, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const external = [];
    page.on("request", request => {
      if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) external.push(request.url());
    });
    const index = await page.goto("/" + locale + "/news");
    expect(index?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
    await expect(page.getByText(sample, { exact: true })).toBeVisible();
    await expect(page.locator("[data-m02-topic]")).toHaveCount(3);
    await page.locator('[data-m02-topic="education"]').click();
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("education");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator('[data-m02-topic="security"]').click();
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("security");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.getByRole("button", { name: locale === "pt-br" ? "Limpar filtros" : "Clear filters" }).click();
    // Browser-level verification of accent-insensitive search and accessible reset.
    await page.locator("[data-m02-search]").fill(locale === "pt-br" ? "SEGURANCA" : "SAFETY");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-category-select]").selectOption("protocol");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(0);
    await expect(page.locator("[data-m02-empty]")).toBeVisible();
    await page.getByRole("button", { name: locale === "pt-br" ? "Limpar filtros" : "Clear filters" }).click();
    await expect(page.locator("[data-m02-search]")).toHaveValue("");
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("all");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(3);
    await expect(page.locator("[data-m02-empty]")).toBeHidden();
    await expect(page.locator("[data-m02-search]")).toBeFocused();
    await page.locator("[data-m02-search]").fill("unlikely-query-for-demo");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(0);
    await expect(page.locator("[data-m02-empty]")).toBeVisible();
    await page.locator("[data-m02-search]").fill(query);
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-search]").fill("");
    await page.locator("[data-m02-category-select]").selectOption("protocol");
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await page.locator("[data-m02-category-select]").selectOption("all");
    await page.getByRole("link", { name: /Read fictional example|Ler exemplo fictício/u }).first().click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-wallet-safety$"));
    await expect(page.getByRole("heading", { name: sample })).toBeVisible();
    const journey = page.getByRole("navigation", { name: locale === "pt-br" ? "Percurso de leitura fictícia" : "Fictional reading path" });
    await expect(journey).toContainText(locale === "pt-br" ? "Exemplo 1 de 3" : "Example 1 of 3");
    await journey.getByRole("link", { name: /Próximo exemplo fictício|Next fictional example/u }).click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-protocol-classroom$"));
    await expect(page.getByRole("navigation", { name: locale === "pt-br" ? "Percurso de leitura fictícia" : "Fictional reading path" })).toContainText(locale === "pt-br" ? "Exemplo 2 de 3" : "Example 2 of 3");
    await page.getByRole("link", { name: /Exemplo fictício anterior|Previous fictional example/u }).click();
    await expect(page).toHaveURL(new RegExp("/" + locale + "/news/demo-wallet-safety$"));
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("body")).not.toContainText("synthetic-article-001");
    expect(external).toEqual([]);
    const missing = await page.goto("/" + locale + "/news/non-existent-demo");
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /Back to fictional stories|Voltar às histórias fictícias/u })).toBeVisible();
  });
  test("M02 listing has no serious WCAG violations: " + locale, async ({ page }) => {
    await page.goto("/" + locale + "/news");
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}
test("M01 links to the separate M02 fictitious news workbench in both locales", async ({ page }) => {
  for (const locale of ["en", "pt-br"]) {
    await page.goto("/" + locale);
    const handoff = page.locator("[data-m02-news-link] a");
    await expect(handoff).toHaveAttribute("href", "/" + locale + "/news");
  }
});

for (const locale of ["en", "pt-br"]) {
  test("M02 private M05 article preview rejects forged HTML and keeps data in tab: " + locale, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const external = [], writes = [];
    page.on("request", request => {
      if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) external.push(request.url());
      if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
    });
    await page.goto("/" + locale + "/news");
    const root = page.locator("[data-m02-local-preview]");
    const input = root.locator("[data-m02-draft-file]");
    const article = root.locator("[data-m02-draft-article]");
    await expect(article).toBeHidden();
    const original = prepareLocalDraft({
      title: "Private article <img src=x onerror=alert(1)>", author: "Fictional author",
      summary: "A sample summary that exists only inside the local browser.",
      body: "A purely fictional article with <script>alert(1)</script> and no publication or network transfer.",
      source: "https://example.test/fixture",
    });
    const raw = draftToMarkdown(original);
    await input.setInputFiles({ name: "safe.md", mimeType: "text/markdown", buffer: Buffer.from(raw) });
    await expect(article).toBeVisible();
    await expect(article.locator("[data-m02-draft-title]")).toHaveText(original.title);
    await expect(article.locator("[data-m02-draft-body]")).toContainText("<script>alert(1)</script>");
    await expect(article.locator("img,iframe,script")).toHaveCount(0);
    await expect(article.locator("[data-m02-draft-title]")).toBeFocused();
    await expect(root).toContainText(locale === "pt-br" ? "NÃO PUBLICADO" : "NOT PUBLISHED");
    await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
    await input.setInputFiles({ name: "bad.md", mimeType: "text/markdown", buffer: Buffer.from("# invalid") });
    await expect(article).toBeHidden();
    await expect(root.locator("[data-m02-draft-status]")).toContainText(locale === "pt-br" ? "Arquivo inválido" : "Invalid file");
    await input.setInputFiles({ name: "large.md", mimeType: "text/markdown", buffer: Buffer.alloc(64001, 120) });
    await expect(article).toBeHidden();
    await input.setInputFiles({ name: "safe.md", mimeType: "text/markdown", buffer: Buffer.from(raw) });
    await expect(article).toBeVisible();
    await root.locator("[data-m02-draft-clear]").click();
    await expect(article).toBeHidden();
    await expect(input).toBeFocused();
    await page.reload();
    await expect(page.locator("[data-m02-draft-article]")).toBeHidden();
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    expect(audit.violations).toEqual([]);
    expect(external).toEqual([]);
    expect(writes).toEqual([]);
  });
}


for (const locale of ["en", "pt-br"]) {
  test("M02 local export revision comparison safely identifies changed fields: " + locale, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const foreign = [], writes = [];
    page.on("request", request => {
      if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) foreign.push(request.url());
      if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
    });
    await page.goto("/" + locale + "/news");
    const root = page.locator("[data-m02-revision-compare]");
    const before = root.locator("[data-m02-compare-before]");
    const after = root.locator("[data-m02-compare-after]");
    const result = root.locator("[data-m02-compare-result]");
    await expect(result).toBeHidden();
    const original = prepareLocalDraft({
      title: "Fictional version one", author: "Sample reporter",
      summary: "This is a fictional local article for comparison tests.",
      body: "The earlier fictional text contains no real assertions or publishing permission.",
      source: "https://example.test/first",
    });
    const revised = prepareLocalDraft({
      title: "Fictional version two <img src=x onerror=alert(1)>", author: "Sample reporter",
      summary: "This is a fictional local article for comparison tests.",
      body: "The later fictional article contains <script>alert(1)</script> as inert text, never HTML.",
      source: "https://example.test/first",
    });
    const oldMarkdown = draftToMarkdown(original);
    const newMarkdown = draftToMarkdown(revised);
    await before.setInputFiles({ name: "earlier.md", mimeType: "text/markdown", buffer: Buffer.from(oldMarkdown) });
    await expect(result).toBeHidden();
    await after.setInputFiles({ name: "later.md", mimeType: "text/markdown", buffer: Buffer.from(newMarkdown) });
    await expect(result).toBeVisible();
    await expect(root.locator("[data-m02-compare-changes] li")).toHaveCount(2);
    await expect(root.locator("[data-m02-compare-count]")).toContainText("2");
    await expect(result).toContainText("<img src=x onerror=alert(1)>");
    await expect(result).toContainText("<script>alert(1)</script>");
    await expect(result.locator("img,script,iframe")).toHaveCount(0);
    await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
    await after.setInputFiles({ name: "invalid.md", mimeType: "text/markdown", buffer: Buffer.from("# invalid") });
    await expect(result).toBeHidden();
    await expect(root.locator("[data-m02-compare-status]")).toContainText(locale === "pt-br" ? "inválida" : "Invalid");
    await after.setInputFiles({ name: "oversize.md", mimeType: "text/markdown", buffer: Buffer.alloc(64001, 120) });
    await expect(result).toBeHidden();
    await after.setInputFiles({ name: "later.md", mimeType: "text/markdown", buffer: Buffer.from(oldMarkdown) });
    await expect(result).toBeVisible();
    await expect(root.locator("[data-m02-compare-changes] li")).toHaveCount(0);
    await expect(root.locator("[data-m02-compare-count]")).toContainText(locale === "pt-br" ? "Nenhuma diferença" : "No differences");
    await root.locator("[data-m02-compare-clear]").click();
    await expect(result).toBeHidden();
    await expect(before).toBeFocused();
    await page.reload();
    await expect(page.locator("[data-m02-compare-result]")).toBeHidden();
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations).toEqual([]);
    expect(foreign).toEqual([]);
    expect(writes).toEqual([]);
  });
}
