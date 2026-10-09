import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLOUDFLARE_PREVIEW_WORKER_NAME,
  derivePreviewName,
  isManagedPreviewName,
  REQUIRED_CONFIRMATION,
  validatePreviewAuthorization,
  validatePreviewMainIdentity,
} from "../scripts/cloudflare-preview-policy.mjs";
import {
  fetchCurrentMainSha,
  sanitizePreviewGuardError,
  verifyPreviewMain,
} from "../scripts/verify-preview-main.mjs";

const validAuthorization = {
  GITHUB_REPOSITORY: "KayzenRoot/coinblink",
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: "a".repeat(40),
  EXPECTED_SHA: "a".repeat(40),
  GITHUB_ACTOR: "owner-user",
  COINBLINK_PREVIEW_OWNER_GITHUB_LOGIN: "Owner-User",
  INPUT_ACTION: "deploy",
  INPUT_CONFIRMATION: REQUIRED_CONFIRMATION,
  COINBLINK_CF_OWNER_AUTHORIZED: "true",
  COINBLINK_CF_GITHUB_ENVIRONMENT_PROTECTED: "true",
  COINBLINK_CF_PLAN: "workers-free",
  COINBLINK_CF_FREE_PLAN_CONFIRMED: "true",
  COINBLINK_CF_MONTHLY_COST_CEILING_USD: "0",
  COINBLINK_CF_COST_CEILING_CONFIRMED: "true",
  COINBLINK_CF_IAM_SCOPE_CONFIRMED: "true",
  COINBLINK_CF_DEDICATED_WORKER_CONFIRMED: "true",
  COINBLINK_CF_ISOLATION_CONFIRMED: "true",
  COINBLINK_CF_WORKER_NAME: CLOUDFLARE_PREVIEW_WORKER_NAME,
  CLOUDFLARE_ACCOUNT_ID: "b".repeat(32),
  CLOUDFLARE_API_TOKEN: "unit-test-placeholder-only",
};

test("rejects missing Owner authorization, plan, zero cost, IAM, isolation, and credentials", () => {
  const errors = validatePreviewAuthorization({
    GITHUB_REPOSITORY: "KayzenRoot/coinblink",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_REF: "refs/heads/main",
    GITHUB_SHA: "a".repeat(40),
    EXPECTED_SHA: "a".repeat(40),
    INPUT_ACTION: "deploy",
    INPUT_CONFIRMATION: "not-authorized",
  });
  assert.ok(errors.length >= 12);
  assert.ok(errors.every((message) => !message.includes("unit-test-placeholder-only")));
});

test("accepts only exact Owner-attested Free plan and zero-cost authorization", () => {
  assert.deepEqual(validatePreviewAuthorization(validAuthorization), []);
});

test("fails closed if any one external authorization fact changes", () => {
  for (const [key, value] of [
    ["GITHUB_ACTOR", "other-user"],
    ["COINBLINK_CF_PLAN", "workers-paid"],
    ["COINBLINK_CF_MONTHLY_COST_CEILING_USD", "5"],
    ["COINBLINK_CF_IAM_SCOPE_CONFIRMED", "false"],
    ["COINBLINK_CF_ISOLATION_CONFIRMED", "false"],
    ["COINBLINK_CF_WORKER_NAME", "production-worker"],
    ["CLOUDFLARE_API_TOKEN", ""],
  ]) {
    const errors = validatePreviewAuthorization({ ...validAuthorization, [key]: value });
    assert.notDeepEqual(errors, [], `${key} should close the gate`);
  }
});

test("delete requires a managed Preview name, never an arbitrary Worker name", () => {
  const allowed = validatePreviewAuthorization({
    ...validAuthorization,
    INPUT_ACTION: "delete",
    INPUT_PREVIEW_NAME: "coinblink-m00-run-123456-2",
  });
  assert.deepEqual(allowed, []);

  const rejected = validatePreviewAuthorization({
    ...validAuthorization,
    INPUT_ACTION: "delete",
    INPUT_PREVIEW_NAME: "production",
  });
  assert.ok(rejected.includes("delete action must target a managed CoinBlink M00 Preview name"));
});

test("Preview names are run-derived and reject malformed or zero run identifiers", () => {
  assert.equal(derivePreviewName("123456", "2"), "coinblink-m00-run-123456-2");
  assert.equal(isManagedPreviewName("coinblink-m00-run-123456-2"), true);
  assert.equal(isManagedPreviewName("coinblink-m00-run-0-1"), false);
  assert.equal(isManagedPreviewName("coinblink-m00-run-1/../main"), false);
  assert.throws(() => derivePreviewName("0", "1"), /positive GitHub Actions run ID/);
  assert.throws(() => derivePreviewName("1", "0"), /positive GitHub Actions run attempt/);
});

test("canonical-main identity requires the exact current repository SHA", () => {
  assert.deepEqual(validatePreviewMainIdentity({
    repository: "KayzenRoot/coinblink",
    ref: "refs/heads/main",
    sha: "a".repeat(40),
    headSha: "a".repeat(40),
    currentMainSha: "a".repeat(40),
  }), []);

  assert.ok(validatePreviewMainIdentity({
    repository: "attacker/fork",
    ref: "refs/heads/feature",
    sha: "a".repeat(40),
    headSha: "b".repeat(40),
    currentMainSha: "c".repeat(40),
  }).length >= 4);
});

test("preview main guard errors are single-line and bounded before logging", () => {
  assert.equal(sanitizePreviewGuardError("safe\r\nforged\u0007\u0085\u2028entry"), "safe  forged   entry");
  assert.equal(sanitizePreviewGuardError("x".repeat(250)), "x".repeat(200));
});

test("current-main guard checks GitHub's public branch tip and fails closed on unavailable or invalid data", async () => {
  const currentSha = "c".repeat(40);
  let requestedUrl;
  let requestOptions;
  const verifiedSha = await verifyPreviewMain({
    repository: "KayzenRoot/coinblink",
    ref: "refs/heads/main",
    sha: currentSha,
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestOptions = options;
      return new Response(JSON.stringify({ sha: currentSha }), { status: 200 });
    },
  });
  assert.equal(verifiedSha, currentSha);
  assert.equal(requestedUrl, "https://api.github.com/repos/KayzenRoot/coinblink/commits/main");
  assert.equal(requestOptions.redirect, "error");
  assert.equal(requestOptions.headers.accept, "application/vnd.github+json");
  assert.equal(Object.hasOwn(requestOptions.headers, "authorization"), false);

  await assert.rejects(fetchCurrentMainSha(async () => new Response("unavailable", { status: 503 })), /HTTP 503/);
  await assert.rejects(fetchCurrentMainSha(async () => new Response(JSON.stringify({ sha: "short" }), { status: 200 })), /full commit SHA/);
  await assert.rejects(verifyPreviewMain({
    repository: "KayzenRoot/coinblink",
    ref: "refs/heads/main",
    sha: "a".repeat(40),
    fetchImpl: async () => new Response(JSON.stringify({ sha: "b".repeat(40) }), { status: 200 }),
  }), /current origin\/main tip/);
});
