import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const baseSha = "27015adc87caacabbed0e318f892644ce0473f10";
const comparisonBaseSha = "b4ddb9891cc66cd3688b8e11a86abc75db4b8544";
const gitExecutable = process.platform === "win32"
  ? String.raw`C:\Program Files\Git\cmd\git.exe`
  : "/usr/bin/git";
const manifestPath = ".engineering/evidence/CB-M00-WO-001-P1-WRANGLER-OUTPUT-FIX-FINGERPRINTS.json";
const manifest = JSON.parse(readFileSync(resolve(manifestPath), "utf8"));

function resolveCurrentBranch(environment, gitBranch) {
  const branch = environment.GITHUB_HEAD_REF || gitBranch.trim();
  assert.ok(branch || environment.GITHUB_ACTIONS === "true",
    "Could not determine the current Git branch outside GitHub Actions");
  return branch;
}

const currentBranch = resolveCurrentBranch(
  process.env,
  execFileSync(gitExecutable, ["branch", "--show-current"], { encoding: "utf8" }),
);

test("branch detection fails closed locally and preserves GitHub Actions behavior", () => {
  assert.throws(() => resolveCurrentBranch({}, ""), /outside GitHub Actions/);
  assert.equal(resolveCurrentBranch({ GITHUB_HEAD_REF: "main" }, ""), "main");
  assert.equal(resolveCurrentBranch({ GITHUB_ACTIONS: "true" }, ""), "");
});

function gitDiffQuiet(path) {
  const result = spawnSync(gitExecutable, ["diff", "--quiet", "--", path], { encoding: "utf8" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${path} working tree differs from the Git index`);
}

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function assertExactPathCoverage(changedPaths, entries) {
  const changed = changedPaths.filter((path) => path !== manifestPath);
  const paths = entries.map((entry) => entry.path);
  const missing = [...new Set(changed)].filter((path) => !paths.includes(path)).sort(comparePaths);
  const extra = [...new Set(paths)].filter((path) => !changed.includes(path)).sort(comparePaths);
  assert.equal(changed.length, new Set(changed).size, "Git changed-path list contains duplicates");
  assert.equal(paths.length, new Set(paths).size, "fingerprint manifest contains duplicate paths");
  assert.deepEqual({ missing, extra }, { missing: [], extra: [] },
    `fingerprints must exactly cover changed paths; missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`);
}

test("P1 output-correction fingerprints exactly bind this branch to the frozen main base", {
  skip: currentBranch !== manifest.branch,
}, () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.repository, "KayzenRoot/coinblink");
  assert.equal(manifest.workOrder, "CB-M00-WO-001");
  assert.equal(manifest.change, "CB-M00-P1-WRANGLER-OUTPUT-FIX");
  assert.equal(manifest.baseCommitSha, baseSha);
  assert.equal(manifest.comparisonBaseCommitSha, comparisonBaseSha);
  assert.equal(manifest.branch, "codex/cb-m00-wrangler-structured-output");
  assert.equal(manifest.excludesSelf, manifestPath);

  const comparisonBaseIsAncestor = spawnSync(gitExecutable, ["merge-base", "--is-ancestor", comparisonBaseSha, "HEAD"]);
  assert.ifError(comparisonBaseIsAncestor.error);
  assert.equal(comparisonBaseIsAncestor.status, 0, "the synchronized main SHA must be an ancestor of this PR head");

  const changedPaths = execFileSync(gitExecutable, ["diff", "--name-only", "--no-renames", "-z", comparisonBaseSha], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  assertExactPathCoverage(changedPaths, manifest.files);

  for (const entry of manifest.files) {
    gitDiffQuiet(entry.path);
    const baseObject = spawnSync(gitExecutable, ["rev-parse", `${baseSha}:${entry.path}`], { encoding: "utf8" });
    assert.ifError(baseObject.error);
    if (entry.base === null) {
      assert.notEqual(baseObject.status, 0, `${entry.path} is declared new but exists in frozen main`);
    } else {
      assert.equal(baseObject.status, 0, `${entry.path} is fingerprinted as existing in frozen main`);
      const baseBlobId = baseObject.stdout.trim();
      const baseBytes = execFileSync(gitExecutable, ["cat-file", "blob", `${baseSha}:${entry.path}`]);
      assert.equal(baseBlobId, entry.base.gitBlobSha1, `${entry.path} base blob SHA-1`);
      assert.equal(createHash("sha256").update(baseBytes).digest("hex"), entry.base.rawBlobSha256, `${entry.path} base raw SHA-256`);
    }

    const candidateReference = `:${entry.path}`;
    const candidateObject = spawnSync(gitExecutable, ["rev-parse", candidateReference], { encoding: "utf8" });
    assert.ifError(candidateObject.error);
    if (entry.candidate === null) {
      assert.notEqual(candidateObject.status, 0, `${entry.path} is declared deleted but remains in the Git index`);
    } else {
      assert.equal(candidateObject.status, 0, `${entry.path} has a candidate fingerprint but no Git index blob`);
      const candidateBlobId = candidateObject.stdout.trim();
      const candidateBytes = execFileSync(gitExecutable, ["cat-file", "blob", candidateReference]);
      assert.equal(candidateBlobId, entry.candidate.gitBlobSha1, `${entry.path} candidate blob SHA-1`);
      assert.equal(createHash("sha256").update(candidateBytes).digest("hex"), entry.candidate.rawBlobSha256, `${entry.path} candidate raw SHA-256`);
    }
  }
});
