import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const repoRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
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

const port = await availablePort();
const origin = "http://127.0.0.1:" + port;
let serverOutput = "";
const server = spawn(process.execPath, [
  astroCli, "dev", "--config=" + join("test", "modules", "CB-M01", "fixture", "astro.config.mjs"),
  "--host", "127.0.0.1", "--port", String(port), "--strictPort",
], {
  cwd: repoRoot,
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, M01_FIXTURE_OUT_DIR: join(process.env.TEMP || process.env.TMP || repoRoot, "coinblink-m01-fixture-dist") },
});
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitUntilReady() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error("Astro fixture exited: " + serverOutput);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch { /* The Astro server is still starting. */ }
    await delay(250);
  }
  throw new Error("Astro fixture did not become ready: " + serverOutput);
}

const results = [];
const consoleErrors = [];
const pageErrors = [];
const externalRequests = [];
let browser;

try {
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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: "networkidle" });
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
  if (browser) await browser.close();
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([new Promise((resolveExit) => server.once("exit", resolveExit)), delay(3000)]);
  }
}

await mkdir(evidenceDir, { recursive: true });
const { readFile } = await import("node:fs/promises");
for (const result of results) {
  const screenshot = await readFile(join(evidenceDir, "golden-home-" + result.name + ".png"));
  result.screenshotSha256 = createHash("sha256").update(screenshot).digest("hex");
}
const report = {
  generatedAt: new Date().toISOString(),
  baseSha: "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c",
  fixture: "isolated Astro fixture; no shared /en route integration",
  origin,
  viewports: results,
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





