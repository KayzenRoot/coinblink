import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
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
const reportPath = join(evidenceRoot, "r26-integrated-visual-check.json");
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
  constrainedNetworkPerformance: [],
  staticAssetLoads: [],
  saveDataBehavior: null,
  staticFallbackBehavior: null,
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
  if (server?.exitCode !== null || server?.signalCode !== null) return true;
  server.kill();
  await Promise.race([once(server, "exit"), new Promise((resolveExit) => setTimeout(resolveExit, 3_000))]);
  if (server.exitCode === null && server.signalCode === null) {
    server.kill("SIGKILL");
    await Promise.race([once(server, "exit"), new Promise((resolveExit) => setTimeout(resolveExit, 3_000))]);
  }
  return server.exitCode !== null || server.signalCode !== null;
}

async function readIntegratedViewportSnapshot(page, allowedOrigin) {
  return page.locator(".hero-cinematic-preview img").evaluate(async (image, expectedOrigin) => {
    await image.decode();
    const document = image.ownerDocument;
    const scene = image.closest(".hero-scene");
    const imageRect = image.getBoundingClientRect();
    const cinematicPreview = {
      fullyDecoded: true,
      complete: image.complete,
      width: image.naturalWidth,
      height: image.naturalHeight,
      path: new URL(image.currentSrc).pathname,
      currentOrigin: new URL(image.currentSrc).origin,
      allowedOrigin: expectedOrigin,
      previewActive: scene.classList.contains("has-cinematic-preview"),
      visible: globalThis.getComputedStyle(image.parentElement).opacity !== "0",
      sceneOpacity: globalThis.getComputedStyle(scene).opacity,
      objectFit: globalThis.getComputedStyle(image).objectFit,
      objectPosition: globalThis.getComputedStyle(image).objectPosition,
      widthOnScreen: imageRect.width,
      heightOnScreen: imageRect.height,
      selectedSource: image.currentSrc,
      visibleArtworkStart: imageRect.left + imageRect.width * 0.58,
      copyRight: scene.parentElement.querySelector(".hero-copy").getBoundingClientRect().right,
      loading: image.loading,
      fetchPriority: image.fetchPriority,
    };
    const coin = document.querySelector(".hero-panel .coin-art");
    const coinScene = coin.closest(".hero-scene");
    const coinRect = coin.getBoundingClientRect();
    const bitcoinScene = {
      decorative: coin.getAttribute("aria-hidden") === "true",
      present: coinRect.width > 45 && coinRect.height > 45,
      perspective: globalThis.getComputedStyle(coinScene).perspective,
      transform: globalThis.getComputedStyle(coin).transform,
      imageCount: coin.querySelectorAll("image").length,
    };
    const coinArt = document.querySelector(".hero-panel svg.coin-art");
    const reliefLayers = {
      rimCircles: coinArt.querySelectorAll(".coin-relief circle").length,
      reflection: coinArt.querySelector(".coin-specular") !== null,
      hidden: coinArt.getAttribute("aria-hidden") === "true",
      glyph: Array.from(coinArt.querySelectorAll("text")).some((node) => node.textContent === "₿"),
    };
    const rockscape = document.querySelector(".hero-panel .hero-rockscape");
    const mountainLayers = {
      backgroundFacets: rockscape.querySelectorAll(".hero-rock-facets-back path").length,
      foregroundFacets: rockscape.querySelectorAll(".hero-rock-facets-front path").length,
      mist: rockscape.querySelector(".hero-ridge-mist") !== null,
      decorative: rockscape.getAttribute("aria-hidden") === "true",
      externalImages: rockscape.querySelectorAll("image").length,
      svgWidth: rockscape.getBoundingClientRect().width,
    };
    const heroScene = document.querySelector(".hero-scene");
    const materialLayer = globalThis.getComputedStyle(heroScene, "::after");
    const materialCoin = heroScene.querySelector(".coin-art");
    const materialOverlay = {
      localTexture: materialLayer.backgroundImage !== "none"
        && (materialLayer.backgroundImage.includes("hero-mineral-texture") || materialLayer.backgroundImage.includes("data:image/svg+xml")),
      nonInteractive: materialLayer.pointerEvents === "none",
      behindCoin: Number(materialLayer.zIndex) < Number(globalThis.getComputedStyle(materialCoin).zIndex),
      decorative: heroScene.getAttribute("aria-hidden") === "true",
    };
    const promoPanel = document.querySelector(".promo-panel");
    const promoRect = promoPanel.getBoundingClientRect();
    const promoCtaRect = promoPanel.querySelector('a[href="#demo-data"]').getBoundingClientRect();
    const promoSvg = promoPanel.querySelector("svg.promo-scene");
    const promoAccent = globalThis.getComputedStyle(promoPanel, "::before");
    const promoGeometry = {
      ctaInside: promoCtaRect.left >= promoRect.left - 1 && promoCtaRect.right <= promoRect.right + 1
        && promoCtaRect.top >= promoRect.top - 1 && promoCtaRect.bottom <= promoRect.bottom + 1,
      decorative: promoSvg.getAttribute("aria-hidden") === "true" && promoAccent.pointerEvents === "none",
      hasAtmosphere: promoAccent.content !== "none" && promoAccent.content !== "normal",
    };
    return {
      title: document.title,
      homeCount: document.querySelectorAll(".cb-home").length,
      cinematicPreview,
      bitcoinScene,
      reliefLayers,
      mountainLayers,
      materialOverlay,
      editorialArtworkCount: document.querySelectorAll(".news-art > svg.editorial-artwork").length,
      promoGeometry,
      developmentToolbarCount: document.querySelectorAll("astro-dev-toolbar").length,
      dimensions: {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
      },
      robotsMeta: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null,
    };
  }, allowedOrigin);
}

