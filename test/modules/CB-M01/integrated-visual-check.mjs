import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync, spawn } from "node:child_process";
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
import { waitForFixtureReady } from "./visual-server.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const baseSha = "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c";
const evidenceRoot = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001");
const screenshotDir = join(evidenceRoot, "screenshots");
const reportPath = join(evidenceRoot, "integrated-visual-check.json");
const viewports = [
  { name: "desktop", width: 1536, height: 864 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const report = {
  status: "running",
  generatedAt: new Date().toISOString(),
  baseSha,
  headSha: null,
  route: "/en",
  fixture: "built integrated /en route via Wrangler local mode with remote bindings disabled and the Astro dev toolbar disabled",
  runtime: "Wrangler 4.149.0 --local",
  origin: null,
  visualInputState: null,
  viewports: [],
  screenshots: [],
  renderPerformance: [],
  desktopGeometry: null,
  mobileHero: null,
  consoleErrors: [],
  pageErrors: [],
  externalRequests: [],
};
let server;
let browser;
let persistDir;
let runFailure = null;

async function availablePort() {
  const listener = createServer();
  await new Promise((resolveListen, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolveListen);
  });
  const address = listener.address();
  await new Promise((resolveClose) => listener.close(resolveClose));
  assert.ok(address && typeof address === "object");
  return address.port;
}

async function saveReport(status, failure = null) {
  report.status = status;
  if (failure) report.failure = { name: String(failure.name || "Error"), message: String(failure.message || failure).slice(0, 2_000) };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return true;
  server.kill();
  await Promise.race([once(server, "exit"), new Promise((resolveExit) => setTimeout(resolveExit, 3_000))]);
  if (server.exitCode === null && server.signalCode === null) {
    server.kill("SIGKILL");
    await Promise.race([once(server, "exit"), new Promise((resolveExit) => setTimeout(resolveExit, 3_000))]);
  }
  return server.exitCode !== null || server.signalCode !== null;
}

await mkdir(screenshotDir, { recursive: true });
await saveReport("running");

try {
  report.headSha = await readGitHead(repoRoot);
  report.visualInputState = assertVisualInputsClean(repoRoot);
  const port = await availablePort();
  report.origin = "http://127.0.0.1:" + port;
  const astroCli = join(repoRoot, "node_modules", "astro", "bin", "astro.mjs");
  const wranglerCli = join(repoRoot, "node_modules", "wrangler", "bin", "wrangler.js");
  const config = join("test", "modules", "CB-M01", "astro-integration.config.mjs");
  const safeEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/(TOKEN|SECRET|PASSWORD|CREDENTIAL|CLOUDFLARE|PRIVATE_KEY)/iu.test(key)));
  safeEnv.CI = "true";
  safeEnv.WRANGLER_SEND_METRICS = "false";
  execFileSync(process.execPath, [astroCli, "build", "--config=" + config], { cwd: repoRoot, env: safeEnv, stdio: "ignore", windowsHide: true });
  persistDir = await mkdtemp(join(tmpdir(), "coinblink-m01-wrangler-local-"));
  server = spawn(process.execPath, [wranglerCli, "dev", "--config", "./dist/server/wrangler.json", "--local", "--ip", "127.0.0.1", "--port", String(port), "--persist-to", persistDir, "--show-interactive-dev-session=false", "--log-level", "error"], {
    cwd: repoRoot,
    windowsHide: true,
    stdio: ["ignore", "ignore", "ignore"],
    env: safeEnv,
  });
  await once(server, "spawn");
  const ready = await waitForFixtureReady({ child: server, origin: report.origin + "/en" });
  assert.equal(ready.status, 200, "the integrated /en route must respond with HTTP 200");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const values = { largestContentfulPaintMs: null, cumulativeLayoutShift: 0 };
    Object.defineProperty(globalThis, "__coinblinkR25Vitals", { value: values });
    if (globalThis.PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
      new globalThis.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          values.largestContentfulPaintMs = Math.round(entry.startTime * 100) / 100;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }
    if (globalThis.PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new globalThis.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) values.cumulativeLayoutShift += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
  });
  page.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!isFixtureOriginRequest(request.url(), report.origin)) report.externalRequests.push(request.url());
  });

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto(report.origin + "/en", { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, viewport.name + " /en must return HTTP 200");
    assert.equal(await page.title(), "CoinBlink · Crypto news in a blink");
    assert.equal(await page.locator(".cb-home").count(), 1);
    const cinematicPreview = await page.locator(".hero-cinematic-preview img").evaluate(async (image, origin) => {
      await image.decode();
      const scene = image.closest(".hero-scene");
      const rect = image.getBoundingClientRect();
      return {
        fullyDecoded: true,
        complete: image.complete,
        width: image.naturalWidth,
        height: image.naturalHeight,
        path: new URL(image.currentSrc).pathname,
        currentOrigin: new URL(image.currentSrc).origin,
        allowedOrigin: origin,
        previewActive: scene.classList.contains("has-cinematic-preview"),
        visible: globalThis.getComputedStyle(image.parentElement).opacity !== "0",
        sceneOpacity: globalThis.getComputedStyle(scene).opacity,
        objectFit: globalThis.getComputedStyle(image).objectFit,
        objectPosition: globalThis.getComputedStyle(image).objectPosition,
        widthOnScreen: rect.width,
        heightOnScreen: rect.height,
        selectedSource: image.currentSrc,
        visibleArtworkStart: image.getBoundingClientRect().left + image.getBoundingClientRect().width * 0.58,
        copyRight: scene.parentElement.querySelector(".hero-copy").getBoundingClientRect().right,
        loading: image.loading,
        fetchPriority: image.fetchPriority,
      };
    }, report.origin);
    assert.ok(cinematicPreview.complete && cinematicPreview.fullyDecoded
      && cinematicPreview.width === 640 && cinematicPreview.height === 320,
      viewport.name + " Blender motion derivative must fully decode at 640x320");
    assert.equal(cinematicPreview.currentOrigin, cinematicPreview.allowedOrigin,
      viewport.name + " Blender preview must be served by the local fixture only");
    assert.match(cinematicPreview.path, /hero-cinematic-motion[^/]*\.webp$/u,
      viewport.name + " no-preference browser must choose the local Blender motion derivative");
    assert.ok(cinematicPreview.previewActive && cinematicPreview.visible
      && cinematicPreview.widthOnScreen > 100 && cinematicPreview.heightOnScreen > 40,
    viewport.name + " Blender preview must be visible after decode");
    assert.equal(cinematicPreview.loading, "eager");
    assert.equal(cinematicPreview.fetchPriority, "high");
    if (viewport.name === "tablet") {
      assert.equal(cinematicPreview.objectFit, "contain", "tablet preview must preserve the full coin in the narrower hero");
      assert.ok(cinematicPreview.visibleArtworkStart >= cinematicPreview.copyRight - 1,
        "tablet motion art must remain behind the text-free part of the masked image");
    }
    if (viewport.name === "mobile") {
      assert.equal(cinematicPreview.sceneOpacity, "1", "loaded Blender motion must not inherit fallback dimming on mobile");
    }
    const bitcoinScene = await page.locator(".hero-panel .coin-art").evaluate((coin) => {
      const scene = coin.closest(".hero-scene");
      const box = coin.getBoundingClientRect();
      return {
        decorative: coin.getAttribute("aria-hidden") === "true",
        present: box.width > 45 && box.height > 45,
        perspective: globalThis.getComputedStyle(scene).perspective,
        transform: globalThis.getComputedStyle(coin).transform,
        imageCount: coin.querySelectorAll("image").length,
      };
    });
    assert.ok(bitcoinScene.decorative && bitcoinScene.present && bitcoinScene.imageCount === 0,
      viewport.name + " local Bitcoin vector must stay decorative and visible");
    assert.notEqual(bitcoinScene.perspective, "none", viewport.name + " must retain scene perspective");
    assert.notEqual(bitcoinScene.transform, "none", viewport.name + " must retain coin transform");
    const reliefLayers = await page.locator(".hero-panel svg.coin-art").evaluate((coin) => ({
      rimCircles: coin.querySelectorAll(".coin-relief circle").length,
      reflection: coin.querySelector(".coin-specular") !== null,
      hidden: coin.getAttribute("aria-hidden") === "true",
      glyph: Array.from(coin.querySelectorAll("text")).some((node) => node.textContent === "₿"),
    }));
    assert.ok(reliefLayers.rimCircles === 2 && reliefLayers.reflection
      && reliefLayers.hidden && reliefLayers.glyph,
      viewport.name + " hero must preserve original decorative minted rim and Bitcoin glyph");
    const mountainLayers = await page.locator(".hero-panel .hero-rockscape").evaluate((art) => ({
      backgroundFacets: art.querySelectorAll(".hero-rock-facets-back path").length,
      foregroundFacets: art.querySelectorAll(".hero-rock-facets-front path").length,
      mist: art.querySelector(".hero-ridge-mist") !== null,
      decorative: art.getAttribute("aria-hidden") === "true",
      externalImages: art.querySelectorAll("image").length,
      svgWidth: art.getBoundingClientRect().width,
    }));
    assert.ok(mountainLayers.backgroundFacets >= 4 && mountainLayers.foregroundFacets >= 4
      && mountainLayers.mist && mountainLayers.decorative && mountainLayers.externalImages === 0
      && mountainLayers.svgWidth > 40,
      viewport.name + " rockscape facets and mist must remain local, visible and decorative");
    const materialOverlay = await page.locator(".hero-scene").evaluate((scene) => {
      const layer = globalThis.getComputedStyle(scene, "::after");
      const coin = scene.querySelector(".coin-art");
      return {
        localTexture: layer.backgroundImage !== "none" && (layer.backgroundImage.includes("hero-mineral-texture") || layer.backgroundImage.includes("data:image/svg+xml")),
        nonInteractive: layer.pointerEvents === "none",
        behindCoin: Number(layer.zIndex) < Number(globalThis.getComputedStyle(coin).zIndex),
        decorative: scene.getAttribute("aria-hidden") === "true",
      };
    });
    assert.ok(materialOverlay.localTexture && materialOverlay.nonInteractive
      && materialOverlay.behindCoin && materialOverlay.decorative,
      viewport.name + " mineral texture must be self-hosted and noninteractive behind coin: " + JSON.stringify(materialOverlay));
    assert.equal(await page.locator(".news-art > svg.editorial-artwork").count(), 4,
      viewport.name + " must render four original local illustrative thumbnails");
    const promoGeometry = await page.locator(".promo-panel").evaluate((panel) => {
      const parent = panel.getBoundingClientRect();
      const cta = panel.querySelector('a[href="#demo-data"]').getBoundingClientRect();
      const svg = panel.querySelector("svg.promo-scene");
      const accent = globalThis.getComputedStyle(panel, "::before");
      return {
        ctaInside: cta.left >= parent.left - 1 && cta.right <= parent.right + 1
          && cta.top >= parent.top - 1 && cta.bottom <= parent.bottom + 1,
        decorative: svg.getAttribute("aria-hidden") === "true" && accent.pointerEvents === "none",
        hasAtmosphere: accent.content !== "none" && accent.content !== "normal",
      };
    });
    assert.ok(promoGeometry.ctaInside, viewport.name + " promotional CTA must remain inside its panel");
    assert.ok(promoGeometry.decorative && promoGeometry.hasAtmosphere,
      viewport.name + " promo atmospheric layers must be present and non-interactive");
    assert.equal(await page.locator("astro-dev-toolbar").count(), 0, "visual evidence must exclude the development toolbar");
    const dimensions = await page.evaluate(() => ({
      viewport: globalThis.document.documentElement.clientWidth,
      document: globalThis.document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.document <= dimensions.viewport, viewport.name + " /en horizontal overflow: " + JSON.stringify(dimensions));
    const moduleAxe = await new AxeBuilder({ page }).include(".cb-home").analyze();
    const pageAxe = await new AxeBuilder({ page }).analyze();
    const violations = (axe) => axe.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      targets: item.nodes.map((node) => node.target),
    }));
    const screenshotPath = join(screenshotDir, "golden-home-integrated-" + viewport.name + "-" + viewport.width + "x" + viewport.height + ".png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshot = await readFile(screenshotPath);
    const performance = await page.evaluate(() => {
      const image = globalThis.document.querySelector(".hero-cinematic-preview img");
      const resource = image?.currentSrc
        ? globalThis.performance.getEntriesByName(image.currentSrc).at(-1)
        : null;
      return {
        largestContentfulPaintMs: globalThis.__coinblinkR25Vitals?.largestContentfulPaintMs ?? null,
        cumulativeLayoutShift: globalThis.__coinblinkR25Vitals?.cumulativeLayoutShift ?? null,
        previewImage: {
          path: new URL(image.currentSrc).pathname,
          transferredBytes: resource?.transferSize ?? null,
          encodedBodyBytes: resource?.encodedBodySize ?? null,
          durationMs: resource ? Math.round(resource.duration * 100) / 100 : null,
        },
        sameOriginTransferredBytes: globalThis.performance.getEntriesByType("resource")
          .filter((entry) => new URL(entry.name).origin === globalThis.location.origin)
          .reduce((total, entry) => total + entry.transferSize, 0),
        measurement: "single local desktop/tablet/mobile browser pass; lab data, not field Core Web Vitals",
      };
    });
    assert.ok(performance.previewImage.encodedBodyBytes === null
      || performance.previewImage.encodedBodyBytes <= 1_500_000,
    viewport.name + " rendered WebP resource must remain below the 1.5 MB cap");
    const headers = response.headers();
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute("content");
    assert.ok(robotsMeta && robotsMeta.includes("noindex"), "integrated /en must retain noindex");
    assert.equal(headers["x-content-type-options"], "nosniff");
    assert.equal(headers["x-frame-options"], "DENY");
    assert.ok(headers["x-robots-tag"]?.includes("noindex"), "integrated /en must return a noindex header");
    report.viewports.push({
      ...viewport,
      httpStatus: response.status(),
      documentWidth: dimensions.document,
      cinematicPreview,
      performance,
      moduleAxeViolations: violations(moduleAxe),
      fullPageAxeViolations: violations(pageAxe),
      securityHeaders: Object.fromEntries(["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "x-robots-tag"].filter((key) => headers[key]).map((key) => [key, headers[key]])),
      robotsMeta,
    });
    report.renderPerformance.push({ viewport: viewport.name, ...performance });
    report.screenshots.push({
      file: screenshotPath.slice(repoRoot.length + 1).replaceAll("\\", "/"),
      sha256: createHash("sha256").update(screenshot).digest("hex"),
      bytes: screenshot.length,
    });
    if (viewport.name === "desktop") {
      report.desktopGeometry = await page.evaluate(() => {
        const rect = (selector) => {
        const box = globalThis.document.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom };
        };
        return Object.fromEntries([".demo-banner", ".cb-header", ".brand", ".hero-panel", ".market-panel", ".ticker-strip", ".trending-strip", ".category-rail", ".content-grid", "#latest-news", ".news-cards", "#newsletter"].map((selector) => [selector, rect(selector)]));
      });
      // Golden desktop uses a vertical editorial thumbnail beside its text,
      // never a banner stacked over a card headline. Assert real DOM geometry.
      report.desktopEditorialCardGeometry = await page.locator(".news-card").first().evaluate((card) => {
        const art = card.querySelector(".news-art").getBoundingClientRect();
        const copy = card.lastElementChild.getBoundingClientRect();
        return { artRight: art.right, artTop: art.top, artBottom: art.bottom,
          copyLeft: copy.left, copyTop: copy.top, copyBottom: copy.bottom };
      });
      assert.ok(
        report.desktopEditorialCardGeometry.artRight <= report.desktopEditorialCardGeometry.copyLeft + 1
          && Math.abs(report.desktopEditorialCardGeometry.artTop - report.desktopEditorialCardGeometry.copyTop) <= 1,
        "Golden desktop editorial art must be left of and top-aligned with readable copy",
      );
    }
    if (viewport.name === "mobile") {
      report.mobileHero = await page.locator(".hero-panel").evaluate((hero) => {
        const box = (element) => {
          const value = element.getBoundingClientRect();
          return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, height: value.height };
        };
        const overlaps = (first, second) => first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
        const ctas = [...hero.querySelectorAll(".hero-actions a")].map((element) => ({
          label: element.textContent.trim(),
          ...box(element),
          minHeight: Number.parseFloat(globalThis.getComputedStyle(element).minHeight),
        }));
        const status = box(hero.querySelector(".hero-stat"));
        const coin = box(hero.querySelector(".coin-art"));
        return {
          ctas,
          status,
          coin,
          ctaStatusOverlap: ctas.some((cta) => overlaps(cta, status)),
          ctaCoinOverlap: ctas.some((cta) => overlaps(cta, coin)),
          statusCoinOverlap: overlaps(status, coin),
        };
      });
      assert.equal(report.mobileHero.ctas.length, 2);
      assert.ok(report.mobileHero.ctas.every((cta) => cta.minHeight >= 44));
      assert.equal(report.mobileHero.ctaStatusOverlap, false);
      assert.equal(report.mobileHero.ctaCoinOverlap, false);
      assert.equal(report.mobileHero.statusCoinOverlap, false);
      await page.locator(".secondary-action").click();
      assert.equal(new URL(page.url()).hash, "#market-overview", "mobile CTA must remain clickable on integrated /en");
    }
  }
  // R25: verify that the Blender motion derivative is local and reduced motion selects the static master.
  // Run after screenshots, so the media preference probe cannot alter the Golden captures.
  await page.setViewportSize({ width: 1536, height: 864 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const animatedResponse = await page.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(animatedResponse?.status(), 200, "R25 motion probe must use the built local route");
  const motionLive = await page.locator(".hero-cinematic-preview img").evaluate(async (image, origin) => {
    await image.decode();
    return {
      decorative: image.closest(".hero-scene").getAttribute("aria-hidden") === "true",
      path: new URL(image.currentSrc).pathname,
      origin: new URL(image.currentSrc).origin,
      width: image.naturalWidth,
      height: image.naturalHeight,
      motionSource: image.currentSrc.includes("hero-cinematic-motion"),
      animationDisabledInCss: globalThis.getComputedStyle(image).animationName === "none",
      allowedOrigin: origin,
    };
  }, report.origin);
  assert.equal(motionLive.decorative, true, "cinematic artwork must remain decorative");
  assert.equal(motionLive.motionSource, true, "no-preference must use the Blender motion derivative");
  assert.equal(motionLive.width, 640);
  assert.equal(motionLive.height, 320);
  assert.equal(motionLive.origin, motionLive.allowedOrigin, "motion must load from the local app origin");
  assert.equal(motionLive.animationDisabledInCss, true, "motion is a Blender-rendered asset, not CSS-generated frames");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => globalThis.document.querySelector(".hero-cinematic-preview img")?.currentSrc.includes("hero-cinematic-original"));
  const motionReduced = await page.locator(".hero-cinematic-preview img").evaluate(async (image, origin) => {
    await image.decode();
    return {
      path: new URL(image.currentSrc).pathname,
      origin: new URL(image.currentSrc).origin,
      width: image.naturalWidth,
      height: image.naturalHeight,
      staticSource: image.currentSrc.includes("hero-cinematic-original"),
      allowedOrigin: origin,
    };
  }, report.origin);
  assert.equal(motionReduced.staticSource, true, "prefers-reduced-motion must use the static master");
  assert.equal(motionReduced.width, 1774);
  assert.equal(motionReduced.height, 887);
  assert.equal(motionReduced.origin, motionReduced.allowedOrigin);
  report.motionAccessibility = {
    mode: "DEMO_LOCAL_ONLY",
    normalMotionSource: motionLive.path,
    normalMotionDimensions: [motionLive.width, motionLive.height],
    normalMotionSameOrigin: true,
    reducedMotionSource: motionReduced.path,
    reducedMotionDimensions: [motionReduced.width, motionReduced.height],
    reducedMotionUsesStaticMaster: true,
  };
  const fallbackPage = await context.newPage();
  fallbackPage.on("request", (request) => {
    if (!isFixtureOriginRequest(request.url(), report.origin)) report.externalRequests.push(request.url());
  });
  await fallbackPage.route(/hero-cinematic-(?:original|motion)[^/]*\.(?:webp|png)(?:\?.*)?$/u, (route) => route.abort());
  const fallbackResponse = await fallbackPage.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(fallbackResponse?.status(), 200, "fallback probe must use the built local route");
  report.previewFallback = await fallbackPage.locator(".hero-scene").evaluate((scene) => ({
    previewActive: scene.classList.contains("has-cinematic-preview"),
    previewImageComplete: scene.querySelector(".hero-cinematic-preview img").complete,
    vectorFallbackVisible: globalThis.getComputedStyle(scene.querySelector(".coin-art")).visibility !== "hidden",
    coinBounds: (() => {
      const rect = scene.querySelector(".coin-art").getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    })(),
  }));
  assert.equal(report.previewFallback.previewActive, false);
  assert.ok(report.previewFallback.previewImageComplete);
  assert.ok(report.previewFallback.vectorFallbackVisible
    && report.previewFallback.coinBounds.width > 45 && report.previewFallback.coinBounds.height > 45,
  "local vector fallback must remain visible when static and motion assets fail");
  await fallbackPage.close();
  assert.deepEqual(report.consoleErrors, []);
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.externalRequests, [], "local screenshots must not contact an external origin");
  await saveReport("passed");
  console.log(JSON.stringify({
    reportPath,
    headSha: report.headSha,
    screenshots: report.screenshots,
    viewports: report.viewports.map(({ name, width, height, httpStatus, documentWidth, moduleAxeViolations, fullPageAxeViolations }) => ({
      name,
      width,
      height,
      httpStatus,
      documentWidth,
      moduleAxe: moduleAxeViolations.length,
      fullPageAxe: fullPageAxeViolations.length,
    })),
    desktopGeometry: report.desktopGeometry,
    securityHeaders: report.viewports[0]?.securityHeaders,
    renderPerformance: report.renderPerformance,
  }));
} catch (error) {
  runFailure = error;
  try {
    await saveReport("failed", error);
  } catch (reportError) {
    console.error("Unable to save the original visual-run failure:", reportError);
  }
  // Defer the rethrow until after every cleanup attempt.
} finally {
  let cleanupFailure = null;
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      cleanupFailure ??= error;
    }
  }
  let stopped = false;
  try {
    stopped = await stopServer();
    if (!stopped) cleanupFailure ??= new Error("Wrangler local process did not exit; temporary data retained");
  } catch (error) {
    cleanupFailure ??= error;
  }
  if (stopped && persistDir) {
    try {
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));
      await rm(persistDir, { recursive: true, force: true, maxRetries: 12, retryDelay: 500 });
    } catch (error) {
      cleanupFailure ??= error;
    }
  }
  if (cleanupFailure) {
    if (runFailure) {
      console.error("Additional cleanup failure (original visual-run error retained):", cleanupFailure);
    } else {
      try {
        await saveReport("failed", cleanupFailure);
      } catch (reportError) {
        console.error("Unable to save visual-run cleanup failure:", reportError);
      }
      runFailure = cleanupFailure;
    }
  }
}
if (runFailure) throw runFailure;
