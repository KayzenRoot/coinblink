import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/ci-quality.yml", "utf8");

test("CB-CI-QUALITY-001 has only read-only, unprivileged PR triggers", () => {
  assert.match(workflow, /^on:\n {2}pull_request:\n/mu);
  assert.match(workflow, /^permissions:\n {2}contents: read\n/mu);
  assert.doesNotMatch(workflow, /^ {2}(pull_request_target|workflow_run|push|schedule|workflow_dispatch):/mu);
  assert.doesNotMatch(workflow, /^\s*(contents|pull-requests|issues|checks|statuses|actions|deployments|packages): write\s*$/mu);
  assert.doesNotMatch(workflow, /GITLEAKS_LICENSE|CODECOV_TOKEN|SONAR_TOKEN|cloudflare\/wrangler-action/u);
});

test("CB-CI-QUALITY-001 includes all authorized diagnostics and pinned actions", () => {
  for (const job of ["static", "tests", "secrets"]) {
    assert.match(workflow, new RegExp("^  " + job + ":$", "mu"));
  }
  for (const required of [
    "npm ci --ignore-scripts", "npm run lint", "npm run typecheck",
    "--experimental-test-coverage", "--test-coverage-include='src/**'",
    "--test-reporter=lcov", "coverage/lcov.info",
    "GITLEAKS_ENABLE_COMMENTS: \"false\"",
    "GITLEAKS_ENABLE_UPLOAD_ARTIFACT: \"false\"",
  ]) assert.ok(workflow.includes(required), required);
  for (const action of workflow.matchAll(/^\s*uses: (.+)$/gmu)) {
    assert.match(action[1], /@[0-9a-f]{40}$/u, action[1]);
  }
});
