import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const expectedAssets = [
  {
    path: "assets/reference/coinblink-home-master-dark-1536x864.jpg",
    role: "golden-home",
    mediaType: "image/jpeg",
    width: 1536,
    height: 864,
    sizeBytes: 532365,
    sha256: "82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8",
    presentInGit: true,
  },
  {
    path: "assets/reference/coinblink-logo-approved-original-1179x1040.jpg",
    role: "golden-logo",
    mediaType: "image/jpeg",
    width: 1179,
    height: 1040,
    sizeBytes: 121728,
    sha256: "126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0",
    presentInGit: true,
  },
];

const startOfFrameMarkers = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

/**
 * Reads dimensions from the first supported JPEG start-of-frame segment.
 * @param {Buffer} bytes JPEG file contents.
 * @returns {{ width: number, height: number }} Decoded pixel dimensions.
 */
function readJpegDimensions(bytes) {
  assert.equal(bytes[0], 0xff, "JPEG must start with the SOI marker");
  assert.equal(bytes[1], 0xd8, "JPEG must start with the SOI marker");

  let offset = 2;
  while (offset < bytes.length) {
    assert.equal(bytes[offset], 0xff, `expected JPEG marker at byte ${offset}`);
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;

    assert.ok(offset + 2 <= bytes.length, "JPEG segment length is truncated");
    const segmentLength = bytes.readUInt16BE(offset);
    assert.ok(segmentLength >= 2, "JPEG segment length must include its length field");
    assert.ok(offset + segmentLength <= bytes.length, "JPEG segment exceeds file bounds");

    if (startOfFrameMarkers.has(marker)) {
      assert.ok(segmentLength >= 7, "JPEG frame header is truncated");
      return {
        width: bytes.readUInt16BE(offset + 5),
        height: bytes.readUInt16BE(offset + 3),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG has no supported start-of-frame dimensions");
}

test("Golden reference manifest and original JPEG bytes match the approved masters", () => {
  const manifest = JSON.parse(readFileSync(join(root, "assets/reference/reference-manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.goldenImageAuthority, "user-selected source originals, immutable; no screenshots as functional backgrounds");
  assert.deepEqual(
    manifest.assets.map((asset) => ({
      path: asset.path,
      role: asset.role,
      mediaType: asset.mediaType,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
      sha256: asset.sha256,
      presentInGit: asset.presentInGit,
    })),
    expectedAssets,
  );

  for (const asset of expectedAssets) {
    const path = join(root, asset.path);
    const bytes = readFileSync(path);
    assert.equal(statSync(path).size, asset.sizeBytes, `${asset.path} byte size`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, `${asset.path} SHA-256`);
    assert.deepEqual(readJpegDimensions(bytes), { width: asset.width, height: asset.height }, `${asset.path} dimensions`);
  }
});
