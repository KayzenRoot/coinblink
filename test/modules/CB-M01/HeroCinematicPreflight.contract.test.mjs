import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { HERO_CINEMATIC_LIMITS, inspectHeroCinematicCandidate } from "../../../src/modules/CB-M01/hero-cinematic-preflight.mjs";

const evidenceRoot = new URL("../../../.engineering/evidence/CB-M01-WO-001/", import.meta.url);
const generatedProvenance = JSON.parse(await readFile(new URL("hero-cinematic-imagegen-provenance.json", evidenceRoot), "utf8"));
const blenderProvenance = JSON.parse(await readFile(new URL("hero-cinematic-blender-provenance.json", evidenceRoot), "utf8"));
const portabilityReport = JSON.parse(await readFile(new URL("hero-cinematic-animation-portable-inspection.json", evidenceRoot), "utf8"));
const sceneRegistry = JSON.parse(await readFile(new URL("scene-asset-provenance.json", evidenceRoot), "utf8"));

function readRepoPath(path) {
  return readFile(new URL("../../../" + path, import.meta.url));
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

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

function staticCandidate(format, bytes) {
  return {
    assetClass: "STATIC_MASTER_APPROVED_IMAGE_PIPELINE",
    path: HERO_CINEMATIC_LIMITS.staticMasterPaths[format],
    origin: "OPENAI_IMAGE_GENERATION",
    pipeline: "CODEX_APPROVED_IMAGE_PIPELINE",
    sourceMaster: { path: HERO_CINEMATIC_LIMITS.staticMasterPaths.png, sha256: digest(bytes) },
    rightsStatus: "PENDING_OWNER_OR_LEGAL",
    ownerVisualApproval: false,
    commercialPublicationAllowed: false,
    publicationPermission: false,
    sha256: digest(bytes),
    bytes: bytes.length,
    width: 1600,
    height: 800,
  };
}

function staticManifestCandidate(format) {
  const master = generatedProvenance.staticMaster;
  return { ...master, ...master.outputs[format] };
}

test("R25 static-master preflight accepts valid PNG and WebP headers from the approved pipeline", () => {
  for (const format of ["webp", "png"]) {
    const bytes = minimalHeaderFixture(format);
    const result = inspectHeroCinematicCandidate(staticCandidate(format, bytes), bytes, { sourceMasterBytes: bytes });
    assert.equal(result.technicalPreflightPassed, true, format + " static-master fixture");
    assert.equal(result.assetClass, "STATIC_MASTER_APPROVED_IMAGE_PIPELINE");
    assert.equal(result.dimensions.width, 1600);
    assert.equal(result.dimensions.height, 800);
    assert.equal(result.releaseAllowed, false);
    assert.equal(result.ownerVisualApprovalRequired, true);
    assert.equal(result.ownerVisualApproval, false);
    assert.equal(result.publicationPermission, false);
    assert.equal(result.commercialPublicationAllowed, false);
  }
});

test("R25 validates the actual ImageGen master and WebP derivative against source bytes", async () => {
  const sourceBytes = await readRepoPath(generatedProvenance.generatedSource.path);
  for (const format of ["png", "webp"]) {
    const candidate = staticManifestCandidate(format);
    const bytes = await readFile(new URL("../../../" + candidate.path, import.meta.url));
    const result = inspectHeroCinematicCandidate(candidate, bytes, { sourceMasterBytes: sourceBytes });

    assert.equal(result.technicalPreflightPassed, true, format + " approved image pipeline output");
    assert.equal(result.assetClass, "STATIC_MASTER_APPROVED_IMAGE_PIPELINE");
    assert.equal(result.observedSha256, candidate.sha256);
    assert.deepEqual(result.dimensions, { width: 1774, height: 887, format });
    assert.equal(result.ownerVisualApproval, false);
    assert.equal(result.publicationPermission, false);
    assert.equal(result.commercialPublicationAllowed, false);
    assert.equal(result.releaseAllowed, false);
  }
});

test("R25 static-master validation fails closed on bad origin, source, rights, path, hash, bytes, or dimensions", async () => {
  const candidate = staticManifestCandidate("webp");
  const bytes = await readFile(new URL("../../../" + candidate.path, import.meta.url));
  const sourceBytes = await readFile(new URL("../../../" + generatedProvenance.generatedSource.path, import.meta.url));
  const mutations = [
    [{ ...candidate, assetClass: "BLENDER_MOTION_DERIVATIVE" }, "INVALID_ASSET_CLASS"],
    [{ ...candidate, pipeline: "UNAPPROVED_PIPELINE" }, "UNAPPROVED_IMAGE_PIPELINE"],
    [{ ...candidate, sourceMaster: { ...candidate.sourceMaster, sha256: "f".repeat(64) } }, "SOURCE_MASTER_SHA256_MISMATCH"],
    [{ ...candidate, path: "C:\\Users\\owner\\Desktop\\hero.webp" }, "INVALID_LOCAL_PATH"],
    [{ ...candidate, sha256: "f".repeat(64) }, "SHA256_MISMATCH"],
    [{ ...candidate, bytes: candidate.bytes + 1 }, "BYTE_COUNT_MISMATCH"],
    [{ ...candidate, width: candidate.width + 1 }, "DIMENSION_METADATA_MISMATCH"],
    [{ ...candidate, rightsStatus: "CLEARED" }, "INVALID_DEMO_RIGHTS_STATE"],
    [{ ...candidate, ownerVisualApproval: true }, "OWNER_VISUAL_APPROVAL_MUST_REMAIN_FALSE"],
    [{ ...candidate, commercialPublicationAllowed: true }, "PUBLICATION_MUST_BE_DISABLED"],
    [{ ...candidate, publicationPermission: true }, "PUBLICATION_PERMISSION_MUST_BE_FALSE"],
  ];

  for (const [changed, reason] of mutations) {
    const result = inspectHeroCinematicCandidate(changed, bytes, { sourceMasterBytes: sourceBytes });
    assert.equal(result.technicalPreflightPassed, false, reason);
    assert.ok(result.failures.includes(reason), reason + ": " + result.failures.join(", "));
    assert.equal(result.releaseAllowed, false);
  }
  const badSource = Buffer.from(sourceBytes);
  badSource[0] ^= 1;
  const sourceResult = inspectHeroCinematicCandidate(candidate, bytes, { sourceMasterBytes: badSource });
  assert.ok(sourceResult.failures.includes("SOURCE_MASTER_SHA256_MISMATCH"));
});

test("R25 accepts only the portable Blender motion derivative linked to the valid static master", async () => {
  const candidate = generatedProvenance.motionDerivative;
  const bytes = await readFile(new URL("../../../" + candidate.path, import.meta.url));
  const sourceMasterBytes = await readFile(new URL("../../../" + candidate.sourceMaster.path, import.meta.url));
  const sourceProjectBytes = await readFile(new URL("../../../" + candidate.sourceProject.path, import.meta.url));
  const contactSheetBytes = await readFile(new URL("../../../" + candidate.motionOutputs.find((output) => output.role === "CONTACT_SHEET").path, import.meta.url));
  const evidenceMotionBytes = await readFile(new URL("../../../" + candidate.motionOutputs.find((output) => output.role === "SOURCE_ANIMATION").path, import.meta.url));
  const result = inspectHeroCinematicCandidate(candidate, bytes, {
    sourceMasterBytes,
    sourceProjectBytes,
    contactSheetBytes,
    evidenceMotionBytes,
  });

  assert.equal(result.technicalPreflightPassed, true, result.failures.join(", "));
  assert.equal(result.assetClass, "BLENDER_MOTION_DERIVATIVE");
  assert.deepEqual(result.motion, { frameCount: 48, durationMs: 4000 });
  assert.equal(result.ownerVisualApprovalRequired, true);
  assert.equal(result.ownerVisualApproval, false);
  assert.equal(result.commercialPublicationAllowed, false);
  assert.equal(result.publicationPermission, false);
  assert.equal(result.releaseAllowed, false);
  assert.equal(blenderProvenance.animationProject.origin, "BLENDER_MOTION_DERIVATIVE");
  assert.equal(portabilityReport.absoluteReferences, false);
});

test("R25 motion validation rejects absolute paths, missing provenance, unlisted outputs, tampering, and approval escalation", async () => {
  const candidate = generatedProvenance.motionDerivative;
  const bytes = await readFile(new URL("../../../" + candidate.path, import.meta.url));
  const sourceMasterBytes = await readFile(new URL("../../../" + candidate.sourceMaster.path, import.meta.url));
  const sourceProjectBytes = await readFile(new URL("../../../" + candidate.sourceProject.path, import.meta.url));
  const contactOutput = candidate.motionOutputs.find((output) => output.role === "CONTACT_SHEET");
  const sourceOutput = candidate.motionOutputs.find((output) => output.role === "SOURCE_ANIMATION");
  const contactSheetBytes = await readFile(new URL("../../../" + contactOutput.path, import.meta.url));
  const evidenceMotionBytes = await readFile(new URL("../../../" + sourceOutput.path, import.meta.url));
  const artifacts = { sourceMasterBytes, sourceProjectBytes, contactSheetBytes, evidenceMotionBytes };
  const mutations = [
    [{ ...candidate, sourceProject: { ...candidate.sourceProject, path: "C:\\Users\\owner\\hero.blend" } }, "NONPORTABLE_BLENDER_REFERENCE"],
    [{ ...candidate, sourceProject: { ...candidate.sourceProject, sha256: "f".repeat(64) } }, "BLENDER_SOURCE_SHA256_MISMATCH"],
    [{ ...candidate, sourceMasterSha256: "f".repeat(64) }, "SOURCE_MASTER_MISMATCH"],
    [{ ...candidate, motionOutputs: candidate.motionOutputs.filter((output) => output.role !== "CONTACT_SHEET") }, "MOTION_OUTPUTS_NOT_INVENTORIED"],
    [{ ...candidate, motionOutputs: [...candidate.motionOutputs, candidate.motionOutputs[0]] }, "MOTION_OUTPUTS_NOT_INVENTORIED"],
    [{ ...candidate, motionOutputs: candidate.motionOutputs.map((output) => output.path === candidate.path ? { ...output, role: "SOURCE_ANIMATION" } : output) }, "MOTION_OUTPUTS_NOT_INVENTORIED"],
    [{ ...candidate, frameCount: candidate.frameCount + 1 }, "MOTION_TIMING_METADATA_MISMATCH"],
    [{ ...candidate, durationMs: candidate.durationMs + 100 }, "MOTION_TIMING_METADATA_MISMATCH"],
    [{ ...candidate, portability: { ...candidate.portability, allExternalReferencesRelative: false } }, "NONPORTABLE_BLENDER_REFERENCE"],
    [{ ...candidate, portability: { ...candidate.portability, absoluteReferences: true } }, "NONPORTABLE_BLENDER_REFERENCE"],
    [{ ...candidate, commercialPublicationAllowed: true }, "PUBLICATION_MUST_BE_DISABLED"],
    [{ ...candidate, ownerVisualApproval: true }, "OWNER_VISUAL_APPROVAL_MUST_REMAIN_FALSE"],
    [{ ...candidate, publicationPermission: true }, "PUBLICATION_PERMISSION_MUST_BE_FALSE"],
  ];

  for (const [changed, reason] of mutations) {
    const result = inspectHeroCinematicCandidate(changed, bytes, artifacts);
    assert.equal(result.technicalPreflightPassed, false, reason);
    assert.ok(result.failures.includes(reason), reason + ": " + result.failures.join(", "));
    assert.equal(result.releaseAllowed, false);
  }
  const badProject = Buffer.from(sourceProjectBytes);
  badProject[0] ^= 1;
  const tamperedProject = inspectHeroCinematicCandidate(candidate, bytes, { ...artifacts, sourceProjectBytes: badProject });
  assert.ok(tamperedProject.failures.includes("BLENDER_SOURCE_SHA256_MISMATCH"));
  const badContactSheet = Buffer.from(contactSheetBytes);
  badContactSheet[0] ^= 1;
  const tamperedOutput = inspectHeroCinematicCandidate(candidate, bytes, { ...artifacts, contactSheetBytes: badContactSheet });
  assert.ok(tamperedOutput.failures.includes("MOTION_OUTPUT_INTEGRITY_MISMATCH"));
});

test("legacy Blender still exports are never used as the new static master", () => {
  assert.equal(sceneRegistry.legacyBlenderStillExports.assetClass, "BLENDER_CYCLES_STILL_RENDER_NOT_MASTER");
  assert.equal(sceneRegistry.legacyBlenderStillExports.runtimeUsage, false);
  assert.equal(HERO_CINEMATIC_LIMITS.staticMasterPaths.png, "src/modules/CB-M01/hero-cinematic-original.png");
  assert.equal(HERO_CINEMATIC_LIMITS.motionPreviewPath, "src/modules/CB-M01/hero-cinematic-motion.webp");
});
