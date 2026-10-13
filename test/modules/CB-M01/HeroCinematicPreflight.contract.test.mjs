import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { HERO_CINEMATIC_LIMITS, inspectHeroCinematicCandidate } from "../../../src/modules/CB-M01/hero-cinematic-preflight.mjs";

const source = await readFile(new URL("../../../src/modules/CB-M01/GoldenHome.astro", import.meta.url), "utf8");
const css = await readFile(new URL("../../../src/modules/CB-M01/golden-home.css", import.meta.url), "utf8");
const generatedProvenance = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/hero-cinematic-imagegen-provenance.json", import.meta.url), "utf8"));
const blenderExportReport = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/hero-cinematic-blender-export-report.json", import.meta.url), "utf8"));

function minimalHeaderFixture(format, width = 1600, height = 800) {
  if (format === "webp") {
    const bytes = Buffer.alloc(30);
    bytes.write("RIFF", 0, "ascii");
    bytes.writeUInt32LE(bytes.length - 8, 4);
    bytes.write("WEBPVP8X", 8, "ascii");
    bytes.writeUInt32LE(10, 16);
    bytes.writeUIntLE(width - 1, 24, 3);
    bytes.writeUIntLE(height - 1, 27, 3);
    return bytes;
  }
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function manifestFor(format, bytes, width = 1600, height = 800) {
  return { path: HERO_CINEMATIC_LIMITS.assetPaths[format],
    origin: "ORIGINAL_LOCAL_RENDER", sourceMaster: "local-creation.blend",
    rightsStatus: "PENDING_OWNER_OR_LEGAL", commercialPublicationAllowed: false,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length, width, height };
}

test("R23 candidate preflight validates synthetic WebP and PNG header fixtures", () => {
  for (const format of ["webp", "png"]) {
    const bytes = minimalHeaderFixture(format);
    const result = inspectHeroCinematicCandidate(manifestFor(format, bytes), bytes);
    assert.equal(result.technicalPreflightPassed, true, format + " header fixture preflight");
    assert.equal(result.dimensions.width, 1600);
    assert.equal(result.dimensions.height, 800);
    assert.equal(result.releaseAllowed, false);
    assert.equal(result.commercialPublicationAllowed, false);
    assert.equal(result.ownerVisualApprovalRequired, true);
  }
});

test("R23 rejects the actual ImageGen candidates at the original-local-render gate", async () => {
  for (const format of ["png", "webp"]) {
    const candidate = generatedProvenance.outputs[format];
    const bytes = await readFile(new URL("../../../" + candidate.path, import.meta.url));
    const result = inspectHeroCinematicCandidate({
      path: candidate.path,
      origin: generatedProvenance.origin,
      sourceMaster: generatedProvenance.generatedSource.path,
      rightsStatus: generatedProvenance.rights.review,
      commercialPublicationAllowed: generatedProvenance.rights.commercialPublicationAllowed,
      sha256: candidate.sha256,
      bytes: candidate.bytes,
      width: generatedProvenance.generatedSource.dimensions[0],
      height: generatedProvenance.generatedSource.dimensions[1],
    }, bytes);

    assert.equal(result.technicalPreflightPassed, false);
    assert.deepEqual(result.failures, ["ORIGINAL_SOURCE_UNESTABLISHED"]);
    assert.equal(result.observedSha256, candidate.sha256);
    assert.deepEqual(result.dimensions, {
      width: generatedProvenance.generatedSource.dimensions[0],
      height: generatedProvenance.generatedSource.dimensions[1],
      format,
    });
    assert.equal(result.releaseAllowed, false);
  }
});

test("R25 admits only the bounded Blender exports as preview candidates and keeps publication blocked", async () => {
  assert.equal(blenderExportReport.origin, "ORIGINAL_LOCAL_RENDER");
  assert.equal(blenderExportReport.sourceMaster.dimensions.join("x"), "2560x1280");
  for (const format of ["png", "webp"]) {
    const candidate = blenderExportReport.exports[format];
    const bytes = await readFile(new URL("../../../" + candidate.path, import.meta.url));
    const result = inspectHeroCinematicCandidate({
      path: candidate.path,
      origin: blenderExportReport.origin,
      sourceMaster: blenderExportReport.sourceMaster.path,
      rightsStatus: blenderExportReport.usage.rightsStatus,
      commercialPublicationAllowed: blenderExportReport.usage.commercialPublicationAllowed,
      sha256: candidate.sha256,
      bytes: candidate.bytes,
      width: candidate.dimensions[0],
      height: candidate.dimensions[1],
    }, bytes);

    assert.equal(candidate.fullyDecoded, true, format + " export must be fully decoded by the producer");
    assert.equal(result.technicalPreflightPassed, true, format + " Blender preview preflight");
    assert.equal(result.observedSha256, candidate.sha256);
    assert.equal(result.dimensions.width, 2560);
    assert.equal(result.dimensions.height, 1280);
    assert.equal(result.releaseAllowed, false);
    assert.equal(result.previewOnly, true);
    assert.equal(result.ownerVisualApprovalRequired, true);
    assert.equal(result.commercialPublicationAllowed, false);
    assert.ok(bytes.length <= (format === "webp" ? 1_500_000 : 3_500_000));
  }
});

test("R23 rejects remote files, wrong magic, tampering, fake approval and wrong dimensions", () => {
  const bytes = minimalHeaderFixture("webp");
  const valid = manifestFor("webp", bytes);
  const mutations = [
    [{ ...valid, path: "https://example.test/hero.webp" }, bytes, "INVALID_LOCAL_PATH"],
    [{ ...valid, path: "../hero.webp" }, bytes, "INVALID_LOCAL_PATH"],
    [{ ...valid, sha256: "f".repeat(64) }, bytes, "SHA256_MISMATCH"],
    [{ ...valid, bytes: 100 }, bytes, "BYTE_COUNT_MISMATCH"],
    [{ ...valid, rightsStatus: "CLEARED" }, bytes, "INVALID_DEMO_RIGHTS_STATE"],
    [{ ...valid, commercialPublicationAllowed: true }, bytes, "PUBLICATION_MUST_BE_DISABLED"],
    [{ ...valid, sourceMaster: "https://example.test/model.blend" }, bytes, "SOURCE_MASTER_MISSING"],
    [{ ...valid, width: 1700 }, bytes, "DIMENSION_METADATA_MISMATCH"],
    [manifestFor("webp", minimalHeaderFixture("webp", 400, 800), 400, 800),
      minimalHeaderFixture("webp", 400, 800), "INVALID_DIMENSIONS_OR_CROP_RATIO"],
    [{ ...valid }, Buffer.alloc(30), "INVALID_BINARY_SIGNATURE_OR_HEADER"],
  ];
  for (const [meta, raw, reason] of mutations) {
    const result = inspectHeroCinematicCandidate(meta, raw);
    assert.equal(result.technicalPreflightPassed, false, reason);
    assert.ok(result.failures.includes(reason), reason + ": " + result.failures.join(", "));
    assert.equal(result.releaseAllowed, false);
  }
});

test("R23 keeps the current vector Golden DEMO active and never self-approves a 3D asset", () => {
  assert.match(source, /<svg class="coin-art"/u);
  assert.match(source, /<div class="hero-scene" aria-hidden="true">/u);
  assert.match(source, /<picture class="hero-cinematic-preview"/u);
  assert.match(source, /hero-cinematic-blender\.webp/u);
  assert.match(source, /hero-cinematic-blender\.png/u);
  assert.doesNotMatch(source, /hero-cinematic-original\.(?:webp|png)/u);
  assert.match(css, /hero-mineral-texture\.svg/u);
  assert.equal(HERO_CINEMATIC_LIMITS.commercialPublicationAllowed, false);
});
