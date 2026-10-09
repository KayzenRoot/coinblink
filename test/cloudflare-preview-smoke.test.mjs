import assert from "node:assert/strict";
import { test } from "node:test";
import { validateWorkerPreviewUrl, verifyWorkerPreview } from "../scripts/verify-worker-preview.mjs";

const sha = "d".repeat(40);
const headers = {
  "x-robots-tag": "noindex, nofollow, noarchive",
  "cache-control": "no-store",
  "content-security-policy": "default-src 'self'; object-src 'none'",
  "permissions-policy": "camera=(), geolocation=(), microphone=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

function fakeFetch(url) {
  const path = new URL(url).pathname;
  if (path === "/health") {
    return new Response(JSON.stringify({ status: "ok", service: "coinblink", buildSha: sha, environment: "preview" }), { status: 200, headers });
  }
  if (path === "/preview-status") {
    return new Response(JSON.stringify({
      status: "demo",
      dataMode: "demonstration-only",
      editorialFeed: "not-connected",
      marketData: "not-connected",
      cloudflarePreview: "preview",
      buildSha: sha,
      environment: "preview",
    }), { status: 200, headers });
  }
  if (path === "/robots.txt") return new Response("User-agent: *\nAllow: /\n", { status: 200, headers });
  return new Response("Not found", { status: 404, headers });
}

test("accepts only HTTPS workers.dev origins for smoke targets", () => {
  assert.equal(validateWorkerPreviewUrl("https://preview.account.workers.dev"), "https://preview.account.workers.dev");
  for (const value of [
    "http://preview.account.workers.dev",
    "https://preview.account.workers.dev/path",
    "https://preview.account.workers.dev?token=value",
    "https://example.com",
  ]) {
    assert.throws(() => validateWorkerPreviewUrl(value));
  }
});

test("checks exact SHA, preview environment, noindex, robots, and 404 on both real URL slots", async () => {
  const result = await verifyWorkerPreview({
    stableUrl: "https://preview.account.workers.dev",
    deploymentUrl: "https://immutable.account.workers.dev",
    expectedSha: sha,
    fetchImpl: fakeFetch,
  });
  assert.deepEqual(result, {
    worker: "coinblink-m00-preview",
    stable: "https://preview.account.workers.dev",
    immutable: "https://immutable.account.workers.dev",
    sha,
  });
});

test("rejects robots directives that block crawlers from reading noindex signals", async () => {
  const disallowingFetch = async (url) => {
    if (new URL(url).pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", { status: 200, headers });
    }
    return fakeFetch(url);
  };

  await assert.rejects(verifyWorkerPreview({
    stableUrl: "https://preview.account.workers.dev",
    deploymentUrl: "https://immutable.account.workers.dev",
    expectedSha: sha,
    fetchImpl: disallowingFetch,
  }), /must allow crawling so crawlers can read the noindex signals/);
});

test("rejects a stale health SHA and non-404 unknown routes", async () => {
  const staleFetch = async (url) => {
    if (new URL(url).pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "coinblink", buildSha: "c".repeat(40), environment: "preview" }), { status: 200, headers });
    }
    return fakeFetch(url);
  };
  await assert.rejects(verifyWorkerPreview({
    stableUrl: "https://preview.account.workers.dev",
    deploymentUrl: "https://immutable.account.workers.dev",
    expectedSha: sha,
    fetchImpl: staleFetch,
  }), /exact Preview build SHA/);

  const unsafeRouteFetch = async (url) => {
    if (new URL(url).pathname === "/missing-route") return new Response("ok", { status: 200, headers });
    return fakeFetch(url);
  };
  await assert.rejects(verifyWorkerPreview({
    stableUrl: "https://preview.account.workers.dev",
    deploymentUrl: "https://immutable.account.workers.dev",
    expectedSha: sha,
    fetchImpl: unsafeRouteFetch,
  }), /HTTP 404/);
});
