import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const route = "/v1/demo/market-readiness";

test("M11/M04 developer documentation describes the blocked markets safely at mobile and desktop", async ({ page }) => {
  const external = [], mutations = [], errors = [];
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) external.push(request.url());
    if (!["GET", "HEAD"].includes(request.method())) mutations.push(request.url());
  });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/developers");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Developer sandbox" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open synthetic market readiness JSON" })).toHaveAttribute("href", route);
    await expect(page.getByText("No live quotes, trading or licensed market redistribution", { exact: false })).toBeVisible();
    const measured = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    console.log("M11/M04 reflow " + JSON.stringify({ width, ...measured }));
    expect(measured.document).toBeLessThanOrEqual(measured.viewport);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    expect(axe.violations).toEqual([]);
  }
  await page.getByRole("link", { name: "Open synthetic market readiness JSON" }).click();
  await expect(page).toHaveURL(new RegExp(route + "$", "u"));
  expect(external).toEqual([]);
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});

test("M11/M04 GET-only API returns exclusively the three blocked fictional markets", async ({ request }) => {
  const result = await request.get(route);
  expect(result.status()).toBe(200);
  expect(result.headers()["content-type"]).toMatch(/^application\/json/u);
  expect(result.headers()["cache-control"]).toContain("no-store");
  expect(result.headers()["x-content-type-options"]).toBe("nosniff");
  expect(result.headers()["x-robots-tag"]).toContain("noindex");
  expect(result.headers()["access-control-allow-origin"]).toBeUndefined();
  const body = await result.json();
  expect(body).toMatchObject({ mode: "SYNTHETIC", status: "BLOCKED_DEMO", live: false, redistributable: false });
  expect(body.items.map(x => x.asset)).toEqual(["BTC", "ETH", "SOL"]);
  expect(body.items.map(x => x.freshness)).toEqual(["STALE", "UNAVAILABLE", "UNAVAILABLE"]);
  for (const item of body.items) {
    expect(Object.keys(item).sort()).toEqual(["asset","blockers","freshness","numericQuote","pair","publiclyUsable","rights"].sort());
    expect(item).toMatchObject({ numericQuote: null, publiclyUsable: false, rights: "NOT_CLEARED" });
    expect(item.blockers).toHaveLength(4);
    expect(item.blockers).toContain("RIGHTS_NOT_CLEARED");
    expect(item.blockers).toContain("NO_LIVE_FEED");
  }
  const raw = JSON.stringify(body);
  for (const forbidden of ["numericValue", "provider", "asOfUTC", "observedAtUTC", "price", "timestamp", "apiKey", "accessToken", "isTradable", "private_notes"]) {
    expect(raw).not.toContain('"' + forbidden + '"');
  }
});

test("M11/M04 rejects expanded queries and every write method without mutating response", async ({ request }) => {
  for (const param of ["?asset=BTC", "?limit=3", "?include=quotes", "?rights=APPROVED", "?cursor=x", "?limit=1&limit=2"]) {
    const response = await request.get(route + param);
    expect(response.status()).toBe(400);
    expect((await response.json()).items).toEqual([]);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["access-control-allow-origin"]).toBeUndefined();
  }
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await request.fetch(route, { method, data: { numericValue: 100, rightsStatus: "APPROVED" } });
    expect(response.status()).toBe(405);
    expect(response.headers()["allow"]).toBe("GET");
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  expect((await (await request.get(route)).json()).items).toHaveLength(3);
  expect((await request.get("/v1/demo/articles")).status()).toBe(200);
});
