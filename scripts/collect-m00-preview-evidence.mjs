import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import {
  createPreviewEvidenceBrowserContext,
  createPreviewEvidenceRouteHandler,
} from "./preview-evidence-origin-guard.mjs";
import { clearStalePreviewEvidenceArtifacts } from "./preview-evidence-output-cleanup.mjs";

/* global document, getComputedStyle, window */

const runId = "38049696879";
const expectedSha = "e8886e21c6f152ca374b1e42852c6b6638543f40";
const stableOrigin = "https://coinblink-m00-run-38049696879-1-coinblink-m00-preview.kayzendev.workers.dev";
const immutableOrigin = "https://5ca9306c-coinblink-m00-preview.kayzendev.workers.dev";
const allowedOrigins = new Set([stableOrigin, immutableOrigin]);
const outputDirectory = resolve(`.engineering/evidence/CB-M00-WO-001-P1-preview-run-${runId}`);
const viewports = [
  { name: "desktop-1536x864", width: 1536, height: 864 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];
const blockedOrigins = [];
const blockedRedirects = [];
const routeFetchErrors = [];
const consoleErrors = [];
const intentional404ConsoleMessages = [];
const pageErrors = [];
const failedRequests = [];
const subresourceErrors = [];
const results = {
  status: "RUNNING",
  runId,
  workflowUrl: `https://github.com/KayzenRoot/coinblink/actions/runs/${runId}`,
  expectedBuildSha: expectedSha,
  stableOrigin,
  immutableOrigin,
  browserContext: "fresh-isolated-context-no-profile-or-cookies",
  capturedAt: new Date().toISOString(),
  browserVersion: null,
  playwrightVersion: null,
  axePlaywrightVersion: null,
  initialHealth: null,
  immutableHealth: null,
  routes: [],
  viewports: [],
  blockedOrigins,
  blockedRedirects,
  routeFetchErrors,
  consoleErrors,
  intentional404ConsoleMessages,
  pageErrors,
  failedRequests,
  subresourceErrors,
};

function assertSecurityHeaders(headers, route) {
  assert.match(headers["content-security-policy"] ?? "", /(?:^|;\s*)default-src 'self'(?:;|$)/, `${route}: CSP`);
  assert.equal(headers["permissions-policy"], "camera=(), geolocation=(), microphone=()", `${route}: Permissions-Policy`);
  assert.equal(headers["referrer-policy"], "strict-origin-when-cross-origin", `${route}: Referrer-Policy`);
  assert.equal(headers["x-content-type-options"], "nosniff", `${route}: X-Content-Type-Options`);
  assert.equal(headers["x-frame-options"], "DENY", `${route}: X-Frame-Options`);
  assert.match(headers["x-robots-tag"] ?? "", /\bnoindex\b/i, `${route}: X-Robots-Tag`);
}

function evidenceHeaders(headers) {
  const names = [
    "cache-control",
    "content-security-policy",
    "content-type",
    "permissions-policy",
    "referrer-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-robots-tag",
  ];
  return Object.fromEntries(names.filter((name) => headers[name] !== undefined).map((name) => [name, headers[name]]));
}

async function goTo(page, origin, pathname) {
  const target = new URL(pathname, `${origin}/`);
  const response = await page.goto(target.href, { waitUntil: "networkidle" });
  assert.ok(response, `${target.href}: missing document response`);
  assert.equal(new URL(page.url()).origin, origin, `${target.href}: origin changed`);
  assert.equal(new URL(page.url()).pathname, target.pathname, `${target.href}: unexpected redirect path`);
  return response;
}

async function instrumentPage(page) {
  await page.route(
    "**/*",
    createPreviewEvidenceRouteHandler({ allowedOrigins, blockedOrigins, blockedRedirects, routeFetchErrors }),
  );
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const entry = { text: message.text(), url: page.url(), location: message.location() };
    if (
      entry.url === `${stableOrigin}/m00-closeout-intentional-404` &&
      /^Failed to load resource: the server responded with a status of 404(?: \(Not Found\))?$/.test(entry.text)
    ) {
      intentional404ConsoleMessages.push(entry);
      return;
    }
    consoleErrors.push(entry);
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? "unknown"}`);
  });
  page.on("response", (response) => {
    const request = response.request();
    if (request.resourceType() !== "document" && response.status() >= 400) {
      subresourceErrors.push(`${response.status()} ${response.url()}`);
    }
  });
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function pngDimensions(filePath) {
  const image = await readFile(filePath);
  assert.equal(image.toString("hex", 0, 8), "89504e470d0a1a0a", `${filePath}: PNG signature`);
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

let browser;
let outputDirectoryCreated = false;

try {
  browser = await chromium.launch({ headless: true });
  results.browserVersion = browser.version();
  results.playwrightVersion = JSON.parse(await readFile(new URL("../node_modules/playwright/package.json", import.meta.url), "utf8")).version;
  results.axePlaywrightVersion = JSON.parse(await readFile(new URL("../node_modules/@axe-core/playwright/package.json", import.meta.url), "utf8")).version;
  const context = await createPreviewEvidenceBrowserContext(browser, {
    ignoreHTTPSErrors: false,
    viewport: { width: 1536, height: 864 },
  });
  const page = await context.newPage();
  await instrumentPage(page);

  // The run-bound stable /health check is a hard gate. No evidence directory or
  // screenshot is written unless this response confirms the expected build SHA.
  const healthResponse = await goTo(page, stableOrigin, "/health");
  assert.equal(healthResponse.status(), 200, "stable /health HTTP status");
  const health = await healthResponse.json();
  assert.deepEqual(Object.keys(health).sort((left, right) => left.localeCompare(right, "en")), ["buildSha", "environment", "service", "status"]);
  assert.deepEqual(health, {
    status: "ok",
    service: "coinblink",
    environment: "preview",
    buildSha: expectedSha,
  }, "stable /health must identify this exact Preview build before capture");
  assert.equal(healthResponse.headers()["cache-control"], "no-store");
  assertSecurityHeaders(healthResponse.headers(), "/health");
  results.initialHealth = { status: healthResponse.status(), body: health, headers: evidenceHeaders(healthResponse.headers()) };

  const immutableHealthResponse = await goTo(page, immutableOrigin, "/health");
  assert.equal(immutableHealthResponse.status(), 200, "immutable /health HTTP status");
  const immutableHealth = await immutableHealthResponse.json();
  assert.deepEqual(immutableHealth, health, "immutable origin must serve the same exact build metadata");
  assertSecurityHeaders(immutableHealthResponse.headers(), "immutable /health");
  results.immutableHealth = { status: immutableHealthResponse.status(), body: immutableHealth, headers: evidenceHeaders(immutableHealthResponse.headers()) };

  await mkdir(outputDirectory, { recursive: true });
  await clearStalePreviewEvidenceArtifacts(outputDirectory);
  outputDirectoryCreated = true;

  const statusResponse = await goTo(page, stableOrigin, "/preview-status");
  assert.equal(statusResponse.status(), 200, "/preview-status HTTP status");
  assert.equal(statusResponse.headers()["cache-control"], "no-store");
  assertSecurityHeaders(statusResponse.headers(), "/preview-status");
  const previewStatus = await statusResponse.json();
  assert.deepEqual(previewStatus, {
    status: "demo",
    dataMode: "demonstration-only",
    editorialFeed: "not-connected",
    marketData: "not-connected",
    cloudflarePreview: "preview",
    buildSha: expectedSha,
    environment: "preview",
  });
  assert.doesNotMatch(JSON.stringify(previewStatus), /secret|password|api.?key/i);
  results.routes.push({ path: "/preview-status", status: statusResponse.status(), body: previewStatus, headers: evidenceHeaders(statusResponse.headers()) });

  const robotsResponse = await goTo(page, stableOrigin, "/robots.txt");
  assert.equal(robotsResponse.status(), 200, "/robots.txt HTTP status");
  const robotsText = await robotsResponse.text();
  assert.match(robotsText, /User-agent:\s*\*/);
  assert.match(robotsText, /Allow:\s*\//);
  assert.doesNotMatch(robotsText, /^Disallow:\s*\/\s*$/m);
  results.routes.push({ path: "/robots.txt", status: robotsResponse.status(), body: robotsText, headers: evidenceHeaders(robotsResponse.headers()) });

  const intentional404Path = "/m00-closeout-intentional-404";
  const missingResponse = await goTo(page, stableOrigin, intentional404Path);
  assert.equal(missingResponse.status(), 404, "unknown route must remain a real 404");
  assertSecurityHeaders(missingResponse.headers(), "/404");
  await page.getByRole("heading", { level: 1, name: "Page not found" }).waitFor({ state: "visible" });
  results.routes.push({ path: intentional404Path, status: missingResponse.status(), headers: evidenceHeaders(missingResponse.headers()) });

  for (const viewport of viewports) {
    const viewportContext = await createPreviewEvidenceBrowserContext(browser, {
      ignoreHTTPSErrors: false,
      viewport: { width: viewport.width, height: viewport.height },
    });
    const viewportPage = await viewportContext.newPage();
    await instrumentPage(viewportPage);
    const response = await goTo(viewportPage, stableOrigin, "/en");
    assert.equal(response.status(), 200, `${viewport.name}: /en HTTP status`);
    assertSecurityHeaders(response.headers(), `${viewport.name} /en`);
    await viewportPage.evaluate(() => document.fonts.ready);
    assert.match(await viewportPage.title(), /CoinBlink/);
    await viewportPage.getByRole("heading", { level: 1, name: "Crypto news in a blink." }).waitFor({ state: "visible" });
    await viewportPage.getByText("DEMO · NO LIVE DATA").waitFor({ state: "visible" });
    await viewportPage.getByText("No live feed", { exact: true }).waitFor({ state: "visible" });
    const stylesheetCount = await viewportPage.evaluate(() => document.styleSheets.length);
    assert.ok(stylesheetCount > 0, `${viewport.name}: expected the same-origin page stylesheet to load`);
    assert.equal(
      await viewportPage.locator('meta[name="robots"]').getAttribute("content"),
      "noindex, nofollow, noarchive",
      `${viewport.name}: HTML noindex meta`,
    );
    assert.equal(
      await viewportPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
      `${viewport.name}: horizontal overflow`,
    );

    const accessibility = await new AxeBuilder({ page: viewportPage })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    assert.deepEqual(accessibility.violations, [], `${viewport.name}: axe WCAG 2.1 A/AA violations`);

    const screenshotPath = join(outputDirectory, `${viewport.name}.png`);
    await viewportPage.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled", type: "png" });
    const dimensions = await pngDimensions(screenshotPath);
    assert.deepEqual(dimensions, { width: viewport.width, height: viewport.height }, `${viewport.name}: PNG pixel dimensions`);
    const screenshotSha256 = await sha256(screenshotPath);

    await viewportPage.keyboard.press("Tab");
    const focused = await viewportPage.evaluate(() => ({
      href: document.activeElement?.getAttribute("href"),
      outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
    }));
    assert.equal(focused.href, "#main", `${viewport.name}: keyboard skip-link focus`);
    assert.equal(focused.outlineStyle, "solid", `${viewport.name}: visible keyboard focus outline`);

    results.viewports.push({
      ...viewport,
      route: "/en",
      status: response.status(),
      headers: evidenceHeaders(response.headers()),
      noindex: true,
      noHorizontalOverflow: true,
      keyboardSkipLinkVisible: true,
      axeViolations: accessibility.violations.length,
      stylesheetCount,
      screenshot: `${viewport.name}.png`,
      pngWidth: dimensions.width,
      pngHeight: dimensions.height,
      screenshotSha256,
    });
    await viewportContext.close();
  }

  assert.deepEqual(blockedOrigins, [], "no disallowed cross-origin navigation or resource was attempted");
  assert.deepEqual(blockedRedirects, [], "no redirect was followed from a Preview document or resource");
  assert.deepEqual(routeFetchErrors, [], "all allowed Preview requests returned a response without transport errors");
  assert.deepEqual(consoleErrors, [], "browser console errors outside the intentional 404 document");
  assert.ok(intentional404ConsoleMessages.length <= 1, "intentional 404 route produced too many console errors");
  assert.deepEqual(pageErrors, [], "uncaught browser errors");
  assert.deepEqual(failedRequests, [], "failed browser requests");
  assert.deepEqual(subresourceErrors, [], "failed subresources");

  results.status = "PASS";
  const resultsPath = join(outputDirectory, "RESULTS.json");
  await writeFile(resultsPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
  const hashes = results.viewports.map(({ screenshot, screenshotSha256 }) => `${screenshotSha256}  ${screenshot}`);
  hashes.push(`${await sha256(resultsPath)}  RESULTS.json`);
  const logPath = join(outputDirectory, "PLAYWRIGHT-LOG.md");
  await writeFile(
    logPath,
    [
      `# Remote Preview verification · run ${runId}`,
      "",
      `- Status: PASS` ,
      `- Build SHA: ${expectedSha}`,
      `- Stable origin: ${stableOrigin}`,
      `- Immutable origin: ${immutableOrigin}`,
      `- Browser: Playwright ${results.playwrightVersion} / axe-playwright ${results.axePlaywrightVersion} / Chromium ${results.browserVersion}, fresh isolated contexts, HTTPS validation enabled, no profile/cookies/CDP attach`,
      `- Checks: exact-SHA /health on both origins, /preview-status contract, /robots.txt, real 404, security headers, noindex, three viewport layouts, axe WCAG 2.1 A/AA, keyboard focus, console/page/network errors, exact-origin allowlist and redirect blocking for documents and resources`,
      `- Screenshots and SHA-256 values: see RESULTS.json and SHA256SUMS.txt.`,
    ].join("\n") + "\n",
    "utf8",
  );
  hashes.push(`${await sha256(logPath)}  PLAYWRIGHT-LOG.md`);
  await writeFile(join(outputDirectory, "SHA256SUMS.txt"), `${hashes.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ status: results.status, outputDirectory, viewports: results.viewports.map(({ name, screenshotSha256 }) => ({ name, screenshotSha256 })) }, null, 2));
} catch (error) {
  if (outputDirectoryCreated) {
    results.status = "FAIL";
    results.failure = error instanceof Error ? error.message : String(error);
    await writeFile(join(outputDirectory, "FAILED.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8");
  }
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
} finally {
  await browser?.close();
}
