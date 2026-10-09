import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";

const baseSha = "954b4db2d6dff3798e76fd4d75d6bccaf24b0876";
const lockPath = resolve(".engineering/context-locks/CB-M00-WO-001-P1-PREPARATION.md");
const lock = readFileSync(lockPath, "utf8");
const evidence = readFileSync(resolve(".engineering/evidence/CB-M00-WO-001-P1-PREPARATION.md"), "utf8");
const rows = [...lock.matchAll(/^\| `([^`]+)` \| `([0-9a-f]{40})` \| `([0-9a-f]{64})` \|$/gm)];
const fingerprints = JSON.parse(readFileSync(resolve(".engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json"), "utf8"));

function assertExactFingerprintCoverage(changedPaths, entries, excludedPath) {
  const changed = changedPaths.filter((path) => path !== excludedPath);
  const manifestPaths = entries.map((entry) => entry.path);
  const uniqueChanged = new Set(changed);
  const uniqueManifest = new Set(manifestPaths);
  const missing = [...uniqueChanged].filter((path) => !uniqueManifest.has(path)).sort();
  const extra = [...uniqueManifest].filter((path) => !uniqueChanged.has(path)).sort();

  assert.equal(changed.length, uniqueChanged.size, "Git changed-path list contains duplicates");
  assert.equal(manifestPaths.length, uniqueManifest.size, "Fingerprint manifest contains duplicate paths");
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] },
    `Fingerprint manifest must exactly cover changed Git paths; missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`);
}

function assertWorktreeMatchesIndex(path, cwd = process.cwd()) {
  const result = spawnSync("git", ["diff", "--quiet", "--", path], { cwd, encoding: "utf8" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${path} working tree differs from Git index${result.stderr ? `: ${result.stderr.trim()}` : ""}`);
}

function assertPathAbsentFromWorktree(path, cwd) {
  let pathInfo;
  try {
    pathInfo = lstatSync(resolve(cwd, path));
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`${path} is declared deleted but still exists in the working tree (mode ${pathInfo.mode})`);
}

function assertFingerprintEntryMatches(entry, { baseCommitSha = baseSha, cwd = process.cwd() } = {}) {
  assertWorktreeMatchesIndex(entry.path, cwd);
  const candidateObject = spawnSync("git", ["rev-parse", `:${entry.path}`], { cwd, encoding: "utf8" });
  assert.ifError(candidateObject.error);
  if (entry.candidate === null) {
    assert.notEqual(candidateObject.status, 0, `${entry.path} is declared deleted but remains in the Git index`);
    assertPathAbsentFromWorktree(entry.path, cwd);
  } else {
    assert.equal(candidateObject.status, 0, `${entry.path} is fingerprinted but missing from the Git index`);
    const candidateBlobId = candidateObject.stdout.trim();
    const candidateBytes = execFileSync("git", ["cat-file", "blob", `:${entry.path}`], { cwd });
    assert.equal(candidateBlobId, entry.candidate.gitBlobSha1, `${entry.path} candidate blob SHA-1`);
    assert.equal(createHash("sha256").update(candidateBytes).digest("hex"), entry.candidate.rawBlobSha256, `${entry.path} candidate raw SHA-256`);
  }

  if (entry.base) {
    const baseBlobId = execFileSync("git", ["rev-parse", `${baseCommitSha}:${entry.path}`], { cwd, encoding: "utf8" }).trim();
    const baseBytes = execFileSync("git", ["cat-file", "blob", `${baseCommitSha}:${entry.path}`], { cwd });
    assert.equal(baseBlobId, entry.base.gitBlobSha1, `${entry.path} base blob SHA-1`);
    assert.equal(createHash("sha256").update(baseBytes).digest("hex"), entry.base.rawBlobSha256, `${entry.path} base raw SHA-256`);
  } else {
    const baseObject = spawnSync("git", ["rev-parse", `${baseCommitSha}:${entry.path}`], { cwd, encoding: "utf8" });
    assert.ifError(baseObject.error);
    assert.notEqual(baseObject.status, 0, `${entry.path} is marked new but exists in the frozen base`);
  }
}

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

test("P1 Evidence Bundle exactly covers changed paths and fingerprints candidate blobs from the staged Git index", () => {
  assert.equal(fingerprints.schemaVersion, 1);
  assert.equal(fingerprints.repository, "KayzenRoot/coinblink");
  assert.equal(fingerprints.workOrder, "CB-M00-WO-001");
  assert.equal(fingerprints.baseCommitSha, baseSha);
  assert.equal(fingerprints.excludesSelf, ".engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json");
  const changedPaths = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", baseSha], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  assertExactFingerprintCoverage(changedPaths, fingerprints.files, fingerprints.excludesSelf);

  for (const entry of fingerprints.files) assertFingerprintEntryMatches(entry);
});

