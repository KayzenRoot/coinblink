/* global document, HTMLImageElement, HTMLElement, getComputedStyle, innerWidth, location, matchMedia, scrollTo */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { arch, cpus, platform } from "node:os";
import { chromium, firefox, webkit } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const repoRoot = resolve(fileURLToPath(new URL("../../../../", import.meta.url)));
const evidenceRoot = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "r27-browser-qa");
const screenshotRoot = join(evidenceRoot, "screenshots");
const origin = (process.env.CB_R27_BASE_URL || "http://127.0.0.1:3001").replace(/\/+$/u, "");
const route = origin + "/en";
const outputPath = join(evidenceRoot, "R27_BROWSER_PERFORMANCE_VISUAL_QA.json");
const baseSha = "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c";
const viewports = [
  { name: "desktop", width: 1536, height: 864 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const report = {
  status: "RUNNING",
  generatedAt: new Date().toISOString(),
  baseSha,
  testedHeadSha: null,
  preview: { origin, route: "/en", runtime: "existing local Docker Compose preview; read-only test traffic" },
  runtime: { node: process.version, platform: platform(), arch: arch(), logicalCpus: cpus().length },
  browsers: [],
  screenshots: [],
  visualChecks: [],
  r26GeometryComparison: null,
  selectionMatrix: [],
  connectionChange: null,
  failureMatrix: [],
  performance: [],
  assetHashes: [],
  errors: [],
  limitations: [
    "Laboratory measurements from one local PC and Docker preview; not field Core Web Vitals.",
    "200 percent zoom is represented by a 768x432 CSS viewport equivalent; Playwright did not control browser chrome zoom.",
    "Image decode measurement is the browser HTMLImageElement.decode() completion probe after load; it does not claim animation frame decode cost.",
  ],
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const save = async () => writeFile(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");
const sameOrigin = (url) => {
  try { return new URL(url).origin === origin; } catch { return false; }
};
const imagePath = (url) => {
  try { return new URL(url).pathname; } catch { return ""; }
};
const assetInventory = async (directory) => {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await assetInventory(path));
    else if (/\.(?:png|webp)$/iu.test(entry.name)) {
      const bytes = await readFile(path);
      output.push({
        path: relative(repoRoot, path).replaceAll("\\", "/"),
        bytes: bytes.length,
        sha256: sha256(bytes),
      });
    }
  }
  return output;
};

async function verifyR26AssetProvenance() {
  const manifestPath = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "r26-static-asset-provenance.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const actual = new Map(report.assetHashes.map((asset) => [asset.path, asset]));
  const verifiedAssets = [];
  for (const asset of manifest.assets) {
    const references = [
      { record: asset.sourceMaster },
      { record: asset.derivatives.png },
      { record: asset.derivatives.webp },
    ];
    for (const reference of references) {
      const measured = actual.get(reference.record.path);
      assert.ok(measured, "R26 provenance path must exist in the module asset inventory: " + reference.record.path);
      assert.equal(measured.sha256, reference.record.sha256, "R26 asset hash must match its provenance record: " + reference.record.path);
      assert.equal(measured.bytes, reference.record.bytes, "R26 asset byte length must match its provenance record: " + reference.record.path);
    }
    verifiedAssets.push({
      assetId: asset.assetId,
      region: asset.region,
      sourceMaster: { path: asset.sourceMaster.path, width: asset.sourceMaster.width, height: asset.sourceMaster.height, sha256: asset.sourceMaster.sha256 },
      derivatives: {
        png: { path: asset.derivatives.png.path, width: asset.derivatives.png.width, height: asset.derivatives.png.height, sha256: asset.derivatives.png.sha256 },
        webp: { path: asset.derivatives.webp.path, width: asset.derivatives.webp.width, height: asset.derivatives.webp.height, sha256: asset.derivatives.webp.sha256 },
      },
    });
  }
  return {
    manifestPath: relative(repoRoot, manifestPath).replaceAll("\\", "/"),
    verifiedAssets,
  };
}

function installObservers(context) {
  return context.addInitScript(() => {
    const values = { lcpMs: null, cls: 0, longTaskCount: 0, longTaskDurationMs: 0, imageLoadToDecodeMs: [] };
    Object.defineProperty(globalThis, "__r27Metrics", { value: values });
    if (globalThis.PerformanceObserver?.supportedEntryTypes?.includes("largest-contentful-paint")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) values.lcpMs = Math.round(entry.startTime * 100) / 100;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }
    if (globalThis.PerformanceObserver?.supportedEntryTypes?.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) values.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    }
    if (globalThis.PerformanceObserver?.supportedEntryTypes?.includes("longtask")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          values.longTaskCount += 1;
          values.longTaskDurationMs += entry.duration;
        }
      }).observe({ type: "longtask", buffered: true });
    }
    document.addEventListener("load", (event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      const entry = performance.getEntriesByName(event.target.currentSrc).at(-1);
      if (entry) values.imageLoadToDecodeMs.push(Math.max(0, performance.now() - entry.responseEnd));
    }, true);
  });
}

