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

async function availablePort() {
  const server = createServer();
  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok);
  });
  const address = server.address();
  await new Promise(ok => server.close(ok));
  if (!address || typeof address === "string") throw new Error("no loopback port");
  return address.port;
}

async function awaitLocalFixture(origin, child, diagnostics) {
  for (let i = 0; i < 90; i += 1) {
    if (child.exitCode !== null || child.signalCode) throw new Error("Astro fixture stopped: " + diagnostics().slice(-1200));
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(600) });
      if (response.status === 200) return;
    } catch { /* local startup in progress */ }
    await new Promise(ok => setTimeout(ok, 280));
  }
  throw new Error("Astro fixture timed out: " + diagnostics().slice(-1200));
}

test("M03 isolated real-browser offline mock accessibility, responsive and filtering", { timeout: 150_000 }, async () => {
  const temp = await mkdtemp(join(tmpdir(), "coinblink-m03-a11y-"));
  const port = await availablePort();
  const origin = "http://127.0.0.1:" + port;
  const forbidden = [];
  const errors = [];
  let browser;
  let astro;
  let stderr = "";
  try {
    astro = spawn(process.execPath, [
      join(repo, "node_modules", "astro", "bin", "astro.mjs"), "dev",
      "--config", "test/modules/CB-M03/fixture.config.mjs",
      "--host", "127.0.0.1", "--port", String(port), "--strictPort",
    ], { cwd: repo, windowsHide: true, stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, CB_M03_A11Y_TEMP: temp, ASTRO_TELEMETRY_DISABLED: "1" } });
    astro.stderr.on("data", chunk => { stderr = (stderr + chunk.toString()).slice(-3000); });
    await awaitLocalFixture(origin, astro, () => stderr);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on("request", request => {
      if (new URL(request.url()).origin !== origin) forbidden.push(request.url());
    });
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const [name, width, height] of [["desktop", 1440, 900], ["tablet", 768, 1024], ["mobile", 390, 844]]) {
      await page.setViewportSize({ width, height });
      const response = await page.goto(origin, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, name + " must render offline");
      assert.equal(await page.locator("[data-m03-root]").count(), 1);
      assert.equal(await page.locator("[data-m03-entry]").count(), 2);
      assert.match(await page.locator("[data-m03-root]").innerText(), /MOCK SOURCES/u);
      assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.document.documentElement.clientWidth),
        name + ": no horizontal overflow");
      const axe = await new AxeBuilder({ page }).include("[data-m03-root]").analyze();
      assert.deepEqual(axe.violations.map(v => v.id), [], name + ": axe-core accessibility");
      await page.screenshot({ path: join(temp, "m03-" + name + ".png"), fullPage: true });
    }
    const search = page.locator("[data-m03-search]");
    await search.focus();
    await search.fill("academic");
    assert.equal(await page.locator("[data-m03-entry]:visible").count(), 1);
    await search.fill("nothing-matches");
    assert.equal(await page.locator("[data-m03-entry]:visible").count(), 0);
    assert.equal(await page.locator("[data-m03-empty]").isVisible(), true);
    await search.fill("");
    assert.equal(await page.locator("[data-m03-entry]:visible").count(), 2);
    assert.deepEqual(forbidden, [], "must never call third-party resources");
    assert.deepEqual(errors, [], "must not raise browser/page errors");
    console.log("M03 real Astro/Chromium: 3 axe responsive viewports, true browser filter/empty state, zero external requests");
  } finally {
    await browser?.close();
    if (astro && astro.exitCode === null) {
      astro.kill();
      await new Promise(ok => { astro.once("exit", ok); setTimeout(ok, 2500); });
      if (astro.exitCode === null) astro.kill("SIGKILL");
    }
    await rm(temp, { recursive: true, force: true });
  }
});
