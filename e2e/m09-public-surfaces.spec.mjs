import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The public surfaces added for launch: search, editorial policy, editions
// archive and the per-locale feed. They have no database in CI, so every test
// also proves the empty state instead of a crash.

test("search answers a GET form in three locales and keeps the empty state", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/en/search");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("Search CoinBlink");
  const form = page.locator('form[role="search"]');
  await expect(form).toHaveAttribute("method", "get");
  await expect(form).toHaveAttribute("action", "/en/search");
  await expect(page.locator('input[name="q"]')).toHaveAttribute("maxlength", "80");
  await expect(page.locator("main")).not.toContainText("results");

  await page.goto("/en/search?q=bitcoin");
  await expect(page.locator("h1")).toHaveText("Search CoinBlink");
  await expect(page.locator('input[name="q"]')).toHaveValue("bitcoin");

  await page.goto("/pt-br/search");
  await expect(page.locator("h1")).toHaveText("Buscar no CoinBlink");
  await page.goto("/es/search");
  await expect(page.locator("h1")).toHaveText("Buscar en CoinBlink");

  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(scan.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("the editorial policy is indexable and states the review gate", async ({ page }) => {
  const response = await page.goto("/en/editorial");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("How CoinBlink writes");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator("main")).toContainText("CoinBlink AI draft");
  await expect(page.locator("main")).toContainText("410");

  await page.goto("/pt-br/editorial");
  await expect(page.locator("h1")).toHaveText("Como o CoinBlink escreve");
  await page.goto("/es/editorial");
  await expect(page.locator("h1")).toHaveText("Cómo escribe CoinBlink");
});

test("the editions archive renders its empty state without a database", async ({ page }) => {
  const response = await page.goto("/newsletter/editions");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("Newsletter editions");
  await expect(page.locator("main")).toContainText("No edition has been sent yet");
  await expect(page.getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "/newsletter");
});

test("the feed is served as RSS for every locale and never invents an item", async ({ request }) => {
  for (const locale of ["en", "pt-br", "es"]) {
    const response = await request.get("/" + locale + "/feed.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");
    const body = await response.text();
    expect(body).toContain("<rss version=\"2.0\"");
    expect(body).toContain("<language>" + locale + "</language>");
    expect(body).not.toContain("<item>");
  }
  const missing = await request.get("/fr/feed.xml");
  expect(missing.status()).toBe(404);
});

test("the layout advertises the feed and the home links the policy", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator('link[type="application/rss+xml"]')).toHaveAttribute("href", "/en/feed.xml");
  await expect(page.locator('footer a[href="/en/editorial"]')).toHaveCount(1);
});

test("a topic page renders the category and an unknown topic answers 404", async ({ page }) => {
  const response = await page.goto("/en/topic/bitcoin");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("Bitcoin");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  await expect(page.locator("main")).not.toContainText("Topic not found");

  const missing = await page.goto("/en/topic/not-a-topic");
  expect(missing?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Topic not found");
});

test("the topics index lists the eight topics and links their pages", async ({ page }) => {
  const response = await page.goto("/en/topics");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveText("Topics");
  await expect(page.locator(".topic-index li")).toHaveCount(8);
  await expect(page.locator('.topic-index a[href="/en/topic/bitcoin"]')).toHaveCount(1);
  await page.goto("/pt-br/topics");
  await expect(page.locator("h1")).toHaveText("Temas");
});
