import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("../../../src/modules/CB-M01/GoldenHome.astro", import.meta.url);
const component = await readFile(componentPath, "utf8");
const visualRunner = await readFile(new URL("./visual-check.mjs", import.meta.url), "utf8");
const visualServer = await readFile(new URL("./visual-server.mjs", import.meta.url), "utf8");
const fixtureConfig = await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/astro-fixture.config.mjs", import.meta.url), "utf8");

test("GoldenHome exposes the approved semantic page seam", () => {
  for (const required of ['<header', '<nav', '<main id="main"', '<footer', 'aria-label="Primary navigation"']) {
    assert.ok(component.includes(required), "missing semantic seam: " + required);
  }
});

test("all market and editorial samples remain visibly demonstration-only", () => {
  for (const required of ["DEMO", "Not connected", "no live story connected", "MOCK MODE", "No message will be sent"]) {
    assert.ok(component.includes(required), "missing demo boundary: " + required);
  }
  assert.doesNotMatch(component, /<[^>]+>\s*Live\s*<\/[^>]+>/i);
});

test("the newsletter form cannot send data to an external destination", () => {
  assert.match(component, /data-demo-form/);
  assert.match(component, /event\.preventDefault\(\)/);
  assert.doesNotMatch(component, /action\s*=|fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
});

test("the component uses the immutable approved logo and does not flatten the Golden Home", () => {
  assert.match(component, /coinblink-logo-approved-original-1179x1040\.jpg/);
  assert.doesNotMatch(component, /coinblink-home-master-dark-1536x864\.jpg/);
});

test("the hero uses a readable Bitcoin symbol rather than a generic T-shaped mark", () => {
  assert.match(component, />₿<\/text>/u);
});

test("the visual fixture uses and cleans only a per-run isolated temp directory", () => {
  assert.match(visualRunner, /mkdtemp\(join\(tmpdir\(\), "coinblink-m01-fixture-"\)\)/);
  assert.match(visualRunner, /M01_FIXTURE_TEMP_DIR: fixtureTempRoot/);
  assert.match(visualRunner, /async function waitForChildExit\(child, timeoutMs\)/);
  assert.match(visualRunner, /setTimeout\(\(\) => finish\(false\), timeoutMs\)/);
  assert.match(visualRunner, /child\.kill\("SIGKILL"\)/);
  assert.match(visualRunner, /if \(!serverStopped\)[\s\S]*isolated directory was retained/);
  assert.match(visualRunner, /removeFixtureTempRootAfterExit\(server, fixtureTempRoot\)/);
  assert.match(visualServer, /export async function waitForFixtureReady/);
  assert.match(visualServer, /Promise\.race\([\s\S]*controller\.signal/);
  assert.match(visualServer, /remainingMs/);
  assert.match(visualServer, /assertFixtureRunning\(child\)/);
  assert.match(visualServer, /export async function removeFixtureTempRootAfterExit/);
  assert.doesNotMatch(visualRunner, /process\.env\.(?:TEMP|TMP)/);
  assert.match(visualRunner, /\.engineering.*CB-M01-WO-001.*astro-fixture\.config\.mjs/);
  assert.match(fixtureConfig, /if \(!fixtureTempDir \|\| !isAbsolute\(fixtureTempDir\)\)/);
  assert.match(fixtureConfig, /relative\(tempParent, resolvedTempDir\)/);
  assert.match(fixtureConfig, /basename\(resolvedTempDir\)\.startsWith\("coinblink-m01-fixture-"\)/);
  assert.match(fixtureConfig, /cacheDir: join\(resolvedTempDir, "cache"\)/);
  assert.match(fixtureConfig, /outDir: join\(resolvedTempDir, "dist"\)/);
  assert.doesNotMatch(fixtureConfig, /fixtureRoot, "\.m01-fixture-output"|M01_FIXTURE_OUT_DIR/);
});
