import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CLOUDFLARE_PREVIEW_WORKER_NAME } from "./cloudflare-preview-policy.mjs";

export function validatePreviewOutput(result, expectedName) {
  const preview = result?.preview;
  const deployment = result?.deployment;
  if (!preview || !deployment || typeof preview !== "object" || typeof deployment !== "object") {
    throw new Error("Wrangler output does not contain nested Preview and deployment resources.");
  }

  if (typeof preview.id !== "string" || !preview.id || typeof deployment.id !== "string" || !deployment.id) {
    throw new Error("Wrangler must return Preview and deployment identities.");
  }
  if (preview.name !== expectedName || deployment.preview_name !== expectedName) {
    throw new Error("Wrangler returned a Preview name that does not match this workflow run.");
  }
  if (deployment.preview_id !== preview.id) {
    throw new Error("Wrangler returned a deployment that does not belong to the returned Preview.");
  }

  const previewUrl = validateCloudflareUrl(
    preview.urls,
    "stable Preview URL",
    `${expectedName}-${CLOUDFLARE_PREVIEW_WORKER_NAME}`,
  );
  const deploymentUrl = validateCloudflareUrl(
    deployment.urls,
    "immutable Deployment URL",
    `${deployment.id}-${CLOUDFLARE_PREVIEW_WORKER_NAME}`,
  );
  if (previewUrl === deploymentUrl) {
    throw new Error("Stable Preview and immutable Deployment URLs must be distinct.");
  }

  return { previewUrl, deploymentUrl };
}

function parseWranglerJsonOutput(output) {
  try {
    return JSON.parse(output);
  } catch (parseError) {
    const lines = output.trim().split(/\r?\n/);
    const jsonStart = lines.findIndex((line) => line.trimStart().startsWith("{"));
    const progressLines = lines.slice(0, jsonStart).map((line) => line.trim()).filter(Boolean);
    if (
      jsonStart <= 0 ||
      progressLines.length === 0 ||
      !progressLines.every((line) => /^Attaching(?:\s|$)/.test(line))
    ) {
      throw parseError;
    }
    return JSON.parse(lines.slice(jsonStart).join("\n").trim());
  }
}

export function parsePreviewOutput(output, expectedName) {
  return validatePreviewOutput(parseWranglerJsonOutput(output), expectedName);
}

function validateCloudflareUrl(values, label, expectedHostnameLabel) {
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
  const hostnameLabel = url.hostname.split(".")[0];
  if (!hostnameLabel.endsWith(`-${CLOUDFLARE_PREVIEW_WORKER_NAME}`)) {
    throw new Error(`${label} must target the dedicated CoinBlink M00 Preview Worker.`);
  }
  if (hostnameLabel !== expectedHostnameLabel) {
    throw new Error(`${label} hostname does not match the returned Preview or deployment identity.`);
  }
  return url.origin;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [resultPath, expectedName] = process.argv.slice(2);
    const urls = parsePreviewOutput(readFileSync(resultPath, "utf8"), expectedName);
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