await mkdir(screenshotDir, { recursive: true });
await saveReport("running");

try {
  report.headSha = await readGitHead(repoRoot);
  report.nodeVersion = process.version;
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
    stdio: ["ignore", "ignore", "pipe"],
    env: safeEnv,
  });
  // Diagnostics only: never treat a crashed Wrangler child as ready. Bounded
  // stderr explains startup failures otherwise hidden by the test runner.
  let startupDiagnostics = "";
  server.stderr.on("data", (chunk) => {
    startupDiagnostics = (startupDiagnostics + String(chunk)).slice(-4_000);
  });
  await once(server, "spawn");
  let ready;
  try {
    ready = await waitForFixtureReady({ child: server, origin: report.origin + "/en" });
  } catch (error) {
    throw new Error(
      "Integrated visual fixture startup failed: " + String(error.message) +
      "; Wrangler stderr tail: " + (startupDiagnostics.trim() || "(none)"),
      { cause: error },
    );
  }
  assert.equal(ready.status, 200, "the integrated /en route must respond with HTTP 200");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const values = {
      largestContentfulPaintMs: null,
      cumulativeLayoutShift: 0,
      longTaskSupported: globalThis.PerformanceObserver.supportedEntryTypes.includes("longtask"),
      longTaskCount: 0,
      longTaskDurationMs: 0,
    };
    Object.defineProperty(globalThis, "__coinblinkR26Vitals", { value: values });
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
    if (values.longTaskSupported) {
      new globalThis.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          values.longTaskCount += 1;
          values.longTaskDurationMs += entry.duration;
        }
      }).observe({ type: "longtask", buffered: true });
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
    const viewportSnapshot = await readIntegratedViewportSnapshot(page, report.origin);
    assert.equal(viewportSnapshot.title, "CoinBlink · Crypto news in a blink");
    assert.equal(viewportSnapshot.homeCount, 1);
    const { cinematicPreview, bitcoinScene, reliefLayers, mountainLayers, materialOverlay, promoGeometry, dimensions } = viewportSnapshot;
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
    assert.ok(bitcoinScene.decorative && bitcoinScene.present && bitcoinScene.imageCount === 0,
      viewport.name + " local Bitcoin vector must stay decorative and visible");
    assert.notEqual(bitcoinScene.perspective, "none", viewport.name + " must retain scene perspective");
    assert.notEqual(bitcoinScene.transform, "none", viewport.name + " must retain coin transform");
    assert.ok(reliefLayers.rimCircles === 2 && reliefLayers.reflection
      && reliefLayers.hidden && reliefLayers.glyph,
      viewport.name + " hero must preserve original decorative minted rim and Bitcoin glyph");
    assert.ok(mountainLayers.backgroundFacets >= 4 && mountainLayers.foregroundFacets >= 4
      && mountainLayers.mist && mountainLayers.decorative && mountainLayers.externalImages === 0
      && mountainLayers.svgWidth > 40,
      viewport.name + " rockscape facets and mist must remain local, visible and decorative");
    assert.ok(materialOverlay.localTexture && materialOverlay.nonInteractive
      && materialOverlay.behindCoin && materialOverlay.decorative,
      viewport.name + " mineral texture must be self-hosted and noninteractive behind coin: " + JSON.stringify(materialOverlay));
    assert.equal(viewportSnapshot.editorialArtworkCount, 4,
      viewport.name + " must render four original local illustrative thumbnails");
    assert.ok(promoGeometry.ctaInside, viewport.name + " promotional CTA must remain inside its panel");
    assert.ok(promoGeometry.decorative && promoGeometry.hasAtmosphere,
      viewport.name + " promo atmospheric layers must be present and non-interactive");
    assert.equal(viewportSnapshot.developmentToolbarCount, 0, "visual evidence must exclude the development toolbar");
    assert.ok(dimensions.document <= dimensions.viewport, viewport.name + " /en horizontal overflow: " + JSON.stringify(dimensions));
    const moduleAxe = await new AxeBuilder({ page }).include(".cb-home").analyze();
    const pageAxe = await new AxeBuilder({ page }).analyze();
    const violations = (axe) => axe.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      targets: item.nodes.map((node) => node.target),
    }));
    const screenshotPath = join(screenshotDir, "r26-home-integrated-" + viewport.name + "-" + viewport.width + "x" + viewport.height + ".png");
    const screenshot = await page.screenshot({ path: screenshotPath, fullPage: false });
    const performance = await page.evaluate(() => {
      const image = globalThis.document.querySelector(".hero-cinematic-preview img");
      const resource = image?.currentSrc
        ? globalThis.performance.getEntriesByName(image.currentSrc).at(-1)
        : null;
      return {
        largestContentfulPaintMs: globalThis.__coinblinkR26Vitals?.largestContentfulPaintMs ?? null,
        cumulativeLayoutShift: globalThis.__coinblinkR26Vitals?.cumulativeLayoutShift ?? null,
        longTaskSupported: globalThis.__coinblinkR26Vitals?.longTaskSupported ?? false,
        longTaskCount: globalThis.__coinblinkR26Vitals?.longTaskSupported ? globalThis.__coinblinkR26Vitals.longTaskCount : null,
        longTaskDurationMs: globalThis.__coinblinkR26Vitals?.longTaskSupported
          ? Math.round(globalThis.__coinblinkR26Vitals.longTaskDurationMs * 100) / 100 : null,
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
    const robotsMeta = viewportSnapshot.robotsMeta;
    assert.ok(robotsMeta?.includes("noindex"), "integrated /en must retain noindex");
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
      const desktopSnapshot = await page.evaluate(() => {
        const rect = (selector) => {
          const box = globalThis.document.querySelector(selector).getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom };
        };
        const desktopGeometry = Object.fromEntries([".demo-banner", ".cb-header", ".brand", ".hero-panel", ".market-panel", ".ticker-strip", ".trending-strip", ".category-rail", ".content-grid", "#latest-news", ".news-cards", "#newsletter"].map((selector) => [selector, rect(selector)]));
        const card = globalThis.document.querySelector(".news-card");
        const art = card.querySelector(".news-art").getBoundingClientRect();
        const copy = card.lastElementChild.getBoundingClientRect();
        const desktopEditorialCardGeometry = { artRight: art.right, artTop: art.top, artBottom: art.bottom,
          copyLeft: copy.left, copyTop: copy.top, copyBottom: copy.bottom };
        return { desktopGeometry, desktopEditorialCardGeometry };
      });
      report.desktopGeometry = desktopSnapshot.desktopGeometry;
      // Golden desktop uses a vertical editorial thumbnail beside its text,
      // never a banner stacked over a card headline. Assert real DOM geometry.
      report.desktopEditorialCardGeometry = desktopSnapshot.desktopEditorialCardGeometry;
      assert.ok(
        report.desktopEditorialCardGeometry.artRight <= report.desktopEditorialCardGeometry.copyLeft + 1
          && Math.abs(report.desktopEditorialCardGeometry.artTop - report.desktopEditorialCardGeometry.copyTop) <= 1,
        "Golden desktop editorial art must be left of and top-aligned with readable copy",
      );
    }
    if (viewport.name === "mobile") {
      report.mobileHero = await page.evaluate(() => {
        const hero = globalThis.document.querySelector(".hero-panel");
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
  // R26: verify that the Blender motion derivative is local and reduced motion selects the static master.
  // Run after screenshots, so the media preference probe cannot alter the Golden captures.
  await page.setViewportSize({ width: 1536, height: 864 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const animatedResponse = await page.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(animatedResponse?.status(), 200, "R26 motion probe must use the built local route");
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
  const saveDataContext = await browser.newContext();
  const saveDataPage = await saveDataContext.newPage();
  const saveDataRequests = [];
  saveDataPage.on("request", (request) => {
    const url = request.url();
    saveDataRequests.push(new URL(url).pathname);
    if (!isFixtureOriginRequest(url, report.origin)) report.externalRequests.push(url);
  });
  await saveDataPage.addInitScript(() => {
    Object.defineProperty(globalThis.navigator, "connection", {
      configurable: true,
      value: { saveData: true, effectiveType: "4g" },
    });
  });
  const saveDataResponse = await saveDataPage.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(saveDataResponse?.status(), 200, "Save-Data probe must use the built local route");
  const saveDataImage = await saveDataPage.locator(".hero-cinematic-preview img").evaluate(async (image) => {
    await image.decode();
    return {
      path: new URL(image.currentSrc).pathname,
      width: image.naturalWidth,
      height: image.naturalHeight,
      loading: image.loading,
    };
  });
  assert.match(saveDataImage.path, /hero-cinematic-original[^/]*\.webp$/u,
    "Save-Data must select the optimized static WebP before image discovery");
  assert.equal(saveDataRequests.some((path) => /hero-cinematic-motion[^/]*\.webp$/u.test(path)), false,
    "Save-Data must prevent the 1.39 MB motion request");
  report.saveDataBehavior = {
    simulatedNavigatorConnection: { saveData: true, effectiveType: "4g" },
    selectedPath: saveDataImage.path,
    dimensions: [saveDataImage.width, saveDataImage.height],
    motionRequestCount: saveDataRequests.filter((path) => /hero-cinematic-motion[^/]*\.webp$/u.test(path)).length,
    staticRequestCount: saveDataRequests.filter((path) => /hero-cinematic-original[^/]*\.webp$/u.test(path)).length,
  };
  assert.equal(report.saveDataBehavior.staticRequestCount, 1);
  await saveDataContext.close();

  const assetContext = await browser.newContext();
  const assetPage = await assetContext.newPage();
  const assetRequestCounts = new Map();
  assetPage.on("request", (request) => {
    const url = request.url();
    const pathname = new URL(url).pathname;
    assetRequestCounts.set(pathname, (assetRequestCounts.get(pathname) ?? 0) + 1);
    if (!isFixtureOriginRequest(url, report.origin)) report.externalRequests.push(url);
  });
  await assetPage.setViewportSize({ width: 1536, height: 864 });
  const assetResponse = await assetPage.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(assetResponse?.status(), 200, "static asset probe must use the built local route");
  const staticImages = assetPage.locator(".promo-image img, .editorial-image img");
  const staticImageCount = await staticImages.count();
  for (let index = 0; index < staticImageCount; index += 1) {
    const image = staticImages.nth(index);
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element) => element.decode());
  }
  report.staticAssetLoads = await staticImages.evaluateAll((images) => images.map((image) => {
    const picture = image.closest("picture");
    const region = picture.dataset.previewRegion;
    const parent = image.closest(region === "promo" ? ".promo-panel" : ".news-art");
    const fallback = parent.querySelector(region === "promo" ? ".promo-scene" : ".editorial-artwork");
    const resource = globalThis.performance.getEntriesByName(image.currentSrc).at(-1);
    return {
      region,
      path: new URL(image.currentSrc).pathname,
      dimensions: [image.naturalWidth, image.naturalHeight],
      encodedBytes: resource?.encodedBodySize ?? null,
      loading: image.loading,
      masterVisible: globalThis.getComputedStyle(picture).opacity === "1",
      svgFallbackRetained: fallback !== null,
      svgFallbackOpacity: globalThis.getComputedStyle(fallback).opacity,
    };
  }));
  assert.equal(report.staticAssetLoads.length, 5);
  const regionNames = ["promo", "editorial", "editorial", "editorial", "editorial"];
  for (const [index, asset] of report.staticAssetLoads.entries()) {
    assert.equal(asset.region, regionNames[index]);
    assert.match(asset.path, /\.(?:webp|png)$/u);
    assert.ok(asset.dimensions[0] > 0 && asset.dimensions[1] > 0);
    assert.ok(asset.encodedBytes > 0);
    assert.equal(asset.loading, "lazy");
    assert.equal(asset.masterVisible, true);
    assert.equal(asset.svgFallbackRetained, true);
    assert.equal(asset.svgFallbackOpacity, "0");
    assert.equal(asset.encodedBytes <= (asset.path.endsWith(".webp") ? 1_500_000 : 3_500_000), true);
    assert.equal(assetRequestCounts.get(asset.path), 1, "each R26 static region must request one optimized image exactly once");
  }
  await assetContext.close();

  const staticFallbackContext = await browser.newContext();
  const staticFallbackPage = await staticFallbackContext.newPage();
  const staticFallbackRequests = new Map();
  staticFallbackPage.on("request", (request) => {
    const url = request.url();
    if (!isFixtureOriginRequest(url, report.origin)) report.externalRequests.push(url);
  });
  await staticFallbackPage.route(/\/(?:promo|bitcoin|ethereum|policy|ecosystem)\.[^/]+\.(?:webp|png)$/u, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    staticFallbackRequests.set(pathname, (staticFallbackRequests.get(pathname) ?? 0) + 1);
    await route.abort();
  });
  const staticFallbackResponse = await staticFallbackPage.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(staticFallbackResponse?.status(), 200, "static fallback probe must use the built local route");
  const failedImages = staticFallbackPage.locator(".promo-image img, .editorial-image img");
  const failedImageCount = await failedImages.count();
  for (let index = 0; index < failedImageCount; index += 1) {
    await failedImages.nth(index).scrollIntoViewIfNeeded();
  }
  await staticFallbackPage.waitForLoadState("networkidle");
  report.staticFallbackBehavior = await staticFallbackPage.locator(".promo-panel, .news-art").evaluateAll((regions) => regions.map((region) => {
    const picture = region.querySelector("picture[data-preview-region]");
    const fallback = region.querySelector(".promo-scene, .editorial-artwork");
    const heading = region.closest(".promo-panel") ? region.querySelector("h2") : region.parentElement?.querySelector("h3");
    return {
      region: picture?.dataset.previewRegion ?? "editorial",
      masterActivated: region.classList.contains("has-promo-master") || region.classList.contains("has-editorial-master"),
      svgFallbackVisible: fallback && globalThis.getComputedStyle(fallback).opacity !== "0",
      htmlCopyRetained: Boolean(heading?.textContent?.trim()),
    };
  }));
  assert.equal(report.staticFallbackBehavior.length, 5);
  assert.ok(report.staticFallbackBehavior.every((region) => !region.masterActivated
    && region.svgFallbackVisible && region.htmlCopyRetained),
  "failed static master and PNG requests must leave the original SVG and HTML copy visible");
  assert.ok(Array.from(staticFallbackRequests.values()).every((count) => count === 1 || count === 2));
  await staticFallbackContext.close();

  for (const scenario of [
    { name: "slow-desktop-motion-opt-in", width: 1536, height: 864, effectiveType: "4g", expected: "motion" },
    { name: "slow-mobile-limited-connection", width: 390, height: 844, effectiveType: "3g", expected: "static" },
  ]) {
    const constrainedContext = await browser.newContext();
    const constrainedPage = await constrainedContext.newPage();
    const constrainedRequests = [];
    await constrainedPage.addInitScript((effectiveType) => {
      const values = {
        largestContentfulPaintMs: null,
        cumulativeLayoutShift: 0,
        longTaskSupported: globalThis.PerformanceObserver.supportedEntryTypes.includes("longtask"),
        longTaskCount: 0,
        longTaskDurationMs: 0,
      };
      Object.defineProperty(globalThis, "__coinblinkR26SlowVitals", { value: values });
      if (globalThis.PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
        new globalThis.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) values.largestContentfulPaintMs = Math.round(entry.startTime * 100) / 100;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      }
      if (globalThis.PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
        new globalThis.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) values.cumulativeLayoutShift += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      }
      if (values.longTaskSupported) {
        new globalThis.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            values.longTaskCount += 1;
            values.longTaskDurationMs += entry.duration;
          }
        }).observe({ type: "longtask", buffered: true });
      }
      Object.defineProperty(globalThis.navigator, "connection", {
        configurable: true,
        value: { saveData: false, effectiveType },
      });
    }, scenario.effectiveType);
    constrainedPage.on("request", (request) => {
      const url = request.url();
      constrainedRequests.push(new URL(url).pathname);
      if (!isFixtureOriginRequest(url, report.origin)) report.externalRequests.push(url);
    });
    await constrainedPage.setViewportSize({ width: scenario.width, height: scenario.height });
    const cdp = await constrainedContext.newCDPSession(constrainedPage);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 250,
      downloadThroughput: 200_000,
      uploadThroughput: 80_000,
      connectionType: "cellular3g",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const constrainedResponse = await constrainedPage.goto(report.origin + "/en", { waitUntil: "networkidle" });
    assert.equal(constrainedResponse?.status(), 200, scenario.name + " must use the built local route");
    const constrainedImage = await constrainedPage.locator(".hero-cinematic-preview img").evaluate(async (image) => {
      const start = globalThis.performance.now();
      await image.decode();
      const decodePromiseResolutionMs = Math.round((globalThis.performance.now() - start) * 100) / 100;
      const resource = globalThis.performance.getEntriesByName(image.currentSrc).at(-1);
      return {
        path: new URL(image.currentSrc).pathname,
        dimensions: [image.naturalWidth, image.naturalHeight],
        encodedBodyBytes: resource?.encodedBodySize ?? null,
        transferredBytes: resource?.transferSize ?? null,
        resourceDurationMs: resource ? Math.round(resource.duration * 100) / 100 : null,
        decodePromiseResolutionMs,
      };
    });
    const motionRequestCount = constrainedRequests.filter((path) => /hero-cinematic-motion[^/]*\.webp$/u.test(path)).length;
    const staticRequestCount = constrainedRequests.filter((path) => /hero-cinematic-original[^/]*\.webp$/u.test(path)).length;
    if (scenario.expected === "motion") {
      assert.match(constrainedImage.path, /hero-cinematic-motion[^/]*\.webp$/u);
      assert.equal(motionRequestCount, 1, "motion candidate must be requested exactly once under the controlled slow link");
      assert.equal(constrainedImage.encodedBodyBytes, 1_394_724);
    } else {
      assert.match(constrainedImage.path, /hero-cinematic-original[^/]*\.webp$/u);
      assert.equal(motionRequestCount, 0, "3G mobile must not request the 1.39 MB motion image");
      assert.equal(staticRequestCount, 1);
    }
    assert.ok(constrainedImage.encodedBodyBytes > 0 && constrainedImage.encodedBodyBytes <= 1_500_000);
    const vitals = await constrainedPage.evaluate(() => globalThis.__coinblinkR26SlowVitals);
    report.constrainedNetworkPerformance.push({
      scenario: scenario.name,
      viewport: { width: scenario.width, height: scenario.height },
      conditions: {
        latencyMs: 250,
        downloadBytesPerSecond: 200_000,
        uploadBytesPerSecond: 80_000,
        connectionType: "cellular3g",
        emulatedEffectiveType: scenario.effectiveType,
        cpuThrottlingRate: 4,
        cacheDisabled: true,
        measurementClass: "SYNTHETIC_LOCAL_LAB_ONLY_NOT_FIELD_CWV",
      },
      selectedPath: constrainedImage.path,
      imageDimensions: constrainedImage.dimensions,
      encodedBodyBytes: constrainedImage.encodedBodyBytes,
      transferredBytes: constrainedImage.transferredBytes,
      resourceDurationMs: constrainedImage.resourceDurationMs,
      decodePromiseResolutionMs: constrainedImage.decodePromiseResolutionMs,
      motionRequestCount,
      staticRequestCount,
      largestContentfulPaintMs: vitals.largestContentfulPaintMs,
      cumulativeLayoutShift: Math.round(vitals.cumulativeLayoutShift * 10_000) / 10_000,
      longTaskSupported: vitals.longTaskSupported,
      longTaskCount: vitals.longTaskSupported ? vitals.longTaskCount : null,
      longTaskDurationMs: vitals.longTaskSupported ? Math.round(vitals.longTaskDurationMs * 100) / 100 : null,
    });
    await constrainedContext.close();
  }

  const partialFailurePage = await context.newPage();
  let motionRequests = 0;
  let staticRequests = 0;
  partialFailurePage.on("request", (request) => {
    if (!isFixtureOriginRequest(request.url(), report.origin)) report.externalRequests.push(request.url());
  });
  await partialFailurePage.route(/hero-cinematic-(?:original|motion)[^/]*\.(?:webp|png)(?:\?.*)?$/u, async (route) => {
    if (route.request().url().includes("hero-cinematic-motion")) {
      motionRequests += 1;
      await route.abort();
      return;
    }
    staticRequests += 1;
    await route.continue();
  });
  const partialFailureResponse = await partialFailurePage.goto(report.origin + "/en", { waitUntil: "networkidle" });
  assert.equal(partialFailureResponse?.status(), 200, "partial-failure probe must use the built local route");
  await partialFailurePage.waitForFunction(() => {
    const image = globalThis.document.querySelector(".hero-cinematic-preview img");
    return image?.complete && image.naturalWidth > 0 && image.currentSrc.includes("hero-cinematic-original");
  }, null, { timeout: 5_000 });
  const partialFailureRecovery = await partialFailurePage.locator(".hero-cinematic-preview img").evaluate(async (image) => {
    await image.decode();
    const scene = image.closest(".hero-scene");
    const title = globalThis.document.querySelector("#hero-title");
    const cta = globalThis.document.querySelector(".hero-actions .primary-action");
    return {
      staticSource: image.currentSrc.includes("hero-cinematic-original"),
      dimensions: [image.naturalWidth, image.naturalHeight],
      previewActive: scene.classList.contains("has-cinematic-preview"),
      titleVisible: title.getBoundingClientRect().width > 0 && globalThis.getComputedStyle(title).color !== "rgba(0, 0, 0, 0)",
      titleText: title.innerText,
      ctaVisible: cta.getBoundingClientRect().width > 0 && globalThis.getComputedStyle(cta).visibility === "visible",
      ctaHref: cta.getAttribute("href"),
    };
  });
  assert.equal(motionRequests, 1, "partial-failure probe must fail only the motion request");
  assert.ok(staticRequests > 0, "partial motion failure must request the static master");
  assert.equal(partialFailureRecovery.staticSource, true);
  assert.deepEqual(partialFailureRecovery.dimensions, [1774, 887]);
  assert.equal(partialFailureRecovery.previewActive, true);
  assert.equal(partialFailureRecovery.titleVisible, true);
  assert.match(partialFailureRecovery.titleText, /Bitcoin market,[\s\S]*focus\./u);
  assert.equal(partialFailureRecovery.ctaVisible, true);
  assert.equal(partialFailureRecovery.ctaHref, "#latest-news");
  const partialFailureAxe = await new AxeBuilder({ page: partialFailurePage }).include(".hero-panel").analyze();
  assert.deepEqual(partialFailureAxe.violations.map((violation) => violation.id), [],
    "static recovery must retain hero text and CTA contrast/accessibility");
  report.partialMotionFailureRecovery = {
    motionRequests,
    staticRequests,
    ...partialFailureRecovery,
    heroAxeViolations: partialFailureAxe.violations.length,
  };
  await partialFailurePage.close();
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
