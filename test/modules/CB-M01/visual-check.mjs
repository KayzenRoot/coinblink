import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { removeFixtureTempRootAfterExit, waitForFixtureReady } from "./visual-server.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const baseSha = "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c";
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const astroCli = join(repoRoot, "node_modules", "astro", "bin", "astro.mjs");
const evidenceDir = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "screenshots");
const reportPath = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "visual-check.json");
const viewports = [
  { name: "desktop", width: 1536, height: 864 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

async function availablePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  await new Promise((resolveClose) => server.close(resolveClose));
  assert.ok(address && typeof address === "object");
  return address.port;
}

async function waitForChildExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return new Promise((resolveExit) => {
    const finish = (exited) => {
      clearTimeout(timer);
      child.off("exit", onExit);
      resolveExit(exited);
    };
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    child.once("exit", onExit);
  });
}

async function stopAstroServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return true;
  child.kill();
  if (await waitForChildExit(child, 3_000)) return true;
  child.kill("SIGKILL");
  return waitForChildExit(child, 3_000);
}

const port = await availablePort();
const origin = "http://127.0.0.1:" + port;
const fixtureTempRoot = await mkdtemp(join(tmpdir(), "coinblink-m01-fixture-"));
let serverOutput = "";
let server;

async function waitUntilReady() {
  try {
    await waitForFixtureReady({ child: server, origin });
  } catch (error) {
    throw new Error(error.message + ". Output: " + serverOutput, { cause: error });
  }
}

const results = [];
const consoleErrors = [];
const pageErrors = [];
const externalRequests = [];
const interactionChecks = { responsiveNavigation: [], trendingStrip: {}, focusVisible: null, categorySearch: null, unavailableNavigation: null };
let browser;
let shutdownFailure;

