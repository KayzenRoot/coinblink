import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("../../../../", import.meta.url)));
const evidenceRoot = join(repoRoot, ".engineering", "evidence", "CB-M01-WO-001", "r27-browser-qa");
const reportPath = join(evidenceRoot, "R27_BROWSER_PERFORMANCE_VISUAL_QA.json");
const origin = (process.env.CB_R27_BASE_URL || "http://127.0.0.1:3001").replace(/\/+$/u, "");
const report = JSON.parse(await readFile(reportPath, "utf8"));
assert.equal(report.status, "R27_DEMO_QA_PASS", "the browser and performance run must pass before validating Docker-served asset bytes");

const sourceFiles = new Map(report.assetHashes.map((asset) => [asset.path, asset]));
const candidates = new Set();
for (const check of report.visualChecks) {
  candidates.add(check.hero.path);
  for (const asset of check.staticImages) candidates.add(asset.path);
}
for (const item of report.selectionMatrix) candidates.add(item.path);
for (const item of report.failureMatrix) candidates.add(item.hero.path);
for (const scenario of report.performance) for (const repeat of scenario.repeats) candidates.add(repeat.heroPath);

function sourceForServedPath(path) {
  const extension = path.endsWith(".png") ? "png" : path.endsWith(".webp") ? "webp" : null;
  assert.ok(extension, "browser media path must be PNG or WebP: " + path);
  const stem = ["hero-cinematic-motion", "hero-cinematic-original", "promo", "bitcoin", "ethereum", "policy", "ecosystem"]
    .find((candidate) => path.includes(candidate));
  assert.ok(stem, "served media path must map to a known R26 asset: " + path);
  const sourcePath = stem.startsWith("hero-cinematic-")
    ? "src/modules/CB-M01/" + stem + "." + extension
    : "src/modules/CB-M01/assets/r26/" + stem + "." + extension;
  const source = sourceFiles.get(sourcePath);
  assert.ok(source, "served media must have an exact source inventory record: " + sourcePath);
  return source;
}

const results = [];
for (const path of candidates) {
  const source = sourceForServedPath(path);
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15_000), cache: "no-store" });
  assert.equal(response.status, 200, "Docker-served asset must return HTTP 200: " + path);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  assert.equal(sha256, source.sha256, "Docker-served asset bytes must exactly match the source hash: " + path);
  assert.equal(bytes.length, source.bytes, "Docker-served asset length must exactly match the source bytes: " + path);
  results.push({
    urlPath: path,
    sourcePath: source.path,
    bytes: bytes.length,
    servedSha256: sha256,
    sourceSha256: source.sha256,
    matchesSource: true,
  });
}

report.servedAssetHashes = {
  status: "VERIFIED",
  previewOrigin: origin,
  checkedAt: new Date().toISOString(),
  method: "Node 22 fetched each distinct image path from the local Docker preview; response SHA-256 and byte length were compared with the checkout inventory.",
  assetCount: results.length,
  assets: results,
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ status: report.servedAssetHashes.status, assetCount: results.length, assets: results }, null, 2));
