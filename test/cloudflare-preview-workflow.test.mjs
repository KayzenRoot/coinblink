import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workflow = readFileSync(resolve(repoRoot, ".github/workflows/cloudflare-worker-preview.yml"), "utf8");
const operations = readFileSync(resolve(repoRoot, "docs/operations/CB-M00-CLOUDFLARE-PREVIEW.md"), "utf8");
const triggers = workflow.split(/^permissions:/m, 1)[0];
const preflight = workflow.split(/^\x20\x20owner-gated-preview:/m, 1)[0];
const gatedJob = workflow.split(/^\x20\x20owner-gated-preview:/m)[1] ?? "";

function commandLines(commandText) {
  const lines = gatedJob.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${commandText} \\`);
  assert.notEqual(start, -1, `${commandText} command is present`);
  const command = [lines[start]];
  for (let index = start + 1; index < lines.length; index += 1) {
    command.push(lines[index]);
    if (!lines[index].trimEnd().endsWith("\\")) break;
  }
  return command.join("\n");
}

function stepBlockNamed(name) {
  const lines = gatedJob.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `- name: ${name}`);
  assert.notEqual(start, -1, `step ${name} is present`);
  const end = lines.findIndex((line, index) => index > start && line.trim().startsWith("- name:"));
  return lines.slice(start, end === -1 ? lines.length : end).join("\n");
}

function optionsIn(command) {
  return [...command.matchAll(/--([a-z][a-z-]*)/g)].map(([, option]) => option).sort();
}

function wranglerHelp(...args) {
  const wranglerPath = resolve(repoRoot, "node_modules/wrangler/bin/wrangler.js");
  return execFileSync(process.execPath, [wranglerPath, ...args, "--help"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    timeout: 15_000,
  });
}

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
  assert.match(preflight, /scripts\/verify-exact-head\.mjs/);
  assert.match(preflight, /npm test/);
});

test("Cloudflare commands sit behind Owner/environment gates and use separate command option sets", () => {
  assert.match(gatedJob, /environment:\s*\r?\n\s+name: cloudflare-preview/);
  assert.match(gatedJob, /scripts\/assert-preview-deployment-authorization\.mjs/);
  assert.match(gatedJob, /GITHUB_ACTOR: \$\{\{ github\.actor \}\}/);
  assert.match(gatedJob, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  const createCommand = commandLines("./node_modules/.bin/wrangler preview");
  const deleteCommand = commandLines("./node_modules/.bin/wrangler preview delete");
  assert.deepEqual(optionsIn(createCommand), ["config", "ignore-base-config", "json", "name", "worker-name"]);
  assert.deepEqual(optionsIn(deleteCommand), ["config", "name", "skip-confirmation", "worker-name"]);
  assert.doesNotMatch(gatedJob, /\bwrangler\s+(deploy|versions\s+upload)\b/);
  assert.doesNotMatch(gatedJob, /npm exec/);
});

test("pinned Wrangler 4.149.0 help confirms isolated Preview and safe delete flags without provider calls", () => {
  const wranglerVersion = JSON.parse(readFileSync(resolve(repoRoot, "node_modules/wrangler/package.json"), "utf8")).version;
  assert.equal(wranglerVersion, "4.149.0");

  const previewHelp = wranglerHelp("preview");
  const deleteHelp = wranglerHelp("preview", "delete");
  assert.match(previewHelp, /--ignore-base-config/);
  assert.match(previewHelp, /--worker-name/);
  assert.match(deleteHelp, /--name/);
  assert.match(deleteHelp, /--worker-name/);
  assert.match(deleteHelp, /--skip-confirmation/);
});

test("rollback documentation uses only supported Wrangler Preview delete options", () => {
  const rollback = operations.split(/^## Bounded rollback\s*$/m)[1]?.split(/^## /m, 1)[0] ?? "";
  assert.match(rollback, /wrangler preview delete/);
  for (const option of ["--config", "--name", "--worker-name", "--skip-confirmation"]) {
    assert.ok(rollback.includes(option), `rollback documentation includes ${option}`);
  }
  assert.doesNotMatch(rollback, /--ignore-base-config/);
});

test("exact-main rechecks run immediately before provider steps without Cloudflare credentials", () => {
  for (const [guardName, providerName] of [
    ["Reverify exact HEAD and canonical main before Preview CLI", "Create isolated Worker Preview"],
    ["Reverify exact HEAD and canonical main before Preview deletion", "Delete only the selected managed Preview and its deployments"],
  ]) {
    const guard = stepBlockNamed(guardName);
    const provider = stepBlockNamed(providerName);
    assert.match(guard, /node scripts\/verify-exact-head\.mjs/);
    assert.match(guard, /node scripts\/verify-preview-main\.mjs/);
    assert.match(guard, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
    assert.doesNotMatch(guard, /CLOUDFLARE_(API_TOKEN|ACCOUNT_ID)/);
    assert.match(provider, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
    const guardIndex = gatedJob.indexOf(guard);
    const providerIndex = gatedJob.indexOf(provider);
    assert.ok(guardIndex < providerIndex, `${providerName} follows the exact-main guard`);
    assert.ok(providerIndex - guardIndex < 800, `${providerName} immediately follows the exact-main guard`);
  }
});

test("workflow compiles the exact SHA and verifies both actual URL slots after deployment", () => {
  assert.match(workflow, /PUBLIC_BUILD_SHA: \$\{\{ github\.sha \}\}/);
  assert.match(workflow, /PUBLIC_BUILD_ENV: preview/);
  assert.match(workflow, /scripts\/record-preview-output\.mjs/);
  assert.match(workflow, /scripts\/verify-worker-preview\.mjs/);
  assert.match(workflow, /wrangler preview delete/);
});
