import { prepareLocalDraft, draftToMarkdown } from "../src/modules/CB-M05/local-draft-markdown.mjs";
import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { startLocalCmsPreview } from "../test/modules/CB-M05/p1c-local-preview.mjs";

test("M05 saved Owner D1 revision exports locally and is manually imported by the M02 browser preview", async ({ page }) => {
  const cms = await startLocalCmsPreview({ headless: true, admin: true });
  const external = [];
  const writes = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4321/")) external.push(request.url());
    if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
  });

  try {
    const ownerPage = cms.page;
    await ownerPage.locator("#login").click();
    await ownerPage.getByText("Local test session active").waitFor({ timeout: 20_000 });
    await ownerPage.locator('[name="title"]').fill("Persisted synthetic editorial bridge");
    await ownerPage.locator('[name="summary"]').fill("A local-only saved summary with no factual or rights clearance.");
    const savedBody = "This synthetic article is stored in local D1 and is only used to verify a manual editorial preview handoff.";
    await ownerPage.locator('[name="body"]').fill(savedBody);
    await ownerPage.locator('[name="sourceUrl"]').fill("https://example.test/synthetic-source");
    await ownerPage.locator('[name="authorLabel"]').fill("Synthetic Owner");
    await ownerPage.locator("#save").click();
    await ownerPage.getByText("Saved LOCAL draft revision 1; not published").waitFor({ timeout: 20_000 });

    const saved = await cms.db.prepare(
      "SELECT id,revision,status,body FROM cms_drafts WHERE owner_id=1 LIMIT 1"
    ).first();
    expect(saved).toMatchObject({ revision: 1, status: "draft", body: savedBody });
    const exportButton = ownerPage.getByRole("button", { name: "Export saved revision to Markdown for M02" });
    await expect(exportButton).toBeEnabled();
    await ownerPage.locator('[name="body"]').fill(savedBody + " Unsaved edit.");
    await expect(exportButton).toBeDisabled();
    await expect(ownerPage.locator("#unsaved-draft-status")).toBeVisible();
    await ownerPage.locator('[name="body"]').fill(savedBody);
    await expect(exportButton).toBeEnabled();

    ownerPage.once("dialog", dialog => dialog.accept());
    const [download] = await Promise.all([
      ownerPage.waitForEvent("download"),
      exportButton.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^[a-z0-9-]+\.md$/u);
    const markdown = await readFile(await download.path(), "utf8");
    expect(Buffer.byteLength(markdown, "utf8")).toBeLessThanOrEqual(64_000);
    expect(markdown).not.toMatch(/session|csrf|credential|token|privateKey/iu);
    await expect(ownerPage.locator("#export-status")).toContainText("Facts and rights remain unverified");
    expect(await cms.db.prepare("SELECT revision,body FROM cms_drafts WHERE id=?").bind(saved.id).first())
      .toEqual({ revision: 1, body: savedBody });

    await page.goto("/en/news");
    const root = page.locator("[data-m02-local-preview]");
    const input = root.locator("[data-m02-draft-file]");
    const article = root.locator("[data-m02-draft-article]");
    await input.setInputFiles({
      name: download.suggestedFilename(),
      mimeType: "text/markdown",
      buffer: Buffer.from(markdown, "utf8"),
    });
    await expect(article).toBeVisible();
    await expect(article.locator("[data-m02-draft-title]")).toHaveText("Persisted synthetic editorial bridge");
    await expect(article.locator("[data-m02-draft-summary]")).toHaveText("A local-only saved summary with no factual or rights clearance.");
    await expect(article.locator("[data-m02-draft-body]")).toHaveText(savedBody);
    await expect(article.locator("[data-m02-draft-author]")).toHaveText("Synthetic Owner");
    await expect(article.locator("[data-m02-draft-source]")).toHaveText("https://example.test/synthetic-source");
    await expect(root.locator("[data-m02-draft-status]")).toHaveText("LOCAL PREVIEW · UNVERIFIED · NOT PUBLISHED");
    await expect(article.locator("img, iframe, script")).toHaveCount(0);
    expect(external).toEqual([]);
    expect(writes).toEqual([]);

    await ownerPage.locator("#logout").click();
    await ownerPage.getByText("Not authenticated", { exact: true }).waitFor({ timeout: 20_000 });
    await expect(ownerPage.locator("#export-draft")).toBeHidden();
    expect(await ownerPage.evaluate(async id => (await fetch('/admin/articles/' + id + '/export?revision=1')).status, saved.id))
      .toBe(401);
    expect(await cms.db.prepare("SELECT revision,body FROM cms_drafts WHERE id=?").bind(saved.id).first())
      .toEqual({ revision: 1, body: savedBody });
  } finally {
    await cms.close();
  }
});
for (const [locale, title, sample, query] of [
  ["en", "Fictional news discovery", "Fictional wallet safety workshop", "wallet"],
  ["pt-br", "Explorar notícias fictícias", "Oficina fictícia de segurança de carteiras", "carteiras"],
]) {
  test("M02 category route is shareable and narrowed on the server: " + locale, async ({ page }) => {
    const response = await page.goto("/" + locale + "/news/category/security");
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator("[data-m02-entry]")).toHaveCount(3);
    await expect(page.locator("[data-m02-entry]:visible")).toHaveCount(1);
    await expect(page.locator("[data-m02-category-select]")).toHaveValue("security");
    await expect(page.locator("[data-m02-result-count]")).toContainText("1");
    const empty = await page.goto("/" + locale + "/news/category/unknown-category");
    expect(empty?.status()).toBe(404);
  });
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


