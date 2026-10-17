import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PRODUCTION_WORKER_NAME, PRODUCTION_WORKER_URL, isFullCommitSha } from "./cloudflare-production-policy.mjs";

const attempts = 6;
const retryDelayMs = 5_000;

export function validateProductionWorkerUrl(value) {
  const url = new URL(value);
  if (
    url.origin !== PRODUCTION_WORKER_URL ||
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".workers.dev") ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error("Production smoke accepts only the fixed HTTPS workers.dev origin.");
  }
  return url.origin;
}

function assertNoindex(response, path) {
  if (!/\bnoindex\b/i.test(response.headers.get("x-robots-tag") ?? "")) {
    throw new Error(`${path} is missing the reviewed noindex policy.`);
  }
}

function assertSecurityHeaders(response, path) {
  const headers = response.headers;
  if (!(headers.get("content-security-policy") ?? "").includes("default-src 'self'")) {
    throw new Error(`${path} is missing the expected Content-Security-Policy.`);
  }
  if (headers.get("permissions-policy") !== "camera=(), geolocation=(), microphone=()") {
    throw new Error(`${path} is missing the restrictive Permissions-Policy.`);
  }
  if (headers.get("referrer-policy") !== "strict-origin-when-cross-origin") {
    throw new Error(`${path} is missing the expected Referrer-Policy.`);
  }
  if (headers.get("x-content-type-options") !== "nosniff" || headers.get("x-frame-options") !== "DENY") {
    throw new Error(`${path} is missing anti-sniffing or frame protections.`);
  }
}