try {
  server = spawn(process.execPath, [
    astroCli, "dev", "--config=" + join(".engineering", "evidence", "CB-M01-WO-001", "astro-fixture.config.mjs"),
    "--host", "127.0.0.1", "--port", String(port), "--strictPort",
  ], {
    cwd: repoRoot,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, M01_FIXTURE_TEMP_DIR: fixtureTempRoot },
  });
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
  try {
    await once(server, "spawn");
  } catch (error) {
    serverOutput += `Astro fixture spawn failed: ${error.message}`;
    throw error;
  }
  await waitUntilReady();
  await mkdir(evidenceDir, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith(origin)) externalRequests.push(request.url());
  });

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await page.title(), "CoinBlink Golden Home · isolated module fixture");
    assert.equal(await page.locator("#main").count(), 1);
    for (const section of ["#market-overview", "#radar-24h", "#latest-news", "#newsletter", "#demo-data"]) {
      assert.equal(await page.locator(section).count(), 1, "missing " + section);
    }
    const dimensions = await page.evaluate(() => {
      const viewport = globalThis.document.documentElement.clientWidth;
      const overflowing = [...globalThis.document.querySelectorAll("body *")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: String(element.className), right: Math.round(rect.right), width: Math.round(rect.width), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      }).filter((element) => element.right > viewport + 1).slice(0, 12);
      return { viewport, document: globalThis.document.documentElement.scrollWidth, overflowing };
    });
    assert.ok(dimensions.document <= dimensions.viewport, viewport.name + " horizontal overflow: " + JSON.stringify(dimensions));
    if (viewport.name === "mobile") {
      const trendingLayout = await page.locator(".trending-strip").evaluate((strip) => {
        const children = [...strip.children];
        return {
          clientWidth: strip.clientWidth,
          scrollWidth: strip.scrollWidth,
          childRects: children.map((child) => {
            const rect = child.getBoundingClientRect();
            return { className: child.className, left: rect.left, top: rect.top, bottom: rect.bottom };
          }),
        };
      });
      assert.ok(trendingLayout.scrollWidth > trendingLayout.clientWidth, "mobile trending items must be horizontally scrollable");
      assert.equal(trendingLayout.childRects.length, 5, "mobile trending strip must show its title and all four items");
      const mobileRowTop = Math.max(...trendingLayout.childRects.map((child) => child.top));
      const mobileRowBottom = Math.min(...trendingLayout.childRects.map((child) => child.bottom));
      assert.ok(
        mobileRowBottom > mobileRowTop,
        "mobile trending title and all items must remain on a single row: " + JSON.stringify(trendingLayout),
      );
      interactionChecks.trendingStrip.mobile = { horizontallyScrollable: true, singleRow: true, visibleItems: 4 };
    }
    const moduleAxe = await new AxeBuilder({ page }).include(".cb-home").analyze();
    const pageAxe = await new AxeBuilder({ page }).analyze();
    const encodeViolations = (axe) => axe.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    }));
    results.push({
      ...viewport,
      documentWidth: dimensions.document,
      axeViolations: encodeViolations(moduleAxe),
      fullPageAxeViolations: encodeViolations(pageAxe),
    });
    await page.screenshot({ path: join(evidenceDir, "golden-home-" + viewport.name + ".png"), fullPage: false });
  }

  for (const width of [850, 851, 1024, 1050, 1051]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin, { waitUntil: "networkidle" });
    if (width > 760 && width <= 1050) {
      const trendingLayout = await page.locator(".trending-strip").evaluate((strip) => {
        const title = strip.querySelector("h2").getBoundingClientRect();
        const items = [...strip.querySelectorAll(".trend-item")]
          .filter((item) => globalThis.getComputedStyle(item).display !== "none")
          .map((item) => {
            const rect = item.getBoundingClientRect();
            return { left: rect.left, top: rect.top, bottom: rect.bottom };
          });
        return { title: { left: title.left, top: title.top, bottom: title.bottom }, items };
      });
      assert.equal(trendingLayout.items.length, 3, "tablet trending strip must show three items");
      const tabletRowTop = Math.max(trendingLayout.title.top, ...trendingLayout.items.map((item) => item.top));
      const tabletRowBottom = Math.min(trendingLayout.title.bottom, ...trendingLayout.items.map((item) => item.bottom));
      assert.ok(
        tabletRowBottom > tabletRowTop,
        "tablet title and three visible items must share one row: " + JSON.stringify(trendingLayout),
      );
      interactionChecks.trendingStrip.tablet = { width, singleRow: true, visibleItems: 3 };
    }
    const toggle = page.locator("[data-menu-toggle]");
    const nav = page.locator("#primary-nav");
    const links = nav.locator("a");
    if (width <= 1050) {
      assert.equal(await toggle.isVisible(), true, `navigation toggle must be available at ${width}px`);
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal(await nav.isVisible(), false, `collapsed navigation must stay closed at ${width}px`);
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      assert.equal(await links.count(), 8);
      for (let index = 0; index < await links.count(); index += 1) {
        assert.equal(await links.nth(index).isVisible(), true, `navigation link ${index + 1} must be reachable at ${width}px`);
      }
      interactionChecks.responsiveNavigation.push({ width, control: "menu toggle", expandedStateVerified: true, allLinksReachable: true });
      await toggle.click();
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    } else {
      assert.equal(await toggle.isVisible(), false, "desktop navigation does not use a hidden menu toggle");
      assert.equal(await nav.isVisible(), true);
      assert.equal(await links.count(), 8);
      for (let index = 0; index < await links.count(); index += 1) {
        assert.equal(await links.nth(index).isVisible(), true, `navigation link ${index + 1} must be visible at ${width}px`);
      }
      const headerRects = await page.evaluate(() => [".brand", "#primary-nav", ".header-tools"].map((selector) => {
        const rect = globalThis.document.querySelector(selector).getBoundingClientRect();
        return { selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      }));
      for (let index = 1; index < headerRects.length; index += 1) {
        assert.ok(headerRects[index - 1].right <= headerRects[index].left + 1, `header regions overlap at ${width}px: ${JSON.stringify(headerRects)}`);
      }
      interactionChecks.responsiveNavigation.push({ width, control: "inline navigation", allLinksVisible: true, headerRegionsOverlap: false });
    }
  }

  await page.setViewportSize({ width: 1536, height: 864 });
  await page.goto(origin, { waitUntil: "networkidle" });
  for (const label of ["Tools", "Videos"]) {
    const link = page.getByRole("link", { name: label, exact: true });
    assert.equal(await link.getAttribute("href"), "#demo-data", label + " must lead to the explicit demo status");
  }
  await page.getByRole("link", { name: "Tools", exact: true }).click();
  assert.equal(new URL(page.url()).hash, "#demo-data");
  assert.match(await page.locator("#demo-data").textContent(), /Tools and videos are unavailable in this demo\./);
  interactionChecks.unavailableNavigation = { toolsAndVideosTarget: "#demo-data", destinationStatusVerified: true };
  let searchReachedByKeyboard = false;
  for (let step = 0; step < 20 && !searchReachedByKeyboard; step += 1) {
    await page.keyboard.press("Tab");
    searchReachedByKeyboard = await page.evaluate(() => globalThis.document.activeElement === globalThis.document.querySelector("[data-news-search]"));
  }
  assert.equal(searchReachedByKeyboard, true, "keyboard Tab must reach the visible search input");
  const searchFocusStyle = await page.locator("[data-news-search]").evaluate((input) => ({
    outlineStyle: globalThis.getComputedStyle(input).outlineStyle,
    outlineWidth: Number.parseFloat(globalThis.getComputedStyle(input).outlineWidth),
  }));
  assert.notEqual(searchFocusStyle.outlineStyle, "none", "keyboard focus must retain a visible outline");
  assert.ok(searchFocusStyle.outlineWidth >= 2, `keyboard focus outline must be at least 2px: ${JSON.stringify(searchFocusStyle)}`);
  interactionChecks.focusVisible = { reachedByTab: true, ...searchFocusStyle };

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: "networkidle" });
  const mobileSearchVisible = await page.locator(".search-box").isVisible();
  const mobileSearchInputVisible = await page.locator("[data-news-search]").isVisible();
  assert.equal(mobileSearchVisible, false, "mobile must not show an inactive search affordance");
  assert.equal(mobileSearchInputVisible, false, "mobile search input is intentionally unavailable");
  interactionChecks.mobileSearch = { visible: mobileSearchVisible, inputVisible: mobileSearchInputVisible, intentionallyUnavailable: true };
  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.setViewportSize({ width: 390, height: 844 });
  await noScriptPage.goto(origin, { waitUntil: "networkidle" });
  await noScriptPage.locator("#demo-email").fill("owner@example.invalid");
  await noScriptPage.getByRole("button", { name: /Preview only/ }).click();
  const noScriptUrl = new URL(noScriptPage.url());
  assert.equal(noScriptUrl.origin, new URL(origin).origin, "the newsletter preview control must not navigate when JavaScript is disabled");
  assert.equal(noScriptUrl.search, "", "no email address may be serialized into a query string");
  interactionChecks.noScriptNewsletter = { addressSerialized: false, javascriptEnabled: false };
  await noScriptContext.close();
  const menu = page.locator("[data-menu-toggle]");
  await menu.click();
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator("#primary-nav").isVisible(), true);
  await page.getByRole("button", { name: /Bitcoin/ }).click();
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1);
  assert.equal(await page.locator("[data-news-card]:visible").getAttribute("data-category-value"), "Bitcoin");
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-news-search]").fill("no matching placeholder");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 0);
  await page.locator("[data-category='All']").click();
  await page.locator("[data-news-search]").fill("Bitcoin");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1, "category labels are included in local search");
  assert.equal(await page.locator("[data-news-card]:visible").getAttribute("data-category-value"), "Bitcoin");
  await page.locator("[data-category='Ethereum']").click();
  assert.equal(await page.locator("[data-news-card]:visible").count(), 0, "category selection remains combined with search");
  await page.locator("[data-category='All']").click();
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1, "All restores the category-inclusive query results");
  interactionChecks.categorySearch = { query: "Bitcoin", matchesCategory: "Bitcoin", selectedCategory: "All", matches: 1, combinedCategoryFilterVerified: true };
  await page.locator("[data-news-search]").clear();
  assert.equal(await page.locator("[data-news-card]:visible").count(), 4);
  await page.locator("#demo-email").fill("owner@example.invalid");
  await page.getByRole("button", { name: /Preview only/ }).click();
  assert.match(await page.locator("[data-form-status]").textContent(), /No email was sent or stored/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.evaluate(() => globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches), true);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(externalRequests, []);
} finally {
  try {
    if (browser) await browser.close();
  } catch (error) {
    shutdownFailure ??= error;
  }
  try {
    const serverStopped = await stopAstroServer(server);
    if (!serverStopped) {
      shutdownFailure = new Error("Astro fixture did not exit after termination; isolated directory was retained at " + fixtureTempRoot + ". Output: " + serverOutput);
    }
  } catch (error) {
    shutdownFailure ??= error;
  }
  try {
    const fixtureRemoved = await removeFixtureTempRootAfterExit(server, fixtureTempRoot);
    if (!fixtureRemoved) {
      shutdownFailure = new Error("Astro fixture exit was not confirmed; isolated directory was retained at " + fixtureTempRoot + ". Output: " + serverOutput);
    }
  } catch (error) {
    shutdownFailure ??= error;
  }
}
if (shutdownFailure) throw shutdownFailure;

