import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validatePreviewMainIdentity } from "./cloudflare-preview-policy.mjs";

const mainEndpoint = "https://api.github.com/repos/KayzenRoot/coinblink/commits/main";
const fullShaPattern = /^[0-9a-f]{40}$/;

export async function fetchCurrentMainSha(fetchImpl = fetch) {
  const response = await fetchImpl(mainEndpoint, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "coinblink-m00-preview-main-guard",
    },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub main lookup returned HTTP ${response.status}.`);

  const result = await response.json();
  if (!fullShaPattern.test(result?.sha ?? "")) throw new Error("GitHub main lookup did not return a full commit SHA.");
  return result.sha;
}

export function sanitizePreviewGuardError(message) {
  const source = String(message);
  let sanitized = "";
  for (let index = 0; index < source.length && sanitized.length < 200; index += 1) {
    const code = source.charCodeAt(index);
    const isControl = code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029;
    sanitized += isControl ? " " : source[index];
  }
  return sanitized;
}

export async function verifyPreviewMain({ repository, ref, sha, fetchImpl = fetch }) {
  const preflightErrors = validatePreviewMainIdentity({
    repository,
    ref,
    sha,
    headSha: sha,
    currentMainSha: sha,
  });
  if (preflightErrors.length > 0) throw new Error(preflightErrors.join("; "));

  const currentMainSha = await fetchCurrentMainSha(fetchImpl);
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

async function runPreviewMainGuard() {
  const sha = process.env.GITHUB_SHA;
  try {
    const currentMainSha = await verifyPreviewMain({
      repository: process.env.GITHUB_REPOSITORY,
      ref: process.env.GITHUB_REF,
      sha,
    });
    console.log(`Verified canonical main SHA ${currentMainSha}.`);
  } catch (error) {
    console.error(`Preview workflow stopped: ${sanitizePreviewGuardError(error.message)}.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runPreviewMainGuard();
}
