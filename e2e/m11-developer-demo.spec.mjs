import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M11 documentation is local-only, readable, accessible and demonstrates the API", async ({ page }) => {
  const outbound = [], mutations = [], errors = [];
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:4321/") && !req.url().startsWith("data:")) outbound.push(req.url());
    if (!["GET", "HEAD"].includes(req.method())) mutations.push(req.url());
  });
  page.on("pageerror", err => errors.push(err.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  for (const width of [390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const pageResponse = await page.goto("/developers");
    expect(pageResponse?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow, noarchive");
    await expect(page.getByRole("heading", { name: "Developer sandbox" })).toBeVisible();
    await expect(page.getByText("DEMO ONLY", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open synthetic JSON" })).toHaveAttribute("href", "/v1/demo/articles");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
  }
  await page.getByRole("link", { name: "Open synthetic JSON" }).click();
  await expect(page).toHaveURL(/\/v1\/demo\/articles$/u);
  expect(outbound).toEqual([]);
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});

test("M11 API returns three canonical fictional metadata records with safe response headers", async ({ request }) => {
  const response = await request.get("/v1/demo/articles");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^application\/json/u);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
  expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  const result = await response.json();
  expect(result).toMatchObject({ mode: "SYNTHETIC", status: "DEMO_ONLY", live: false, redistributable: false });
  expect(result.items).toHaveLength(3);
  for (const row of result.items) {
    expect(Object.keys(row).sort()).toEqual(["category", "id", "published", "rights", "slug", "summary", "title"]);
    expect(row).toMatchObject({ published: false, rights: "SYNTHETIC_NOT_LICENSED_NEWS" });
    expect(row.id).toMatch(/^demo-[a-z0-9-]+$/u);
  }
  const raw = JSON.stringify(result);
  for (const banned of ["private_notes", "password", "access_token", "body", "api_key", "published_at", "provider_secret"]) {
    expect(raw).not.toContain('"' + banned + '"');
  }
});

test("M11 API rejects expanded queries and unsafe methods without modifying data", async ({ request }) => {
  for (const url of ["/v1/demo/articles?limit=5", "/v1/demo/articles?locale=es",
    "/v1/demo/articles?cursor=x", "/v1/demo/articles?include=drafts",
    "/v1/demo/articles?limit=1&limit=2"]) {
    const response = await request.get(url);
    expect(response.status()).toBe(400);
    expect((await response.json()).items).toEqual([]);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await request.fetch("/v1/demo/articles", { method, data: { title: "must not persist" } });
    expect(response.status()).toBe(405);
    expect(response.headers()["allow"]).toBe("GET");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  }
  const after = await request.get("/v1/demo/articles");
  expect(after.status()).toBe(200);
  expect((await after.json()).items).toHaveLength(3);
});

test("M11 /developers has no document-wide horizontal scrolling at 320 and 390 px", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 850 });
    const response = await page.goto("/developers");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main pre")).toBeVisible();
    const measures = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      codeBlock: Math.round(document.querySelector("main pre").getBoundingClientRect().width),
    }));
    console.log("M11 reflow " + JSON.stringify({ width, ...measures }));
    expect(measures.viewport).toBe(width);
    expect(measures.document, "Horizontal overflow in /developers at " + width + " px").toBeLessThanOrEqual(measures.viewport);
  }
});