async function setConnection(context, { saveData = false, effectiveType = "4g" } = {}) {
  await context.addInitScript((profile) => {
    const persistedEffectiveType = sessionStorage.getItem("__r27EffectiveType");
    const connection = {
      saveData: profile.saveData,
      effectiveType: persistedEffectiveType || profile.effectiveType,
      downlink: 10,
      rtt: 30,
    };
    Object.defineProperty(navigator, "connection", { configurable: true, value: connection });
    Object.defineProperty(globalThis, "__r27Connection", { configurable: true, value: connection });
  }, { saveData, effectiveType });
}

async function inspectHero(page) {
  return page.locator(".hero-cinematic-preview img").evaluate(async (image) => {
    let decodeMs = null;
    if (image.naturalWidth > 0) {
      const start = performance.now();
      await image.decode();
      decodeMs = Math.round((performance.now() - start) * 100) / 100;
    }
    const scene = image.closest(".hero-scene");
    return {
      currentSrc: image.currentSrc,
      path: new URL(image.currentSrc || image.src, document.baseURI).pathname,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      decodePromiseMs: decodeMs,
      previewActive: scene.classList.contains("has-cinematic-preview"),
      previewOpacity: getComputedStyle(image.closest("picture")).opacity,
      vectorFallbackVisible: getComputedStyle(scene.querySelector(".coin-art")).visibility !== "hidden",
      prefersReducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      connection: navigator.connection ? {
        saveData: navigator.connection.saveData === true,
        effectiveType: navigator.connection.effectiveType || null,
      } : null,
    };
  });
}

async function createRoutedPage(browser, { viewport, reducedMotion = "no-preference", connection, failPath, rewriteWebp = false, headers } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor: 1, ...(headers ? { extraHTTPHeaders: headers } : {}) });
  await installObservers(context);
  if (connection) await setConnection(context, connection);
  const page = await context.newPage();
  const externalRequests = [];
  const failedPaths = {};
  page.on("request", (request) => { if (!sameOrigin(request.url())) externalRequests.push(request.url()); });
  await page.route("**/*", async (requestRoute) => {
    const url = requestRoute.request().url();
    if (!sameOrigin(url)) {
      await requestRoute.abort();
      return;
    }
    const pathname = imagePath(url);
    if (failPath?.(pathname)) {
      failedPaths[pathname] = (failedPaths[pathname] || 0) + 1;
      await requestRoute.abort("failed");
      return;
    }
    if (rewriteWebp && pathname === "/en") {
      const response = await requestRoute.fetch();
      let body = await response.text();
      const original = body;
      body = body.replaceAll('type="image/webp"', 'type="image/x-r27-unsupported"');
      assert.notEqual(body, original, "the PNG-only scenario must disable the WebP picture sources in its in-memory response");
      const responseHeaders = { ...response.headers() };
      delete responseHeaders["content-encoding"];
      delete responseHeaders["content-length"];
      delete responseHeaders["transfer-encoding"];
      await requestRoute.fulfill({ status: response.status(), headers: responseHeaders, body });
      return;
    }
    await requestRoute.continue();
  });
  return { context, page, externalRequests, failedPaths };
}

async function assertNoBrokenVisibleImages(page) {
  return page.locator("img").evaluateAll((images) => images.filter((image) => {
    if (!image.complete || image.naturalWidth > 0) return false;
    let node = image;
    while (node instanceof HTMLElement) {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 || rect.width === 0 || rect.height === 0) return false;
      node = node.parentElement;
    }
    return true;
  }).map((image) => image.currentSrc || image.src));
}

