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
      moduleAxeViolations: violations(moduleAxe),
      fullPageAxeViolations: violations(pageAxe),
      securityHeaders: Object.fromEntries(["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "x-robots-tag"].filter((key) => headers[key]).map((key) => [key, headers[key]])),
      robotsMeta,
    });
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
