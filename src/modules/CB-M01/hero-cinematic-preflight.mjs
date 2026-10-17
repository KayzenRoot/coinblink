import { createHash } from "node:crypto";

export const HERO_CINEMATIC_LIMITS = Object.freeze({
  staticMasterPaths: Object.freeze({
    webp: "src/modules/CB-M01/hero-cinematic-original.webp",
    png: "src/modules/CB-M01/hero-cinematic-original.png",
  }),
  staticSourcePaths: Object.freeze([
    ".engineering/evidence/CB-M01-WO-001/hero-cinematic-imagegen-source.png",
    "src/modules/CB-M01/hero-cinematic-original.png",
  ]),
  motionPreviewPath: "src/modules/CB-M01/hero-cinematic-motion.webp",
  evidenceMotionPath: ".engineering/evidence/CB-M01-WO-001/hero-cinematic-motion-preview.webp",
  motionContactSheetPath: ".engineering/evidence/CB-M01-WO-001/hero-cinematic-motion-contact-sheet.png",
  motionProjectPath: ".engineering/evidence/CB-M01-WO-001/hero-cinematic-animation-portable.blend",
  minWidth: 1536,
  minHeight: 640,
  maxWidth: 4096,
  maxHeight: 2048,
  minAspectRatio: 1.75,
  maxAspectRatio: 3.3,
  maxWebpBytes: 1_500_000,
  maxPngBytes: 3_500_000,
  maxMotionWebpBytes: 1_500_000,
  sourceMasterRequired: true,
  commercialPublicationAllowed: false,
});

const STATIC_MASTER_CLASS = "STATIC_MASTER_APPROVED_IMAGE_PIPELINE";
const BLENDER_MOTION_CLASS = "BLENDER_MOTION_DERIVATIVE";
const IMAGEGEN_ORIGIN = "OPENAI_IMAGE_GENERATION";
const APPROVED_IMAGE_PIPELINE = "CODEX_APPROVED_IMAGE_PIPELINE";
const PENDING_RIGHTS = "PENDING_OWNER_OR_LEGAL";

function dimensionsFromPng(buffer) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (buffer.length < 33 || !signature.every((byte, index) => buffer[index] === byte)) return null;
  if (buffer.toString("ascii", 12, 16) !== "IHDR" || buffer.readUInt32BE(8) !== 13) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), format: "png" };
}

function dimensionsFromWebp(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  if (buffer.readUInt32LE(4) + 8 !== buffer.length) return null;
  const tag = buffer.toString("ascii", 12, 16);
  const length = buffer.readUInt32LE(16);
  if (length + 20 > buffer.length) return null;
  if (tag === "VP8X" && length >= 10) {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height, format: "webp" };
  }
  if (tag === "VP8 " && length >= 10 && buffer[23] === 0x9d
    && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return { width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff, format: "webp" };
  }
  if (tag === "VP8L" && length >= 5 && buffer[20] === 0x2f) {
    return { width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
      height: 1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
      format: "webp" };
  }
  return null;
}

function animationMetadataFromWebp(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "RIFF"
    || buffer.toString("ascii", 8, 12) !== "WEBP" || buffer.readUInt32LE(4) + 8 !== buffer.length) return null;
  const durations = [];
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const tag = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (payload + size > buffer.length) return null;
    if (tag === "ANMF") {
      if (size < 16) return null;
      durations.push(buffer.readUIntLE(payload + 12, 3));
    }
    offset = payload + size + (size % 2);
  }
  if (offset !== buffer.length || durations.length === 0) return null;
  return { frameCount: durations.length, durationMs: durations.reduce((sum, duration) => sum + duration, 0) };
}

function isSha256(value) {
  return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function isCanonicalRepoPath(value) {
  return typeof value === "string" && value.length > 0 && !value.includes("\\")
    && !value.startsWith("/") && !/^[a-z]:/iu.test(value) && !value.includes("://")
    && !value.split("/").includes("..");
}

function isPortableBlenderPath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("://")
    || /^[a-z]:[\\/]/iu.test(value) || value.startsWith("\\\\")) return false;
  const relative = value.startsWith("//") ? value.slice(2) : value;
  return relative.length > 0 && !relative.startsWith("/");
}

function asBuffer(payload) {
  if (Buffer.isBuffer(payload)) return payload;
  if (payload instanceof Uint8Array) return Buffer.from(payload);
  return null;
}

function failureResult(failures, details = {}) {
  return Object.freeze({
    technicalPreflightPassed: failures.length === 0,
    failures: Object.freeze([...new Set(failures)]),
    previewOnly: true,
    ownerVisualApprovalRequired: true,
    ownerVisualApproval: false,
    commercialRightsClearanceRequired: true,
    commercialPublicationAllowed: false,
    publicationPermission: false,
    releaseAllowed: false,
    ...details,
  });
}

