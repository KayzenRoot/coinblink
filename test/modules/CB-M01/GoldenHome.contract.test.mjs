import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("../../../src/modules/CB-M01/GoldenHome.astro", import.meta.url);
const component = await readFile(componentPath, "utf8");
const clientScript = await readFile(new URL("../../../public/home-demo.js", import.meta.url), "utf8");
const stylesheet = await readFile(new URL("../../../src/modules/CB-M01/golden-home.css", import.meta.url), "utf8");
const visualRunner = await readFile(new URL("./visual-check.mjs", import.meta.url), "utf8");
const visualServer = await readFile(new URL("./visual-server.mjs", import.meta.url), "utf8");
const visualRequestOrigin = await readFile(new URL("./visual-request-origin.mjs", import.meta.url), "utf8");
const fixtureConfig = await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/astro-fixture.config.mjs", import.meta.url), "utf8");

test("GoldenHome exposes the approved semantic page seam", () => {
  for (const required of ['<header', '<nav', '<main id="main"', '<footer', 'aria-label={t("Primary navigation")}']) {
    assert.ok(component.includes(required), "missing semantic seam: " + required);
  }
});

test("all market and editorial samples remain visibly demonstration-only", () => {
  for (const required of ["DEMO", "Not connected", "no live story connected", "MOCK MODE", "No message will be sent"]) {
    assert.ok(component.includes(required), "missing demo boundary: " + required);
  }
  assert.doesNotMatch(component, /<[^>]+>\s*Live\s*<\/[^>]+>/i);
});

