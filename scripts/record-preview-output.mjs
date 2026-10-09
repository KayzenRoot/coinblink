import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CLOUDFLARE_PREVIEW_WORKER_NAME } from "./cloudflare-preview-policy.mjs";

export function validatePreviewOutput(result, expectedName) {
  if (result?.type !== "preview" || result.version !== 1) {
    throw new Error("Wrangler output is not a supported Worker Preview result.");
  }
  if (result.worker_name !== CLOUDFLARE_PREVIEW_WORKER_NAME) {
    throw new Error("Wrangler targeted a Worker other than the dedicated CoinBlink M00 Preview Worker.");
  }
  if (result.preview_name !== expectedName) {
    throw new Error("Wrangler returned a Preview name that does not match this workflow run.");
  }

  const previewUrl = validateCloudflareUrl(result.preview_urls, "stable Preview URL");
  const deploymentUrl = validateCloudflareUrl(result.deployment_urls, "immutable Deployment URL");
  if (previewUrl === deploymentUrl) {
    throw new Error("Stable Preview and immutable Deployment URLs must be distinct.");
  }

  return { previewUrl, deploymentUrl };
}

function validateCloudflareUrl(values, label) {
  if (!Array.isArray(values) || values.length !== 1) {
    throw new Error(`Wrangler must return exactly one ${label}.`);
  }
  const url = new URL(values[0]);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".workers.dev") ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error(`${label} must be an HTTPS workers.dev origin without credentials, path, query, or fragment.`);
  }
  return url.origin;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [resultPath, expectedName] = process.argv.slice(2);
    const urls = validatePreviewOutput(JSON.parse(readFileSync(resultPath, "utf8")), expectedName);
    appendFileSync(process.env.GITHUB_OUTPUT, `stable_url=${urls.previewUrl}\ndeployment_url=${urls.deploymentUrl}\n`, "utf8");
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### CoinBlink M00 Worker Preview\n\n- Stable Preview: ${urls.previewUrl}\n- Immutable Deployment: ${urls.deploymentUrl}\n- Preview name: ${expectedName}\n- Build SHA: ${process.env.EXPECTED_SHA}\n`,
      "utf8",
    );
    console.log("Recorded the verified Wrangler Preview URLs and exact build SHA.");
  } catch (error) {
    console.error(`Worker Preview output rejected: ${error.message}`);
    process.exit(1);
  }
}
