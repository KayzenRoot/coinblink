import assert from "node:assert/strict";
import test from "node:test";
import { validateProductionDeploymentEnvironment } from "../scripts/assert-production-deployment-config.mjs";
import { runProductionWorkerSmoke, verifyWorkerProduction, validateProductionWorkerUrl } from "../scripts/verify-worker-production.mjs";
import { PRODUCTION_WORKER_NAME, PRODUCTION_WORKER_URL } from "../scripts/cloudflare-production-policy.mjs";

const sha = "d".repeat(40);

function headers(contentType = "application/json; charset=utf-8") {
  return {
    "cache-control": "no-store",
    "content-security-policy": "default-src 'self'; object-src 'none'",
    "permissions-policy": "camera=(), geolocation=(), microphone=()",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow, noarchive",
    "content-type": contentType,
  };
}

function syntheticFetch({ healthSha = sha, productionStatus = {}, assetStatus = 200, redirectPath, homepageHtml, robotsText = "User-agent: *\nAllow: /\n" } = {}) {
  const seenPaths = [];
  const fetchImpl = async (input, options) => {
    const url = new URL(input);
    seenPaths.push(url.pathname);
    assert.equal(options.redirect, "manual");
    assert.equal(url.origin, PRODUCTION_WORKER_URL);
    if (redirectPath === url.pathname) return new Response(null, { status: 302, headers: { location: "/en" } });
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "coinblink", buildSha: healthSha, environment: "production" }), {
        status: 200,
        headers: headers(),
      });
    }
    if (url.pathname === "/preview-status") {
      return new Response(JSON.stringify({
        status: "demo",
        dataMode: "demonstration-only",
        cloudflarePreview: "not-deployed",
        buildSha: sha,
        environment: "production",
        editorialFeed: "not-connected",
        marketData: "not-connected",
        ...productionStatus,
      }), { status: 200, headers: headers() });
    }
    if (url.pathname === "/en") {
      return new Response(homepageHtml ?? '<html><head><title>CoinBlink</title><link rel="stylesheet" href="/_astro/site.123.css"></head><body>CoinBlink</body></html>', {
        status: 200,
        headers: headers("text/html; charset=utf-8"),
      });
    }
    if (url.pathname === "/_astro/site.123.css") {
      return new Response("body{color:#fff}", { status: assetStatus, headers: headers("text/css; charset=utf-8") });
    }
    if (url.pathname === "/robots.txt") {
      return new Response(robotsText, { status: 200, headers: headers("text/plain; charset=utf-8") });
    }
    if (url.pathname === "/missing-route") {
      return new Response("Not found", { status: 404, headers: headers("text/html; charset=utf-8") });
    }
    return new Response("Unexpected path", { status: 500, headers: headers("text/plain") });
  };
  return { fetchImpl, seenPaths };
}

function validEnvironment(overrides = {}) {
  return {
    GITHUB_REPOSITORY: "KayzenRoot/coinblink",
    GITHUB_REF: "refs/heads/main",
    GITHUB_ENVIRONMENT: "production",
    EXPECTED_MAIN_SHA: sha,
    COINBLINK_CF_WORKER_NAME: PRODUCTION_WORKER_NAME,
    COINBLINK_CF_WORKER_URL: PRODUCTION_WORKER_URL,
    CLOUDFLARE_ACCOUNT_ID: "91aeaffe2456eff6bb9ce76ce177bb3f",
    CLOUDFLARE_API_TOKEN: "synthetic-token-value-that-is-not-real",
    ...overrides,
  };
}

test("production smoke checks exact SHA, demo-only status, home HTML, same-origin asset, noindex and 404", async () => {
  const { fetchImpl, seenPaths } = syntheticFetch();
  const result = await verifyWorkerProduction({ workerUrl: PRODUCTION_WORKER_URL, expectedSha: sha, fetchImpl });
  assert.deepEqual(result, { worker: PRODUCTION_WORKER_NAME, url: PRODUCTION_WORKER_URL, sha });
  assert.ok(seenPaths.includes("/health"));
  assert.ok(seenPaths.includes("/preview-status"));
  assert.ok(seenPaths.includes("/en"));
  assert.ok(seenPaths.includes("/_astro/site.123.css"));
  assert.ok(seenPaths.includes("/robots.txt"));
  assert.ok(seenPaths.includes("/missing-route"));
});