test("the newsletter demo cannot submit an email address", () => {
  assert.match(component, /<script is:inline src="\/home-demo\.js"><\/script>/u);
  assert.match(component, /<script is:inline type="module" src="\/explorer-lookup\.js"><\/script>/u);
  const newsletter = component.split('class="content-panel newsletter-panel"')[1]?.split("</section>")[0];
  assert.ok(newsletter, "newsletter section is required");
  assert.doesNotMatch(newsletter, /<form\b/u, "demo email control must have no native submission behavior");
  assert.match(component, /<button type="button" data-demo-preview>/u);
  assert.match(clientScript, /querySelector\("\[data-demo-preview\]"\)\?\.addEventListener\("click"/u);
  assert.doesNotMatch(component, /action\s*=|fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon/);
});

test("visual request monitoring compares parsed origins rather than URL prefixes", () => {
  assert.equal(visualRunner.includes("isFixtureOriginRequest(request.url(), origin)"), true);
  assert.equal(visualRequestOrigin.includes("new URL(requestUrl).origin === new URL(fixtureOrigin).origin"), true);
});
test("the component uses the immutable approved logo and does not flatten the Golden Home", () => {
  assert.match(component, /coinblink-logo-approved-original-1179x1040\.jpg/);
  assert.doesNotMatch(component, /coinblink-home-master-dark-1536x864\.jpg/);
});

test("the hero uses a readable Bitcoin symbol rather than a generic T-shaped mark", () => {
  assert.match(component, />₿<\/text>/u);
});

test("original layered rockscape stays decorative, noninteractive and independent of Golden raster", () => {
  assert.match(component, /<svg class="hero-rockscape" viewBox="0 0 760 320"[^>]*focusable="false" aria-hidden="true">/u);
  for (const id of ["hero-rock-back", "hero-rock-front", "hero-rock-rim", "hero-rock-haze"]) {
    assert.ok(component.includes('id="' + id + '"'), "missing layered rockscape definition: " + id);
  }
  assert.match(stylesheet, /\.cb-home \.hero-rockscape \{[\s\S]*?pointer-events: none;/u);
  assert.doesNotMatch(component, /<img[^>]+coinblink-home-master-dark-1536x864\.jpg/u);
});

test("Tools opens the working read-only lookup while Videos remains disconnected", () => {
  assert.match(component, /<a href="#chain-lookup">\{t\("Tools"\)\}<\/a><a href="#demo-data">\{t\("Videos"\)\}<\/a>/u);
  assert.match(component, /data-explorer-form/u);
  assert.match(component, /Video publishing and live feeds are unavailable/u);
  assert.match(component, /Public identifiers only\. Never paste private keys/u);
});

test("mobile navigation closes after selecting a link", () => {
  assert.match(clientScript, /navLinks\.forEach\(\(link\) => link\.addEventListener\("click"/u);
  assert.match(visualRunner, /mobileNavigationLinkCloses/u);
});

test("visual evidence records the frozen base separately from the captured HEAD", () => {
  assert.match(visualRunner, /const baseSha = "07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c";/u);
  assert.match(visualRunner, /headSha = await readGitHead\(repoRoot\);/u);
  assert.doesNotMatch(visualRunner, /execFileSync\("git"/u);
  assert.match(visualRunner, /visualInputState = assertVisualInputsClean\(repoRoot\);/u);
  assert.match(visualRunner, /finalHeadSha = await readGitHead\(repoRoot\);[\s\S]*visualInputState = assertVisualInputsClean\(repoRoot\);/u);
  assert.match(visualRunner, /visualInputState,/u);
  assert.match(visualRunner, /baseSha,\s*headSha,/u);
  const clearReport = visualRunner.indexOf("await clearVisualCheckReport(reportPath)");
  assert.ok(clearReport >= 0, "each run must invalidate old evidence");
  for (const initialization of ["await readGitHead(repoRoot)", "await availablePort()", "await mkdtemp("]) {
    assert.ok(clearReport < visualRunner.indexOf(initialization), "stale evidence must clear before " + initialization);
  }
  assert.match(visualRunner, /catch \(error\) \{\s*await writeVisualCheckFailure\(reportPath,/u);
});

test("trending cards keep one tablet row and a horizontally scrollable mobile row", () => {
  assert.match(stylesheet, /\.trending-strip \{ grid-template-columns:125px repeat\(3,minmax\(0,1fr\)\); \}/u);
  assert.match(stylesheet, /\.trending-strip \{ grid-auto-flow:column; grid-auto-columns:minmax\(148px,1fr\); grid-template-columns:132px; overflow-x:auto; \}/u);
  assert.match(visualRunner, /tablet title and three visible items must share one row/u);
  assert.match(visualRunner, /mobile trending title and all items must remain on a single row/u);
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

const sharedEnglishRoute = await readFile(new URL("../../../src/pages/en.astro", import.meta.url), "utf8");

test("real /en route mounts GoldenHome without bypassing the common secure layout", () => {
  assert.match(sharedEnglishRoute, /import BaseLayout from "\.\.\/layouts\/BaseLayout\.astro"/u);
  assert.match(sharedEnglishRoute, /import GoldenHome from "\.\.\/modules\/CB-M01\/GoldenHome\.astro"/u);
  assert.match(sharedEnglishRoute, /<BaseLayout[\s\S]*<GoldenHome \/>[\s\S]*<\/BaseLayout>/u);
  assert.doesNotMatch(sharedEnglishRoute, /<main\b/u, "the shared route must not create a second main landmark");
  assert.match(sharedEnglishRoute, /export const prerender = false/u);
});


const copy = await readFile(new URL("../../../src/modules/CB-M01/home-copy.mjs", import.meta.url), "utf8");
const ptRoute = await readFile(new URL("../../../src/pages/pt-br.astro", import.meta.url), "utf8");
const secureLayout = await readFile(new URL("../../../src/layouts/BaseLayout.astro", import.meta.url), "utf8");

test("Brazilian Portuguese uses one shared Golden Home and correct document language", () => {
  assert.match(component, /locale\?: "en" \| "pt-br"/u);
  assert.match(component, /data-locale=\{locale\}/u);
  assert.match(component, /href=\{locale === "en" \? "\/pt-br" : "\/en"\}/u);
  assert.match(ptRoute, /lang="pt-BR"/u);
  assert.match(ptRoute, /<GoldenHome locale="pt-br"\s*\/>/u);
  assert.match(secureLayout, /<html lang=\{lang\}>/u);
  assert.match(copy, /"Regulation": "Regulação"/u);
  assert.match(copy, /"DEMO · NO STORIES CONNECTED": "DEMO · SEM NOTÍCIAS CONECTADAS"/u);
  assert.match(clientScript, /const isPortuguese = /u);
  assert.doesNotMatch(clientScript, /\b(?:fetch\s*\(|localStorage|sessionStorage|document\.cookie)\b/u);
});
