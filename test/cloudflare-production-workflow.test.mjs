import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(new URL("../.github/workflows/cloudflare-production-main-only.yml", import.meta.url), "utf8");

test("production workflow listens only for a completed GEF push to main", () => {
  assert.match(workflow, /^on:\r?\n[ ]{2}workflow_run:\r?\n/m);
  assert.match(workflow, /workflows:\s*\["GEF validation"\]/);
  assert.match(workflow, /types:\s*\[completed\]/);
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.doesNotMatch(workflow, /^\s{2}(?:push|pull_request|pull_request_target|workflow_dispatch|schedule|repository_dispatch|workflow_call):/m);
});

test("the workflow uses least privilege and the deployment environment only after preflight", () => {
  assert.match(workflow, /^permissions:\r?\n[ ]{2}contents: read/m);
  assert.match(workflow, /actions: read\r?\n\s+checks: read\r?\n\s+contents: read\r?\n\s+pull-requests: read\r?\n\s+statuses: read/);
  assert.match(workflow, /needs: preflight/);
  assert.match(workflow, /if: needs\.preflight\.result == 'success'/);
  assert.match(workflow, /name: production\r?\n\s+url: https:\/\/coinblink-production\.kayzendev\.workers\.dev/);
  assert.match(workflow, /deployments: write/);
  assert.match(workflow, /persist-credentials: false/);
});

test("only the fixed production name is passed to Wrangler, preserving the local config", () => {
  const deployCalls = workflow.match(/wrangler deploy[^\r\n]*/g) ?? [];
  assert.equal(deployCalls.length, 2, "one dry-run and one authenticated deployment are expected");
  assert.ok(deployCalls.every((command) => command.includes("--config ./dist/server/wrangler.json") && command.includes("--name \"$COINBLINK_CF_WORKER_NAME\"")));
  assert.match(workflow, /COINBLINK_CF_WORKER_NAME: coinblink-production/);
  assert.match(workflow, /COINBLINK_CF_WORKER_URL: https:\/\/coinblink-production\.kayzendev\.workers\.dev/);
  assert.doesNotMatch(workflow, /wrangler preview|--ignore-base-config|--worker-name/);
  assert.equal((workflow.match(/\$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/g) ?? []).length, 1);
});

test("the exact main SHA is built, guarded immediately before deployment, and smoke-tested", () => {
  assert.match(workflow, /ref: \$\{\{ needs\.preflight\.outputs\.main_sha \}\}/);
  assert.match(workflow, /EXPECTED_SHA: \$\{\{ needs\.preflight\.outputs\.main_sha \}\}/);
  assert.match(workflow, /PUBLIC_BUILD_SHA: \$\{\{ needs\.preflight\.outputs\.main_sha \}\}/);
  assert.match(workflow, /PUBLIC_BUILD_ENV: production/);
  assert.match(workflow, /node scripts\/assert-production-main-current\.mjs/);
  assert.match(workflow, /node scripts\/assert-production-deployment-config\.mjs/);
  assert.match(workflow, /node scripts\/verify-worker-production\.mjs/);
  assert.match(workflow, /node scripts\/assert-no-session-binding\.mjs/);
});

test("no deploy workflow writes production secrets or downloads PR artifacts", () => {
  assert.doesNotMatch(workflow, /pull_request_target|download-artifact|workflow_run\.pull_requests\[0\]/);
  const tokenLines = workflow.split(/\r?\n/).filter((line) => line.includes("CLOUDFLARE_API_TOKEN:"));
  assert.deepEqual(tokenLines, ["          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}"]);
  assert.doesNotMatch(workflow, /gh secret set|wrangler secret put|wrangler secret bulk/);
});