test("production smoke parses long robots directives without regex", async () => {
  const { fetchImpl } = syntheticFetch({
    robotsText: `User-agent: *\nAllow: /${" ".repeat(64_000)}\nDisallow: /private\n`,
  });
  const result = await verifyWorkerProduction({ workerUrl: PRODUCTION_WORKER_URL, expectedSha: sha, fetchImpl });
  assert.equal(result.sha, sha);

  await assert.rejects(verifyWorkerProduction({
    workerUrl: PRODUCTION_WORKER_URL,
    expectedSha: sha,
    fetchImpl: syntheticFetch({ robotsText: `User-agent: *\nAllow: /\nDisallow: /${" ".repeat(64_000)}\n` }).fetchImpl,
  }), /noindex response policy/);
});

test("production smoke failure logs do not include exception text", async () => {
  const errors = [];
  const exitCode = await runProductionWorkerSmoke({
    env: { COINBLINK_CF_WORKER_URL: "https://untrusted.invalid/\r\n::warning::forged", EXPECTED_MAIN_SHA: sha },
    logger: { log() {}, error(message) { errors.push(message); } },
    fetchImpl: syntheticFetch().fetchImpl,
  });
  assert.equal(exitCode, 1);
  assert.deepEqual(errors, ["Production Worker smoke failed; details withheld."]);
  assert.equal(errors.some((message) => message.includes("forged")), false);
});

test("production smoke rejects another Worker URL, invalid SHA, and redirects", async () => {
  assert.throws(() => validateProductionWorkerUrl("https://coinblink-m00-preview.kayzendev.workers.dev"), /fixed HTTPS workers.dev origin/);
  await assert.rejects(verifyWorkerProduction({ workerUrl: PRODUCTION_WORKER_URL, expectedSha: "short", fetchImpl: syntheticFetch().fetchImpl }), /full commit SHA/);
  await assert.rejects(verifyWorkerProduction({
    workerUrl: PRODUCTION_WORKER_URL,
    expectedSha: sha,
    fetchImpl: syntheticFetch({ redirectPath: "/health" }).fetchImpl,
  }), /unexpectedly redirected/);
});

test("production smoke rejects mismatched SHA and any LIVE data contract", async () => {
  await assert.rejects(verifyWorkerProduction({
    workerUrl: PRODUCTION_WORKER_URL,
    expectedSha: sha,
    fetchImpl: syntheticFetch({ healthSha: "e".repeat(40) }).fetchImpl,
  }), /exact deployed main SHA/);
  await assert.rejects(verifyWorkerProduction({
    workerUrl: PRODUCTION_WORKER_URL,
    expectedSha: sha,
    fetchImpl: syntheticFetch({ productionStatus: { marketData: "live" } }).fetchImpl,
  }), /no-live-data demo contract/);
});

test("production smoke rejects missing security policy and failed static assets", async () => {
  await assert.rejects(verifyWorkerProduction({
    workerUrl: PRODUCTION_WORKER_URL,
    expectedSha: sha,
    fetchImpl: async (url, options) => {
      const response = await syntheticFetch().fetchImpl(url, options);
      if (new URL(url).pathname === "/preview-status") {
        const copiedHeaders = new Headers(response.headers);
        copiedHeaders.delete("x-robots-tag");
        return new Response(await response.text(), { status: response.status, headers: copiedHeaders });
      }
      return response;
    },
  }), /noindex policy/);
  await assert.rejects(verifyWorkerProduction({
    workerUrl: PRODUCTION_WORKER_URL,
    expectedSha: sha,
    fetchImpl: syntheticFetch({ assetStatus: 404 }).fetchImpl,
  }), /static Astro asset/);
});

test("the production credential guard fails closed on non-main refs, wrong account, and missing token", () => {
  assert.deepEqual(validateProductionDeploymentEnvironment(validEnvironment()), []);
  assert.ok(validateProductionDeploymentEnvironment(validEnvironment({ GITHUB_REF: "refs/heads/feature" })).some((error) => error.includes("must be main")));
  assert.ok(validateProductionDeploymentEnvironment(validEnvironment({ CLOUDFLARE_ACCOUNT_ID: "0".repeat(32) })).some((error) => error.includes("verified account")));
  assert.ok(validateProductionDeploymentEnvironment(validEnvironment({ CLOUDFLARE_API_TOKEN: "" })).some((error) => error.includes("not configured")));
});
