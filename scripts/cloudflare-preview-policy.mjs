export const CLOUDFLARE_PREVIEW_WORKER_NAME = "coinblink-m00-preview";
export const PREVIEW_NAME_PREFIX = "coinblink-m00-run-";
export const REQUIRED_CONFIRMATION = "authorize-preview";

export function derivePreviewName(runId, runAttempt) {
  if (!/^\d+$/.test(String(runId)) || Number(runId) < 1) {
    throw new Error("A positive GitHub Actions run ID is required.");
  }
  if (!/^\d+$/.test(String(runAttempt)) || Number(runAttempt) < 1) {
    throw new Error("A positive GitHub Actions run attempt is required.");
  }
  return `${PREVIEW_NAME_PREFIX}${runId}-${runAttempt}`;
}

export function isManagedPreviewName(value) {
  return typeof value === "string" && /^coinblink-m00-run-[1-9]\d*-[1-9]\d*$/.test(value);
}

export function validatePreviewMainIdentity({ repository, ref, sha, headSha, currentMainSha }) {
  const errors = [];
  if (repository !== "KayzenRoot/coinblink") errors.push("repository must be KayzenRoot/coinblink");
  if (ref !== "refs/heads/main") errors.push("dispatch ref must be refs/heads/main");
  if (!/^[0-9a-f]{40}$/.test(sha ?? "")) errors.push("dispatch SHA must be a full commit SHA");
  if (headSha !== sha) errors.push("checked-out HEAD must match the dispatch SHA");
  if (currentMainSha !== sha) errors.push("dispatch SHA must still be the current origin/main tip");
  return errors;
}

export function validatePreviewAuthorization(env) {
  const errors = [];
  const expect = (key, value, description = key) => {
    if (env[key] !== value) errors.push(`${description} is not authorized`);
  };

  expect("GITHUB_REPOSITORY", "KayzenRoot/coinblink", "repository");
  expect("GITHUB_EVENT_NAME", "workflow_dispatch", "workflow event");
  expect("GITHUB_REF", "refs/heads/main", "dispatch ref");
  if (!/^[0-9a-f]{40}$/.test(env.GITHUB_SHA ?? "")) errors.push("dispatch SHA must be a full commit SHA");
  if (env.EXPECTED_SHA !== env.GITHUB_SHA) errors.push("expected SHA must match the dispatch SHA");

  const ownerLogin = env.COINBLINK_PREVIEW_OWNER_GITHUB_LOGIN?.trim();
  if (!ownerLogin) {
    errors.push("Owner GitHub login is not configured");
  } else if (env.GITHUB_ACTOR?.toLowerCase() !== ownerLogin.toLowerCase()) {
    errors.push("only the configured Owner may dispatch this workflow");
  }

  expect("INPUT_CONFIRMATION", REQUIRED_CONFIRMATION, "manual authorization confirmation");
  if (!new Set(["deploy", "delete"]).has(env.INPUT_ACTION)) errors.push("action must be deploy or delete");

  expect("COINBLINK_CF_OWNER_AUTHORIZED", "true", "Owner Cloudflare authorization");
  expect("COINBLINK_CF_GITHUB_ENVIRONMENT_PROTECTED", "true", "protected GitHub environment review");
  expect("COINBLINK_CF_PLAN", "workers-free", "Cloudflare plan");
  expect("COINBLINK_CF_FREE_PLAN_CONFIRMED", "true", "Owner Free plan confirmation");
  // Owner-approved Free-only operation does not require a hard account-wide
  // USD 0 billing cap. Paid plans remain forbidden by COINBLINK_CF_PLAN above.
  expect("COINBLINK_CF_IAM_SCOPE_CONFIRMED", "true", "scoped IAM confirmation");
  expect("COINBLINK_CF_DEDICATED_WORKER_CONFIRMED", "true", "dedicated Worker confirmation");
  expect("COINBLINK_CF_ISOLATION_CONFIRMED", "true", "Preview resource isolation confirmation");
  expect("COINBLINK_CF_WORKER_NAME", CLOUDFLARE_PREVIEW_WORKER_NAME, "dedicated Worker name");

  if (!/^[0-9a-f]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID ?? "")) {
    errors.push("Cloudflare account ID is not configured as a valid 32-character identifier");
  }
  if (!env.CLOUDFLARE_API_TOKEN?.trim()) errors.push("Cloudflare API token is not configured");

  if (env.INPUT_ACTION === "delete" && !isManagedPreviewName(env.INPUT_PREVIEW_NAME)) {
    errors.push("delete action must target a managed CoinBlink M00 Preview name");
  }

  return errors;
}
