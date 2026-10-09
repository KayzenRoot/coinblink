import { CLOUDFLARE_PREVIEW_WORKER_NAME } from "./cloudflare-preview-policy.mjs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const expectedShaPattern = /^[0-9a-f]{40}$/;
const attempts = 6;
const retryDelayMs = 10_000;

export function validateWorkerPreviewUrl(value) {
  const url = new URL(value);
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
    throw new Error("Preview smoke accepts only an HTTPS workers.dev origin.");
  }
  return url.origin;
}

function assertNoindex(response, label) {
  const value = response.headers.get("x-robots-tag") ?? "";
  if (!/\bnoindex\b/i.test(value)) throw new Error(`${label} is missing X-Robots-Tag: noindex.`);
}

function assertWorkerSecurityHeaders(response, label) {
  const headers = response.headers;
  if (!(headers.get("content-security-policy") ?? "").includes("default-src 'self'")) {
    throw new Error(`${label} is missing the expected Content-Security-Policy.`);
  }
  if (headers.get("permissions-policy") !== "camera=(), geolocation=(), microphone=()") {
    throw new Error(`${label} is missing the restrictive Permissions-Policy.`);
  }
  if (headers.get("referrer-policy") !== "strict-origin-when-cross-origin") {
    throw new Error(`${label} is missing the expected Referrer-Policy.`);
  }
  if (headers.get("x-content-type-options") !== "nosniff" || headers.get("x-frame-options") !== "DENY") {
    throw new Error(`${label} is missing anti-sniffing or frame protections.`);
  }
}

async function fetchAttempt(url, fetchImpl, attempt) {
  let nextError;
  try {
    const response = await fetchImpl(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
    if (response.status < 500) return response;
    nextError = new Error(`HTTP ${response.status}`);
  } catch (error) {
    nextError = error;
  }

  if (attempt + 1 >= attempts) {
    throw new Error(`Preview endpoint did not become available after bounded retries (${nextError?.name ?? "unknown error"}).`);
  }
  await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  return fetchAttempt(url, fetchImpl, attempt + 1);
}

function fetchWithBoundedRetry(url, fetchImpl) {
  return fetchAttempt(url, fetchImpl, 0);
}

async function fetchPreviewPath(baseUrl, path, fetchImpl) {
  const response = await fetchWithBoundedRetry(new URL(path, baseUrl), fetchImpl);
  assertNoindex(response, path);
  if (path !== "/robots.txt") assertWorkerSecurityHeaders(response, path);
  return response;
}

async function verifyHealth(baseUrl, expectedSha, fetchImpl) {
  const response = await fetchPreviewPath(baseUrl, "/health", fetchImpl);
  if (response.status !== 200) throw new Error("/health must return HTTP 200.");
  if (response.headers.get("cache-control") !== "no-store") throw new Error("/health must be no-store.");
  const health = await response.json();
  if (health.status !== "ok" || health.service !== "coinblink") throw new Error("/health returned an unexpected service status.");
  if (health.buildSha !== expectedSha || health.environment !== "preview") {
    throw new Error("/health does not match the exact Preview build SHA and environment.");
  }
}

async function verifyPreviewStatus(baseUrl, expectedSha, fetchImpl) {
  const response = await fetchPreviewPath(baseUrl, "/preview-status", fetchImpl);
  if (response.status !== 200) throw new Error("/preview-status must return HTTP 200.");
  if (response.headers.get("cache-control") !== "no-store") throw new Error("/preview-status must be no-store.");
  const status = await response.json();
  const matchesContract =
    status.status === "demo" &&
    status.dataMode === "demonstration-only" &&
    status.cloudflarePreview === "preview" &&
    status.buildSha === expectedSha &&
    status.environment === "preview" &&
    status.editorialFeed === "not-connected" &&
    status.marketData === "not-connected";
  if (!matchesContract) throw new Error("/preview-status does not match the exact isolated Preview contract.");
  if (Object.keys(status).some((key) => /secret|token|password|api.?key/i.test(key))) {
    throw new Error("/preview-status exposes a prohibited credential-shaped field.");
  }
}

async function verifyRobots(baseUrl, fetchImpl) {
  const response = await fetchPreviewPath(baseUrl, "/robots.txt", fetchImpl);
  if (response.status !== 200) throw new Error("/robots.txt must return HTTP 200.");
  if (!(await response.text()).includes("Disallow: /")) throw new Error("/robots.txt must disallow crawler indexing.");
}

async function verifyMissingRoute(baseUrl, fetchImpl) {
  const response = await fetchPreviewPath(baseUrl, "/missing-route", fetchImpl);
  if (response.status !== 404) throw new Error("Unknown Preview routes must return HTTP 404.");
}

async function verifyOnePreview(baseUrl, expectedSha, fetchImpl) {
  await Promise.all([
    verifyHealth(baseUrl, expectedSha, fetchImpl),
    verifyPreviewStatus(baseUrl, expectedSha, fetchImpl),
    verifyRobots(baseUrl, fetchImpl),
    verifyMissingRoute(baseUrl, fetchImpl),
  ]);
}

export async function verifyWorkerPreview({ stableUrl, deploymentUrl, expectedSha, fetchImpl = fetch }) {
  if (!expectedShaPattern.test(expectedSha ?? "")) throw new Error("Expected Preview SHA must be a full commit SHA.");
  const stable = validateWorkerPreviewUrl(stableUrl);
  const immutable = validateWorkerPreviewUrl(deploymentUrl);
  if (stable === immutable) throw new Error("Stable and immutable Preview URLs must be distinct.");
  await Promise.all([
    verifyOnePreview(stable, expectedSha, fetchImpl),
    verifyOnePreview(immutable, expectedSha, fetchImpl),
  ]);
  return { worker: CLOUDFLARE_PREVIEW_WORKER_NAME, stable, immutable, sha: expectedSha };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [stableUrl, deploymentUrl, expectedSha] = process.argv.slice(2);
    const result = await verifyWorkerPreview({ stableUrl, deploymentUrl, expectedSha });
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      const { appendFileSync } = await import("node:fs");
      appendFileSync(summaryPath, `\n### Exact-SHA Preview smoke\n\n- Worker: ${result.worker}\n- Build SHA: ${result.sha}\n- Stable URL: ${result.stable}\n- Immutable URL: ${result.immutable}\n- Result: PASS for health, preview status, robots/noindex, security headers, and 404 on both URLs.\n`, "utf8");
    }
    console.log(`Verified both Worker Preview URLs at exact SHA ${result.sha}.`);
  } catch (error) {
    console.error(`Worker Preview smoke failed: ${error.message}`);
    process.exit(1);
  }
}
