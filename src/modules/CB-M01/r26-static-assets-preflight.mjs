import { createHash } from "node:crypto";

const EXPECTED_ASSETS = Object.freeze([
  { assetId: "CB-M01-R26-PROMO-MASTER", stem: "promo" },
  { assetId: "CB-M01-R26-EDITORIAL-BITCOIN", stem: "bitcoin" },
  { assetId: "CB-M01-R26-EDITORIAL-ETHEREUM", stem: "ethereum" },
  { assetId: "CB-M01-R26-EDITORIAL-POLICY", stem: "policy" },
  { assetId: "CB-M01-R26-EDITORIAL-ECOSYSTEM", stem: "ecosystem" },
]);
const ASSET_ROOT = "src/modules/CB-M01/assets/r26/";

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function dimensionsFromPng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33 || !signature.every((value, index) => bytes[index] === value)
    || bytes.toString("ascii", 12, 16) !== "IHDR" || bytes.readUInt32BE(8) !== 13) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), format: "PNG" };
}

function dimensionsFromWebp(bytes) {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF"
    || bytes.toString("ascii", 8, 12) !== "WEBP" || bytes.readUInt32LE(4) + 8 !== bytes.length) return null;
  const tag = bytes.toString("ascii", 12, 16);
  const length = bytes.readUInt32LE(16);
  if (length + 20 > bytes.length) return null;
  if (tag === "VP8X" && length >= 10) {
    return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3), format: "WEBP" };
  }
  if (tag === "VP8 " && length >= 10 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff, format: "WEBP" };
  }
  if (tag === "VP8L" && length >= 5 && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10),
      format: "WEBP",
    };
  }
  return null;
}

function isSafeAssetPath(path, filenamePattern) {
  return typeof path === "string" && path.startsWith(ASSET_ROOT) && !path.includes("\\")
    && !path.split("/").includes("..") && !path.includes(":") && filenamePattern.test(path);
}

function imageRecordPattern(kind) {
  if (kind === "master") return /\/masters\/[a-z]+\.png$/u;
  if (kind === "png") return /\/[a-z]+\.png$/u;
  return /\/[a-z]+\.webp$/u;
}

function validateImagePayloadMetadata(record, buffer, kind, maxBytes, failures) {
  const expectedFormat = kind === "webp" ? "WEBP" : "PNG";
  const dimensions = kind === "webp" ? dimensionsFromWebp(buffer) : dimensionsFromPng(buffer);
  if (!dimensions || dimensions.format !== expectedFormat) failures.push("INVALID_BINARY_SIGNATURE_OR_HEADER");
  if (record.format !== expectedFormat) failures.push("INVALID_FORMAT_METADATA");
  if (record.bytes !== buffer.length) failures.push("BYTE_COUNT_MISMATCH");
  if (buffer.length === 0 || buffer.length > maxBytes) failures.push("ASSET_EXCEEDS_BYTE_BUDGET");
  if (!/^[0-9a-f]{64}$/u.test(record.sha256 ?? "") || record.sha256 !== sha256(buffer)) {
    failures.push("SHA256_MISMATCH");
  }
  if (dimensions && (record.width !== dimensions.width || record.height !== dimensions.height)) {
    failures.push("DIMENSION_METADATA_MISMATCH");
  }
}

function validateImageRecord(record, kind, maxBytes, payloads, failures, masterSha = null) {
  if (!record || typeof record !== "object") {
    failures.push("MISSING_IMAGE_RECORD");
    return;
  }
  if (!isSafeAssetPath(record.path, imageRecordPattern(kind))) failures.push("INVALID_LOCAL_PATH");
  const bytes = payloads.get(record.path);
  if (!Buffer.isBuffer(bytes) && !(bytes instanceof Uint8Array)) {
    failures.push("MISSING_ASSET_BYTES");
    return;
  }
  const buffer = Buffer.from(bytes);
  validateImagePayloadMetadata(record, buffer, kind, maxBytes, failures);
  if (masterSha && record.derivedFromMasterSha256 !== masterSha) failures.push("DERIVATIVE_SOURCE_MISMATCH");
}

function validateManifestIdentity(manifest, failures) {
  if (!manifest || manifest.schemaVersion !== 1 || manifest.workOrder !== "CB-M01-WO-001") {
    failures.push("INVALID_MANIFEST_IDENTITY");
  }
  if (manifest?.productState !== "DRAFT_DEMO_ONLY_NOT_PUBLISHED") failures.push("INVALID_PRODUCT_STATE");
  if (manifest?.goldenReference?.path !== "assets/reference/coinblink-home-master-dark-1536x864.jpg"
    || manifest?.goldenReference?.sha256 !== "82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8"
    || manifest?.goldenReference?.use !== "VISUAL_GUIDANCE_ONLY_NOT_USED_AS_IMAGE_SOURCE") {
    failures.push("INVALID_GOLDEN_REFERENCE_RELATION");
  }
}

