import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../../../src/modules/CB-M01/GoldenHome.astro", import.meta.url), "utf8");
const stylesheet = await readFile(new URL("../../../src/modules/CB-M01/golden-home.css", import.meta.url), "utf8");
const provenance = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/lightning-sprites-provenance.json", import.meta.url), "utf8"));
const promptEvidence = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/lightning-sprites-v2/sprite-prompts.json", import.meta.url), "utf8"));

test("seven generated lightning frames are local, transparent, hashed demo assets", async () => {
  assert.equal(provenance.schemaVersion, 1);
  assert.equal(provenance.workOrder, "CB-M01-WO-001");
  assert.equal(provenance.assetId, "CB-M01-DEMO-LIGHTNING-VFX");
  assert.equal(provenance.origin, "OPENAI_IMAGE_GENERATION");
  assert.equal(provenance.promptWorkflowEvidence, ".engineering/evidence/CB-M01-WO-001/lightning-sprites-v2/sprite-prompts.json");
  assert.equal(provenance.frames.length, 7);
  assert.equal(promptEvidence.spriteSet.length, 7);

  let totalBytes = 0;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  for (const frame of provenance.frames) {
    const runtimeBytes = await readFile(new URL("../../../" + frame.runtimePath, import.meta.url));
    const evidenceBytes = await readFile(new URL("../../../" + frame.evidencePath, import.meta.url));
    const matchingPrompt = promptEvidence.spriteSet.find((item) => item.filename === frame.filename);

    assert.ok(matchingPrompt?.prompt, "missing image generation prompt: " + frame.filename);
    assert.ok(runtimeBytes.subarray(0, 8).equals(signature), "invalid PNG signature: " + frame.filename);
    assert.equal(runtimeBytes.toString("ascii", 12, 16), "IHDR");
    assert.equal(runtimeBytes.readUInt32BE(8), 13);
    assert.deepEqual([runtimeBytes.readUInt32BE(16), runtimeBytes.readUInt32BE(20)], frame.dimensions);
    assert.equal(runtimeBytes[25], 6, "frame must retain RGBA alpha: " + frame.filename);
    assert.equal(runtimeBytes.length, frame.bytes);
    assert.equal(createHash("sha256").update(runtimeBytes).digest("hex"), frame.sha256);
    assert.ok(runtimeBytes.equals(evidenceBytes), "runtime frame must equal its evidence source: " + frame.filename);
    assert.ok(component.includes(`import ${frame.importName} from "./lightning-sprites/${frame.filename}";`));
    assert.ok(component.includes(`class="hero-lightning-frame ${frame.className}" src={${frame.importName}.src}`));
    assert.ok(stylesheet.includes(`animation: ${frame.keyframeName} 6.4s linear infinite`));
    totalBytes += runtimeBytes.length;
  }

  assert.equal(totalBytes, provenance.aggregate.runtimeBytes);
  assert.ok(totalBytes <= provenance.aggregate.maxRuntimeBytes, "lightning overlay payload exceeded its recorded budget");
  assert.equal(provenance.aggregate.canvas[0], 1774);
  assert.equal(provenance.aggregate.canvas[1], 887);
  assert.equal(provenance.rights.review, "PENDING_OWNER_OR_LEGAL");
  assert.equal(provenance.rights.ownerVisualApproval, false);
  assert.equal(provenance.rights.commercialPublicationAllowed, false);
  assert.equal(provenance.runtime.externalRequests, false);
});

test("hero lightning stays decorative, timed, and respects reduced-motion preference", () => {
  const frameMarkup = component.match(/<img class="hero-lightning-frame /gu) ?? [];
  assert.equal(frameMarkup.length, 7);
  assert.match(component, /<div class="hero-lightning" aria-hidden="true">[\s\S]*?<span class="hero-lightning-flash"><\/span>[\s\S]*?<\/div>/u);
  assert.equal((component.match(/decoding="async"/gu) ?? []).length, 7);
  assert.equal((component.match(/alt=""/gu) ?? []).length >= 7, true);
  assert.match(stylesheet, /\.cb-home \.hero-lightning-frame\s*\{[\s\S]*?mix-blend-mode: screen/u);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.hero-lightning-frame--impact\s*\{\s*opacity: \.38 !important;/u);
  assert.match(stylesheet, /\.cb-home \.hero-lightning\s*\{[\s\S]*?pointer-events: none;/u);
});