function validateRights(candidate, failures) {
  if (candidate.rightsStatus !== PENDING_RIGHTS) failures.push("INVALID_DEMO_RIGHTS_STATE");
  if (candidate.ownerVisualApproval !== false) failures.push("OWNER_VISUAL_APPROVAL_MUST_REMAIN_FALSE");
  if (candidate.commercialPublicationAllowed !== false) failures.push("PUBLICATION_MUST_BE_DISABLED");
  if (candidate.publicationPermission !== false) failures.push("PUBLICATION_PERMISSION_MUST_BE_FALSE");
}

function imageFormatFromPath(path) {
  if (typeof path !== "string") return null;
  if (path.endsWith(".webp")) return "webp";
  if (path.endsWith(".png")) return "png";
  return null;
}

function maxImageBytes(format, allowLargeMotion) {
  if (allowLargeMotion && format === "webp") return HERO_CINEMATIC_LIMITS.maxMotionWebpBytes;
  if (format === "webp") return HERO_CINEMATIC_LIMITS.maxWebpBytes;
  return HERO_CINEMATIC_LIMITS.maxPngBytes;
}

function validateImageBytes(candidate, buffer, byteLimit, failures) {
  if (!buffer || buffer.length === 0 || buffer.length > byteLimit) failures.push("INVALID_ASSET_BYTES");
  const digest = buffer ? createHash("sha256").update(buffer).digest("hex") : null;
  if (!isSha256(candidate.sha256) || candidate.sha256 !== digest) failures.push("SHA256_MISMATCH");
  if (!buffer || candidate.bytes !== buffer.length) failures.push("BYTE_COUNT_MISMATCH");
  return digest;
}

function validateImageDimensions(candidate, buffer, format, minWidth, minHeight, failures) {
  let dimensions = null;
  if (buffer && format === "webp") dimensions = dimensionsFromWebp(buffer);
  else if (buffer && format === "png") dimensions = dimensionsFromPng(buffer);
  if (!dimensions) failures.push("INVALID_BINARY_SIGNATURE_OR_HEADER");
  if (dimensions && (!Number.isInteger(dimensions.width) || !Number.isInteger(dimensions.height)
    || dimensions.width < minWidth
    || dimensions.height < minHeight
    || dimensions.width > HERO_CINEMATIC_LIMITS.maxWidth
    || dimensions.height > HERO_CINEMATIC_LIMITS.maxHeight
    || dimensions.width / dimensions.height < HERO_CINEMATIC_LIMITS.minAspectRatio
    || dimensions.width / dimensions.height > HERO_CINEMATIC_LIMITS.maxAspectRatio)) {
    failures.push("INVALID_DIMENSIONS_OR_CROP_RATIO");
  }
  if (dimensions && (candidate.width !== dimensions.width || candidate.height !== dimensions.height)) {
    failures.push("DIMENSION_METADATA_MISMATCH");
  }
  return dimensions;
}

function validateImage(candidate, payload, allowedPaths, {
  allowLargeMotion = false,
  minWidth = HERO_CINEMATIC_LIMITS.minWidth,
  minHeight = HERO_CINEMATIC_LIMITS.minHeight,
} = {}) {
  const failures = [];
  if (!allowedPaths.includes(candidate.path) || !isCanonicalRepoPath(candidate.path)) {
    failures.push("INVALID_LOCAL_PATH");
  }
  const buffer = asBuffer(payload);
  const format = imageFormatFromPath(candidate.path);
  const digest = validateImageBytes(candidate, buffer, maxImageBytes(format, allowLargeMotion), failures);
  const dimensions = validateImageDimensions(candidate, buffer, format, minWidth, minHeight, failures);
  return { failures, buffer, digest, dimensions };
}

function validateStaticMaster(candidate, payload, sourceMasterBytes) {
  const failures = [];
  const image = validateImage(candidate, payload, Object.values(HERO_CINEMATIC_LIMITS.staticMasterPaths));
  failures.push(...image.failures);
  if (candidate.assetClass !== STATIC_MASTER_CLASS) failures.push("INVALID_ASSET_CLASS");
  if (candidate.origin !== IMAGEGEN_ORIGIN || candidate.pipeline !== APPROVED_IMAGE_PIPELINE) {
    failures.push("UNAPPROVED_IMAGE_PIPELINE");
  }

  const sourceBytes = asBuffer(sourceMasterBytes);
  const source = candidate.sourceMaster && typeof candidate.sourceMaster === "object"
    ? candidate.sourceMaster : {};
  if (!HERO_CINEMATIC_LIMITS.staticSourcePaths.includes(source.path) || !isCanonicalRepoPath(source.path)) {
    failures.push("SOURCE_MASTER_MISSING");
  }
  const sourceDigest = sourceBytes ? createHash("sha256").update(sourceBytes).digest("hex") : null;
  if (!sourceBytes || !isSha256(source.sha256) || source.sha256 !== sourceDigest) {
    failures.push("SOURCE_MASTER_SHA256_MISMATCH");
  }
  validateRights(candidate, failures);

  return failureResult(failures, {
    assetClass: candidate.assetClass,
    observedSha256: image.digest,
    dimensions: image.dimensions && Object.freeze(image.dimensions),
  });
}