async function captureBrowser(target) {
  const browser = await target.launch();
  const browserInfo = { name: target.name, version: browser.version(), viewports: [] };
  report.browsers.push(browserInfo);
  const baselineText = execFileSync("git", ["show", "HEAD:.engineering/evidence/CB-M01-WO-001/r26-integrated-visual-check.json"], { cwd: repoRoot, encoding: "utf8" });
  const baseline = JSON.parse(baselineText);
  const geometryBaseline = baseline.desktopGeometry || {};

  for (const viewport of viewports) {
    const { context, page, externalRequests } = await createRoutedPage(browser, {
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "no-preference",
    });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const response = await page.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
    assert.equal(response?.status(), 200, target.name + " " + viewport.name + " /en must return HTTP 200");
    await page.locator(".cb-home").waitFor({ state: "visible" });
    await page.locator(".hero-cinematic-preview img").evaluate((image) => image.decode());
    const hero = await inspectHero(page);
    const limitedConnection = hero.connection?.saveData === true
      || ["slow-2g", "2g", "3g"].includes(hero.connection?.effectiveType);
    const expectedSelection = hero.prefersReducedMotion || limitedConnection ? "static" : "motion";
    const selectedMedia = /hero-cinematic-motion[^/]*\.webp$/u.test(hero.path) ? "motion" : "static";
    assert.equal(selectedMedia, expectedSelection,
      target.name + " must select media according to its observed reduced-motion and connection profile");
    assert.equal(await page.title(), "CoinBlink · Crypto news in a blink");
    assert.equal(await page.locator(".demo-banner").count(), 1);
    const demoCtaCount = await page.locator('a[href="#demo-data"]').count();
    assert.ok(demoCtaCount >= 1, target.name + " " + viewport.name + " must retain a local demo CTA");
    const staticImageCount = await page.locator(".promo-image img, .editorial-image img").count();
    const staticImages = [];
    for (let imageIndex = 0; imageIndex < staticImageCount; imageIndex += 1) {
      const image = page.locator(".promo-image img, .editorial-image img").nth(imageIndex);
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => element.decode());
      const asset = await image.evaluate((element) => ({
        region: element.closest("picture").dataset.previewRegion,
        path: new URL(element.currentSrc).pathname,
        width: element.naturalWidth,
        height: element.naturalHeight,
        complete: element.complete,
      }));
      assert.equal(asset.complete, true);
      if (asset.region === "promo") assert.equal(asset.width + "x" + asset.height, "1200x600");
      else assert.equal(asset.width + "x" + asset.height, "768x512");
      staticImages.push(asset);
    }
    assert.equal(staticImages.length, 5, "the promo and four editorial preview images must decode");
    await page.evaluate(() => scrollTo(0, 0));
    const layout = await page.evaluate(() => ({
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      demoBanner: ".demo-banner",
      geometry: Object.fromEntries([
        [".demo-banner", ".demo-banner"], [".cb-header", ".cb-header"], [".hero-panel", ".hero-panel"],
        [".market-panel", ".market-panel"], [".ticker-strip", ".ticker-strip"], [".trending-strip", ".trending-strip"],
        [".category-rail", ".category-rail"], [".content-grid", ".content-grid"], ["#latest-news", "#latest-news"],
        [".news-cards", ".news-cards"], ["#newsletter", "#newsletter"],
      ].map(([key, selector]) => {
        const rect = document.querySelector(selector)?.getBoundingClientRect();
        return [key, rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom } : null];
      })),
    }));
    assert.equal(layout.documentWidth, viewport.width, target.name + " " + viewport.name + " must not overflow horizontally");
    const fullAxe = await new AxeBuilder({ page }).analyze();
    const moduleAxe = await new AxeBuilder({ page }).include(".cb-home").analyze();
    const violations = [...fullAxe.violations, ...moduleAxe.violations].map((violation) => ({
      id: violation.id, impact: violation.impact, help: violation.help, nodes: violation.nodes.length,
    }));
    assert.equal(violations.length, 0, target.name + " " + viewport.name + " Axe scan must have no violations");
    const imageResponse = await page.locator(".hero-cinematic-preview img").evaluate((image) => {
      const entry = performance.getEntriesByName(image.currentSrc).at(-1);
      return entry ? {
        path: new URL(entry.name).pathname,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        durationMs: Math.round(entry.duration * 100) / 100,
      } : null;
    });
    const screenshotPath = join(screenshotRoot, target.name + "-" + viewport.name + "-" + viewport.width + "x" + viewport.height + ".png");
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled" });
    const screenshot = await readFile(screenshotPath);
    const result = {
      name: viewport.name,
      width: viewport.width,
      height: viewport.height,
      documentWidth: layout.documentWidth,
      documentHeight: layout.documentHeight,
      demoCtaCount,
      hero,
      staticImages,
      heroResponse: imageResponse,
      axeViolationCount: violations.length,
      axeViolations: violations,
      consoleErrors,
      pageErrors,
      externalRequests,
      geometry: layout.geometry,
      screenshot: {
        path: relative(repoRoot, screenshotPath).replaceAll("\\", "/"),
        bytes: screenshot.length,
        sha256: sha256(screenshot),
      },
    };
    browserInfo.viewports.push(result);
    report.screenshots.push({ browser: target.name, ...result.screenshot, width: viewport.width, height: viewport.height });
    report.visualChecks.push({ browser: target.name, ...result });
    assert.equal(consoleErrors.length + pageErrors.length + externalRequests.length, 0,
      target.name + " " + viewport.name + " must have no console/page errors or external requests");

    if (viewport.name === "desktop") {
      const differences = {};
      for (const [selector, current] of Object.entries(layout.geometry)) {
        const prior = geometryBaseline[selector];
        if (!prior || !current) continue;
        differences[selector] = Object.fromEntries(["x", "y", "width", "height", "bottom"].map((key) => [key, Math.round((current[key] - prior[key]) * 100) / 100]));
      }
      if (!report.r26GeometryComparison) {
        report.r26GeometryComparison = {
          baselineHeadSha: baseline.headSha,
          comparedWith: "R26 integrated desktopGeometry in the frozen tested HEAD",
          differencesPxByBrowser: {},
          rule: "Captured geometry differences are reported as measured; no aesthetic edit is made by this QA run.",
        };
      }
      report.r26GeometryComparison.differencesPxByBrowser[target.name] = differences;
    }

    if (viewport.name === "desktop") {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => {
        const active = document.activeElement;
        const style = active instanceof HTMLElement ? getComputedStyle(active) : null;
        return {
          tagName: active?.tagName || null,
          label: active?.getAttribute("aria-label") || active?.textContent?.trim().slice(0, 80) || null,
          focusVisible: active instanceof HTMLElement && active.matches(":focus-visible"),
          outlineStyle: style?.outlineStyle || null,
          outlineWidth: style?.outlineWidth || null,
          boxShadow: style?.boxShadow || null,
        };
      });
      assert.equal(focus.focusVisible, true, target.name + " first keyboard tab must expose a visible focus state");
      browserInfo.keyboardFocus = focus;
    }
    await context.close();
  }

  const zoomContext = await browser.newContext({ viewport: { width: 768, height: 432 }, reducedMotion: "no-preference" });
  const zoomPage = await zoomContext.newPage();
  const zoomResponse = await zoomPage.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
  assert.equal(zoomResponse?.status(), 200);
  const zoom = await zoomPage.evaluate(() => ({
    viewportWidth: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  assert.equal(zoom.documentWidth, 768, target.name + " 200 percent equivalent viewport must not overflow horizontally");
  browserInfo.zoomEquivalent = { ...zoom, method: "768x432 CSS viewport equivalent to 1536x864 at 200 percent; not browser chrome zoom" };
  await zoomContext.close();
  await browser.close();
}

async function testSelectionMatrix(browser) {
  const cases = [
    { name: "desktop-no-preference-4g", reducedMotion: "no-preference", connection: { effectiveType: "4g" }, expected: "motion" },
    { name: "reduced-motion", reducedMotion: "reduce", connection: { effectiveType: "4g" }, expected: "static" },
    { name: "save-data-4g", reducedMotion: "no-preference", connection: { saveData: true, effectiveType: "4g" }, expected: "static" },
    { name: "slow-2g", reducedMotion: "no-preference", connection: { effectiveType: "slow-2g" }, expected: "static" },
    { name: "2g", reducedMotion: "no-preference", connection: { effectiveType: "2g" }, expected: "static" },
    { name: "3g", reducedMotion: "no-preference", connection: { effectiveType: "3g" }, expected: "static" },
    { name: "4g", reducedMotion: "no-preference", connection: { effectiveType: "4g" }, expected: "motion" },
  ];
  for (const item of cases) {
    const { context, page } = await createRoutedPage(browser, {
      viewport: { width: 390, height: 844 },
      reducedMotion: item.reducedMotion,
      connection: item.connection,
      headers: item.connection.saveData ? { "Save-Data": "on" } : undefined,
    });
    const response = await page.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
    assert.equal(response?.status(), 200);
    const hero = await inspectHero(page);
    const selection = /hero-cinematic-motion[^/]*\.webp$/u.test(hero.path) ? "motion" : "static";
    assert.equal(selection, item.expected, item.name + " must match the approved media selection policy");
    report.selectionMatrix.push({ name: item.name, expected: item.expected, selected: selection, path: hero.path, saveData: item.connection.saveData === true, effectiveType: item.connection.effectiveType, reducedMotion: item.reducedMotion });
    await context.close();
  }

  const { context, page } = await createRoutedPage(browser, {
    viewport: { width: 390, height: 844 },
    connection: { effectiveType: "4g" },
  });
  await page.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
  const before = await inspectHero(page);
  await page.evaluate(() => {
    globalThis.__r27Connection.effectiveType = "3g";
    sessionStorage.setItem("__r27EffectiveType", "3g");
  });
  const withoutReload = await inspectHero(page);
  assert.equal(withoutReload.path, before.path, "connection changes during the session must not silently switch source before reload");
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await inspectHero(page);
  assert.match(afterReload.path, /hero-cinematic-original[^/]*\.webp$/u, "connection change must select static media after reload");
  report.connectionChange = { initialEffectiveType: "4g", changedTo: "3g", selectedBeforeReload: before.path, remainedBeforeReload: withoutReload.path, selectedAfterReload: afterReload.path, reloadRequired: true };
  await context.close();
}

async function testFailureMatrix(browser) {
  const cases = [
    {
      name: "motion-failure-uses-static-webp",
      failPath: (path) => /hero-cinematic-motion[^/]*\.webp$/u.test(path),
      reducedMotion: "no-preference",
      expected: /hero-cinematic-original[^/]*\.webp$/u,
    },
    {
      name: "static-webp-failure-uses-png",
      failPath: (path) => /hero-cinematic-original[^/]*\.webp$/u.test(path),
      reducedMotion: "reduce",
      expected: /hero-cinematic-original[^/]*\.png$/u,
    },
    {
      name: "png-failure-keeps-vector-fallback",
      failPath: (path) => /hero-cinematic-original[^/]*\.png$/u.test(path),
      reducedMotion: "reduce",
      rewriteWebp: true,
      expected: /hero-cinematic-original[^/]*\.png$/u,
    },
    {
      name: "promo-editorial-failure-keeps-original-illustrations",
      failPath: (path) => /(?:promo|bitcoin|ethereum|policy|ecosystem)[^/]*\.(?:webp|png)$/u.test(path),
      reducedMotion: "reduce",
      expected: /hero-cinematic-original[^/]*\.webp$/u,
    },
    {
      name: "full-hero-failure-keeps-vector-fallback",
      failPath: (path) => /hero-cinematic-(?:motion|original)[^/]*\.(?:webp|png)$/u.test(path),
      reducedMotion: "no-preference",
      expected: null,
    },
  ];
  for (const item of cases) {
    const { context, page, externalRequests, failedPaths } = await createRoutedPage(browser, {
      viewport: { width: 1536, height: 864 },
      reducedMotion: item.reducedMotion,
      failPath: item.failPath,
      rewriteWebp: item.rewriteWebp === true,
    });
    const response = await page.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
    assert.equal(response?.status(), 200);
    if (item.name.includes("promo-editorial")) {
      const images = page.locator(".promo-image img, .editorial-image img");
      for (let imageIndex = 0; imageIndex < await images.count(); imageIndex += 1) {
        const image = images.nth(imageIndex);
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element) => element.complete ? null : new Promise((resolve) => {
          element.addEventListener("load", resolve, { once: true });
          element.addEventListener("error", resolve, { once: true });
        }));
      }
      for (const marker of ["promo", "bitcoin", "ethereum", "policy", "ecosystem"]) {
        assert.ok(Object.keys(failedPaths).some((path) => path.includes(marker)),
          "the injected failure must reach the " + marker + " R26 static preview");
      }
    }
    await page.waitForTimeout(100);
    const hero = await inspectHero(page);
    const brokenVisibleImages = await assertNoBrokenVisibleImages(page);
    if (item.expected) assert.match(hero.path, item.expected, item.name + " must fall back to the next supported source");
    else assert.equal(hero.previewActive, false, "full hero failure must reveal the original local vector scene");
    if (item.name.includes("promo-editorial")) {
      const fallbacks = await page.evaluate(() => ({
        promoVectorVisible: getComputedStyle(document.querySelector(".promo-panel .promo-scene")).opacity !== "0",
        editorialsVisible: Array.from(document.querySelectorAll(".news-art .editorial-artwork")).every((node) => getComputedStyle(node).opacity !== "0"),
        editorialCount: document.querySelectorAll(".news-art .editorial-artwork").length,
      }));
      assert.equal(fallbacks.promoVectorVisible, true);
      assert.equal(fallbacks.editorialsVisible, true);
      assert.equal(fallbacks.editorialCount, 4);
      report.failureMatrix.push({ name: item.name, hero, fallbacks, brokenVisibleImages, failedPaths, externalRequests });
    } else {
      report.failureMatrix.push({ name: item.name, hero, brokenVisibleImages, failedPaths, externalRequests });
    }
    assert.deepEqual(brokenVisibleImages, [], item.name + " must not leave a broken visible image");
    assert.deepEqual(externalRequests, [], item.name + " must not request an external origin");
    assert.ok(Object.values(failedPaths).every((count) => count === 1), item.name + " must not retry failed assets in a loop");
    if (item.name === "motion-failure-uses-static-webp") {
      assert.ok(Object.keys(failedPaths).some((path) => /hero-cinematic-motion/u.test(path)));
    } else if (item.name === "static-webp-failure-uses-png") {
      assert.ok(Object.keys(failedPaths).some((path) => /hero-cinematic-original/u.test(path) && /\.webp$/u.test(path)));
    } else if (item.name === "png-failure-keeps-vector-fallback") {
      assert.ok(Object.keys(failedPaths).some((path) => /hero-cinematic-original/u.test(path) && /\.png$/u.test(path)));
    } else if (item.name === "full-hero-failure-keeps-vector-fallback") {
      assert.ok(["hero-cinematic-motion", "hero-cinematic-original"].every((marker) =>
        Object.keys(failedPaths).some((path) => path.includes(marker))));
    }
    await context.close();
  }
}

