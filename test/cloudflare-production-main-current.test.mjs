import assert from "node:assert/strict";
import test from "node:test";
import { verifyProductionMainCurrent } from "../scripts/assert-production-main-current.mjs";

const sha = "f".repeat(40);
const issuePath = "https://api.github.com/repos/KayzenRoot/coinblink/issues/72";
const commentsPath = `${issuePath}/comments?per_page=100&page=1`;

function authorizedRightsComment() {
  return [{
    id: 7202,
    user: { login: "KayzenRoot" },
    created_at: "2026-10-17T10:00:00Z",
    updated_at: "2026-10-17T10:00:00Z",
    body: [
      "COINBLINK_COMMERCIAL_PUBLICATION_GATE=AUTHORIZED",
      "rightsReview=CLEARED",
      "commercialPublicationAllowed=true",
      "rightsEvidence=https://github.com/KayzenRoot/coinblink/issues/72#issuecomment-7202",
    ].join("\n"),
  }];
}

function options(overrides = {}) {
  return {
    expectedSha: sha,
    repository: "KayzenRoot/coinblink",
    ref: "refs/heads/main",
    githubToken: "synthetic-read-only-token",
    execFile: (_file, _args, settings) => {
      assert.equal(settings.encoding, "utf8");
      return sha;
    },
    fetchImpl: async (url, settings) => {
      assert.equal(settings.redirect, "error");
      assert.match(settings.headers.authorization, /^Bearer synthetic-read-only-token$/);
      const href = String(url);
      if (href === "https://api.github.com/repos/KayzenRoot/coinblink/commits/main") return new Response(JSON.stringify({ sha }), { status: 200 });
      if (href === issuePath) return new Response(JSON.stringify({ number: 72, state: "closed" }), { status: 200 });
      if (href === commentsPath) return new Response(JSON.stringify(authorizedRightsComment()), { status: 200 });
      throw new Error(`Unexpected API path: ${href}`);
    },
    ...overrides,
  };
}

test("accepts the exact checked-out commit only while it remains current main", async () => {
  assert.equal(await verifyProductionMainCurrent(options()), sha);
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

test("rechecks the Owner commercial-rights gate immediately before deployment", async () => {
  await assert.rejects(verifyProductionMainCurrent(options({
    fetchImpl: async (url) => {
      const href = String(url);
      if (href === "https://api.github.com/repos/KayzenRoot/coinblink/commits/main") return new Response(JSON.stringify({ sha }), { status: 200 });
      if (href === issuePath) return new Response(JSON.stringify({ number: 72, state: "closed" }), { status: 200 });
      if (href === commentsPath) return new Response(JSON.stringify([{ ...authorizedRightsComment()[0], body: "commercialPublicationAllowed=false" }]), { status: 200 });
      throw new Error(`Unexpected API path: ${href}`);
    },
  })), /Commercial publication gate blocked/);
});