async function fetchWithBoundedRetry(url, fetchImpl) {
  let lastFailure;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      if (response.status < 500) return response;
      lastFailure = `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.name : "unknown network failure";
    }
    if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }
  throw new Error(`Production endpoint did not become available after bounded retries (${lastFailure ?? "unknown failure"}).`);
}

async function requestPath(baseUrl, path, fetchImpl) {
  const response = await fetchWithBoundedRetry(new URL(path, baseUrl), fetchImpl);
  if (response.status >= 300 && response.status < 400) throw new Error(`${path} unexpectedly redirected.`);
  assertNoindex(response, path);
  if (path !== "/robots.txt") assertSecurityHeaders(response, path);
  return response;
}

async function verifyHealth(baseUrl, expectedSha, fetchImpl) {
  const response = await requestPath(baseUrl, "/health", fetchImpl);
  if (response.status !== 200 || response.headers.get("cache-control") !== "no-store") {
    throw new Error("Production /health must return HTTP 200 with no-store caching.");
  }
  const health = await response.json();
  if (health.status !== "ok" || health.service !== "coinblink" || health.buildSha !== expectedSha || health.environment !== "production") {
    throw new Error("Production /health does not identify the exact deployed main SHA.");
  }
  if (Object.keys(health).some((key) => /secret|token|password|api.?key/i.test(key))) {
    throw new Error("Production /health exposes a prohibited credential-shaped field.");
  }
}

async function verifyDemoStatus(baseUrl, expectedSha, fetchImpl) {
  const response = await requestPath(baseUrl, "/preview-status", fetchImpl);
  if (response.status !== 200 || response.headers.get("cache-control") !== "no-store") {
    throw new Error("Production /preview-status must return HTTP 200 with no-store caching.");
  }
  const status = await response.json();
  if (
    status.status !== "demo" ||
    status.dataMode !== "demonstration-only" ||
    status.cloudflarePreview !== "not-deployed" ||
    status.buildSha !== expectedSha ||
    status.environment !== "production" ||
    status.editorialFeed !== "not-connected" ||
    status.marketData !== "not-connected"
  ) {
    throw new Error("Production site does not match the reviewed no-live-data demo contract.");
  }
  if (Object.keys(status).some((key) => /secret|token|password|api.?key/i.test(key))) {
    throw new Error("Production /preview-status exposes a prohibited credential-shaped field.");
  }
}

async function verifyHomepageAndAsset(baseUrl, fetchImpl) {
  const response = await requestPath(baseUrl, "/en", fetchImpl);
  if (response.status !== 200 || !(response.headers.get("content-type") ?? "").includes("text/html")) {
    throw new Error("Production /en must return the homepage as HTML.");
  }
  const html = await response.text();
  if (!html.includes("CoinBlink")) throw new Error("Production /en does not contain the expected site identity.");
  const assetPath = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .map((path) => {
      try {
        return new URL(path, baseUrl);
      } catch {
        return null;
      }
    })
    .find((url) => url?.origin === baseUrl && url.pathname.startsWith("/_astro/"));
  if (!assetPath) throw new Error("Production /en does not reference a same-origin Astro asset.");
  const assetResponse = await requestPath(baseUrl, `${assetPath.pathname}${assetPath.search}`, fetchImpl);
  const assetContentType = assetResponse.headers.get("content-type") ?? "";
  if (assetResponse.status !== 200 || !assetContentType || assetContentType.includes("text/html")) {
    throw new Error("The production static Astro asset must return a successful non-HTML response.");
  }
}

async function verifyRobots(baseUrl, fetchImpl) {
  const response = await requestPath(baseUrl, "/robots.txt", fetchImpl);
  if (response.status !== 200) throw new Error("Production /robots.txt must return HTTP 200.");
  const robots = await response.text();
  if (!/^\s*Allow:\s*\/\s*$/im.test(robots) || /^\s*Disallow:\s*\/\s*$/im.test(robots)) {
    throw new Error("Production robots.txt must not contradict the noindex response policy.");
  }
}

async function verify404(baseUrl, fetchImpl) {
  const response = await requestPath(baseUrl, "/missing-route", fetchImpl);
  if (response.status !== 404) throw new Error("Unknown production routes must return HTTP 404.");
}

export async function verifyWorkerProduction({ workerUrl, expectedSha, fetchImpl = fetch } = {}) {
  if (!isFullCommitSha(expectedSha)) throw new Error("Production build SHA must be a full commit SHA.");
  const baseUrl = validateProductionWorkerUrl(workerUrl);
  await Promise.all([
    verifyHealth(baseUrl, expectedSha, fetchImpl),
    verifyDemoStatus(baseUrl, expectedSha, fetchImpl),
    verifyHomepageAndAsset(baseUrl, fetchImpl),
    verifyRobots(baseUrl, fetchImpl),
    verify404(baseUrl, fetchImpl),
  ]);
  return { worker: PRODUCTION_WORKER_NAME, url: baseUrl, sha: expectedSha };
}

export async function runProductionWorkerSmoke({ env = process.env, logger = console, fetchImpl = fetch } = {}) {
  try {
    const result = await verifyWorkerProduction({
      workerUrl: env.COINBLINK_CF_WORKER_URL,
      expectedSha: env.EXPECTED_MAIN_SHA,
      fetchImpl,
    });
    if (typeof env.GITHUB_STEP_SUMMARY === "string" && env.GITHUB_STEP_SUMMARY.length > 0) {
      appendFileSync(
        env.GITHUB_STEP_SUMMARY,
        `\n### Cloudflare production exact-SHA smoke\n\n- Worker: \`${result.worker}\`\n- URL: ${result.url}\n- Build SHA: \`${result.sha}\`\n- Verified: /health, /en, one same-origin Astro asset, demo-only /preview-status, robots/noindex, security headers, and 404.\n`,
        "utf8",
      );
    }
    logger.log(`Verified ${result.worker} serves main SHA ${result.sha} with demo-only endpoints and a static Astro asset.`);
    return 0;
  } catch (error) {
    logger.error(`Production Worker smoke failed: ${error instanceof Error ? error.message : "unknown failure"}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = await runProductionWorkerSmoke();
}
