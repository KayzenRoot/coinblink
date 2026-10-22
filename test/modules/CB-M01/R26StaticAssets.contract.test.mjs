import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateR26StaticAssetManifest } from "../../../src/modules/CB-M01/r26-static-assets-preflight.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const manifestPath = join(repoRoot, "assets", "archive", "m01", "r26-static-asset-provenance.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const payloads = new Map();
for (const asset of manifest.assets) {
  for (const record of [asset.sourceMaster, asset.derivatives.png, asset.derivatives.webp]) {
    payloads.set(record.path, await readFile(join(repoRoot, ...record.path.split("/"))));
  }
}

test("R26 pins five exact ImageGen masters and optimized static derivatives", async () => {
  const result = validateR26StaticAssetManifest(manifest, payloads);
  assert.equal(result.technicalPreflightPassed, true, result.failures.join(", "));
  assert.equal(manifest.assets.length, 5);
  assert.deepEqual(manifest.assets.map((asset) => asset.assetId), [
    "CB-M01-R26-PROMO-MASTER",
    "CB-M01-R26-EDITORIAL-BITCOIN",
    "CB-M01-R26-EDITORIAL-ETHEREUM",
    "CB-M01-R26-EDITORIAL-POLICY",
    "CB-M01-R26-EDITORIAL-ECOSYSTEM",
  ]);
  const golden = await readFile(join(repoRoot, manifest.goldenReference.path));
  assert.notEqual(manifest.assets[0].sourceMaster.sha256, createHash("sha256").update(golden).digest("hex"));
  for (const asset of manifest.assets) {
    assert.equal(asset.sourceMaster.format, "PNG");
    assert.ok(asset.sourceMaster.bytes <= 3_500_000);
    assert.ok(asset.derivatives.png.bytes <= 3_500_000);
    assert.ok(asset.derivatives.webp.bytes <= 1_500_000);
    assert.equal(asset.derivatives.png.derivedFromMasterSha256, asset.sourceMaster.sha256);
    assert.equal(asset.derivatives.webp.derivedFromMasterSha256, asset.sourceMaster.sha256);
    assert.equal(asset.assetClass, "STATIC_MASTER_APPROVED_IMAGE_PIPELINE");
    assert.equal(asset.providerVersion, "NOT_EXPOSED");
    assert.equal(asset.derivativeOfGoldenReference, false);
    assert.equal(asset.rightsReview, "PENDING_OWNER_OR_LEGAL");
    assert.equal(asset.ownerVisualApproval, false);
    assert.equal(asset.commercialPublicationAllowed, false);
    assert.equal(asset.publicationPermission, false);
    assert.equal(asset.demoOnly, true);
  }
});

test("R26 preflight rejects approval or publication escalation", () => {
  const altered = structuredClone(manifest);
  altered.assets[0].ownerVisualApproval = true;
  altered.assets[1].commercialPublicationAllowed = true;
  altered.releaseGate.publicationPermission = true;
  const result = validateR26StaticAssetManifest(altered, payloads);
  assert.equal(result.technicalPreflightPassed, false);
  assert.ok(result.failures.includes("OWNER_VISUAL_APPROVAL_MUST_REMAIN_FALSE"));
  assert.ok(result.failures.includes("PUBLICATION_MUST_BE_DISABLED"));
  assert.equal(result.releaseAllowed, false);
});

test("R26 preflight rejects rights, prompt, or Golden lineage divergence", () => {
  const altered = structuredClone(manifest);
  altered.assets[0].rightsReview = "CLEARED";
  altered.assets[1].prompt = "short";
  altered.assets[2].derivativeOfGoldenReference = true;
  const result = validateR26StaticAssetManifest(altered, payloads);
  assert.equal(result.technicalPreflightPassed, false);
  assert.ok(result.failures.includes("RIGHTS_REVIEW_MUST_REMAIN_PENDING"));
  assert.ok(result.failures.includes("MISSING_GENERATION_PROMPT"));
  assert.ok(result.failures.includes("ASSET_MUST_BE_INDEPENDENT_OF_GOLDEN_RASTER"));
});

test("R26 preflight fails closed on unsafe paths and source hash changes", () => {
  const unsafePathManifest = structuredClone(manifest);
  unsafePathManifest.assets[0].sourceMaster.path = "src/modules/CB-M01/assets/r26/masters/../../private.png";
  const unsafePathResult = validateR26StaticAssetManifest(unsafePathManifest, payloads);
  assert.equal(unsafePathResult.technicalPreflightPassed, false);
  assert.ok(unsafePathResult.failures.includes("INVALID_LOCAL_PATH"));

  const sourcePath = manifest.assets[0].sourceMaster.path;
  const tampered = new Map(payloads);
  const source = Buffer.from(tampered.get(sourcePath));
  source[128] ^= 0xff;
  tampered.set(sourcePath, source);
  const digestResult = validateR26StaticAssetManifest(manifest, tampered);
  assert.equal(digestResult.technicalPreflightPassed, false);
  assert.ok(digestResult.failures.includes("SHA256_MISMATCH"));
});

test("R26 preflight rejects derivatives detached from the exact static master", () => {
  const altered = structuredClone(manifest);
  altered.assets[3].derivatives.webp.derivedFromMasterSha256 = "0".repeat(64);
  const result = validateR26StaticAssetManifest(altered, payloads);
  assert.equal(result.technicalPreflightPassed, false);
  assert.ok(result.failures.includes("DERIVATIVE_SOURCE_MISMATCH"));
});

test("R26 media selection and failure recovery use a local external script under strict CSP", async () => {
  const component = await readFile(join(repoRoot, "src", "modules", "CB-M01", "GoldenHome.astro"), "utf8");
  const mediaScript = await readFile(join(repoRoot, "src", "modules", "CB-M01", "r26-media-selection.js"), "utf8");

  assert.match(component, /import\s+r26MediaSelectionUrl\s+from\s+"\.\/r26-media-selection\.js\?url&no-inline";/u);
  assert.match(component, /<script\s+is:inline\s+src=\{r26MediaSelectionUrl\}><\/script>/u);
  assert.doesNotMatch(component, /<script\s+is:inline\s*>[\s\S]*?<\/script>/u,
    "new media selection must not rely on an inline script blocked by script-src 'self'");
  assert.match(mediaScript, /navigator\.(?:connection|mozConnection|webkitConnection)/u);
  assert.match(mediaScript, /prefers-reduced-motion/u);
  assert.match(mediaScript, /data-motion-srcset/u);
  assert.match(mediaScript, /data-static-srcset/u);
  assert.match(mediaScript, /addEventListener\("error"/u,
    "a failed motion source must recover to a static source while full failure preserves SVG fallback");
  assert.match(mediaScript, /classList\.add\("has-cinematic-preview"\)/u,
    "a recovered static hero must activate the preview layer while preserving surrounding HTML");
});
