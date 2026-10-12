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
const buildEnvironment = process.env.PUBLIC_BUILD_ENV?.trim() || "local";
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
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow, noarchive");
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.locator(".demo-banner")).toContainText("no live prices, headlines, or external feeds");
      await expect(page.locator("#hero-title")).toContainText("Bitcoin market,");
      await expect(page.locator("#market-overview")).toContainText("Market data feed is not connected.");
      await expect(page.locator("#latest-news [data-news-card]")).toHaveCount(4);
      await expect(page.locator("#newsletter")).toContainText("will not send or store your email");

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


  test("demo categories, search and newsletter interaction are safe and functional", async ({ page }) => {
    await page.goto("/en");
    const cards = page.locator("[data-news-card]");
    await expect(cards).toHaveCount(4);
    await page.locator('[data-category="Bitcoin"]').click();
    await expect(cards.filter({ visible: true })).toHaveCount(1);
    await page.locator('[data-category="All"]').click();
    await expect(cards.filter({ visible: true })).toHaveCount(4);
    await page.locator("[data-news-search]").fill("unmatched-keyword");
    await expect(cards.filter({ visible: true })).toHaveCount(0);
    await page.locator("[data-news-search]").fill("");
    await expect(cards.filter({ visible: true })).toHaveCount(4);
    await page.locator("[data-demo-preview]").click();
    await expect(page.locator("[data-form-status]")).toContainText("No email was sent or stored.");
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864, input: "[data-news-search]" },
    { name: "mobile", width: 390, height: 844, input: "[data-news-search-mobile]" },
  ]) {
    test(`search, category, no-results and reset work at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/en");
      const input = page.locator(viewport.input);
      await expect(input).toBeVisible();
      const cards = page.locator("[data-news-card]");
      await expect(cards.filter({ visible: true })).toHaveCount(4);

      await input.fill("ethereum");
      await expect(cards.filter({ visible: true })).toHaveCount(1);
      await expect(page.locator("[data-result-count]")).toHaveText("1 placeholder");
      await expect(page.locator("[data-news-filter-summary]")).toContainText("matching your search");
      await expect(page.locator("[data-clear-filters]")).toBeVisible();

      await page.locator('[data-category="Bitcoin"]').click();
      await expect(cards.filter({ visible: true })).toHaveCount(0);
      await expect(page.locator("[data-news-empty]")).toBeVisible();
      await expect(page.locator("[data-result-count]")).toHaveText("0 placeholders");

      await page.locator("[data-reset-filters]").click();
      await expect(cards.filter({ visible: true })).toHaveCount(4);
      await expect(page.locator("[data-news-empty]")).toBeHidden();
      await expect(input).toHaveValue("");
      await expect(page.locator('[data-category="All"]')).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("[data-clear-filters]")).toBeHidden();
      await expect(page.locator("[data-news-filter-summary]")).toHaveText("Showing all demo placeholders.");
    });
  }

  test("keyboard shortcut focuses visible search and Escape clears demo filters", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    await page.keyboard.press("/");
    const mobileSearch = page.locator("[data-news-search-mobile]");
    await expect(mobileSearch).toBeFocused();
    await mobileSearch.fill("nothing-matches");
    await expect(page.locator("[data-news-empty]")).toBeVisible();
    await mobileSearch.press("Escape");
    await expect(mobileSearch).toHaveValue("");
    await expect(page.locator("[data-news-card]").filter({ visible: true })).toHaveCount(4);
  });

  test("mobile navigation closes on Escape and on outside pointer interaction", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    const toggle = page.locator("[data-menu-toggle]");
    const nav = page.locator("[data-primary-nav]");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.locator(".demo-banner").click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toBeHidden();
  });

  test("shareable demo filters restore on direct URL, back navigation and forward navigation", async ({ page }) => {
    await page.goto("/en?category=Ethereum&q=ethereum");
    const cards = page.locator("[data-news-card]");
    await expect(cards.filter({ visible: true })).toHaveCount(1);
    await expect(page.locator('[data-category="Ethereum"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-news-search]")).toHaveValue("ethereum");
    await expect(page.locator("[data-news-search-mobile]")).toHaveValue("ethereum");
    await page.locator('[data-category="Bitcoin"]').click();
    await expect(page).toHaveURL(/category=Bitcoin/);
    await expect(cards.filter({ visible: true })).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(/category=Ethereum&q=ethereum/);
    await expect(cards.filter({ visible: true })).toHaveCount(1);
    await expect(page.locator('[data-category="Ethereum"]')).toHaveAttribute("aria-pressed", "true");
    await page.goForward();
    await expect(page).toHaveURL(/category=Bitcoin/);
    await expect(cards.filter({ visible: true })).toHaveCount(0);
  });

  test("demo search URL is bounded, safe and never writes untrusted category markup", async ({ page }) => {
    const injected = "<img src=x onerror=alert(1)>";
    await page.goto("/en?category=" + encodeURIComponent(injected) + "&q=" + encodeURIComponent("a".repeat(150)));
    await expect(page.locator('[data-category="All"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-news-search]")).toHaveValue("a".repeat(80));
    await expect(page.locator("[data-news-search-mobile]")).toHaveValue("a".repeat(80));
    await expect(page.locator("[data-news-card]").filter({ visible: true })).toHaveCount(0);
    await expect(page.locator("img[onerror]")).toHaveCount(0);
    await page.locator("[data-clear-filters]").click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("[data-news-card]").filter({ visible: true })).toHaveCount(4);
  });

  test("typing on mobile updates URL without exposing email text in query", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    const input = page.locator("[data-news-search-mobile]");
    await input.fill("solana");
    await expect(page).toHaveURL(/\/en\?q=solana$/);
    await expect(page.locator("[data-news-search]")).toHaveValue("solana");
    await page.locator("#demo-email").fill("private@example.com");
    await page.locator("[data-demo-preview]").click();
    expect(page.url()).not.toContain("private");
    expect(page.url()).not.toContain("example.com");
    await expect(page.locator("[data-form-status]")).toContainText("No email was sent or stored.");
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`Portuguese homepage is translated and keyboard accessible at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/en");
      const localeLink = page.getByRole("link", { name: "Mudar para português" });
      await expect(localeLink).toBeVisible();
      await expect(localeLink).toHaveAttribute("href", "/pt-br");
      await localeLink.click();
      await expect(page).toHaveURL(/\/pt-br$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      await expect(page.locator(".cb-home")).toHaveAttribute("data-locale", "pt-br");
      await expect(page.locator("#hero-title")).toContainText("Mercado Bitcoin,");
      await expect(page.getByRole("heading", { level: 2, name: "Últimas notícias" })).toBeVisible();
      await expect(page.locator("[data-result-count]")).toHaveText("4 exemplos");
      await expect(page.getByRole("link", { name: "Switch to English" })).toHaveAttribute("href", "/en");
      await expect(page.locator(".demo-banner")).toContainText("não estão conectados");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      const violations = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(violations.violations).toEqual([]);
    });
  }

  test("Portuguese category filtering preserves canonical URLs and translated status", async ({ page }) => {
    await page.goto("/pt-br?category=Regulation");
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect(page.locator('[data-category="Regulation"]')).toContainText("Regulação");
    await expect(page.locator('[data-category="Regulation"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-news-card]").filter({ visible: true })).toHaveCount(1);
    await expect(page.locator("[data-result-count]")).toHaveText("1 exemplo");
    await expect(page.locator("[data-news-filter-summary]")).toContainText("Regulação");
    await page.locator("[data-demo-preview]").click();
    await expect(page.locator("[data-form-status]")).toContainText("Nenhum e-mail foi enviado ou armazenado");
    await page.locator("[data-clear-filters]").click();
    await expect(page).toHaveURL(/\/pt-br$/);
    await expect(page.locator("[data-news-card]").filter({ visible: true })).toHaveCount(4);
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`language switch keeps category, search and section at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/en?category=Regulation&q=Regulation#latest-news");
      const englishCards = page.locator("[data-news-card]");
      await expect(englishCards.filter({ visible: true })).toHaveCount(1);
      const portugueseLink = page.getByRole("link", { name: "Mudar para português" });
      await expect(portugueseLink).toHaveAttribute("href", "/pt-br?category=Regulation&q=Regulation#latest-news");
      await portugueseLink.click();
      await expect(page).toHaveURL(/\/pt-br\?category=Regulation&q=Regulation#latest-news$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      await expect(page.locator('[data-category="Regulation"]')).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator("[data-news-card]").filter({ visible: true })).toHaveCount(1);
      await expect(page.locator("[data-news-search]")).toHaveValue("Regulation");
      const englishLink = page.getByRole("link", { name: "Switch to English" });
      await expect(englishLink).toHaveAttribute("href", "/en?category=Regulation&q=Regulation#latest-news");
      await englishLink.click();
      await expect(page).toHaveURL(/\/en\?category=Regulation&q=Regulation#latest-news$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });
  }

  test("copy-view action uses canonical URL with no unrelated query parameters", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (value) => { window.__lastCopiedView = value; } },
      });
    });
    await page.goto("/pt-br?utm_source=external&category=Regulation&q=Regulation#latest-news");
    await page.getByRole("button", { name: "Copiar link da seleção" }).click();
    const copied = await page.evaluate(() => window.__lastCopiedView);
    expect(copied).toBe(new URL("/pt-br?category=Regulation&q=Regulation#latest-news", page.url()).href);
    expect(copied).not.toContain("utm_source");
    await expect(page.locator("[data-share-status]")).toHaveText("Link da seleção copiado.");
    await expect(page.locator("[data-share-manual]")).toBeHidden();
    await page.locator('[data-category="Bitcoin"]').click();
    await expect(page.locator("[data-share-status]")).toBeEmpty();
  });

  test("copy-view gracefully offers manual selection when clipboard is denied", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => { throw new Error("permission denied"); } },
      });
    });
    await page.goto("/en?category=Ethereum&q=ethereum");
    await page.locator("[data-copy-filter-link]").click();
    await expect(page.locator("[data-share-status]")).toContainText("Automatic copying is unavailable");
    const manual = page.locator("[data-share-manual]");
    await expect(manual).toBeVisible();
    await expect(page.locator("[data-share-url]")).toHaveValue(
      new URL("/en?category=Ethereum&q=ethereum", page.url()).href,
    );
    await expect(page.locator("[data-share-url]")).toBeFocused();
    await page.locator("[data-clear-filters]").click();
    await expect(manual).toBeHidden();
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`Crypto 101 guide is useful, translated, and accessible at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/pt-br#learn");
      const learn = page.locator("#learn");
      await expect(page.getByRole("heading", { name: "Crypto 101: primeiros passos com segurança" })).toBeVisible();
      await expect(learn.locator("details.learn-card")).toHaveCount(6);
      await expect(learn).toContainText("Conteúdo educativo");
      const wallet = learn.locator("details#learn-wallets");
      await expect(wallet).not.toHaveAttribute("open");
      const summary = wallet.locator("summary");
      await summary.focus();
      await summary.press("Enter");
      await expect(wallet).toHaveAttribute("open", "");
      await expect(wallet).toContainText("gerencia as chaves");
      await expect(wallet).toContainText("Antes de agir:");
      await summary.press("Enter");
      await expect(wallet).not.toHaveAttribute("open");
      const switchLink = page.getByRole("link", { name: "Switch to English" });
      await expect(switchLink).toHaveAttribute("href", "/en#learn");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
    });
  }

  test("Learn link opens the real educational section without affecting search demo", async ({ page }) => {
    await page.goto("/en?category=Bitcoin&q=bitcoin");
    await page.getByRole("link", { name: "Learn", exact: true }).click();
    await expect(page).toHaveURL(/\/en\?category=Bitcoin&q=bitcoin#learn$/);
    await expect(page.locator("#learn details.learn-card")).toHaveCount(6);
    await expect(page.getByRole("heading", { name: "Crypto 101: safer first steps" })).toBeVisible();
    await expect(page.locator("#latest-news [data-news-card]").filter({ visible: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Mudar para português" })).toHaveAttribute(
      "href", "/pt-br?category=Bitcoin&q=bitcoin#learn",
    );
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`official publisher links show proper attribution and remain accessible on ${viewport.name}`, async ({ page }) => {
      const externalRequests = [];
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      page.on("request", (request) => {
        if (!request.url().startsWith("http://127.0.0.1:4321/")) externalRequests.push(request.url());
      });
      await page.goto("/pt-br#official-sources");
      const sourceDesk = page.locator("#official-sources");
      await expect(page.getByRole("heading", { name: "Central de fontes oficiais" })).toBeVisible();
      await expect(sourceDesk.locator("[data-official-source]")).toHaveCount(6);
      const domains = [
        "bitcoincore.org", "blog.ethereum.org", "solana.com",
        "chain.link", "www.sec.gov", "www.cftc.gov",
      ];
      const links = sourceDesk.locator(".official-source__foot a");
      await expect(links).toHaveCount(6);
      for (let index = 0; index < 6; index++) {
        const link = links.nth(index);
        const url = new URL(await link.getAttribute("href"));
        expect(url.protocol).toBe("https:");
        expect(url.hostname).toBe(domains[index]);
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", /noopener noreferrer/);
        await expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
      }
      await expect(page.locator('[data-official-source="ethereum-foundation"] a')).toHaveAttribute(
        "href", "https://blog.ethereum.org/pt-br/archive",
      );
      await expect(sourceDesk).toContainText("não importa manchetes");
      expect(externalRequests).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
    });
  }

  test("the News demo links to first-party original sources without scraping or changing its four placeholders", async ({ page }) => {
    await page.goto("/en?category=Ethereum&q=ethereum");
    await page.getByRole("link", { name: "Browse official sources" }).click();
    await expect(page).toHaveURL(/\/en\?category=Ethereum&q=ethereum#official-sources$/);
    await expect(page.locator("#latest-news [data-news-card]")).toHaveCount(4);
    await expect(page.locator("#latest-news [data-news-card]").filter({ visible: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Mudar para português" })).toHaveAttribute(
      "href", "/pt-br?category=Ethereum&q=ethereum#official-sources",
    );
    await expect(page.locator('[data-official-source="ethereum-foundation"] a')).toHaveAttribute(
      "href", "https://blog.ethereum.org/archive",
    );
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864, locale: "en" },
    { name: "mobile", width: 390, height: 844, locale: "pt-br" },
  ]) {
    test(`read-only explorer tool validates real user inputs at ${viewport.name}`, async ({ page }) => {
      const requests = [];
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== "http://127.0.0.1:4321") requests.push(request.url());
      });
      await page.goto(`/${viewport.locale}#chain-lookup`);
      const form = page.locator("[data-explorer-form]");
      await expect(form).toBeVisible();
      await expect(form.locator("[data-explorer-result]")).toBeHidden();
      await form.locator("[data-explorer-network]").selectOption("ethereum");
      await form.locator("[data-explorer-kind]").selectOption("transaction");
      await form.locator("[data-explorer-value]").fill("javascript:alert(1)");
      await form.getByRole("button", { name: viewport.locale === "en" ? "Prepare explorer link" : "Preparar link de consulta" }).click();
      await expect(form.locator("[data-explorer-value]")).toHaveAttribute("aria-invalid", "true");
      await expect(form.locator("[data-explorer-result]")).toBeHidden();
      await form.locator("[data-explorer-value]").fill("0x" + "a".repeat(64));
      await form.getByRole("button", { name: viewport.locale === "en" ? "Prepare explorer link" : "Preparar link de consulta" }).click();
      await expect(form.locator("[data-explorer-result]")).toBeVisible();
      await expect(form.locator("[data-explorer-value]")).not.toHaveAttribute("aria-invalid");
      const outbound = form.locator("[data-explorer-link]");
      await expect(outbound).toHaveAttribute("href", "https://etherscan.io/tx/0x" + "a".repeat(64));
      await expect(outbound).toHaveAttribute("target", "_blank");
      await expect(outbound).toHaveAttribute("rel", /noopener noreferrer/);
      await expect(outbound).toHaveAttribute("referrerpolicy", "no-referrer");
      await expect(form.locator("[data-explorer-status]")).toContainText(
        viewport.locale === "en" ? "does not confirm" : "não confirma",
      );
      await expect(page).not.toHaveURL(/0x[a-f0-9]{64}/);
      expect(requests).toEqual([]);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      await form.locator("[data-explorer-network]").selectOption("solana");
      await expect(form.locator("[data-explorer-result]")).toBeHidden();
      await expect(outbound).not.toHaveAttribute("href");
    });
  }

  test("Tools menu and language switch keep a safe deep link without transmitting lookup text", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en?category=Bitcoin");
    await page.locator("[data-menu-toggle]").click();
    await page.getByRole("link", { name: "Tools", exact: true }).click();
    await expect(page).toHaveURL(/\/en\?category=Bitcoin#chain-lookup$/);
    await expect(page.locator("[data-menu-toggle]")).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("link", { name: "Mudar para português" })).toHaveAttribute(
      "href", "/pt-br?category=Bitcoin#chain-lookup",
    );
    await page.locator("[data-explorer-value]").fill("0x" + "f".repeat(40));
    expect(page.url()).not.toContain("ffff");
    await page.getByRole("link", { name: "Mudar para português" }).click();
    await expect(page).toHaveURL(/\/pt-br\?category=Bitcoin#chain-lookup$/);
    await expect(page.locator("[data-explorer-value]")).toHaveValue("");
  });

  test("site root redirects internally to the integrated Golden Home", async ({ request, page }) => {
    const response = await request.get("/", { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/en");
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    const loaded = await page.goto("/");
    expect(loaded?.status()).toBe(200);
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator("#hero-title")).toContainText("Bitcoin market,");
  });

  test("health and preview status expose only sanitized development metadata", async ({ request }) => {
    const healthResponse = await request.get("/health");
    expect(healthResponse.status()).toBe(200);
    expect(healthResponse.headers()["cache-control"]).toBe("no-store");
    const health = await healthResponse.json();
    expect(health).toMatchObject({
      status: "ok",
      service: "coinblink",
      environment: buildEnvironment,
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
      cloudflarePreview: buildEnvironment === "preview" ? "preview" : "not-deployed",
      buildSha: process.env.EXPECTED_SHA || "local",
      environment: buildEnvironment,
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
      expect(headers["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    }
  });

  test("robots.txt allows crawlers to read noindex signals without claiming privacy", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).not.toMatch(/^Disallow:\s*\/\s*$/m);
  });
});
