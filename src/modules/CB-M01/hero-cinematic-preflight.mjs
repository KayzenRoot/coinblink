import { createHash } from "node:crypto";

// CB-M01 R23: binary-only preflight. A passing result is never approval to publish.
export const HERO_CINEMATIC_LIMITS = Object.freeze({
  assetPaths: Object.freeze({
    webp: "src/modules/CB-M01/hero-cinematic-original.webp",
    png: "src/modules/CB-M01/hero-cinematic-original.png",
  }),
  previewAssetPaths: Object.freeze({
    webp: "src/modules/CB-M01/hero-cinematic-blender.webp",
    png: "src/modules/CB-M01/hero-cinematic-blender.png",
  }),
  minWidth: 1536,
  minHeight: 640,
  maxWidth: 4096,
  maxHeight: 2048,
  minAspectRatio: 1.75,
  maxAspectRatio: 3.3,
  maxWebpBytes: 1_500_000,
  maxPngBytes: 3_500_000,
  sourceMasterRequired: true,
  commercialPublicationAllowed: false,
});

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

// This checks bytes, format header, declared SHA-256, dimensions and bounded path.
// Decodability, Golden fidelity, rights, final owner approval and production release
// require independent checks. Never promote these metadata fields into authority.
export function inspectHeroCinematicCandidate(metadata, payload) {
  const failures = [];
  const candidate = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {};
  const allowedPath = [...Object.values(HERO_CINEMATIC_LIMITS.assetPaths),
    ...Object.values(HERO_CINEMATIC_LIMITS.previewAssetPaths)].includes(candidate.path);
  if (!allowedPath) failures.push("INVALID_LOCAL_PATH");
  if (candidate.origin !== "ORIGINAL_LOCAL_RENDER") failures.push("ORIGINAL_SOURCE_UNESTABLISHED");
  if (typeof candidate.sourceMaster !== "string" || !candidate.sourceMaster.trim()
    || candidate.sourceMaster.includes("://")) failures.push("SOURCE_MASTER_MISSING");
  if (candidate.rightsStatus !== "PENDING_OWNER_OR_LEGAL") failures.push("INVALID_DEMO_RIGHTS_STATE");
  if (candidate.commercialPublicationAllowed !== false) failures.push("PUBLICATION_MUST_BE_DISABLED");

  const buffer = Buffer.isBuffer(payload) ? payload
    : payload instanceof Uint8Array ? Buffer.from(payload) : null;
  const isWebp = typeof candidate.path === "string" && candidate.path.endsWith(".webp");
  const max = isWebp
    ? HERO_CINEMATIC_LIMITS.maxWebpBytes : HERO_CINEMATIC_LIMITS.maxPngBytes;
  if (!buffer || buffer.length === 0 || buffer.length > max) failures.push("INVALID_ASSET_BYTES");
  const digest = buffer ? createHash("sha256").update(buffer).digest("hex") : null;
  if (typeof candidate.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(candidate.sha256)
    || candidate.sha256 !== digest) failures.push("SHA256_MISMATCH");
  if (!buffer || candidate.bytes !== buffer.length) failures.push("BYTE_COUNT_MISMATCH");

  let dimensions = null;
  if (buffer) {
    dimensions = isWebp
      ? dimensionsFromWebp(buffer) : dimensionsFromPng(buffer);
  }
  if (!dimensions) failures.push("INVALID_BINARY_SIGNATURE_OR_HEADER");
  if (dimensions && (!Number.isInteger(dimensions.width) || !Number.isInteger(dimensions.height)
    || dimensions.width < HERO_CINEMATIC_LIMITS.minWidth
    || dimensions.height < HERO_CINEMATIC_LIMITS.minHeight
    || dimensions.width > HERO_CINEMATIC_LIMITS.maxWidth
    || dimensions.height > HERO_CINEMATIC_LIMITS.maxHeight
    || dimensions.width / dimensions.height < HERO_CINEMATIC_LIMITS.minAspectRatio
    || dimensions.width / dimensions.height > HERO_CINEMATIC_LIMITS.maxAspectRatio)) {
    failures.push("INVALID_DIMENSIONS_OR_CROP_RATIO");
  }
  if (dimensions && (candidate.width !== dimensions.width || candidate.height !== dimensions.height)) {
    failures.push("DIMENSION_METADATA_MISMATCH");
  }

  return Object.freeze({
    technicalPreflightPassed: failures.length === 0,
    failures: Object.freeze(failures),
    observedSha256: digest,
    dimensions: dimensions && Object.freeze(dimensions),
    previewOnly: true,
    ownerVisualApprovalRequired: true,
    independentReviewRequired: true,
    commercialRightsClearanceRequired: true,
    commercialPublicationAllowed: false,
    releaseAllowed: false,
  });
}
