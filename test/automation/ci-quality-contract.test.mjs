import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLocalEditorialVariant } from "../../src/modules/CB-M07/local-editorial-variants.mjs";

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

test("M07 LOCAL control-character safety contract stays active under strict ESLint", () => {
  const draft = Object.freeze({
    id: "00000000-0000-0000-0000-000000000001",
    revision: 2,
    title: "Synthetic editorial sample",
    summary: "This source is unverified and fictional.",
    source_url: "https://example.org/fiction",
    author_label: "",
    status: "draft",
    updated_at: 1760870000,
  });
  const forbidden = [
    ...Array.from({ length: 9 }, (_, code) => code),
    11, 12, ...Array.from({ length: 18 }, (_, n) => n + 14), 127,
  ];
  for (const code of forbidden) {
    const input = "Valid " + String.fromCharCode(code) + " fictional caption";
    assert.throws(() => createLocalEditorialVariant(draft, "x", input), TypeError,
      "forbidden ASCII control code " + code);
  }
  for (const code of [9, 10, 13, 32, 126, 128]) {
    const input = "Valid " + String.fromCharCode(code) + " fictional caption";
    assert.equal(createLocalEditorialVariant(draft, "x", input).editableText, input,
      "allowed internal character " + code);
  }
});

test("M07 browser test gets scoped globals without disabling strict lint rules", () => {
  const config = readFileSync("eslint.config.mjs", "utf8");
  assert.ok(config.includes('"test/modules/CB-M07/local-social-preview.test.mjs"'));
  assert.doesNotMatch(config, /["']no-(?:control-regex|undef)["']\s*:\s*["']off["']/u);
});
