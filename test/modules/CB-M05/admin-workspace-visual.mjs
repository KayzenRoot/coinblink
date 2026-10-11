/* global document, getComputedStyle */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { allocateEphemeralPort, buildAstroDevArgs, cleanupVisualFixture, waitForAstroServer } from "./visual-server.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../../..");
const fixtureRoot = path.join(testDirectory, "fixture");
const astroCli = path.join(repositoryRoot, "node_modules", "astro", "bin", "astro.mjs");
const runId = new Date().toISOString().replace(/[:.]/gu, "-");
const artifactDirectory = path.join(testDirectory, "artifacts", `run-${runId}`);
const port = await allocateEphemeralPort();
const baseUrl = `http://127.0.0.1:${port}`;
const routes = [
  ["login", "/admin/login"],
  ["setup", "/admin/setup"],
  ["recovery", "/admin/recovery"],
  ["articles", "/admin/articles"],
  ["article-new", "/admin/articles/new"],
  ["article-edit", "/admin/articles/mock-article/edit"],
  ["settings", "/admin/settings"],
  ["integrations", "/admin/settings/integrations"],
];
const viewports = [
  { name: "desktop", width: 1536, height: 864 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const server = spawn(process.execPath, buildAstroDevArgs(astroCli, port), {
  cwd: fixtureRoot,
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
let serverSpawnError;
server.on("error", (error) => { serverSpawnError = error; });
server.stdout.setEncoding("utf8").on("data", (chunk) => { serverOutput += chunk; });
server.stderr.setEncoding("utf8").on("data", (chunk) => { serverOutput += chunk; });

let browser;
const consoleErrors = [];
const pageErrors = [];
const results = [];

try {
  await waitForAstroServer({
    child: server,
    expectedOrigin: baseUrl,
    getChildOutput: () => serverOutput,
    getChildError: () => serverSpawnError,
  });
  await mkdir(artifactDirectory, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const [view, route] of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, `${view} route responds successfully at ${viewport.name}`);
      assert.equal(await page.locator("[data-module='CB-M05']").getAttribute("data-view"), view);
      assert.equal(await page.getByText("MOCK / SECURITY DISABLED", { exact: true }).count(), 1);
      assert.equal(await page.locator("[data-module='CB-M05'] h1").count(), 1, `${view} has one module page heading`);
      assert.equal(await page.locator("[data-module='CB-M05'] form, [data-module='CB-M05'] input, [data-module='CB-M05'] textarea").count(), 0, `${view} has no credential or mutation form controls`);
      assert.equal(await page.locator("[data-module='CB-M05'] button").evaluateAll((buttons) => buttons.every((button) => button.disabled)), true, `${view} has no enabled action buttons`);
      const articlesLink = page.locator(".m05-nav a[href='/admin/articles']");
      assert.equal(await articlesLink.getAttribute("aria-current"), view === "articles" ? "page" : null, `${view} marks only the current Articles page`);
      assert.equal(await articlesLink.evaluate((link) => link.classList.contains("m05-nav__link--active")), ["articles", "article-new", "article-edit"].includes(view), `${view} retains the Articles group highlight`);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      assert.ok(dimensions.page <= dimensions.viewport, `${view}/${viewport.name} has horizontal page overflow: ${JSON.stringify(dimensions)}`);
      assert.ok(dimensions.body <= dimensions.viewport, `${view}/${viewport.name} body overflows horizontally: ${JSON.stringify(dimensions)}`);

      const axe = new AxeBuilder({ page })
        .include("[data-module='CB-M05']")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]);
      const accessibility = await axe.analyze();
      const blockingViolations = accessibility.violations.filter(({ impact }) => ["critical", "serious"].includes(impact));
      assert.deepEqual(blockingViolations, [], `${view}/${viewport.name} has critical or serious accessibility findings`);
      assert.deepEqual(accessibility.violations, [], `${view}/${viewport.name} has Axe violations`);
      const fixtureMetadata = {
        title: await page.title(),
        language: await page.locator("html").getAttribute("lang"),
        robots: await page.locator("meta[name='robots']").getAttribute("content"),
        documentWidth: dimensions.page,
        documentViewport: dimensions.viewport,
        bodyWidth: dimensions.body,
      };
      assert.equal(fixtureMetadata.language, "en", "fixture document language is explicit");
      assert.equal(fixtureMetadata.robots, "noindex, nofollow", "fixture is not indexed");
      results.push({
        view,
        viewport: viewport.name,
        axeScope: "[data-module='CB-M05'] only",
        axeViolations: accessibility.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
        fixtureMetadata,
      });

      const screenshotName = `CB-M05-${view}-${viewport.width}x${viewport.height}.png`;
      const screenshotPath = path.join(artifactDirectory, screenshotName);
      const bytes = await page.screenshot({ path: screenshotPath });
      results.at(-1).screenshot = { path: screenshotName, sha256: sha256(bytes), bytes: bytes.length, width: viewport.width, height: viewport.height };

      if (view === "articles" && viewport.name === "desktop") {
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("fixture-skip-link")), true, "the skip link receives first keyboard focus");
        assert.equal(await page.locator(".fixture-skip-link").evaluate((element) => getComputedStyle(element).transform), "matrix(1, 0, 0, 1, 0, 0)", "the skip link becomes visible on focus");
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("m05-brand")), true, "the first M05 link follows the skip link in keyboard order");
        assert.equal(await page.locator(".m05-brand").evaluate((element) => getComputedStyle(element).outlineStyle), "solid", "the focused M05 link has a visible focus outline");
      }
    }
  }

  assert.deepEqual(consoleErrors, [], "browser console has no errors");
  assert.deepEqual(pageErrors, [], "browser has no uncaught page errors");
  const report = {
    fixture: "M05 module component rendered in an isolated local-only Astro harness; not an application route or deployment build",
    baseUrl,
    mode: "MOCK / SECURITY DISABLED",
    viewports,
    routeCount: routes.length,
    axeRuns: results.length,
    consoleErrors,
    pageErrors,
    fixtureObservations: "Document title, language, noindex, document/body overflow, console, page errors, and the test-only skip link are observed separately; Axe scans only the M05 root.",
    results,
  };
  const reportPath = path.join(artifactDirectory, "CB-M05-visual-results.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "w" });
  console.log(JSON.stringify({ ...report, reportPath }, null, 2));
} catch (error) {
  console.error(serverOutput);
  throw error;
} finally {
  await cleanupVisualFixture({ browser, server });
}
