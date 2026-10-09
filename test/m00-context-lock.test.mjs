import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const baseSha = "bf3a5f800ddb3ebf9a0a6b338268f59500b6547d";

test("the execution Context Lock binds canonical source bytes at the admitted main SHA", () => {
  const lock = readFileSync(join(root, ".engineering/context-locks/CB-M00-WO-001-EXECUTION.md"), "utf8");
  assert.match(lock, /exact implementation base is canonical/);
  assert.match(lock, new RegExp(baseSha));
  assert.match(lock, /Codex Desktop/);
  assert.doesNotMatch(lock, /\| `\.gef\//);

  execFileSync("git", ["cat-file", "-e", `${baseSha}^{commit}`], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["merge-base", "--is-ancestor", baseSha, "HEAD"], { cwd: root, stdio: "ignore" });

  const rows = [...lock.matchAll(/^\| `([^`]+)` \| `([a-f0-9]{40})` \| `([a-f0-9]{64})` \|$/gm)];
  assert.equal(rows.length, 29, "the complete frozen base source set must be present");

  for (const [, path, expectedBlob, expectedFileSha] of rows) {
    const spec = `${baseSha}:${path}`;
    const actualBlob = execFileSync("git", ["rev-parse", spec], { cwd: root, encoding: "utf8" }).trim();
    const bytes = execFileSync("git", ["cat-file", "blob", spec], { cwd: root });
    const actualFileSha = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actualBlob, expectedBlob, `${path} Git blob SHA-1`);
    assert.equal(actualFileSha, expectedFileSha, `${path} raw Git blob SHA-256`);
  }
});
