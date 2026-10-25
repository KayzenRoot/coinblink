/* global document, window */
// CB-M01-VIS-PREVIEW-001: run a sealed, offline Chromium-only brand laboratory.
// Never route this file through src/pages, public website headers or deployed infrastructure.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const expected = new Map([
  ["/brand/coinblink-symbol.svg", "240d6e4c7e929920f0b7cbef37278aea09b6e55ac405e2d34ed7e55368a01de2"],
  ["/brand/coinblink-horizontal-dark.svg", "9da72437b4df9d896b85d8fc313e6734dd21db6905d7a5cf7419f0e353b3ab8c"],
  ["/brand/coinblink-horizontal-light.svg", "f054553a21372a5ca44837e6c75cf96450e461afbb49ed4629ffb5c2ee032825"],
  ["/brand/coinblink-stacked.svg", "707ac8a765cf99aa1dcd2b74364fac7b650238f78aaebfc392b6cec281adcfdd"],
  ["/brand/favicon.svg", "0f446faef5fc69f4bdc76fffa03cf0b0e6feb6e4ddb4aceefce8e97e4d1e6e16"],
]);
const root = process.cwd();
const sha = (data) => createHash("sha256").update(data).digest("hex");
const golden = [
  ["assets/reference/coinblink-home-master-dark-1536x864.jpg", "82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8"],
  ["assets/reference/coinblink-logo-approved-original-1179x1040.jpg", "126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0"],
];
const screenshotDirectory = resolve(process.env.RUNNER_TEMP || tmpdir(), "cb-m01-vis-preview");
const files = new Map();
for (const [url, digest] of expected) {
  const buf = await readFile(join(root, "public", url.slice(1)));
  assert.equal(sha(buf), digest, url + " immutable SHA-256");
  files.set(url, buf);
}
for (const [path, digest] of golden) {
  assert.equal(sha(await readFile(join(root, path))), digest, path + " immutable Golden SHA-256");
}
const html = await readFile(join(root, "test/brand/m01-visual-preview.html"));
assert.ok(!html.toString("utf8").includes('<link rel="icon"'), "favicon must not be installed");
files.set("/", html);

const server = createServer((req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    const bytes = files.get(pathname);
    if (!bytes) {
      res.writeHead(404, { "Cache-Control": "no-store" }).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": pathname === "/" ? "text/html; charset=utf-8" : "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res.writeHead(400).end();
  }
});
await new Promise((ok, fail) => {
  server.once("error", fail);
  server.listen(0, "127.0.0.1", ok);
});
const { port } = server.address();
const origin = "http://127.0.0.1:" + port;
const viewports = [
  ["desktop-1536x864", 1536, 864],
  ["desktop-1280x800", 1280, 800],
  ["tablet-768x1024", 768, 1024],
  ["mobile-390x844", 390, 844],
  ["mobile-360x800", 360, 800],
];
let browser;
const results = [];
try {
  await mkdir(screenshotDirectory, { recursive: true });
  browser = await chromium.launch({ headless: true });
  for (const [name, width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      colorScheme: "dark",
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const external = [], writes = [], errors = [];
    page.on("request", request => {
      if (new URL(request.url()).origin !== origin) external.push(request.url());
      if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url());
    });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    const response = await page.goto(origin + "/", { waitUntil: "load" });
    assert.equal(response?.status(), 200, name + " local lab response");
    assert.equal(await page.locator("img").count(), 6, name + " six local renders");
    assert.equal(await page.locator('img[src="/brand/coinblink-stacked.svg"]').count(), 1);
    assert.equal(await page.locator('[data-surface="light"] img[src="/brand/coinblink-stacked.svg"]').count(), 0);
    assert.equal(await page.locator('link[rel="icon"]').count(), 0, "favicon installation prohibited");
    assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"), "noindex, nofollow, noarchive");
    const validImages = await page.locator("img").evaluateAll(imgs => imgs.every(img => img.complete && img.naturalWidth > 0));
    assert.ok(validImages, name + " decoded SVGs");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, name + " no horizontal overflow");
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    assert.deepEqual(axe.violations.map(v => v.id), [], name + " a11y");
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(".skip").evaluate(e => e === document.activeElement), true, "keyboard skip link");
    assert.deepEqual(external, [], "no external requests");
    assert.deepEqual(writes, [], "no network writes");
    assert.deepEqual(errors, [], "no JS or console errors");
    const data = await page.screenshot({
      path: join(screenshotDirectory, name + ".png"), fullPage: true, animations: "disabled",
    });
    results.push({ name, width, height, screenshotSha256: sha(data), screenshotBytes: data.length,
      validImages: 6, a11yViolations: 0, externalRequests: 0, writes: 0, overflow: false });
    await context.close();
  }
  const report = {
    source: "CB-M01-VIS-PREVIEW-001",
    data: "DEMO_ONLY",
    head: process.env.EXPECTED_COMMIT || process.env.GITHUB_SHA || "LOCAL",
    assets: Object.fromEntries(expected),
    golden: Object.fromEntries(golden),
    viewports: results,
  };
  await writeFile(join(screenshotDirectory, "report.json"), JSON.stringify(report, null, 2));
  console.log("M01_ISOLATED_VISUAL_QA_PASS: " + results.length + " viewports, 5 original SVG hashes, 2 Goldens, zero external network, zero axe violations, no site integration.");
  console.log(JSON.stringify(report));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