function validateManifestReleaseGate(releaseGate, failures) {
  if (releaseGate?.rightsReview !== "PENDING_OWNER_OR_LEGAL") failures.push("RIGHTS_REVIEW_MUST_REMAIN_PENDING");
  if (releaseGate?.ownerVisualApproval !== false) failures.push("OWNER_VISUAL_APPROVAL_MUST_REMAIN_FALSE");
  if (releaseGate?.commercialPublicationAllowed !== false || releaseGate?.publicationPermission !== false) {
    failures.push("PUBLICATION_MUST_BE_DISABLED");
  }
  if (releaseGate?.productState !== "DEMO") failures.push("PRODUCT_MUST_REMAIN_DEMO");
}

function validateAssetIdentity(asset, expectedAsset, failures) {
  if (expectedAsset && (asset.sourceMaster?.path !== ASSET_ROOT + "masters/" + expectedAsset.stem + ".png"
    || asset.derivatives?.png?.path !== ASSET_ROOT + expectedAsset.stem + ".png"
    || asset.derivatives?.webp?.path !== ASSET_ROOT + expectedAsset.stem + ".webp")) {
    failures.push("ASSET_PATH_DOES_NOT_MATCH_REGION");
  }
  if (asset.assetClass !== "STATIC_MASTER_APPROVED_IMAGE_PIPELINE") failures.push("INVALID_ASSET_CLASS");
  if (asset.provider !== "OpenAI Codex ImageGen" || asset.providerVersion !== "NOT_EXPOSED") {
    failures.push("INVALID_GENERATION_PROVIDER_RECORD");
  }
  if (typeof asset.prompt !== "string" || asset.prompt.trim().length < 100) failures.push("MISSING_GENERATION_PROMPT");
  if (!/^exec-[0-9a-f-]{36}\.png$/u.test(asset.generatedOutputName ?? "")) failures.push("INVALID_GENERATOR_OUTPUT_ID");
  if (asset.derivativeOfGoldenReference !== false
    || asset.goldenReferenceRelation !== "VISUAL_GUIDANCE_ONLY_NO_RASTER_EXTRACTION_OR_CROP") {
    failures.push("ASSET_MUST_BE_INDEPENDENT_OF_GOLDEN_RASTER");
  }
}

function validateAssetRightsAndUsage(asset, failures) {
  if (asset.rightsReview !== "PENDING_OWNER_OR_LEGAL") failures.push("RIGHTS_REVIEW_MUST_REMAIN_PENDING");
  if (asset.licenseOrTrademarkClearance !== "NOT_ESTABLISHED") failures.push("CLEARANCE_MUST_REMAIN_UNESTABLISHED");
  if (asset.ownerVisualApproval !== false) failures.push("OWNER_VISUAL_APPROVAL_MUST_REMAIN_FALSE");
  if (asset.commercialPublicationAllowed !== false || asset.publicationPermission !== false) {
    failures.push("PUBLICATION_MUST_BE_DISABLED");
  }
  if (asset.liveEditorialEligible !== false) failures.push("LIVE_EDITORIAL_MUST_REMAIN_DISABLED");
  if (asset.demoOnly !== true || asset.allowedUsage !== "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY") {
    failures.push("ASSET_MUST_REMAIN_DEMO_ONLY");
  }
}

function validateAssetImages(asset, payloads, failures) {
  if (!asset.sourceMaster || asset.sourceMaster.generatedOutputName !== asset.generatedOutputName) {
    failures.push("INVALID_SOURCE_MASTER_RECORD");
    return;
  }
  validateImageRecord(asset.sourceMaster, "master", 3_500_000, payloads, failures);
  const masterSha = asset.sourceMaster.sha256;
  validateImageRecord(asset.derivatives?.png, "png", 3_500_000, payloads, failures, masterSha);
  validateImageRecord(asset.derivatives?.webp, "webp", 1_500_000, payloads, failures, masterSha);
}

function validateAsset(asset, payloads, failures) {
  const expectedAsset = EXPECTED_ASSETS.find((expected) => expected.assetId === asset.assetId);
  validateAssetIdentity(asset, expectedAsset, failures);
  validateAssetRightsAndUsage(asset, failures);
  validateAssetImages(asset, payloads, failures);
}

function resultForFailures(failures) {
  return Object.freeze({ technicalPreflightPassed: false, failures: Object.freeze([...new Set(failures)]) });
}

export function validateR26StaticAssetManifest(manifest, payloads) {
  const failures = [];
  validateManifestIdentity(manifest, failures);
  validateManifestReleaseGate(manifest?.releaseGate, failures);
  if (!Array.isArray(manifest?.assets) || manifest.assets.length !== EXPECTED_ASSETS.length) {
    failures.push("INVALID_ASSET_SET");
    return resultForFailures(failures);
  }
  if (manifest.assets.some((asset) => !asset || typeof asset !== "object")) {
    failures.push("INVALID_ASSET_ENTRY");
    return resultForFailures(failures);
  }
  if (manifest.assets.map((asset) => asset.assetId).join("|") !== EXPECTED_ASSETS.map((asset) => asset.assetId).join("|")) {
    failures.push("INVALID_ASSET_ORDER_OR_ID");
  }
  for (const asset of manifest.assets) validateAsset(asset, payloads, failures);
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
  });
}
