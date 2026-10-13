import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("five market badges use local vector identity rather than first letters", () => {
  const panel = component.split('<ul class="market-list">')[1]?.split("</ul>")[0];
  assert.ok(panel, "market panel must exist");
  for (const symbol of ["BTC", "ETH", "SOL", "BNB", "XRP"]) {
    assert.ok(panel.includes('market.symbol === "' + symbol + '"'), "missing visual icon for " + symbol);
  }
  assert.doesNotMatch(panel, /market\.symbol\.slice\(0,\s*1\)/u);
  assert.equal((panel.match(/class="market-asset-icon"/gu) ?? []).length, 4);
  assert.match(panel, /aria-hidden="true"/u);
  assert.match(stylesheet, /\.cb-home \.coin-mark \.market-asset-icon \{/u);
});

test("four editorial thumbnails are original, local and clearly DEMO-only", async () => {
  const artwork = await readFile(new URL("../../../src/modules/CB-M01/EditorialArtwork.astro", import.meta.url), "utf8");
  assert.match(component, /import EditorialArtwork from "\.\/EditorialArtwork\.astro"/u);
  assert.match(component, /<EditorialArtwork variant=\{story\.artwork/u);
  for (const [tag, variant] of [["MARKET", "bitcoin"], ["DEVELOPMENT", "ethereum"], ["POLICY", "policy"], ["ECOSYSTEM", "ecosystem"]]) {
    assert.ok(component.includes('tag: "' + tag + '", artwork: "' + variant + '"'), "missing decorative variant " + variant);
    assert.ok(artwork.includes('variant === "' + variant + '"'), "missing artwork variant " + variant);
  }
  assert.match(artwork, /<svg class="editorial-artwork"[^>]+focusable="false" aria-hidden="true">/u);
  assert.doesNotMatch(artwork, /<script|<image|https?:\/\/|fetch\(/iu);
  assert.match(component, /Editorial placeholder · no live story connected/u);
  assert.match(stylesheet, /\.cb-home \.news-art \.editorial-artwork/u);
});

test("R15 decorative editorial assets have fail-closed provenance and exact-source SHA-256", async () => {
  const registry = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/editorial-asset-provenance.json", import.meta.url), "utf8"));
  const source = await readFile(new URL("../../../src/modules/CB-M01/EditorialArtwork.astro", import.meta.url), "utf8");
  const actualSha256 = createHash("sha256").update(source, "utf8").digest("hex");

  assert.equal(registry.workOrder, "CB-M01-WO-001");
  assert.equal(registry.productState, "DRAFT_DEMO_ONLY_NOT_PUBLISHED");
  assert.equal(registry.sharedSource.path, "src/modules/CB-M01/EditorialArtwork.astro");
  assert.equal(registry.sharedSource.sha256, actualSha256, "source changed without provenance refresh");
  assert.equal(registry.sharedSource.gitBlobSha, "f02b58375e548a89d86b677463439730e94f7687");
  assert.equal(registry.sharedSource.derivativeOfGoldenRaster, false);
  assert.equal(registry.assets.length, 4);

  const expectedVariants = ["bitcoin", "ethereum", "policy", "ecosystem"];
  assert.deepEqual(registry.assets.map((entry) => entry.variant), expectedVariants);
  assert.equal(new Set(registry.assets.map((entry) => entry.assetId)).size, 4);
  for (const entry of registry.assets) {
    assert.equal(entry.sourceSha256, actualSha256);
    assert.equal(entry.sourceGitBlobSha, registry.sharedSource.gitBlobSha);
    assert.equal(entry.sourcePath, registry.sharedSource.path);
    assert.equal(entry.viewBox, "0 0 80 110");
    assert.equal(entry.exportFormat, "ASTRO_INLINE_SVG");
    assert.equal(entry.altTextMode, "DECORATIVE_ARIA_HIDDEN");
    assert.equal(entry.rightsReview, "PENDING_OWNER_OR_LEGAL");
    assert.equal(entry.licenseOrTrademarkClearance, "NOT_ESTABLISHED");
    assert.equal(entry.commercialPublicationAllowed, false);
    assert.equal(entry.ownerVisualApproval, false);
    assert.equal(entry.liveNewsEligible, false);
    assert.equal(entry.allowedUsage, "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY");
    assert.equal(entry.lightVariant, "NOT_APPROVED");
    assert.equal(entry.evidence.commit, "33b8aa8b34aaca94d01487c93fe0a2617dbe5400");
    assert.equal(entry.evidence.runId, 38409789009);
    assert.ok(entry.sourceMaster && entry.creatorTool && entry.designGoldenReference);
    assert.ok(source.includes('variant === "' + entry.variant + '"'));
  }
  assert.match(component, /Editorial placeholder · no live story connected/u);
});

test("hero and promo scene metadata pin exact source fragments and deny commercial publishing", async () => {
  const registry = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/scene-asset-provenance.json", import.meta.url), "utf8"));
  const actualSourceSha256 = createHash("sha256").update(component, "utf8").digest("hex");
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.workOrder, "CB-M01-WO-001");
  assert.equal(registry.productState, "DRAFT_DEMO_ONLY_NOT_PUBLISHED");
  assert.equal(registry.source.path, "src/modules/CB-M01/GoldenHome.astro");
  assert.equal(registry.source.sha256, actualSourceSha256, "the scene parent source changed without provenance refresh");
  const sourceBytes = Buffer.from(component, "utf8");
  const expectedGitBlobSha = createHash("sha1")
    .update(Buffer.from("blob " + sourceBytes.length + "\0", "utf8"))
    .update(sourceBytes)
    .digest("hex");
  assert.equal(registry.source.gitBlobSha, expectedGitBlobSha, "the scene source Git blob changed without provenance refresh");
  assert.equal(registry.source.rasterDerivativeOfGoldenReference, false);
  assert.equal(registry.goldenReference.use, "VISUAL_REFERENCE_ONLY_NOT_DISPLAYED_AS_BACKGROUND_OR_CROPPED");
  assert.equal(registry.sharedReleaseGate.commercialPublicationAllowed, false);
  assert.equal(registry.sharedReleaseGate.ownerVisualApproval, false);
  assert.equal(registry.assets.length, 2);
  assert.deepEqual(registry.assets.map((a) => a.region), ["hero", "promo"]);
  assert.equal(new Set(registry.assets.map((a) => a.assetId)).size, 2);
  for (const asset of registry.assets) {
    const { startMarker, endMarker, includeEndMarker, sha256, sourceByteLength } = asset.sourceFragment;
    const start = component.indexOf(startMarker);
    const end = component.indexOf(endMarker, start + startMarker.length);
    assert.ok(start >= 0 && end > start, "missing bounded fragment: " + asset.region);
    assert.equal(component.indexOf(startMarker, start + 1), -1, "duplicate asset fragment: " + asset.region);
    const slice = component.slice(start, end + (includeEndMarker ? endMarker.length : 0));
    assert.equal(Buffer.byteLength(slice, "utf8"), sourceByteLength);
    assert.equal(createHash("sha256").update(slice, "utf8").digest("hex"), sha256,
      "undocumented source fragment change: " + asset.region);
    assert.equal(asset.sourceGitBlobSha, registry.source.gitBlobSha);
    assert.equal(asset.sourcePath, registry.source.path);
    assert.equal(asset.rightsReview, "PENDING_OWNER_OR_LEGAL");
    assert.equal(asset.licenseOrTrademarkClearance, "NOT_ESTABLISHED");
    assert.equal(asset.ownerVisualApproval, false);
    assert.equal(asset.commercialPublicationAllowed, false);
    assert.equal(asset.liveEditorialEligible, false);
    assert.equal(asset.advertisingEligible, false);
    assert.equal(asset.allowedUsage, "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY");
    assert.equal(asset.lightThemeApproval, "NOT_APPROVED");
    assert.ok(asset.assetId && asset.sourceValidationDate && asset.viewBoxes.length > 0);
    assert.equal(slice.includes("<image"), false, "scene must not embed remote images");
    assert.equal(slice.includes("http://"), false, "scene must not contain remote HTTP URLs");
    assert.equal(slice.includes("https://"), false, "scene must not contain remote HTTPS URLs");
  }
  const [hero, promo] = registry.assets;
  assert.match(component, /<div class="hero-scene" aria-hidden="true">/u);
  assert.match(component, /<svg class="promo-scene"[^>]*aria-hidden="true"/u);
  assert.equal(hero.form, "LOCAL_BLENDER_PREVIEW_WITH_HTML_AND_EMBEDDED_SVG_FALLBACK");
  assert.equal(registry.r25SupplementalPreview.origin, "ORIGINAL_LOCAL_RENDER");
  assert.equal(registry.r25SupplementalPreview.previewOnly, true);
  assert.equal(registry.r25SupplementalPreview.ownerVisualApproval, false);
  assert.equal(registry.r25SupplementalPreview.commercialPublicationAllowed, false);
  assert.equal(promo.form, "INLINE_SVG");
  assert.equal(promo.adjacentBrandAsset.includedInSvgFragment, false);
  assert.equal(promo.adjacentBrandAsset.status, "OWNER_VISUAL_APPROVED_BUT_COMMERCIAL_CLEARANCE_PENDING");
});

test("R18 promo atmosphere stays decorative, local and subordinate to DEMO copy", () => {
  const promo = component.split('<aside class="promo-panel"')[1]?.split("</aside>")[0];
  assert.ok(promo, "promotional panel must exist");
  assert.match(promo, /<svg class="promo-scene"[^>]*aria-hidden="true"/u);
  assert.match(promo, /href="#demo-data"/u);
  assert.match(promo, /DEMONSTRATION/u);
  assert.doesNotMatch(promo, /<script|<image|https?:\/\//iu);
  assert.match(stylesheet, /CB-M01 R18: visual-only Golden promotional atmosphere/u);
  assert.match(stylesheet, /\.cb-home \.promo-panel::before \{[\s\S]*?pointer-events: none;/u);
  assert.match(stylesheet, /\.cb-home \.promo-scene \{[\s\S]*?drop-shadow/u);
});

test("R19 adds a noninteractive three-quarter perspective without changing the source art", () => {
  assert.match(stylesheet, /CB-M01 R19: subtle three-quarter metallic coin perspective/u);
  assert.match(stylesheet, /\.cb-home \.coin-art \{[\s\S]*?rotateY\(-16deg\)/u);
  assert.match(stylesheet, /\.cb-home \.hero-scene \{ perspective: 980px/u);
  assert.match(component, /<svg class="coin-art"[^>]*aria-hidden="true"/u);
  assert.doesNotMatch(component, /<img[^>]*coinblink-home-master-dark/u);
});

test("R20 Bitcoin relief is original inline SVG with bounded local metallic depth", () => {
  const coin = component.split('<svg class="coin-art"')[1]?.split("</svg>")[0];
  assert.ok(coin, "Bitcoin SVG must exist");
  for (const name of ["coin-relief", "coin-side-metal", "coin-reflection", "coin-specular"]) {
    assert.ok(coin.includes(name), "missing original relief layer " + name);
  }
  assert.equal((coin.match(/<circle cx="13[89]" cy="161"/gu) ?? []).length, 2);
  assert.match(coin, /<g class="coin-relief" aria-hidden="true">/u);
  assert.match(coin, /<text x="150" y="201"[^>]*>₿<\/text>/u);
  assert.doesNotMatch(coin, /<image|<script|https?:\/\//iu);
});

test("R21 rockscape has layered source-owned facets and no external texture dependencies", () => {
  const scene = component.split('<svg class="hero-rockscape"')[1]?.split("</svg>")[0];
  assert.ok(scene, "rockscape SVG required");
  for (const marker of ["hero-facet-lit", "hero-facet-shadow", "hero-ground-mist",
    "hero-rock-facets-back", "hero-rock-facets-front", "hero-ridge-mist"]) {
    assert.ok(scene.includes(marker), "missing original rockscape layer: " + marker);
  }
  assert.match(stylesheet, /CB-M01 R21: noninteractive faceted rock material/u);
  assert.match(stylesheet, /\.cb-home \.hero-rockscape \{[\s\S]*?opacity: \.93;/u);
  assert.match(component, /<div class="hero-scene" aria-hidden="true">/u);
  assert.doesNotMatch(scene, /<image|<script|https?:\/\//iu);
});

test("R22 independently versioned mineral asset is locally hashed and fail-closed", async () => {
  const reg = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/scene-asset-provenance.json", import.meta.url), "utf8"));
  assert.equal(reg.assets.length, 2, "embedded hero and promo source fragments must remain unchanged");
  assert.equal(reg.supplementalAssets.length, 1);
  const art = reg.supplementalAssets[0];
  const svg = await readFile(new URL("../../../src/modules/CB-M01/hero-mineral-texture.svg", import.meta.url), "utf8");
  assert.equal(art.path, "src/modules/CB-M01/hero-mineral-texture.svg");
  assert.equal(art.sha256, createHash("sha256").update(svg, "utf8").digest("hex"));
  assert.equal(art.byteLength, Buffer.byteLength(svg, "utf8"));
  const attr = await readFile(new URL("../../../src/modules/CB-M01/.gitattributes", import.meta.url), "utf8");
  assert.ok(attr.split(/\r?\n/u).includes("hero-mineral-texture.svg text eol=lf"),
    "cross-platform source SHA-256 needs invariant LF checkout on Windows");
  assert.equal(art.checkoutEOL, "LF_ENFORCED_BY_LOCAL_GITATTRIBUTES");
  assert.equal(art.commercialPublicationAllowed, false);
  assert.equal(art.productionReady, false);
  assert.equal(art.ownerVisualApproval, false);
  assert.ok(svg.includes('seed="22"') && svg.includes('type="fractalNoise"'));
  assert.ok(svg.includes('clip-path="url(#mineral-mountain-mask)"'));
  assert.equal(svg.includes("<image"), false);
  assert.equal(svg.includes("<script"), false);
  assert.equal(svg.includes("https://"), false);
  assert.ok(stylesheet.includes('url("./hero-mineral-texture.svg")'));
  assert.ok(stylesheet.includes("CB-M01 R22: independently versioned mineral texture"));
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