function validateMotionIdentity(candidate, failures) {
  if (candidate.assetClass !== BLENDER_MOTION_CLASS || candidate.origin !== BLENDER_MOTION_CLASS) {
    failures.push("INVALID_ASSET_CLASS");
  }
  if (typeof candidate.blenderVersion !== "string" || !candidate.blenderVersion.trim()) {
    failures.push("BLENDER_SOURCE_MISSING");
  }
}

function validateMotionSourceMaster(candidate, artifacts, failures) {
  const staticMaster = candidate.sourceMaster && typeof candidate.sourceMaster === "object"
    ? candidate.sourceMaster : {};
  const result = validateStaticMaster(staticMaster, artifacts.sourceMasterBytes, artifacts.sourceMasterBytes);
  if (!result.technicalPreflightPassed
    || staticMaster.path !== HERO_CINEMATIC_LIMITS.staticMasterPaths.png
    || staticMaster.sha256 !== candidate.sourceMasterSha256) {
    failures.push("SOURCE_MASTER_MISMATCH");
  }
}

function validateMotionSourceProject(candidate, artifacts, failures) {
  const project = candidate.sourceProject && typeof candidate.sourceProject === "object"
    ? candidate.sourceProject : {};
  if (project.path !== HERO_CINEMATIC_LIMITS.motionProjectPath || !isCanonicalRepoPath(project.path)) {
    failures.push("NONPORTABLE_BLENDER_REFERENCE");
  }
  const projectBytes = asBuffer(artifacts.sourceProjectBytes);
  const projectDigest = projectBytes ? createHash("sha256").update(projectBytes).digest("hex") : null;
  if (!projectBytes || !isSha256(project.sha256) || project.sha256 !== projectDigest) {
    failures.push("BLENDER_SOURCE_SHA256_MISMATCH");
  }
  return projectDigest;
}

function validateMotionPortability(candidate, failures) {
  const portability = candidate.portability && typeof candidate.portability === "object"
    ? candidate.portability : {};
  const fileImages = Array.isArray(portability.images)
    ? portability.images.filter((imageRecord) => imageRecord.source === "FILE") : [];
  const invalidReferences = fileImages.some((imageRecord) => !isPortableBlenderPath(imageRecord.relativePath));
  if (portability.status !== "passed" || portability.absoluteReferences !== false
    || portability.allExternalReferencesRelative !== true || portability.allExternalImagesPacked !== true
    || portability.linkedLibraries !== 0 || fileImages.length === 0 || invalidReferences) {
    failures.push("NONPORTABLE_BLENDER_REFERENCE");
  }
}

function expectedMotionOutputPaths() {
  return [HERO_CINEMATIC_LIMITS.motionPreviewPath,
    HERO_CINEMATIC_LIMITS.evidenceMotionPath, HERO_CINEMATIC_LIMITS.motionContactSheetPath];
}

function expectedMotionOutputRoles() {
  return new Map([
    [HERO_CINEMATIC_LIMITS.motionPreviewPath, "RUNTIME_PREVIEW"],
    [HERO_CINEMATIC_LIMITS.evidenceMotionPath, "SOURCE_ANIMATION"],
    [HERO_CINEMATIC_LIMITS.motionContactSheetPath, "CONTACT_SHEET"],
  ]);
}

function validateMotionOutputInventory(outputs, expectedPaths, failures) {
  const outputPaths = outputs.map((output) => output?.path);
  const expectedRoles = expectedMotionOutputRoles();
  if (outputs.length !== expectedPaths.length
    || new Set(outputPaths).size !== outputs.length
    || expectedPaths.some((path) => !outputPaths.includes(path))
    || outputs.some((output) => expectedRoles.get(output?.path) !== output?.role)) {
    failures.push("MOTION_OUTPUTS_NOT_INVENTORIED");
  }
}

function bytesForMotionOutput(output, candidate, image, artifacts) {
  if (output.path === candidate.path) return image.buffer;
  if (output.path === HERO_CINEMATIC_LIMITS.evidenceMotionPath) return asBuffer(artifacts.evidenceMotionBytes);
  return asBuffer(artifacts.contactSheetBytes);
}

