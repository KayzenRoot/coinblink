import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validatePreviewMainIdentity } from "./cloudflare-preview-policy.mjs";

const mainEndpoint = "https://api.github.com/repos/KayzenRoot/coinblink/commits/main";
const fullShaPattern = /^[0-9a-f]{40}$/;

export async function fetchCurrentMainSha(fetchImpl = fetch, githubToken) {
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "coinblink-m00-preview-main-guard",
  };
  if (typeof githubToken === "string" && githubToken.length > 0) {
    headers.authorization = `Bearer ${githubToken}`;
  }
  const response = await fetchImpl(mainEndpoint, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub main lookup returned HTTP ${response.status}.`);

  const result = await response.json();
  if (!fullShaPattern.test(result?.sha ?? "")) throw new Error("GitHub main lookup did not return a full commit SHA.");
  return result.sha;
}

export async function verifyPreviewMain({ repository, ref, sha, fetchImpl = fetch, githubToken }) {
  const preflightErrors = validatePreviewMainIdentity({
    repository,
    ref,
    sha,
    headSha: sha,
    currentMainSha: sha,
  });
  if (preflightErrors.length > 0) throw new Error(preflightErrors.join("; "));

  const currentMainSha = await fetchCurrentMainSha(fetchImpl, githubToken);
  const errors = validatePreviewMainIdentity({
    repository,
    ref,
    sha,
    headSha: sha,
    currentMainSha,
  });
  if (errors.length > 0) throw new Error(errors.join("; "));
  return currentMainSha;
}

function safeFailureReason(error) {
  const message = error instanceof Error ? error.message : "";
  const statusMatch = /^GitHub main lookup returned HTTP ([1-5]\d\d)\.$/.exec(message);
  if (statusMatch) return `GitHub main lookup returned HTTP ${statusMatch[1]}.`;
  if (message === "GitHub main lookup did not return a full commit SHA.") {
    return "GitHub main lookup returned an invalid commit SHA.";
  }
  if (message.includes("current origin/main tip")) return "dispatch SHA no longer matches the current main tip.";
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return "GitHub main lookup timed out.";
  return "canonical main could not be verified.";
}

export async function runPreviewMainGuard({ env = process.env, fetchImpl = fetch, logger = console } = {}) {
  const sha = env.GITHUB_SHA;
  try {
    await verifyPreviewMain({
      repository: env.GITHUB_REPOSITORY,
      ref: env.GITHUB_REF,
      sha,
      fetchImpl,
      githubToken: env.GITHUB_TOKEN,
    });
    logger.log("Verified canonical main SHA against GitHub's current branch tip.");
    return 0;
  } catch (error) {
    logger.error(`Preview workflow stopped: ${safeFailureReason(error)}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runPreviewMainGuard();
}
