import { test, expect } from "@playwright/test";

// Crawl the seeded product surfaces and prove every same-origin link resolves.
// External publisher links are collected but never fetched: this audit checks
// our own routes, it does not generate traffic to third parties.
const SEEDS = [
  "/en", "/pt-br", "/es",
  "/en/news", "/pt-br/news", "/es/news",
  "/en/news/live", "/pt-br/news/live", "/es/news/live",
  "/en/news/sources", "/pt-br/news/sources", "/es/news/sources",
  "/en/news/source/coindesk",
  "/developers",
  "/en/about", "/pt-br/about", "/es/about",
  "/demo", "/demo/sources", "/demo/intake", "/demo/pulse",
  "/demo/markets", "/demo/markets/live", "/demo/editorial/articles",
];

test("every internal link on the seeded surfaces resolves", async ({ page, request }) => {
  test.slow();
  const internal = new Set();
  const external = new Set();
  for (const seed of SEEDS) {
    const response = await page.goto(seed);
    expect(response?.status(), seed).toBe(200);
    const origin = new URL(page.url()).origin;
    const links = await page.locator("a[href]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href")));
    for (const href of links) {
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      const url = new URL(href, page.url());
      if (url.origin !== origin) {
        external.add(url.href);
        continue;
      }
      url.hash = "";
      internal.add(url.pathname + url.search);
    }
  }
  expect(internal.size, "the crawl must not be empty").toBeGreaterThan(50);
  expect(external.size, "publisher links must stay external").toBeGreaterThan(0);

  const failures = [];
  for (const path of internal) {
    const response = await request.get(path, { maxRedirects: 0 });
    if (path.startsWith("/admin")) {
      if (response.status() < 400) failures.push(path + " must stay unreachable");
      continue;
    }
    if (response.status() >= 400) failures.push(path + " -> " + response.status());
  }
  expect(failures).toEqual([]);
});
