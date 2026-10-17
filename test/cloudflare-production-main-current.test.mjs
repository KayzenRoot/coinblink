import assert from "node:assert/strict";
import test from "node:test";
import { verifyProductionMainCurrent } from "../scripts/assert-production-main-current.mjs";

const sha = "f".repeat(40);

function options(overrides = {}) {
  return {
    expectedSha: sha,
    repository: "KayzenRoot/coinblink",
    ref: "refs/heads/main",
    githubToken: "synthetic-read-only-token",
    publicDemoDeploymentAuthorization: "AUTHORIZED_DEMO_ONLY",
    commercialPublicationAllowed: "false",
    execFile: (_file, _args, settings) => {
      assert.equal(settings.encoding, "utf8");
      return sha;
    },
    fetchImpl: async (url, settings) => {
      assert.equal(settings.redirect, "error");
      assert.match(settings.headers.authorization, /^Bearer synthetic-read-only-token$/);
      const href = String(url);
      if (href === "https://api.github.com/repos/KayzenRoot/coinblink/commits/main") return new Response(JSON.stringify({ sha }), { status: 200 });
      throw new Error(`Unexpected API path: ${href}`);
    },
    ...overrides,
  };
}

test("accepts the exact checked-out commit only while it remains current main and demo-only is authorized", async () => {
  assert.equal(await verifyProductionMainCurrent(options({
    publicDemoDeploymentAuthorization: "AUTHORIZED_DEMO_ONLY",
    commercialPublicationAllowed: "false",
  })), sha);
});

test("rejects non-main refs, source checkout drift, stale main, and API failures", async () => {
  await assert.rejects(verifyProductionMainCurrent(options({ ref: "refs/heads/development" })), /not running for refs\/heads\/main/);
  await assert.rejects(verifyProductionMainCurrent(options({ execFile: () => "0".repeat(40) })), /does not match/);
  await assert.rejects(verifyProductionMainCurrent(options({
    fetchImpl: async () => new Response(JSON.stringify({ sha: "0".repeat(40) }), { status: 200 }),
  })), /main advanced/);
  await assert.rejects(verifyProductionMainCurrent(options({
    fetchImpl: async () => new Response("", { status: 403 }),
  })), /HTTP 403/);
});

test("final guard rejects absent demo authorization and enabled commercial publication", async () => {
  await assert.rejects(verifyProductionMainCurrent(options({ publicDemoDeploymentAuthorization: undefined })), /Demo deployment authorization blocked/);
  await assert.rejects(verifyProductionMainCurrent(options({ commercialPublicationAllowed: "true" })), /Demo deployment authorization blocked/);
});
