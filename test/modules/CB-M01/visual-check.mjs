import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { readGitHead } from "./git-head.mjs";
import { assertVisualInputsClean } from "./visual-input-state.mjs";
import { isFixtureOriginRequest } from "./visual-request-origin.mjs";
import {
  clearVisualCheckReport,
  removeFixtureTempRootAfterExit,
  waitForFixtureReady,
  writeVisualCheckFailure,
} from "./visual-server.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const baseSha = "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c";
const evidenceDir = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "screenshots");
const reportPath = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "visual-check.json");
const viewports = [
  { name: "desktop", width: 1536, height: 864 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const runStartedAt = new Date().toISOString();
await clearVisualCheckReport(reportPath);
let headSha = null;
let origin = null;
let port;
let fixtureTempRoot;
let visualInputState = null;

try {
  headSha = await readGitHead(repoRoot);
  visualInputState = assertVisualInputsClean(repoRoot);
  port = await availablePort();
  origin = "http://127.0.0.1:" + port;
  fixtureTempRoot = await mkdtemp(join(tmpdir(), "coinblink-m01-fixture-"));
} catch (error) {
  await writeVisualCheckFailure(reportPath, {
    generatedAt: runStartedAt,
    baseSha,
    headSha,
    visualInputState,
    fixture: "isolated Astro fixture; no shared /en route integration",
    origin,
    viewports: [],
    interactionChecks: {},
    consoleErrors: [],
    pageErrors: [],
    externalRequests: [],
    serverOutput: [],
  }, error);
  throw error;
}

const astroCli = join(repoRoot, "node_modules", "astro", "bin", "astro.mjs");

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

// Runs each step after the previous one has fully settled, preserving the
// original sequential order of side effects on the shared browser page.
function runInOrder(items, step) {
  return items.reduce((previous, item) => previous.then(() => step(item)), Promise.resolve());
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
  if (!(child?.exitCode === null && child?.signalCode === null)) return true;
  child.kill();
  if (await waitForChildExit(child, 3_000)) return true;
  child.kill("SIGKILL");
  return waitForChildExit(child, 3_000);
}

let serverOutput = "";
let server;
let runFailure;

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
  // Reject unexpected remote requests before bytes can leave the isolated fixture.
  // The request listener below records attempted leaks and fails the test.
  const routeHandlerFailures = [];
  await context.route("**/*", async (route) => {
    try {
      if (isFixtureOriginRequest(route.request().url(), origin)) {
        await route.continue();
        return;
      }
      await route.abort("blockedbyclient");
    } catch (error) {
      routeHandlerFailures.push(error instanceof Error ? error.message : "unknown route handler failure");
      throw error;
    }
  });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!isFixtureOriginRequest(request.url(), origin)) externalRequests.push(request.url());
  });

  const desktopGeometryViolations = (desktopGeometry, viewport) => {
    const geometryViolations = [];
    if (desktopGeometry.brandName.left <= desktopGeometry.brandImage.right - 2) geometryViolations.push("brand mark and wordmark are not arranged side by side");
    if (desktopGeometry.header.height > 60) geometryViolations.push("header exceeds the compact Golden header envelope");
    if (desktopGeometry.hero.top > 78) geometryViolations.push("hero begins below the compact first-fold target");
    if (desktopGeometry.hero.height > 300) geometryViolations.push("hero exceeds the Golden reference height envelope");
    if (desktopGeometry.latestNews.top > 735) geometryViolations.push("latest-news panel begins below the compact first-fold target");
    if (desktopGeometry.latestNews.top < 700) geometryViolations.push("latest-news and newsletter begin too early compared with the Golden lower fold");
    if (desktopGeometry.latestNewsCards.top > 780) geometryViolations.push("latest-news demo cards are pushed out of the first fold");
    if (desktopGeometry.latestNewsCards.bottom > viewport.height) geometryViolations.push("all four demo story cards must remain inside the desktop first fold");
    if (desktopGeometry.newsletter.top > 735) geometryViolations.push("newsletter panel begins below the compact first-fold target");
    if (desktopGeometry.trendingItems !== 5) geometryViolations.push("five demo trend placeholders are required");
    return geometryViolations;
  };

  const assertMobileTrendingStrip = async () => {
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
    assert.equal(trendingLayout.childRects.length, 6, "mobile trending strip must show its title and all five items");
    const mobileRowTop = Math.max(...trendingLayout.childRects.map((child) => child.top));
    const mobileRowBottom = Math.min(...trendingLayout.childRects.map((child) => child.bottom));
    assert.ok(
      mobileRowBottom > mobileRowTop,
      "mobile trending title and all items must remain on a single row: " + JSON.stringify(trendingLayout),
    );
    interactionChecks.trendingStrip.mobile = { horizontallyScrollable: true, singleRow: true, visibleItems: 5 };
  };

  const checkViewport = async (viewport) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(origin, { waitUntil: "networkidle" });
    assert.equal(await page.title(), "CoinBlink Golden Home · isolated module fixture");
    assert.equal(await page.locator("astro-dev-toolbar").count(), 0, "captured visual fixtures must not include Astro's development toolbar");
    assert.equal(await page.locator("#main").count(), 1);
    const requiredSections = ["#market-overview", "#radar-24h", "#latest-news", "#newsletter", "#demo-data"];
    const sectionCounts = await Promise.all(requiredSections.map((section) => page.locator(section).count()));
    requiredSections.forEach((section, index) => {
      assert.equal(sectionCounts[index], 1, "missing " + section);
    });
    const dimensions = await page.evaluate(() => {
      const viewport = globalThis.document.documentElement.clientWidth;
      const overflowing = [...globalThis.document.querySelectorAll("body *")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, className: String(element.className), right: Math.round(rect.right), width: Math.round(rect.width), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      }).filter((element) => element.right > viewport + 1).slice(0, 12);
      return { viewport, document: globalThis.document.documentElement.scrollWidth, overflowing };
    });
    assert.ok(dimensions.document <= dimensions.viewport, viewport.name + " horizontal overflow: " + JSON.stringify(dimensions));
    if (viewport.name === "mobile") await assertMobileTrendingStrip();
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
    if (viewport.name === "desktop") {
      const desktopGeometry = await page.evaluate(() => {
        const readRect = (selector) => {
          const rect = globalThis.document.querySelector(selector).getBoundingClientRect();
          return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
        };
        return {
          demoBanner: readRect(".demo-banner"),
          header: readRect(".cb-header"),
          brand: readRect(".brand"),
          brandImage: readRect(".brand img"),
          brandName: readRect(".brand-name"),
          trendingItems: globalThis.document.querySelectorAll(".trend-item").length,
          categoryLabels: [...globalThis.document.querySelectorAll(".category-chip")].map((item) => item.dataset.category),
          primaryNav: readRect(".primary-nav"),
          headerTools: readRect(".header-tools"),
          hero: readRect(".hero-panel"),
          market: readRect(".market-panel"),
          ticker: readRect(".ticker-strip"),
          trending: readRect(".trending-strip"),
          categories: readRect(".category-rail"),
          signals: readRect(".content-grid"),
          latestNews: readRect("#latest-news"),
          latestNewsCards: readRect(".news-cards"),
          newsletter: readRect("#newsletter"),
        };
      });
      results.at(-1).desktopGeometry = desktopGeometry;
      interactionChecks.desktopGeometry = desktopGeometry;
      const geometryViolations = desktopGeometryViolations(desktopGeometry, viewport);
      assert.deepEqual(
        desktopGeometry.categoryLabels,
        ["All", "Bitcoin", "Ethereum", "Altcoins", "DeFi", "NFTs", "Regulation", "Web3", "AI x Crypto", "Market Analysis", "Guides"],
        "the Golden's ten editorial categories must be available with All as a filter",
      );
      assert.deepEqual(geometryViolations, [], `desktop Golden geometry failed: ${JSON.stringify(desktopGeometry)}; ${geometryViolations.join("; ")}`);
    }
    await page.screenshot({ path: join(evidenceDir, "golden-home-" + viewport.name + ".png"), fullPage: false });
  };
  await runInOrder(viewports, checkViewport);

  // Exercise the real Astro->GoldenHome producer prop path with mock-only
  // fixture routes. The Golden Home visual source and approved art stay untouched.
  const producerSmoke = {};
  const producerCases = [
    { path: "/mock-producers", expected: {
      news: "SYNTHETIC_FIXTURE_ONLY",
      sources: "SYNTHETIC_FIXTURE_ONLY",
      markets: "SYNTHETIC_FIXTURE_ONLY",
    }, forbidden: ["PRIVATE_FIXTURE_NEVER_RENDER_THIS", "987654321", "fake-source.example.test"] },
    { path: "/denied-producers", expected: {
      news: "REJECTED_LIVE_UNAUTHORIZED",
      sources: "REJECTED_INVALID_INPUT",
      markets: "EMPTY_SYNTHETIC_FIXTURE",
    }, forbidden: ["PRIVATE_LIVE_NEVER_RENDER_THIS"] },
  ];
  const checkProducerCase = async ({ path, expected, forbidden }) => {
    const response = await page.goto(new URL(path, origin).href, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, "offline producer fixture route must render: " + path);
    const states = {
      news: await page.locator("#latest-news").getAttribute("data-m01-news-source-state"),
      sources: await page.locator("[data-m01-source-feed-state]").getAttribute("data-m01-source-feed-state"),
      markets: await page.locator("#market-overview").getAttribute("data-m01-market-source-state"),
    };
    assert.deepEqual(states, expected, "producer input must be isolated and fail closed in real Astro HTML");
    const bodyText = await page.locator("body").innerText();
    assert.match(bodyText, /DEMO/u, "a producer fixture must not remove DEMO labeling");
    for (const secret of forbidden) {
      assert.equal(bodyText.includes(secret), false, "unlicensed fixture payload leaked into Home: " + secret);
    }
    producerSmoke[path] = { statuses: states, payloadNotRendered: true, externalRequests: [] };
  };
  await producerCases.reduce(
    (serialCase, producerCase) => serialCase.then(() => checkProducerCase(producerCase)),
    Promise.resolve(),
  );
  assert.deepEqual(externalRequests, [], "synthetic producer fixtures must not fetch any external provider");
  assert.deepEqual(routeHandlerFailures, [], "fixture request routing must complete without errors");
  interactionChecks.syntheticProducerSmoke = producerSmoke;

  const mobileHeroGeometry = [];
  const checkMobileHeroWidth = async (width) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(origin, { waitUntil: "networkidle" });
    const geometry = await page.locator(".hero-panel").evaluate((hero) => {
      const readRect = (element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const overlaps = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
      const ctas = [...hero.querySelectorAll(".hero-actions a")].map((element) => ({
        label: element.textContent.trim(),
        rect: readRect(element),
        minHeight: Number.parseFloat(globalThis.getComputedStyle(element).minHeight),
      }));
      const statusElement = hero.querySelector(".hero-stat");
      const coinElement = hero.querySelector(".coin-art");
      const status = readRect(statusElement);
      const coin = readRect(coinElement);
      const heroRect = readRect(hero);
      return {
        hero: heroRect,
        ctas,
        status,
        coin,
        ctaStatusOverlap: ctas.some(({ rect }) => overlaps(rect, status)),
        ctaCoinOverlap: ctas.some(({ rect }) => overlaps(rect, coin)),
        statusCoinOverlap: overlaps(status, coin),
        ctasWithinHero: ctas.every(({ rect }) => rect.left >= heroRect.left && rect.right <= heroRect.right && rect.top >= heroRect.top && rect.bottom <= heroRect.bottom),
      };
    });
    const violations = [];
    if (geometry.ctas.length !== 2) violations.push("both hero actions must exist");
    if (geometry.ctas.some(({ minHeight }) => minHeight < 44)) violations.push("CTA touch target is under 44px");
    if (geometry.ctaStatusOverlap) violations.push("hero actions overlap the demo status");
    if (geometry.ctaCoinOverlap) violations.push("hero actions overlap decorative coin art");
    if (geometry.statusCoinOverlap) violations.push("demo status overlaps decorative coin art");
    if (!geometry.ctasWithinHero) violations.push("hero action extends outside the panel");
    assert.deepEqual(violations, [], `mobile hero geometry failed at ${width}px: ${JSON.stringify(geometry)}`);
    mobileHeroGeometry.push({ width, ...geometry });
  };
  await runInOrder([390, 360, 320], checkMobileHeroWidth);
  interactionChecks.mobileHeroGeometry = mobileHeroGeometry;

  const checkResponsiveNavigationWidth = async (width) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin, { waitUntil: "networkidle" });
    const documentWidth = await page.evaluate(() => globalThis.document.documentElement.scrollWidth);
    assert.ok(documentWidth <= width, `responsive navigation must not create horizontal overflow at ${width}px: ${documentWidth}`);
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
      const linkVisibility = await Promise.all(
        Array.from({ length: await links.count() }, (_, index) => links.nth(index).isVisible()),
      );
      linkVisibility.forEach((visible, index) => {
        assert.equal(visible, true, `navigation link ${index + 1} must be reachable at ${width}px`);
      });
      const reachableLabels = ["Tools", "Videos", "About"];
      const labelVisibility = await Promise.all(
        reachableLabels.map((label) => page.getByRole("link", { name: label, exact: true }).isVisible()),
      );
      reachableLabels.forEach((label, index) => {
        assert.equal(labelVisibility[index], true, `${label} must be reachable at ${width}px`);
      });
      await page.getByRole("link", { name: "Tools", exact: true }).click();
      assert.equal(new URL(page.url()).hash, "#chain-lookup", `mouse can activate Tools at ${width}px`);
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      await toggle.focus();
      await page.keyboard.press("Enter");
      assert.equal(await toggle.getAttribute("aria-expanded"), "true", `keyboard can open navigation at ${width}px`);
      const aboutLink = page.getByRole("link", { name: "About", exact: true });
      await aboutLink.focus();
      await aboutLink.press("Enter");
      await page.waitForURL(/#footer$/, { timeout: 5_000 });
      assert.equal(new URL(page.url()).hash, "#footer", `keyboard can activate About at ${width}px`);
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      interactionChecks.responsiveNavigation.push({ width, control: "mouse and keyboard", expandedStateVerified: true, allLinksReachable: true });
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    } else {
      assert.equal(await toggle.isVisible(), false, "desktop navigation does not use a hidden menu toggle");
      assert.equal(await nav.isVisible(), true);
      assert.equal(await links.count(), 8);
      const linkVisibility = await Promise.all(
        Array.from({ length: await links.count() }, (_, index) => links.nth(index).isVisible()),
      );
      linkVisibility.forEach((visible, index) => {
        assert.equal(visible, true, `navigation link ${index + 1} must be visible at ${width}px`);
      });
      const reachableLabels = ["Tools", "Videos", "About"];
      const labelVisibility = await Promise.all(
        reachableLabels.map((label) => page.getByRole("link", { name: label, exact: true }).isVisible()),
      );
      reachableLabels.forEach((label, index) => {
        assert.equal(labelVisibility[index], true, `${label} must be reachable at ${width}px`);
      });
      const headerRects = await page.evaluate(() => [".brand", "#primary-nav", ".header-tools"].map((selector) => {
        const rect = globalThis.document.querySelector(selector).getBoundingClientRect();
        return { selector, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      }));
      for (let index = 1; index < headerRects.length; index += 1) {
        assert.ok(headerRects[index - 1].right <= headerRects[index].left + 1, `header regions overlap at ${width}px: ${JSON.stringify(headerRects)}`);
      }
      interactionChecks.responsiveNavigation.push({ width, control: "inline navigation", allLinksVisible: true, headerRegionsOverlap: false });
      await page.getByRole("link", { name: "Tools", exact: true }).click();
      assert.equal(new URL(page.url()).hash, "#chain-lookup", "mouse can activate Tools at the desktop boundary");
      const aboutLink = page.getByRole("link", { name: "About", exact: true });
      await aboutLink.focus();
      await aboutLink.press("Enter");
      await page.waitForURL(/#footer$/, { timeout: 5_000 });
      assert.equal(new URL(page.url()).hash, "#footer", "keyboard can activate About in the desktop navigation");
    }
  };
  await runInOrder([850, 851, 1024, 1050, 1051], checkResponsiveNavigationWidth);

  await page.setViewportSize({ width: 1536, height: 864 });
  await page.goto(origin, { waitUntil: "networkidle" });
  const destinations = [["Tools", "#chain-lookup"], ["Videos", "#demo-data"]];
  const destinationHrefs = await Promise.all(
    destinations.map(([label]) => page.getByRole("link", { name: label, exact: true }).getAttribute("href")),
  );
  destinations.forEach(([label, destination], index) => {
    assert.equal(destinationHrefs[index], destination, label + " must lead to its actual status");
  });
  await page.getByRole("link", { name: "Tools", exact: true }).click();
  assert.equal(new URL(page.url()).hash, "#chain-lookup");
  assert.match(await page.locator("#chain-lookup").textContent(), /Blockchain explorer lookup/);
  assert.match(await page.locator("#chain-lookup").textContent(), /Public identifiers only/);
  await page.getByRole("link", { name: "Videos", exact: true }).click();
  assert.equal(new URL(page.url()).hash, "#demo-data");
  assert.match(await page.locator("#demo-data").textContent(), /Video publishing and live feeds are unavailable/);
  interactionChecks.unavailableNavigation = { toolsTarget: "#chain-lookup", videosTarget: "#demo-data", destinationStatusVerified: true };
  // Tab presses are sequential focus moves; after the search input gains focus, later presses are skipped.
  const focusSearchByTab = () => Array.from({ length: 20 }).reduce(
    (previous) => previous.then(async (reached) => {
      if (reached) return true;
      await page.keyboard.press("Tab");
      return page.evaluate(() => globalThis.document.activeElement === globalThis.document.querySelector("[data-news-search]"));
    }),
    Promise.resolve(false),
  );
  const searchReachedByKeyboard = await focusSearchByTab();
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
  const noScriptForm = noScriptPage.locator("#newsletter form");
  assert.equal(await noScriptForm.getAttribute("method"), "post");
  assert.equal(await noScriptForm.getAttribute("action"), "/api/newsletter/subscribe");
  assert.equal(new URL(noScriptPage.url()).search, "", "no email address may be serialized into a query string");
  interactionChecks.noScriptNewsletter = { nativePost: true, addressSerialized: false, javascriptEnabled: false };
  await noScriptContext.close();
  const menu = page.locator("[data-menu-toggle]");
  await menu.click();
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  assert.equal(await page.locator("#primary-nav").isVisible(), true);
  await page.getByRole("link", { name: "Tools", exact: true }).click();
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(await page.locator("#primary-nav").isVisible(), false);
  interactionChecks.mobileNavigationLinkCloses = true;
  await page.getByRole("button", { name: /Bitcoin/ }).click();
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1);
  assert.equal(await page.locator("[data-news-card]:visible").getAttribute("data-category-value"), "Bitcoin");
  await page.setViewportSize({ width: 768, height: 1024 });
  const resultCount = page.locator("[data-result-count]");
  await page.locator("[data-news-search]").fill("no matching placeholder");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 0);
  assert.equal(await resultCount.textContent(), "0 placeholders");
  await page.locator("[data-category='All']").click();
  await page.locator("[data-news-search]").fill("Bitcoin");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1, "category labels are included in local search");
  assert.equal(await page.locator("[data-news-card]:visible").getAttribute("data-category-value"), "Bitcoin");
  assert.equal(await resultCount.textContent(), "1 placeholder");
  await page.locator("[data-news-search]").fill("Ethereum");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1, "Ethereum is searchable by category label");
  assert.equal(await page.locator("[data-news-card]:visible").getAttribute("data-category-value"), "Ethereum");
  await page.locator("[data-news-search]").fill("not-a-category-or-story");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 0, "unmatched text hides every placeholder");
  assert.equal(await resultCount.textContent(), "0 placeholders");
  await page.locator("[data-news-search]").fill("Bitcoin");
  await page.locator("[data-category='Ethereum']").click();
  assert.equal(await page.locator("[data-category='Ethereum']").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 0, "category selection remains combined with search");
  assert.equal(await resultCount.textContent(), "0 placeholders");
  await page.locator("[data-category='All']").click();
  assert.equal(await page.locator("[data-category='All']").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("[data-news-card]:visible").count(), 1, "All restores the category-inclusive query results");
  assert.equal(await resultCount.textContent(), "1 placeholder");
  interactionChecks.categorySearch = { bitcoin: 1, ethereum: 1, unmatched: 0, selectedCategory: "All", resetCount: 1, combinedCategoryFilterVerified: true };
  await page.locator("[data-news-search]").clear();
  assert.equal(await page.locator("[data-news-card]:visible").count(), 4);
  assert.equal(await resultCount.textContent(), "4 placeholders");
  assert.deepEqual(await page.locator("[data-news-card]:visible small").allTextContents(), ["DEMO", "DEMO", "DEMO", "DEMO"]);
  assert.equal(await page.locator("#newsletter form").getAttribute("action"), "/api/newsletter/subscribe");
  assert.equal(await page.locator("#newsletter input[name=locale]").inputValue(), "en");
  assert.match(await page.locator("[data-form-status]").textContent(), /Confirm the link we send/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await page.evaluate(() => globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches), true);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(externalRequests, []);
} catch (error) {
  runFailure = error;
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
try {
  const finalHeadSha = await readGitHead(repoRoot);
  assert.equal(finalHeadSha, headSha, "Git HEAD must remain unchanged during visual capture");
  visualInputState = assertVisualInputsClean(repoRoot);
} catch (error) {
  runFailure ??= error;
}
const reportBase = {
  generatedAt: runStartedAt,
  baseSha,
  headSha,
  visualInputState,
  fixture: "isolated Astro fixture; no shared /en route integration",
  origin,
  viewports: results,
  interactionChecks,
  consoleErrors,
  pageErrors,
  externalRequests,
  serverOutput: serverOutput.split(/\r?\n/).filter(Boolean).slice(-12),
};

try {
  if (shutdownFailure) throw shutdownFailure;
  if (runFailure) throw runFailure;
  await mkdir(evidenceDir, { recursive: true });
  const { readFile } = await import("node:fs/promises");
  await Promise.all(results.map(async (result) => {
    const screenshot = await readFile(join(evidenceDir, "golden-home-" + result.name + ".png"));
    result.screenshotSha256 = createHash("sha256").update(screenshot).digest("hex");
  }));
  const violations = results.flatMap((result) => result.axeViolations);
  if (violations.length) throw new Error("Axe violations: " + JSON.stringify(violations, null, 2));
  const globalViolations = results.flatMap((result) => result.fullPageAxeViolations);
  const unexpectedGlobalViolations = globalViolations.filter((violation) =>
    violation.id !== "region" || violation.nodes.some((node) => !node.target.includes(".skip-link"))
  );
  if (unexpectedGlobalViolations.length) throw new Error("Unexpected full-page Axe violations: " + JSON.stringify(unexpectedGlobalViolations, null, 2));
  const report = { ...reportBase, status: "passed" };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ reportPath, screenshots: results.map(({ name, width, height, screenshotSha256 }) => ({ name, width, height, screenshotSha256 })), viewports: results.map(({ name, documentWidth, axeViolations, fullPageAxeViolations }) => ({ name, documentWidth, moduleAxeViolationCount: axeViolations.length, fullPageAxeViolations })), consoleErrors, pageErrors, externalRequests }, null, 2));
} catch (error) {
  await writeVisualCheckFailure(reportPath, reportBase, error);
  throw error;
}
