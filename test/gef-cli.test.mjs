import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = join(root, "node_modules", "@gef-bootstrap", "cli", "bin", "gef.mjs");

function runGef(args, cwd = root) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true,
  });
  assert.equal(result.error, undefined, `GEF ${args.join(" ")} did not start`);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function runJson(args, cwd = root) {
  const result = runGef([...args, "--json"], cwd);
  assert.equal(result.status, 0, `GEF ${args.join(" ")} exited ${result.status}`);
  return JSON.parse(result.stdout);
}

test("the pinned GEF CLI exposes its verified version and command surface", () => {
  const version = runJson(["--version"]);
  assert.equal(version.ok, true);
  assert.equal(version.version, "1.1.2");
  assert.equal(Number.parseInt(version.nodeVersion.split(".")[0].slice(1), 10), 22);

  const help = runJson(["--help"]);
  assert.equal(help.kind, "help");
  const commands = new Set(help.commands.map((command) => command.id));
  for (const command of [
    "gef.init.plan",
    "gef.init.run",
    "gef.doctor.run",
    "gef.status.show",
  ]) {
    assert.ok(commands.has(command), `missing command ${command}`);
  }
});

test("preflight validates the post-merge M00 checkpoint target without authorizing the open candidate", () => {
  const preview = runJson(["init", "--target", root]);
  assert.equal(preview.value.effect, "NONE");
  assert.equal(preview.value.plan.install.state, "READY");

  const checkpoint = JSON.parse(readFileSync(join(root, ".engineering", "CHECKPOINT.json"), "utf8"));
  const admission = readFileSync(join(root, ".engineering", "CB-M00-ADMISSION.md"), "utf8");
  assert.equal(checkpoint.schemaVersion, 2);
  assert.equal(checkpoint.status, "M00_ADMITTED");
  assert.equal(checkpoint.phase, "IMPLEMENTATION_NOT_STARTED");
  assert.equal(Object.hasOwn(checkpoint, "stopState"), false);
  assert.equal(checkpoint.nextLegalStage, "START_CB_M00_WO_001_FROM_CURRENT_CANONICAL_MAIN");
  assert.equal(checkpoint.checkpointFacts.sourceMainSha, "cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f");
  assert.equal(checkpoint.overallCompletionPercent, 0);
  assert.equal(checkpoint.checkpointFacts.applicationImplementation, "NOT_STARTED");
  assert.equal(checkpoint.checkpointFacts.previewDeployment, "NOT_DEPLOYED");
  assert.equal(checkpoint.checkpointFacts.formalAdmission.workOrder, "CB-M00-WO-001");
  assert.equal(checkpoint.checkpointFacts.formalAdmission.status, "ADMITTED");
  assert.equal(checkpoint.checkpointFacts.formalAdmission.change, "CB-GOV-005");
  assert.equal(checkpoint.checkpointFacts.formalAdmission.effectiveOnMerge, true);
  assert.equal(checkpoint.checkpointFacts.formalAdmission.candidateBranchCodeAuthority, "NOT_AUTHORIZED_BEFORE_MERGE");
  assert.equal(checkpoint.checkpointFacts.formalAdmission.requiredBeforeEffective, "EXACT_HEAD_CHECKS_INDEPENDENT_REVIEW_OWNER_AUDIT_AND_MERGE");
  assert.match(admission, /That target is not active while the PR is open: the candidate branch has no code authority/);
  assert.match(admission, /exact candidate passes all required checks and independent review[\s\S]*Owner's exact-head audit, and merges/);
  assert.equal(checkpoint.checkpointFacts.activeWorkOrder, "CB-M00-WO-001");
  assert.equal(checkpoint.checkpointFacts.moduleAdmission["CB-M00"], "ADMITTED");
  for (let module = 1; module <= 17; module += 1) {
    assert.equal(checkpoint.checkpointFacts.moduleAdmission[`CB-M${String(module).padStart(2, "0")}`], "NOT_ADMITTED");
  }
  assert.equal(checkpoint.checkpointFacts.moduleAdmission["CB-M18"], "FUTURE_NOT_ADMITTED");
  assert.equal(Object.hasOwn(checkpoint, "mainProductionDenominatorWeight"), false);
  assert.equal(Object.hasOwn(checkpoint, "earnedProductionWeight"), false);

  const doctor = runJson(["doctor", "--target", root]);
  assert.equal(doctor.value.effect, "NONE");
  assert.equal(doctor.value.doctor.readOnly, true);
  assert.equal(doctor.value.doctor.governance.present, true);
  assert.equal(doctor.value.doctor.governance.valid, true);
  assert.equal(doctor.value.doctor.governance.source, ".engineering/CHECKPOINT.json");
  assert.deepEqual(doctor.value.doctor.governance.observationLimits, []);
  assert.notEqual(doctor.value.doctor.security.dependency.state, "PASS");

  const status = runJson(["status", "--target", root]);
  assert.equal(status.value.effect, "NONE");
  assert.equal(status.value.status.readOnly, true);
  assert.equal(status.value.status.release.valid, true);
  assert.equal(status.value.status.release.production.status, "M00_ADMITTED");
  assert.equal(status.value.status.release.production.overallCompletionPercent, 0);
  assert.equal(status.value.status.operator.state, "M00_ADMITTED");
  assert.equal(status.value.status.operator.progress, 0);
  assert.equal(typeof status.value.status.operator.stale, "boolean");
  assert.equal(status.value.status.observationLimits.includes("GOVERNANCE_SOURCE_ABSENT"), false);
});

test("governed init apply succeeds in a disposable target and refuses clobber", (t) => {
  const target = mkdtempSync(join(tmpdir(), "coinblink-gef-init-"));
  t.after(() => rmSync(target, { recursive: true, force: true }));

  const preview = runJson(["init", "--target", target]);
  assert.equal(preview.value.effect, "NONE");
  assert.equal(existsSync(join(target, ".gef")), false);

  const applied = runJson(["init", "--apply", "--target", target]);
  assert.equal(applied.value.effect, "CONFIRMED");
  assert.equal(applied.value.transaction.outcome, "APPLIED");

  const statePath = join(target, ".gef", "init-state.json");
  const stateBytes = readFileSync(statePath, "utf8");
  const state = JSON.parse(stateBytes);
  assert.equal(state.schemaVersion, "1.0");
  assert.equal(state.kind, "gef.init.state");
  assert.equal(state.productVersion, "1.1.2");
  assert.match(state.planDigest, /^[0-9a-f]{64}$/);

  const receiptNames = readdirSync(join(target, ".gef", "receipts"));
  assert.equal(receiptNames.length, 1);
  const receipt = JSON.parse(readFileSync(join(target, ".gef", "receipts", receiptNames[0]), "utf8"));
  assert.equal(receipt.kind, "gef.cli.receipt");
  assert.equal(receipt.effectStatus, "CONFIRMED");

  const second = runGef(["init", "--apply", "--target", target, "--json"]);
  assert.notEqual(second.status, 0, "a second managed create must fail closed");
  assert.equal(readFileSync(statePath, "utf8"), stateBytes, "a repeated apply must not overwrite state");

  const status = runJson(["status", "--target", target]);
  assert.equal(status.value.status.readOnly, true);
});
