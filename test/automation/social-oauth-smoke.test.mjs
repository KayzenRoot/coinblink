import assert from "node:assert/strict";
import test from "node:test";
import { verifySocialOAuthSmoke } from "../../scripts/smoke-social-oauth.mjs";
import { oauthInvalidState, oauthNotConfigured, oauthNotFound } from "../../src/modules/CB-M07/oauth-page.mjs";

const base = "https://coinblink.test/";

function unconfigured(path) {
  const provider = path.includes("/instagram/") ? "Instagram" : "TikTok";
  return oauthNotConfigured(provider, "app credentials");
}

test("the built Worker must serve all four OAuth handlers in an unconfigured preview", async () => {
  const calls = [];
  await verifySocialOAuthSmoke(base, {
    local: true,
    fetchImpl: async (url, { credentials, redirect }) => {
      assert.equal(credentials, "omit");
      assert.equal(redirect, "manual");
      calls.push(url.pathname);
      return unconfigured(url.pathname);
    },
  });
  assert.deepEqual(calls.sort(), [
    "/api/oauth/instagram/callback", "/api/oauth/instagram/start",
    "/api/oauth/tiktok/callback", "/api/oauth/tiktok/start",
  ]);
});

test("the deployed smoke accepts the application's configured anonymous refusals", async () => {
  await assert.doesNotReject(() => verifySocialOAuthSmoke(base, {
    fetchImpl: async (url) => url.pathname.endsWith("/start")
      ? oauthNotFound()
      : oauthInvalidState("No authorization state"),
  }));
});

test("the deployed smoke also accepts apps that are not configured", async () => {
  await assert.doesNotReject(() => verifySocialOAuthSmoke(base, {
    fetchImpl: async (url) => unconfigured(url.pathname),
  }));
});

test("the preview rejects even a bare 404 because every handler must be observed", async () => {
  await assert.rejects(verifySocialOAuthSmoke(base, { local: true, fetchImpl: async () => oauthNotFound() }),
    /OAuth smoke failed.*404/u);
});

const invalid = [
  ["a generic page 404 instead of the bare start refusal", "/instagram/start", () => new Response("<h1>Page not found</h1>", {
    status: 404, headers: { "content-type": "text/html", "cache-control": "no-store" },
  })],
  ["a missing callback", "/tiktok/callback", oauthNotFound],
  ["a redirect", "/instagram/start", () => Response.redirect("https://provider.test/authorize", 302)],
  ["an unexpected server error", "/tiktok/start", () => new Response(null, { status: 500 })],
  ["an unrelated service-unavailable response", "/tiktok/callback", () => new Response(null, { status: 503 })],
  ["a start that sets a cookie", "/instagram/start", () => {
    const response = oauthNotFound();
    response.headers.set("set-cookie", "synthetic=unexpected");
    return response;
  }],
];

for (const [description, suffix, respond] of invalid) {
  test("the deployed smoke rejects " + description, async () => {
    await assert.rejects(verifySocialOAuthSmoke(base, {
      fetchImpl: async (url) => url.pathname.endsWith(suffix) ? respond() : unconfigured(url.pathname),
    }), /OAuth smoke failed/u);
  });
}
