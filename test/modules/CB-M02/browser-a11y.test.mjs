import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const repo = resolve(fileURLToPath(new URL("../../../", import.meta.url)));

async function freePort() {
  const listener = createServer();
  await new Promise((ok, fail) => {
    listener.once("error", fail);
    listener.listen(0, "127.0.0.1", ok);
  });
  const address = listener.address();
  await new Promise(ok => listener.close(ok));
  if (!address || typeof address === "string") throw new Error("no free loopback port");
  return address.port;
}

async function waitForResponse(origin, child, stderr) {
  for (let attempts = 0; attempts < 90; attempts += 1) {
    if (child.exitCode !== null || child.signalCode) {
      throw new Error("isolated Astro server stopped: " + stderr().slice(-1200));
    }
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(600) });
      if (response.ok) return;
    } catch { /* booting local-only fixture */ }
    await new Promise(ok => setTimeout(ok, 280));
  }
  throw new Error("Astro did not become ready: " + stderr().slice(-1200));
}

test("M02 isolated Astro browser: offline interaction, keyboard, axe, responsive, no requests", { timeout: 150_000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), "coinblink-m02-a11y-"));
  const port = await freePort();
  const origin = "http://127.0.0.1:" + port;
  const forbidden = [];
  const errors = [];
  let browser;
  let processAstro;
  let stderr = "";
  try {
    processAstro = spawn(process.execPath, [
      join(repo, "node_modules", "astro", "bin", "astro.mjs"), "dev",
      "--config", "test/modules/CB-M02/fixture.config.mjs",
      "--host", "127.0.0.1", "--port", String(port), "--strictPort",
    ], { cwd: repo, windowsHide: true, stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, CB_M02_A11Y_TEMP: temp, ASTRO_TELEMETRY_DISABLED: "1" } });
    processAstro.stderr.on("data", chunk => { stderr = (stderr + chunk.toString()).slice(-3000); });
    await waitForResponse(origin, processAstro, () => stderr);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on("request", request => {
      if (new URL(request.url()).origin !== origin) forbidden.push(request.url());
    });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const [label, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844]]) {
      await page.setViewportSize({ width, height });
      const response = await page.goto(origin, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, label + ": offline fixture must load");
      assert.equal(await page.locator("[data-m02-root]").count(), 1);
      assert.equal(await page.locator("[data-m02-entry]").count(), 3);
      assert.match(await page.locator("[data-m02-root]").innerText(), /MOCK.*FICTIONAL.*NOT PUBLISHED/su);
      assert.ok(await page.evaluate(() =>
        globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth),
      label + ": unexpected horizontal overflow");
      const axe = await new AxeBuilder({ page }).include("[data-m02-root]").analyze();
      assert.deepEqual(axe.violations.map(v => v.id), [], label + ": axe violations");
      await page.screenshot({ path: join(temp, "m02-" + label + ".png"), fullPage: true });
    }
    const search = page.locator("[data-m02-search]");
    await search.focus();
    await search.fill("wallet");
    assert.equal(await page.locator("[data-m02-entry]:visible").count(), 1);
    await page.locator("[data-m02-category]").selectOption("education");
    assert.equal(await page.locator("[data-m02-entry]:visible").count(), 0);
    assert.equal(await page.locator("[data-m02-empty]").isVisible(), true);
    await search.fill("");
    assert.equal(await page.locator("[data-m02-entry]:visible").count(), 1);
    await page.locator("[data-m02-entry]:visible summary").press("Enter");
    assert.equal(await page.locator("[data-m02-entry]:visible details").getAttribute("open"), "");
    assert.deepEqual(forbidden, [], "browser must not call external content providers");
    assert.deepEqual(errors, [], "browser must not have console/page errors");
    console.log("M02 isolated browser: 3 responsive viewport/axe passes; real search/category/detail controls; no external requests");
  } finally {
    await browser?.close();
    if (processAstro && processAstro.exitCode === null) {
      processAstro.kill();
      await new Promise(ok => { processAstro.once("exit", ok); setTimeout(ok, 2500); });
      if (processAstro.exitCode === null) processAstro.kill("SIGKILL");
    }
    await rm(temp, { recursive: true, force: true });
  }
});
