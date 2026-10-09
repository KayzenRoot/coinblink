import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const workflowPath = join(root, ".github", "workflows", "gef-validation.yml");
const verifierPath = join(root, "scripts", "verify-exact-head.mjs");
const expectedShaExpression = String.raw`\$\{\{\s*github\.event_name\s*==\s*'pull_request'\s*&&\s*github\.event\.pull_request\.head\.sha\s*\|\|\s*github\.sha\s*\}\}`;

function workflowSteps(contents) {
  return contents.replace(/\r\n/g, "\n").split(/^[ ]{6}- name: /m).slice(1);
}

test("CI checks out the event's exact commit and verifies HEAD", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const steps = workflowSteps(workflow);
  const checkout = steps.find((step) => step.startsWith("Check out exact commit\n"));
  const verification = steps.find((step) => step.startsWith("Verify exact checked-out commit\n"));

  assert.ok(checkout, "workflow must have an exact-commit checkout step");
  assert.match(checkout, new RegExp(`ref:\\s*${expectedShaExpression}`));
  assert.match(checkout, /fetch-depth:\s*0/, "checkout must include the admitted base for Context Lock validation");
  assert.ok(verification, "workflow must verify the selected commit after checkout");
  assert.match(verification, /run: node scripts\/verify-exact-head\.mjs/);
  assert.match(workflow, new RegExp(`EXPECTED_SHA:\\s*${expectedShaExpression}`));
  assert.match(workflow, new RegExp(`PUBLIC_BUILD_SHA:\\s*${expectedShaExpression}`));
});

test("the workflow contract test locates steps in a CRLF checkout", () => {
  const workflow = readFileSync(workflowPath, "utf8").replace(/\r?\n/g, "\r\n");
  const steps = workflowSteps(workflow);
  const checkout = steps.find((step) => step.startsWith("Check out exact commit\n"));
  assert.ok(checkout, "CRLF input must still expose the exact-commit checkout step");
});

test("the exact-head verifier accepts matching HEAD and rejects a mismatch", () => {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  assert.equal(head.status, 0, head.stderr);

  const matching = spawnSync(process.execPath, [verifierPath], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, EXPECTED_SHA: head.stdout.trim() },
  });
  assert.equal(matching.error, undefined, "exact-head verifier must start");
  assert.equal(matching.status, 0, matching.stderr);

  const mismatched = spawnSync(process.execPath, [verifierPath], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, EXPECTED_SHA: "0".repeat(40) },
  });
  assert.equal(mismatched.status, 1, "a different commit must fail the workflow guard");
  assert.match(mismatched.stderr, /expected .* but checked out/i);
});
