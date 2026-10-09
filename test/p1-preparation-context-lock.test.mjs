import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const baseSha = "954b4db2d6dff3798e76fd4d75d6bccaf24b0876";
const lockPath = resolve(".engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md");
const lock = readFileSync(lockPath, "utf8");
const rows = [...lock.matchAll(/^\| `([^`]+)` \| `([0-9a-f]{40})` \| `([0-9a-f]{64})` \|$/gm)];
const fingerprints = JSON.parse(readFileSync(resolve(".engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json"), "utf8"));

test("P1 preparation Context Lock binds its frozen table to the exact merged main SHA", () => {
  assert.match(lock, new RegExp(`source base[^\\n]*${baseSha}`));
  assert.equal(rows.length, 25);

  for (const [, path, expectedBlob, expectedSha256] of rows) {
    const blobId = execFileSync("git", ["rev-parse", `${baseSha}:${path}`], { encoding: "utf8" }).trim();
    const bytes = execFileSync("git", ["cat-file", "blob", `${baseSha}:${path}`]);
    assert.equal(blobId, expectedBlob, `${path} base blob SHA-1`);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expectedSha256, `${path} base raw SHA-256`);
  }
});

test("P1 Evidence Bundle fingerprints every candidate blob from the staged Git index", () => {
  assert.equal(fingerprints.schemaVersion, 1);
  assert.equal(fingerprints.repository, "KayzenRoot/coinblink");
  assert.equal(fingerprints.workOrder, "CB-M00-WO-001");
  assert.equal(fingerprints.baseCommitSha, baseSha);
  assert.equal(fingerprints.excludesSelf, ".engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json");
  assert.equal(fingerprints.files.length, 26);

  for (const entry of fingerprints.files) {
    const candidateBlobId = execFileSync("git", ["rev-parse", `:${entry.path}`], { encoding: "utf8" }).trim();
    const candidateBytes = execFileSync("git", ["cat-file", "blob", `:${entry.path}`]);
    assert.equal(candidateBlobId, entry.candidate.gitBlobSha1, `${entry.path} candidate blob SHA-1`);
    assert.equal(createHash("sha256").update(candidateBytes).digest("hex"), entry.candidate.rawBlobSha256, `${entry.path} candidate raw SHA-256`);

    if (entry.base) {
      const baseBlobId = execFileSync("git", ["rev-parse", `${baseSha}:${entry.path}`], { encoding: "utf8" }).trim();
      const baseBytes = execFileSync("git", ["cat-file", "blob", `${baseSha}:${entry.path}`]);
      assert.equal(baseBlobId, entry.base.gitBlobSha1, `${entry.path} base blob SHA-1`);
      assert.equal(createHash("sha256").update(baseBytes).digest("hex"), entry.base.rawBlobSha256, `${entry.path} base raw SHA-256`);
    }
  }
});

test("P1 preparation leaves checkpoint, historical lock, and Work Order authority frozen", () => {
  assert.match(lock, /Do not modify the checkpoint, Work Order decisions/);
  assert.match(lock, /original `\.engineering\/context-locks\/CB-M00-WO-001-EXECUTION\.md` and all of its fingerprints remain immutable/);
  assert.match(lock, /no authorization to contact Cloudflare, create a resource, deploy, change billing, provision or disclose credentials, merge, or start M01\+/);
});
