import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { verify as verifySigstore } from "sigstore";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const evidence = join(root, ".engineering", "evidence");
const expectedPackage = "@gef-bootstrap/cli";
const expectedVersion = "1.1.2";
const expectedCommit = "af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82";
const expectedTarballSha256 = "331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97";

test("the official GEF tarball and npm SLSA provenance match the pinned source", async (t) => {
  const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const locked = lock.packages[`node_modules/${expectedPackage}`];
  assert.equal(locked.version, expectedVersion);
  assert.equal(locked.resolved, "https://registry.npmjs.org/@gef-bootstrap/cli/-/cli-1.1.2.tgz");

  const integrity = locked.integrity.match(/^sha512-(.+)$/)?.[1];
  assert.ok(integrity, "lockfile must pin SHA-512 integrity");
  const expectedSha512Hex = Buffer.from(integrity, "base64").toString("hex");

  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, "npm must expose its CLI path while running the test suite");
  const tarballDirectory = mkdtempSync(join(tmpdir(), "coinblink-gef-package-"));
  t.after(() => rmSync(tarballDirectory, { recursive: true, force: true }));
  const packed = spawnSync(process.execPath, [
    npmCli,
    "pack",
    `${expectedPackage}@${expectedVersion}`,
    "--pack-destination",
    tarballDirectory,
    "--ignore-scripts",
    "--json",
  ], { cwd: root, encoding: "utf8", timeout: 60_000, windowsHide: true });
  assert.equal(packed.error, undefined, "npm pack must start");
  assert.equal(packed.status, 0, `npm pack exited ${packed.status}`);
  const packedMetadata = JSON.parse(packed.stdout);
  const tarball = await readFile(join(tarballDirectory, packedMetadata[0].filename));
  assert.equal(createHash("sha256").update(tarball).digest("hex"), expectedTarballSha256);
  assert.equal(createHash("sha512").update(tarball).digest("hex"), expectedSha512Hex);

  const registryEvidence = JSON.parse(await readFile(join(evidence, "CB-BOOT-001-npm-registry-keys.json"), "utf8"));
  const attestations = JSON.parse(await readFile(join(evidence, "CB-BOOT-001-npm-attestations.json"), "utf8"));
  const publish = attestations.attestations.find((item) => item.predicateType === "https://github.com/npm/attestation/tree/main/specs/publish/v0.1");
  const provenance = attestations.attestations.find((item) => item.predicateType === "https://slsa.dev/provenance/v1");
  assert.ok(publish, "npm signed publish attestation must be present");
  assert.ok(provenance, "SLSA provenance must be present");

  const publishStatement = JSON.parse(Buffer.from(publish.bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  const provenanceStatement = JSON.parse(Buffer.from(provenance.bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  for (const statement of [publishStatement, provenanceStatement]) {
    assert.equal(statement.subject[0].name, "pkg:npm/%40gef-bootstrap/cli@1.1.2");
    assert.equal(statement.subject[0].digest.sha512, expectedSha512Hex);
  }
  assert.equal(publishStatement.predicate.name, expectedPackage);
  assert.equal(publishStatement.predicate.version, expectedVersion);
  assert.equal(publishStatement.predicate.registry, "https://registry.npmjs.org");

  const build = provenanceStatement.predicate.buildDefinition;
  assert.equal(build.externalParameters.workflow.repository, "https://github.com/KayzenRoot/gef-bootstrap");
  assert.equal(build.externalParameters.workflow.ref, "refs/tags/v1.1.2");
  assert.equal(build.externalParameters.workflow.path, ".github/workflows/v11-publish.yml");
  assert.ok(build.resolvedDependencies.some((dependency) =>
    dependency.uri === "git+https://github.com/KayzenRoot/gef-bootstrap@refs/tags/v1.1.2" &&
    dependency.digest.gitCommit === expectedCommit));

  const registryKeyId = publish.bundle.verificationMaterial.publicKey.hint;
  const registryKey = registryEvidence.keys.find((key) => key.keyid === registryKeyId);
  assert.ok(registryKey, "npm publish attestation key must be pinned");
  const pemKey = `-----BEGIN PUBLIC KEY-----\n${registryKey.key}\n-----END PUBLIC KEY-----`;
  const trustCache = mkdtempSync(join(tmpdir(), "coinblink-sigstore-trust-"));
  t.after(() => rmSync(trustCache, { recursive: true, force: true }));

  await verifySigstore(publish.bundle, {
    keySelector: () => pemKey,
    tufCachePath: trustCache,
  });
  // A valid Sigstore signature alone is insufficient: the exact OIDC workflow
  // identity that released GEF v1.1.2 must also be attested by Fulcio.
  // certificateIdentityURI uses an anchored regex, so dots MUST be escaped.
  const expectedSigner = {
    certificateIssuer: "https://token.actions.githubusercontent.com",
    certificateIdentityURI: String.raw`^https://github\\.com/KayzenRoot/gef-bootstrap/\\.github/workflows/v11-publish\\.yml@refs/tags/v1\\.1\\.2import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { verify as verifySigstore } from "sigstore";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const evidence = join(root, ".engineering", "evidence");
const expectedPackage = "@gef-bootstrap/cli";
const expectedVersion = "1.1.2";
const expectedCommit = "af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82";
const expectedTarballSha256 = "331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97";

test("the official GEF tarball and npm SLSA provenance match the pinned source", async (t) => {
  const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const locked = lock.packages[`node_modules/${expectedPackage}`];
  assert.equal(locked.version, expectedVersion);
  assert.equal(locked.resolved, "https://registry.npmjs.org/@gef-bootstrap/cli/-/cli-1.1.2.tgz");

  const integrity = locked.integrity.match(/^sha512-(.+)$/)?.[1];
  assert.ok(integrity, "lockfile must pin SHA-512 integrity");
  const expectedSha512Hex = Buffer.from(integrity, "base64").toString("hex");

  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, "npm must expose its CLI path while running the test suite");
  const tarballDirectory = mkdtempSync(join(tmpdir(), "coinblink-gef-package-"));
  t.after(() => rmSync(tarballDirectory, { recursive: true, force: true }));
  const packed = spawnSync(process.execPath, [
    npmCli,
    "pack",
    `${expectedPackage}@${expectedVersion}`,
    "--pack-destination",
    tarballDirectory,
    "--ignore-scripts",
    "--json",
  ], { cwd: root, encoding: "utf8", timeout: 60_000, windowsHide: true });
  assert.equal(packed.error, undefined, "npm pack must start");
  assert.equal(packed.status, 0, `npm pack exited ${packed.status}`);
  const packedMetadata = JSON.parse(packed.stdout);
  const tarball = await readFile(join(tarballDirectory, packedMetadata[0].filename));
  assert.equal(createHash("sha256").update(tarball).digest("hex"), expectedTarballSha256);
  assert.equal(createHash("sha512").update(tarball).digest("hex"), expectedSha512Hex);

  const registryEvidence = JSON.parse(await readFile(join(evidence, "CB-BOOT-001-npm-registry-keys.json"), "utf8"));
  const attestations = JSON.parse(await readFile(join(evidence, "CB-BOOT-001-npm-attestations.json"), "utf8"));
  const publish = attestations.attestations.find((item) => item.predicateType === "https://github.com/npm/attestation/tree/main/specs/publish/v0.1");
  const provenance = attestations.attestations.find((item) => item.predicateType === "https://slsa.dev/provenance/v1");
  assert.ok(publish, "npm signed publish attestation must be present");
  assert.ok(provenance, "SLSA provenance must be present");

  const publishStatement = JSON.parse(Buffer.from(publish.bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  const provenanceStatement = JSON.parse(Buffer.from(provenance.bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  for (const statement of [publishStatement, provenanceStatement]) {
    assert.equal(statement.subject[0].name, "pkg:npm/%40gef-bootstrap/cli@1.1.2");
    assert.equal(statement.subject[0].digest.sha512, expectedSha512Hex);
  }
  assert.equal(publishStatement.predicate.name, expectedPackage);
  assert.equal(publishStatement.predicate.version, expectedVersion);
  assert.equal(publishStatement.predicate.registry, "https://registry.npmjs.org");

  const build = provenanceStatement.predicate.buildDefinition;
  assert.equal(build.externalParameters.workflow.repository, "https://github.com/KayzenRoot/gef-bootstrap");
  assert.equal(build.externalParameters.workflow.ref, "refs/tags/v1.1.2");
  assert.equal(build.externalParameters.workflow.path, ".github/workflows/v11-publish.yml");
  assert.ok(build.resolvedDependencies.some((dependency) =>
    dependency.uri === "git+https://github.com/KayzenRoot/gef-bootstrap@refs/tags/v1.1.2" &&
    dependency.digest.gitCommit === expectedCommit));

  const registryKeyId = publish.bundle.verificationMaterial.publicKey.hint;
  const registryKey = registryEvidence.keys.find((key) => key.keyid === registryKeyId);
  assert.ok(registryKey, "npm publish attestation key must be pinned");
  const pemKey = `-----BEGIN PUBLIC KEY-----\n${registryKey.key}\n-----END PUBLIC KEY-----`;
  const trustCache = mkdtempSync(join(tmpdir(), "coinblink-sigstore-trust-"));
  t.after(() => rmSync(trustCache, { recursive: true, force: true }));

  await verifySigstore(publish.bundle, {
    keySelector: () => pemKey,
    tufCachePath: trustCache,
  });
,
  };
  await verifySigstore(provenance.bundle, {
    ...expectedSigner,
    tufCachePath: trustCache,
  });

  // Both negative tests must fail cryptographic identity verification, not
  // merely compare untrusted predicates embedded in the signed statement.
  await assert.rejects(
    async () => verifySigstore(provenance.bundle, {
      ...expectedSigner,
      certificateIssuer: "https://accounts.google.com",
      tufCachePath: trustCache,
    }),
    "provenance signed by an unexpected issuer must be rejected",
  );
  await assert.rejects(
    async () => verifySigstore(provenance.bundle, {
      ...expectedSigner,
      certificateIdentityURI: String.raw`^https://github\\.com/other-org/other-repo/\\.github/workflows/publish\\.yml@refs/tags/v1\\.1\\.2import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { verify as verifySigstore } from "sigstore";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const evidence = join(root, ".engineering", "evidence");
const expectedPackage = "@gef-bootstrap/cli";
const expectedVersion = "1.1.2";
const expectedCommit = "af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82";
const expectedTarballSha256 = "331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97";

test("the official GEF tarball and npm SLSA provenance match the pinned source", async (t) => {
  const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  const locked = lock.packages[`node_modules/${expectedPackage}`];
  assert.equal(locked.version, expectedVersion);
  assert.equal(locked.resolved, "https://registry.npmjs.org/@gef-bootstrap/cli/-/cli-1.1.2.tgz");

  const integrity = locked.integrity.match(/^sha512-(.+)$/)?.[1];
  assert.ok(integrity, "lockfile must pin SHA-512 integrity");
  const expectedSha512Hex = Buffer.from(integrity, "base64").toString("hex");

  const npmCli = process.env.npm_execpath;
  assert.ok(npmCli, "npm must expose its CLI path while running the test suite");
  const tarballDirectory = mkdtempSync(join(tmpdir(), "coinblink-gef-package-"));
  t.after(() => rmSync(tarballDirectory, { recursive: true, force: true }));
  const packed = spawnSync(process.execPath, [
    npmCli,
    "pack",
    `${expectedPackage}@${expectedVersion}`,
    "--pack-destination",
    tarballDirectory,
    "--ignore-scripts",
    "--json",
  ], { cwd: root, encoding: "utf8", timeout: 60_000, windowsHide: true });
  assert.equal(packed.error, undefined, "npm pack must start");
  assert.equal(packed.status, 0, `npm pack exited ${packed.status}`);
  const packedMetadata = JSON.parse(packed.stdout);
  const tarball = await readFile(join(tarballDirectory, packedMetadata[0].filename));
  assert.equal(createHash("sha256").update(tarball).digest("hex"), expectedTarballSha256);
  assert.equal(createHash("sha512").update(tarball).digest("hex"), expectedSha512Hex);

  const registryEvidence = JSON.parse(await readFile(join(evidence, "CB-BOOT-001-npm-registry-keys.json"), "utf8"));
  const attestations = JSON.parse(await readFile(join(evidence, "CB-BOOT-001-npm-attestations.json"), "utf8"));
  const publish = attestations.attestations.find((item) => item.predicateType === "https://github.com/npm/attestation/tree/main/specs/publish/v0.1");
  const provenance = attestations.attestations.find((item) => item.predicateType === "https://slsa.dev/provenance/v1");
  assert.ok(publish, "npm signed publish attestation must be present");
  assert.ok(provenance, "SLSA provenance must be present");

  const publishStatement = JSON.parse(Buffer.from(publish.bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  const provenanceStatement = JSON.parse(Buffer.from(provenance.bundle.dsseEnvelope.payload, "base64").toString("utf8"));
  for (const statement of [publishStatement, provenanceStatement]) {
    assert.equal(statement.subject[0].name, "pkg:npm/%40gef-bootstrap/cli@1.1.2");
    assert.equal(statement.subject[0].digest.sha512, expectedSha512Hex);
  }
  assert.equal(publishStatement.predicate.name, expectedPackage);
  assert.equal(publishStatement.predicate.version, expectedVersion);
  assert.equal(publishStatement.predicate.registry, "https://registry.npmjs.org");

  const build = provenanceStatement.predicate.buildDefinition;
  assert.equal(build.externalParameters.workflow.repository, "https://github.com/KayzenRoot/gef-bootstrap");
  assert.equal(build.externalParameters.workflow.ref, "refs/tags/v1.1.2");
  assert.equal(build.externalParameters.workflow.path, ".github/workflows/v11-publish.yml");
  assert.ok(build.resolvedDependencies.some((dependency) =>
    dependency.uri === "git+https://github.com/KayzenRoot/gef-bootstrap@refs/tags/v1.1.2" &&
    dependency.digest.gitCommit === expectedCommit));

  const registryKeyId = publish.bundle.verificationMaterial.publicKey.hint;
  const registryKey = registryEvidence.keys.find((key) => key.keyid === registryKeyId);
  assert.ok(registryKey, "npm publish attestation key must be pinned");
  const pemKey = `-----BEGIN PUBLIC KEY-----\n${registryKey.key}\n-----END PUBLIC KEY-----`;
  const trustCache = mkdtempSync(join(tmpdir(), "coinblink-sigstore-trust-"));
  t.after(() => rmSync(trustCache, { recursive: true, force: true }));

  await verifySigstore(publish.bundle, {
    keySelector: () => pemKey,
    tufCachePath: trustCache,
  });
,
      tufCachePath: trustCache,
    }),
    "provenance signed by an unexpected workflow must be rejected",
  );
});