for (const locale of ["en", "pt-br"]) {
  test("M02 source evidence review stays local and rejects malformed import: " + locale, async ({ page }) => {
    const { addLocalSource } = await import("../src/modules/CB-M05/local-source-notes.mjs");
    await page.setViewportSize({ width: 390, height: 844 });
    const remote = [], writes = [];
    page.on("request", request => {
      if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) remote.push(request.url());
      if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
    });
    await page.goto("/" + locale + "/news");
    const root = page.locator("[data-m02-local-preview]");
    const input = root.locator("[data-m02-draft-file]");
    const panel = root.locator("[data-m02-evidence-review]");
    await expect(panel).toBeHidden();
    const body = addLocalSource(
      "TODO verify the fictional 42% report. [^cb9] These numbers are only local editorial claims.",
      "Uncited example", "https://example.test/uncited",
    ).value;
    const draft = prepareLocalDraft({
      title: "Fictional evidence review", author: "Synthetic editor",
      summary: "This story is a private fixture for source-integrity review.",
      body, source: "https://example.test/original",
    });
    await input.setInputFiles({ name: "fixture.md", mimeType: "text/markdown", buffer: Buffer.from(draftToMarkdown(draft)) });
    await expect(panel).toBeVisible();
    await expect(root.locator("[data-m02-evidence-summary]")).toContainText("3");
    await expect(root.locator("[data-m02-evidence-signals] li")).toHaveCount(3);
    const actions = root.locator("[data-m02-evidence-actions]");
    await expect(actions.locator("li")).toHaveCount(3);
    await expect(actions).toContainText(locale === "pt-br" ? "Defina a fonte" : "Define the source");
    await expect(panel).toContainText("[^cb9]");
    await expect(panel).toContainText("[^cb1]");
    await expect(panel).toContainText(locale === "pt-br" ? "NÃO VERIFICA" : "DOES NOT VERIFY");
    await expect(panel.locator("a,img,iframe,script")).toHaveCount(0);
    await input.setInputFiles({ name: "invalid.md", mimeType: "text/markdown", buffer: Buffer.from("# invalid") });
    await expect(panel).toBeHidden();
    await expect(root.locator("[data-m02-evidence-signals] li")).toHaveCount(0);
    await expect(actions.locator("li")).toHaveCount(0);
    const clean = prepareLocalDraft({
      title: "Another fictional story", author: "Synthetic editor",
      summary: "A fictional clean looking article with no cited sources.",
      body: "A fictional body longer than forty characters without any citation notes.",
      source: "https://example.test/clean",
    });
    await input.setInputFiles({ name: "clean.md", mimeType: "text/markdown", buffer: Buffer.from(draftToMarkdown(clean)) });
    await expect(panel).toBeVisible();
    await expect(root.locator("[data-m02-evidence-summary]")).toContainText("0");
    await expect(panel).toContainText(locale === "pt-br" ? "Não é verificação" : "Not verification");
    await expect(actions.locator("li")).toHaveCount(1);
    await expect(actions).toContainText(locale === "pt-br" ? "Verifique fatos" : "Check facts");
    await root.locator("[data-m02-draft-clear]").click();
    await expect(panel).toBeHidden();
    await expect(actions.locator("li")).toHaveCount(0);
    await page.reload();
    await expect(page.locator("[data-m02-evidence-review]")).toBeHidden();
    const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(scan.violations).toEqual([]);
    expect(remote).toEqual([]);
    expect(writes).toEqual([]);
  });
}

test('M02 P1 private article preview keeps existing M02 manual import separate', async ({ page }) => {
  const cms = await startLocalCmsPreview({ headless: true, admin: true });
  try {
    const owner = cms.page;
    await owner.locator('#login').click();
    await owner.getByText('Local test session active').waitFor({ timeout: 20_000 });
    await owner.locator('[name="title"]').fill('Owner-only article presentation');
    await owner.locator('[name="summary"]').fill('An original fictitious article held only in the local Owner lab.');
    await owner.locator('[name="body"]').fill('This synthetic editorial body remains private and has no licensed publication rights.');
    await owner.locator('[name="sourceUrl"]').fill('https://example.test/rights-pending');
    await owner.locator('[name="authorLabel"]').fill('Local author');
    await owner.locator('#save').click();
    await owner.getByText('Saved LOCAL draft revision 1; not published').waitFor({ timeout: 20_000 });
    await owner.locator('#m02-owner-article-trigger').click();
    const privateView = owner.locator('#m02-owner-article');
    await expect(privateView).toBeVisible();
    await expect(privateView.locator('#m02-owner-title')).toHaveText('Owner-only article presentation');
    await expect(privateView).toContainText('NOT PUBLISHED');
    await page.goto('/en/news');
    await expect(page.locator('[data-m02-local-preview]')).toBeVisible();
    await expect(page.locator('[data-m02-draft-article]')).toBeHidden();
    await expect(page.getByText('Owner-only article presentation')).toHaveCount(0);
    const audit = await new AxeBuilder({ page: owner }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    await owner.locator('#logout').click();
    await owner.getByText('Not authenticated', { exact: true }).waitFor();
    await expect(privateView).toBeHidden();
    expect(await privateView.locator('#m02-owner-body').textContent()).toBe('');
    expect(cms.networkAttempts.filter(q => !q.allowed)).toEqual([]);
  } finally {
    await cms.close();
  }
});
