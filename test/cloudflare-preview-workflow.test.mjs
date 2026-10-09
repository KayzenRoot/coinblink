import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const workflow = readFileSync(resolve(".github/workflows/cloudflare-worker-preview.yml"), "utf8");
const triggers = workflow.split(/^permissions:/m, 1)[0];
const preflight = workflow.split(/^\x20\x20owner-gated-preview:/m, 1)[0];
const gatedJob = workflow.split(/^\x20\x20owner-gated-preview:/m)[1] ?? "";

test("deployment workflow is manual-only and defaults to a closed action", () => {
  assert.match(triggers, /^on:\s*\r?\n\s+workflow_dispatch:/m);
  assert.doesNotMatch(triggers, /^\s+(pull_request|pull_request_target|push|schedule):/m);
  assert.match(triggers, /default: delete/);
  assert.match(triggers, /default: not-authorized/);
  assert.doesNotMatch(workflow, /pull_request_target:/);
});

test("preflight has read-only repository access and receives no Cloudflare credentials", () => {
  assert.match(preflight, /permissions:\s*\r?\n\s+contents: read/);
  assert.doesNotMatch(preflight, /CLOUDFLARE_(API_TOKEN|ACCOUNT_ID)/);
  assert.match(preflight, /scripts\/verify-preview-main\.mjs/);
  assert.match(preflight, /npm test/);
});

test("Cloudflare commands sit behind Owner/environment gates and ignore dashboard Preview base config", () => {
  assert.match(gatedJob, /environment:\s*\r?\n\s+name: cloudflare-preview/);
  assert.match(gatedJob, /scripts\/assert-preview-deployment-authorization\.mjs/);
  assert.match(gatedJob, /GITHUB_ACTOR: \$\{\{ github\.actor \}\}/);
  assert.match(gatedJob, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  assert.match(gatedJob, /wrangler preview \\\r?\n[\s\S]*--ignore-base-config/);
  assert.match(gatedJob, /wrangler preview delete \\\r?\n[\s\S]*--ignore-base-config/);
  assert.doesNotMatch(gatedJob, /\bwrangler\s+(deploy|versions\s+upload)\b/);
});

test("rechecks the exact current main immediately before each provider operation", () => {
  for (const command of ["npm exec -- wrangler preview \\", "npm exec -- wrangler preview delete \\"]) {
    const commandIndex = gatedJob.indexOf(command);
    assert.notEqual(commandIndex, -1, `${command} is present`);
    const guardIndex = gatedJob.lastIndexOf("node scripts/verify-preview-main.mjs", commandIndex);
    assert.notEqual(guardIndex, -1, `${command} has an immediately preceding current-main check`);
    assert.ok(commandIndex - guardIndex < 200, `${command} is kept adjacent to its current-main check`);
  }
});

test("workflow compiles the exact SHA and verifies both actual URL slots after deployment", () => {
  assert.match(workflow, /PUBLIC_BUILD_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /PUBLIC_BUILD_ENV: preview/);
  assert.match(workflow, /scripts\/record-preview-output\.mjs/);
  assert.match(workflow, /scripts\/verify-worker-preview\.mjs/);
  assert.match(workflow, /wrangler preview delete/);
});