async function measureScenario(browser, scenario) {
  const samples = [];
  for (let index = 1; index <= 3; index += 1) {
    const { context, page, externalRequests } = await createRoutedPage(browser, {
      viewport: scenario.viewport,
      reducedMotion: scenario.reducedMotion,
      connection: scenario.connection,
      headers: scenario.connection.saveData ? { "Save-Data": "on" } : undefined,
    });
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (scenario.network) {
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: scenario.network.latencyMs,
        downloadThroughput: scenario.network.downloadBytesPerSecond,
        uploadThroughput: scenario.network.uploadBytesPerSecond,
        connectionType: scenario.network.connectionType,
      });
    }
    let sameOriginRequestCount = 0;
    page.on("request", (request) => { if (sameOrigin(request.url())) sameOriginRequestCount += 1; });
    const response = await page.goto(route, { waitUntil: "networkidle", timeout: 60_000 });
    assert.equal(response?.status(), 200);
    await page.waitForTimeout(1_200);
    const hero = await inspectHero(page);
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType("resource");
      const image = document.querySelector(".hero-cinematic-preview img");
      const resource = entries.filter((entry) => entry.name === image.currentSrc).at(-1);
      const values = globalThis.__r27Metrics;
      return {
        lcpMs: values.lcpMs,
        cls: Math.round(values.cls * 1_000_000) / 1_000_000,
        longTaskCount: values.longTaskCount,
        longTaskDurationMs: Math.round(values.longTaskDurationMs * 100) / 100,
        imageLoadToDecodeMs: values.imageLoadToDecodeMs,
        heroResource: resource ? {
          path: new URL(resource.name).pathname,
          transferSize: resource.transferSize,
          encodedBodySize: resource.encodedBodySize,
          durationMs: Math.round(resource.duration * 100) / 100,
        } : null,
        sameOriginTransferBytes: entries.filter((entry) => new URL(entry.name).origin === location.origin).reduce((sum, entry) => sum + entry.transferSize, 0),
      };
    });
    assert.ok(hero.complete && hero.naturalWidth > 0, scenario.name + " must fully load the selected hero image");
    assert.deepEqual(externalRequests, [], scenario.name + " must not request external origins");
    samples.push({
      repeat: index,
      heroPath: hero.path,
      heroWidth: hero.naturalWidth,
      heroHeight: hero.naturalHeight,
      decodePromiseMs: hero.decodePromiseMs,
      requestCount: sameOriginRequestCount,
      metrics,
    });
    await client.detach();
    await context.close();
  }
  report.performance.push({
    name: scenario.name,
    viewport: scenario.viewport,
    cache: "disabled; new browser context for each repeat",
    connection: scenario.connection,
    network: scenario.network || "unthrottled local network",
    repeats: samples,
  });
}

