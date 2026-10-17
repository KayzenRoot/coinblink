import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("../../../src/modules/CB-M01/GoldenHome.astro", import.meta.url), "utf8");
const stylesheet = await readFile(new URL("../../../src/modules/CB-M01/golden-home.css", import.meta.url), "utf8");
const provenance = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/lightning-sprites-provenance.json", import.meta.url), "utf8"));
const promptEvidence = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/lightning-sprites-v2/sprite-prompts.json", import.meta.url), "utf8"));
const motionProvenance = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/hero-cinematic-blender-provenance.json", import.meta.url), "utf8"));

test("seven generated lightning stills remain inventoried as Blender motion inputs, not browser animation frames", async () => {
  assert.equal(provenance.schemaVersion, 1);
  assert.equal(provenance.workOrder, "CB-M01-WO-001");
  assert.equal(provenance.assetId, "CB-M01-DEMO-LIGHTNING-VFX");
  assert.equal(provenance.origin, "OPENAI_IMAGE_GENERATION");
  assert.equal(provenance.assetClass, "DECORATIVE_OVERLAY_INPUT_TO_BLENDER_MOTION");
  assert.equal(provenance.promptWorkflowEvidence, ".engineering/evidence/CB-M01-WO-001/lightning-sprites-v2/sprite-prompts.json");
  assert.equal(provenance.frames.length, 7);
  assert.equal(promptEvidence.spriteSet.length, 7);

  let totalBytes = 0;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  for (const frame of provenance.frames) {
    const overlayBytes = await readFile(new URL("../../../" + frame.packagedSourcePath, import.meta.url));
    const evidenceBytes = await readFile(new URL("../../../" + frame.evidencePath, import.meta.url));
    const matchingPrompt = promptEvidence.spriteSet.find((item) => item.filename === frame.filename);

    assert.ok(matchingPrompt?.prompt, "missing image generation prompt: " + frame.filename);
    assert.ok(overlayBytes.subarray(0, 8).equals(signature), "invalid PNG signature: " + frame.filename);
    assert.equal(overlayBytes.toString("ascii", 12, 16), "IHDR");
    assert.equal(overlayBytes.readUInt32BE(8), 13);
    assert.deepEqual([overlayBytes.readUInt32BE(16), overlayBytes.readUInt32BE(20)], frame.dimensions);
    assert.equal(overlayBytes[25], 6, "overlay must retain RGBA alpha: " + frame.filename);
    assert.equal(overlayBytes.length, frame.bytes);
    assert.equal(createHash("sha256").update(overlayBytes).digest("hex"), frame.sha256);
    assert.ok(overlayBytes.equals(evidenceBytes), "overlay must equal its evidence source: " + frame.filename);
    assert.equal(frame.runtimePath, null, "generated overlays are not direct browser runtime assets");
    assert.equal(frame.role, "DECORATIVE_OVERLAY_INPUT_TO_BLENDER_MOTION");
    assert.doesNotMatch(component, new RegExp(frame.filename.replaceAll(".", "\\."), "u"));
    totalBytes += overlayBytes.length;
  }

  assert.equal(totalBytes, provenance.aggregate.sourceAssetBytes);
  assert.equal(provenance.aggregate.runtimeBytes, 0, "sprite PNGs must not be delivered as browser animation frames");
  assert.equal(provenance.runtime.browserAnimation, false);
  assert.equal(provenance.runtime.externalRequests, false);
  assert.equal(provenance.runtime.blenderMotionProject, provenance.motionProject.path);
  assert.equal(provenance.motionProject.absoluteReferences, false);
  assert.equal(motionProvenance.animationProject.absoluteReferences, false);
  assert.equal(motionProvenance.animationProject.imageDependenciesPacked, true);
});

test("normal motion uses the local Blender derivative and reduced motion selects the static master", async () => {
  const mediaScript = await readFile(new URL("../../../src/modules/CB-M01/r26-media-selection.js", import.meta.url), "utf8");
  assert.ok(component.includes('<source media="(prefers-reduced-motion: no-preference)" type="image/webp" data-motion-srcset={heroCinematicMotionWebp.src}'));
  assert.ok(component.includes('<source type="image/webp" data-static-srcset={heroCinematicOriginalWebp.src}'));
  assert.ok(component.includes("<script is:inline src={r26MediaSelectionUrl}></script>"));
  assert.ok(mediaScript.includes('motionSource.setAttribute("srcset", motionSrcset)'));
  assert.ok(mediaScript.includes('staticSource.setAttribute("srcset", staticSrcset)'));
  assert.match(component, /<img src=\{heroCinematicOriginalPng\.src\} width="1774" height="887" alt=""/u);
  assert.match(component, /<div class="hero-scene" aria-hidden="true">/u);
  assert.doesNotMatch(component, /hero-lightning|lightning-sprites\//u);
  assert.doesNotMatch(stylesheet, /@keyframes cb-lightning|hero-lightning-frame/u);
  assert.match(stylesheet, /@media \(prefers-reduced-motion:\s*reduce\)/u);
});

test("Blender provenance derives the motion from the static image pipeline without granting release", async () => {
  const staticProvenance = JSON.parse(await readFile(new URL("../../../.engineering/evidence/CB-M01-WO-001/hero-cinematic-imagegen-provenance.json", import.meta.url), "utf8"));
  const renderedMotion = await readFile(new URL("../../../src/modules/CB-M01/hero-cinematic-motion.webp", import.meta.url));

  assert.equal(motionProvenance.animationProject.origin, "BLENDER_MOTION_DERIVATIVE");
  assert.equal(motionProvenance.animationProject.staticMasterPath, staticProvenance.outputs.png.path);
  assert.equal(motionProvenance.animationProject.staticMasterSha256, staticProvenance.outputs.png.sha256);
  assert.equal(motionProvenance.animationProject.runtimeOutput.path, "src/modules/CB-M01/hero-cinematic-motion.webp");
  assert.equal(motionProvenance.animationProject.runtimeOutput.bytes, renderedMotion.length);
  assert.equal(createHash("sha256").update(renderedMotion).digest("hex"), motionProvenance.animationProject.runtimeOutput.sha256);
  assert.equal(motionProvenance.rights.ownerVisualApproval, false);
  assert.equal(motionProvenance.rights.commercialPublicationAllowed, false);
  assert.equal(motionProvenance.rights.publicationPermission, false);
});
