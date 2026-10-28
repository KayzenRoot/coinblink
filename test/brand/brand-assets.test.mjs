import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inspectSvg } from "./svg-security.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EXPECTED_ASSETS = {
  "coinblink-symbol.svg": {
    bytes: 4042,
    sha256: "240d6e4c7e929920f0b7cbef37278aea09b6e55ac405e2d34ed7e55368a01de2",
    viewBox: "0 0 512 512",
  },
  "coinblink-horizontal-dark.svg": {
    bytes: 18085,
    sha256: "9da72437b4df9d896b85d8fc313e6734dd21db6905d7a5cf7419f0e353b3ab8c",
    viewBox: "0 0 1150 260",
  },
  "coinblink-horizontal-light.svg": {
    bytes: 18087,
    sha256: "f054553a21372a5ca44837e6c75cf96450e461afbb49ed4629ffb5c2ee032825",
    viewBox: "0 0 1150 260",
  },
  "coinblink-stacked.svg": {
    bytes: 18040,
    sha256: "707ac8a765cf99aa1dcd2b74364fac7b650238f78aaebfc392b6cec281adcfdd",
    viewBox: "0 0 780 680",
  },
  "favicon.svg": {
    bytes: 3718,
    sha256: "0f446faef5fc69f4bdc76fffa03cf0b0e6feb6e4ddb4aceefce8e97e4d1e6e16",
    viewBox: "0 0 512 512",
  },
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("brand library contains the five byte-identical owner-approved SVGs", async () => {
  for (const [filename, expected] of Object.entries(EXPECTED_ASSETS)) {
    const bytes = await readFile(path.join(REPOSITORY_ROOT, "public/brand", filename));
    assert.equal(bytes.byteLength, expected.bytes, filename + " byte length");
    assert.equal(sha256(bytes), expected.sha256, filename + " SHA-256");
  }
});

test("Git must not convert approved SVG bytes on Windows checkouts", async () => {
  const attributes = await readFile(path.join(REPOSITORY_ROOT, "public/brand/.gitattributes"), "utf8");
  assert.match(attributes, /^\*\.svg\s+-text\s*$/m);
});

test("each SVG is structurally bounded and contains no active, remote, or embedded content", async () => {
  for (const [filename, expected] of Object.entries(EXPECTED_ASSETS)) {
    const source = await readFile(path.join(REPOSITORY_ROOT, "public/brand", filename), "utf8");
    const result = inspectSvg(source);
    assert.deepEqual(result.errors, [], filename + " security checks");
    assert.equal(result.viewBox, expected.viewBox, filename + " viewBox");
    assert.doesNotMatch(source, /<text\b/i, filename + " must use outlined text");
    assert.doesNotMatch(source, /font-family|@font-face/i, filename + " must not require a font");
  }
});

test("SVG security checks reject active content, event handlers, links, and XML entities", () => {
  const unsafeSamples = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" onload="alert(1)"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><foreignObject/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><image href="https://example.invalid/a.png"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><a href="https://example.invalid/">x</a></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><style>@import url(https://example.invalid/a.css);</style></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path fill="url(https://example.invalid/a.svg#x)"/></svg>',
    '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">&xxe;</svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path fill="url(#missing)"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 NaN 1"></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="https://example.invalid/ns" viewBox="0 0 1 1"></svg>',
  ];

  for (const source of unsafeSamples) {
    assert.notDeepEqual(inspectSvg(source).errors, [], source);
  }
});

test("standard SVG namespace and local fragment paint servers remain allowed", () => {
  const safeSample = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><defs><linearGradient id="g"/></defs><path fill="url(#g)"/></svg>';
  assert.deepEqual(inspectSvg(safeSample).errors, []);
});

test("manifest records demo-only rights, the owner wiring authorization and verified derivatives", async () => {
  const manifest = JSON.parse(await readFile(path.join(REPOSITORY_ROOT, "public/brand/brand-manifest.json"), "utf8"));
  assert.equal(manifest.status, "DEMO_ONLY");
  // Rights and commercial publication are untouched by the wiring authorization.
  assert.equal(manifest.rightsReview, "PENDING_OWNER_OR_LEGAL");
  assert.equal(manifest.commercialPublicationAllowed, false);
  assert.equal(manifest.siteIntegrationAllowed, true);
  assert.equal(manifest.headerIntegrationAllowed, true);
  assert.equal(manifest.faviconInstalledGlobally, true);
  assert.equal(manifest.integrationAuthorization.authorizedBy, "KayzenRoot");
  assert.match(manifest.integrationAuthorization.scope, /DEMO_ONLY/u);
  const favicon = manifest.assets.find((entry) => entry.path === "public/brand/favicon.svg");
  assert.equal(favicon.installationStatus, "INSTALLED_DEMO_ONLY");
  // Every recorded derivative must match the bytes actually committed.
  assert.equal(manifest.derivatives.length, 3);
  for (const derivative of manifest.derivatives) {
    const bytes = await readFile(path.join(REPOSITORY_ROOT, derivative.path));
    assert.equal(bytes.byteLength, derivative.bytes, derivative.path + " byte length");
    assert.equal(sha256(bytes), derivative.sha256, derivative.path + " sha256");
    assert.ok(Number.isInteger(derivative.width) && derivative.width > 0, derivative.path + " width");
    assert.ok(Number.isInteger(derivative.height) && derivative.height > 0, derivative.path + " height");
    assert.ok(derivative.source, derivative.path + " records its source");
  }
  assert.equal(manifest.approval.ownerVectorApproval, "ACCEPTED_FOR_DEMO");
  assert.equal(manifest.approval.authorizedTransport.sha256, "fe8f14a6837aee1a4bfc760461ff30e7b260a7ee89e902c254a357947ba5c0d8");

  const stacked = manifest.assets.find((entry) => entry.path === "public/brand/coinblink-stacked.svg");
  assert.equal(stacked.recommendedSurface, "Dark");
  assert.match(stacked.surfaceLimitation, /insufficient visible contrast on light surfaces/i);

  for (const [filename, expected] of Object.entries(EXPECTED_ASSETS)) {
    const asset = manifest.assets.find((entry) => entry.path === "public/brand/" + filename);
    assert.ok(asset, filename + " provenance entry");
    assert.equal(asset.bytes, expected.bytes);
    assert.equal(asset.sha256, expected.sha256);
  }
});

test("golden raster reference remains unchanged", async () => {
  const golden = await readFile(path.join(REPOSITORY_ROOT, "assets/reference/coinblink-logo-approved-original-1179x1040.jpg"));
  assert.equal(sha256(golden), "126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0");
});

test("changing even one byte breaks the pinned vector identity", async () => {
  const original = await readFile(path.join(REPOSITORY_ROOT, "public/brand/coinblink-symbol.svg"));
  const changed = Buffer.from(original);
  changed[changed.length - 1] ^= 1;
  assert.notEqual(sha256(changed), EXPECTED_ASSETS["coinblink-symbol.svg"].sha256);
});