test("fingerprint path coverage rejects omissions, extras, duplicates, and unlisted deletions", () => {
  assert.throws(
    () => assertExactFingerprintCoverage(["manifest.json", "kept.txt", "removed.txt"], [{ path: "kept.txt" }], "manifest.json"),
    /missing: removed\.txt/,
  );
  assert.throws(
    () => assertExactFingerprintCoverage(["manifest.json", "kept.txt"], [{ path: "kept.txt" }, { path: "extra.txt" }], "manifest.json"),
    /extra: extra\.txt/,
  );
  assert.throws(
    () => assertExactFingerprintCoverage(["manifest.json", "kept.txt"], [{ path: "kept.txt" }, { path: "kept.txt" }], "manifest.json"),
    /duplicate paths/,
  );
  assert.doesNotThrow(() => assertExactFingerprintCoverage(
    ["manifest.json", "kept.txt", "removed.txt"],
    [{ path: "kept.txt" }, { path: "removed.txt" }],
    "manifest.json",
  ));
});

test("fingerprint path coverage detects tracked deletions against a frozen Git base", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "coinblink-p1-deletion-"));
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: sandbox });
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: sandbox });
    execFileSync("git", ["config", "user.name", "CoinBlink Test"], { cwd: sandbox });
    execFileSync("git", ["config", "user.email", "coinblink-test@example.invalid"], { cwd: sandbox });
    writeFileSync(join(sandbox, "removed.txt"), "frozen base content\n");
    execFileSync("git", ["add", "--", "removed.txt"], { cwd: sandbox });
    execFileSync("git", ["commit", "--quiet", "-m", "frozen test base"], { cwd: sandbox });
    const frozenBase = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sandbox, encoding: "utf8" }).trim();
    const baseBlobId = execFileSync("git", ["rev-parse", `${frozenBase}:removed.txt`], { cwd: sandbox, encoding: "utf8" }).trim();
    const baseBytes = execFileSync("git", ["cat-file", "blob", `${frozenBase}:removed.txt`], { cwd: sandbox });
    const deletedEntry = {
      path: "removed.txt",
      base: { gitBlobSha1: baseBlobId, rawBlobSha256: createHash("sha256").update(baseBytes).digest("hex") },
      candidate: null,
    };

    execFileSync("git", ["rm", "--quiet", "--", "removed.txt"], { cwd: sandbox });
    assert.doesNotThrow(() => assertFingerprintEntryMatches(deletedEntry, { baseCommitSha: frozenBase, cwd: sandbox }));

    writeFileSync(join(sandbox, "removed.txt"), "recreated as untracked\n");
    assert.doesNotThrow(() => assertWorktreeMatchesIndex("removed.txt", sandbox));
    assert.throws(
      () => assertFingerprintEntryMatches(deletedEntry, { baseCommitSha: frozenBase, cwd: sandbox }),
      /still exists in the working tree/,
    );

    rmSync(join(sandbox, "removed.txt"));
    const changedPaths = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", frozenBase], {
      cwd: sandbox,
      encoding: "utf8",
    }).split("\0").filter(Boolean);
    assert.deepEqual(changedPaths, ["removed.txt"]);
    assert.throws(() => assertExactFingerprintCoverage(changedPaths, [], ".fingerprints.json"), /missing: removed\.txt/);
    assert.doesNotThrow(() => assertExactFingerprintCoverage(changedPaths, [deletedEntry], ".fingerprints.json"));
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("working-tree consistency rejects unstaged edits and honors Git line-ending normalization", () => {
  const sandbox = mkdtempSync(join(tmpdir(), "coinblink-p1-fingerprint-"));
  try {
    execFileSync("git", ["init", "--quiet"], { cwd: sandbox });
    execFileSync("git", ["config", "core.autocrlf", "false"], { cwd: sandbox });
    writeFileSync(join(sandbox, ".gitattributes"), "tracked.txt text eol=lf\n");
    writeFileSync(join(sandbox, "tracked.txt"), "staged content\n");
    execFileSync("git", ["add", "--", ".gitattributes", "tracked.txt"], { cwd: sandbox });

    writeFileSync(join(sandbox, "tracked.txt"), "staged content\r\n");
    assert.doesNotThrow(() => assertWorktreeMatchesIndex("tracked.txt", sandbox));

    writeFileSync(join(sandbox, "tracked.txt"), "unstaged mutation\r\n");
    assert.throws(() => assertWorktreeMatchesIndex("tracked.txt", sandbox), /working tree differs from Git index/);
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
});

test("P1 preparation leaves checkpoint, historical lock, and Work Order authority frozen", () => {
  assert.match(lock, /Do not modify the checkpoint, Work Order decisions/);
  assert.match(lock, /original `\.engineering\/context-locks\/CB-M00-WO-001-EXECUTION\.md` and all of its fingerprints remain immutable/);
  assert.match(lock, /no authorization to contact Cloudflare, create a resource, deploy, change billing, provision or disclose credentials, merge, or start M01\+/);
});

test("P1 Evidence Bundle states the Cloudflare credential boundary accurately", () => {
  assert.match(evidence, /Cloudflare credentials are absent from the read-only preflight job/);
  assert.match(evidence, /protected job passes them to its authorization step and to the conditional Wrangler Preview create\/delete steps/);
  assert.doesNotMatch(evidence, /only enter the gated Wrangler action step/);
});
