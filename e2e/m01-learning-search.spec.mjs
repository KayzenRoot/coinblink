import { expect, test } from "@playwright/test";

// CB-M01: no API, persistence, cookies, telemetry or published articles.
for (const [locale, label, query, clearText, emptyText] of [
  ["/en", "Search guides", "recovery phrase", "Clear guide search", "No guides match your search"],
  ["/pt-br", "Pesquisar guias", "frase de recuperação", "Limpar pesquisa de guias", "Nenhum guia corresponde"],
]) {
  test("M01 Crypto 101 search is localized, safe and keyboard-accessible: " + locale, async ({ page }) => {
    const remote = [];
    const writes = [];
    page.on("request", (req) => {
      if (new URL(req.url()).origin !== "http://127.0.0.1:4321") remote.push(req.url());
      if (!["GET", "HEAD"].includes(req.method())) writes.push(req.url());
    });
    const response = await page.goto(locale);
    expect(response?.status()).toBe(200);
    const guides = page.locator("#learn [data-learning-topic]");
    await expect(guides).toHaveCount(6);
    const search = page.getByRole("searchbox", { name: label });
    await expect(search).toBeVisible();
    await expect(guides.filter({ visible: true })).toHaveCount(6);

    await search.fill(query);
    await expect(guides.filter({ visible: true })).toHaveCount(1);
    await expect(page.locator("[data-learning-status]")).toContainText(locale === "/en" ? "1 guide found" : "1 guia encontrado");

    const clear = page.getByRole("button", { name: clearText });
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(search).toBeFocused();
    await expect(search).toHaveValue("");
    await expect(guides.filter({ visible: true })).toHaveCount(6);

    await search.fill("<img src=x onerror=alert(1)>");
    await expect(guides.filter({ visible: true })).toHaveCount(0);
    await expect(page.locator("[data-learning-status]")).toContainText(emptyText);
    await expect(page.locator("img[onerror]")).toHaveCount(0);
    await search.press("Escape");
    await expect(guides.filter({ visible: true })).toHaveCount(6);
    await expect(clear).toBeHidden();

    expect(remote).toEqual([]);
    expect(writes).toEqual([]);
  });

  test("M01 Crypto 101 guides work without JavaScript: " + locale, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:4321" + locale);
      await expect(page.locator("#learn [data-learning-topic]")).toHaveCount(6);
      await expect(page.locator("#learn [data-learning-topic]:visible")).toHaveCount(6);
      await expect(page.locator("[data-m01-learning-search]")).toBeHidden();
      const first = page.locator("#learn [data-learning-topic]").first();
      await first.locator("summary").click();
      await expect(first).toHaveAttribute("open", "");
    } finally {
      await context.close();
    }
  });
}