function validateMotionOutput(output, candidate, image, artifacts, expectedPaths, failures) {
  if (!output || !expectedPaths.includes(output.path) || !isCanonicalRepoPath(output.path)) {
    failures.push("MOTION_OUTPUTS_NOT_INVENTORIED");
    return;
  }
  const outputBytes = bytesForMotionOutput(output, candidate, image, artifacts);
  const outputDigest = outputBytes ? createHash("sha256").update(outputBytes).digest("hex") : null;
  if (!outputBytes || output.bytes !== outputBytes.length || output.sha256 !== outputDigest) {
    failures.push("MOTION_OUTPUT_INTEGRITY_MISMATCH");
    return;
  }
  const outputDimensions = output.path.endsWith(".webp") ? dimensionsFromWebp(outputBytes) : dimensionsFromPng(outputBytes);
  if (!outputDimensions || output.width !== outputDimensions.width || output.height !== outputDimensions.height) {
    failures.push("MOTION_OUTPUT_DIMENSIONS_MISMATCH");
  }
}

function validateMotionOutputs(candidate, image, artifacts, failures) {
  const outputs = Array.isArray(candidate.motionOutputs) ? candidate.motionOutputs : [];
  const expectedPaths = expectedMotionOutputPaths();
  validateMotionOutputInventory(outputs, expectedPaths, failures);
  for (const output of outputs) validateMotionOutput(output, candidate, image, artifacts, expectedPaths, failures);
  return outputs;
}

function validateMotionTiming(candidate, outputs, artifacts, runtimeAnimation, failures) {
  const preview = outputs.find((output) => output?.path === candidate.path);
  if (!preview || preview.frameCount !== candidate.frameCount || preview.durationMs !== candidate.durationMs
    || !Number.isInteger(candidate.frameCount) || candidate.frameCount < 1
    || !Number.isInteger(candidate.durationMs) || candidate.durationMs < 1
    || !runtimeAnimation || runtimeAnimation.frameCount !== candidate.frameCount
    || runtimeAnimation.durationMs !== candidate.durationMs) {
    failures.push("MOTION_TIMING_METADATA_MISMATCH");
  }
  const sourceAnimation = outputs.find((output) => output?.path === HERO_CINEMATIC_LIMITS.evidenceMotionPath);
  const sourceAnimationMetadata = sourceAnimation
    ? animationMetadataFromWebp(asBuffer(artifacts.evidenceMotionBytes)) : null;
  if (!sourceAnimation || !Number.isInteger(sourceAnimation.frameCount) || sourceAnimation.frameCount < candidate.frameCount
    || sourceAnimation.durationMs !== candidate.durationMs || !sourceAnimationMetadata
    || sourceAnimationMetadata.frameCount !== sourceAnimation.frameCount
    || sourceAnimationMetadata.durationMs !== sourceAnimation.durationMs) {
    failures.push("MOTION_TIMING_METADATA_MISMATCH");
  }
}

function validateMotionDerivative(candidate, payload, artifacts = {}) {
  const failures = [];
  const image = validateImage(candidate, payload, [HERO_CINEMATIC_LIMITS.motionPreviewPath], {
    allowLargeMotion: true,
    minWidth: 640,
    minHeight: 320,
  });
  failures.push(...image.failures);
  const runtimeAnimation = animationMetadataFromWebp(image.buffer);
  validateMotionIdentity(candidate, failures);
  validateMotionSourceMaster(candidate, artifacts, failures);
  const projectDigest = validateMotionSourceProject(candidate, artifacts, failures);
  validateMotionPortability(candidate, failures);
  const outputs = validateMotionOutputs(candidate, image, artifacts, failures);
  validateMotionTiming(candidate, outputs, artifacts, runtimeAnimation, failures);
  validateRights(candidate, failures);

  return failureResult(failures, {
    assetClass: candidate.assetClass,
    observedSha256: image.digest,
    dimensions: image.dimensions && Object.freeze(image.dimensions),
    motion: Object.freeze({ frameCount: candidate.frameCount, durationMs: candidate.durationMs }),
    sourceProjectSha256: projectDigest,
  });
}

// The preflight establishes local technical integrity only; it never approves rights or release.
export function inspectHeroCinematicCandidate(metadata, payload, artifacts = {}) {
  const candidate = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  if (candidate.assetClass === STATIC_MASTER_CLASS) {
    return validateStaticMaster(candidate, payload, artifacts.sourceMasterBytes);
  }
  if (candidate.assetClass === BLENDER_MOTION_CLASS) {
    return validateMotionDerivative(candidate, payload, artifacts);
  }
  return failureResult(["INVALID_ASSET_CLASS"], { assetClass: candidate.assetClass ?? null });
}