await mkdir(evidenceDir, { recursive: true });
const { readFile } = await import("node:fs/promises");
for (const result of results) {
  const screenshot = await readFile(join(evidenceDir, "golden-home-" + result.name + ".png"));
  result.screenshotSha256 = createHash("sha256").update(screenshot).digest("hex");
}
const report = {
  generatedAt: new Date().toISOString(),
  baseSha,
  headSha,
  fixture: "isolated Astro fixture; no shared /en route integration",
  origin,
  viewports: results,
  interactionChecks,
  consoleErrors,
  pageErrors,
  externalRequests,
  serverOutput: serverOutput.split(/\r?\n/).filter(Boolean).slice(-12),
};
await mkdir(resolve(reportPath, ".."), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
const violations = results.flatMap((result) => result.axeViolations);
if (violations.length) throw new Error("Axe violations: " + JSON.stringify(violations, null, 2));
const globalViolations = results.flatMap((result) => result.fullPageAxeViolations);
const unexpectedGlobalViolations = globalViolations.filter((violation) =>
  violation.id !== "region" || violation.nodes.some((node) => !node.target.includes(".skip-link"))
);
if (unexpectedGlobalViolations.length) throw new Error("Unexpected full-page Axe violations: " + JSON.stringify(unexpectedGlobalViolations, null, 2));
console.log(JSON.stringify({ reportPath, screenshots: results.map(({ name, width, height, screenshotSha256 }) => ({ name, width, height, screenshotSha256 })), viewports: results.map(({ name, documentWidth, axeViolations, fullPageAxeViolations }) => ({ name, documentWidth, moduleAxeViolationCount: axeViolations.length, fullPageAxeViolations })), consoleErrors, pageErrors, externalRequests }, null, 2));
