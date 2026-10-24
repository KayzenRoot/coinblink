import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const repo = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const types = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".webp": "image/webp" };

test("M02 isolated built Astro / Chromium accessible offline workbench", { timeout: 150_000 }, async () => {
  const temp = await mkdtemp(join(repo, "node_modules", "coinblink-m02-static-a11y-"));
  const root = join(temp, "dist");
  const deniedRequests = [];
  const browserErrors = [];
  let browser;
  let server;
  try {
    // Build a standalone STATIC fixture instead of running another astro dev:
    // M01's visual fixture owns the dev-server lock during concurrent node --test.
    execFileSync(process.execPath, [
      join(repo, "node_modules", "astro", "bin", "astro.mjs"), "build",
      "--config", "test/modules/CB-M02/fixture.config.mjs",
    ], { cwd: repo, windowsHide: true, encoding: "utf8", timeout: 100_000,
      env: { ...process.env, CB_M02_A11Y_TEMP: temp, ASTRO_TELEMETRY_DISABLED: "1" } });
    server = createServer(async (request, response) => {
      try {
        const name = new URL(request.url, "http://localhost").pathname;
        const decoded = decodeURIComponent(name);
        if (decoded.includes("..") || decoded.includes("\\") || decoded.includes("\0")) {
          response.writeHead(400); response.end(); return;
        }
        const requested = join(root, decoded === "/" ? "index.html" : decoded.replace(/^\/+/, ""));
        if (!(requested === root || requested.startsWith(root + sep))) {
          response.writeHead(403); response.end(); return;
        }
        const bytes = await readFile(requested);
        response.writeHead(200, { "content-type": types[extname(requested)] || "application/octet-stream",
          "cache-control": "no-store" });
        response.end(bytes);
      } catch { response.writeHead(404); response.end(); }
    });
    await new Promise((ok, fail) => {
      server.once("error", fail);
      server.listen(0, "127.0.0.1", ok);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const origin = "http://127.0.0.1:" + address.port;
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on("request", request => {
      if (new URL(request.url()).origin !== origin) deniedRequests.push(request.url());
    });
    page.on("pageerror", error => browserErrors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    for (const [viewport, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844]]) {
      await page.setViewportSize({ width, height });
      const response = await page.goto(origin, { waitUntil: "networkidle" });
      assert.equal(response?.status(), 200, viewport + ": fixture must render");
      assert.equal(await page.locator("[data-m02-root]").count(), 1);
      assert.equal(await page.locator("[data-m02-entry]").count(), 3);
      assert.match(await page.locator("[data-m02-root]").innerText(), /MOCK.*FICTIONAL.*NOT PUBLISHED/su);
      assert.ok(await page.evaluate(() =>
        globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth),
      viewport + ": horizontal overflow");
      const axe = await new AxeBuilder({ page }).include("[data-m02-root]").analyze();
      assert.deepEqual(axe.violations.map(v => v.id), [], viewport + ": axe violations");
      await page.screenshot({ path: join(temp, "m02-" + viewport + ".png"), fullPage: true });
    }
    const search = page.locator("[data-m02-search]");
    await search.focus();
    await search.fill("wallet");
    assert.equal(await page.locator("[data-m02-entry]:visible").count(), 1);
    await page.locator("select[data-m02-category]").selectOption("education");
    assert.equal(await page.locator("[data-m02-entry]:visible").count(), 0);
    assert.equal(await page.locator("[data-m02-empty]").isVisible(), true);
    await search.fill("");
    assert.equal(await page.locator("[data-m02-entry]:visible").count(), 1);
    await page.locator("[data-m02-entry]:visible summary").press("Enter");
    assert.equal(await page.locator("[data-m02-entry]:visible details").getAttribute("open"), "");
    assert.deepEqual(deniedRequests, [], "external provider requests forbidden");
    assert.deepEqual(browserErrors, [], "console/page errors forbidden");
    console.log("M02 static Astro + real Chromium: three responsive axe passes, live in-browser controls, zero external requests");
  } finally {
    await browser?.close();
    if (server) await new Promise(ok => server.close(ok));
    await rm(temp, { recursive: true, force: true });
  }
});