async function main() {
  await mkdir(screenshotRoot, { recursive: true });
  report.testedHeadSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
  report.assetHashes = await assetInventory(join(repoRoot, "src", "modules", "CB-M01"));
  report.r26AssetProvenance = await verifyR26AssetProvenance();
  const health = await fetch(origin + "/health", { signal: AbortSignal.timeout(8_000) });
  assert.equal(health.status, 200, "the local Docker preview /health endpoint must return HTTP 200");
  const app = await fetch(route, { signal: AbortSignal.timeout(8_000) });
  assert.equal(app.status, 200, "the local Docker preview /en route must return HTTP 200");

  const targets = [
    { name: "chromium", launch: () => chromium.launch({ headless: true }) },
    { name: "msedge", launch: () => chromium.launch({ headless: true, channel: "msedge" }) },
  ];
  for (const candidate of [
    { name: "firefox", type: firefox },
    { name: "webkit", type: webkit },
  ]) {
    try {
      const optional = await candidate.type.launch({ headless: true });
      report.browsers.push({ name: candidate.name, available: true, version: optional.version(), notSelected: "not in the current browser matrix" });
      await optional.close();
      targets.push({ name: candidate.name, launch: () => candidate.type.launch({ headless: true }) });
    } catch {
      report.browsers.push({ name: candidate.name, available: false, note: "browser binary not installed; no download attempted" });
    }
  }

  for (const target of targets) await captureBrowser(target);
  const browser = await chromium.launch({ headless: true });
  await testSelectionMatrix(browser);
  await testFailureMatrix(browser);
  await measureScenario(browser, {
    name: "desktop-motion",
    viewport: { width: 1536, height: 864 },
    reducedMotion: "no-preference",
    connection: { effectiveType: "4g" },
  });
  await measureScenario(browser, {
    name: "mobile-static-3g-save-data",
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
    connection: { saveData: true, effectiveType: "3g" },
    network: { latencyMs: 150, downloadBytesPerSecond: 200 * 1024, uploadBytesPerSecond: 64 * 1024, connectionType: "cellular3g" },
  });
  await measureScenario(browser, {
    name: "mobile-motion-4g",
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
    connection: { effectiveType: "4g" },
    network: { latencyMs: 40, downloadBytesPerSecond: 1_125 * 1024, uploadBytesPerSecond: 375 * 1024, connectionType: "cellular4g" },
  });
  await browser.close();
  report.status = "R27_DEMO_QA_PASS";
}

try {
  await main();
} catch (error) {
  report.status = "R27_CORRECTION_REQUIRED";
  const sourceLocation = String(error?.stack || "").match(/r27-browser-performance-visual-qa\.mjs:(\d+):(\d+)/u);
  report.errors.push({
    name: String(error?.name || "Error"),
    message: String(error?.message || error).slice(0, 2_000),
    sourceLocation: sourceLocation ? { line: Number(sourceLocation[1]), column: Number(sourceLocation[2]) } : null,
  });
  process.exitCode = 1;
} finally {
  report.completedAt = new Date().toISOString();
  await save();
}

if (report.status !== "R27_DEMO_QA_PASS") throw new Error("R27 browser QA failed; inspect " + outputPath);
