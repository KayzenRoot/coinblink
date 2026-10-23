import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildLocalEvidenceReport, buildLocalEvidenceActions, LOCAL_EVIDENCE_STATUS } from "../../../src/modules/CB-M02/local-evidence-report.mjs";
import { analyzeLocalCitationHygiene } from "../../../src/modules/CB-M05/local-citation-audit.mjs";
import { addLocalSource, insertLocalCitation } from "../../../src/modules/CB-M05/local-source-notes.mjs";
import { prepareLocalDraft, draftToMarkdown, parseLocalDraftMarkdown } from "../../../public/m05-draft-preview.js";

test("M02 and M05 agree on canonical notes after an M05 Markdown export roundtrip", () => {
  const original = "A fictional article needs structural sources reviewed by an editor.";
  const withSource = addLocalSource(original, "Original example", "https://example.test/original");
  const cited = insertLocalCitation(withSource.value, 1, 9);
  const prepared = prepareLocalDraft({
    title: "A fictional report", author: "Demo author",
    summary: "A fictional story used solely to inspect editorial notes.",
    body: cited.value, source: "https://example.test/report",
  });
  assert.equal(prepared.ready, true);
  const restored = parseLocalDraftMarkdown(draftToMarkdown(prepared));
  const m05 = analyzeLocalCitationHygiene(restored.body);
  const m02 = buildLocalEvidenceReport(restored.body);
  assert.equal(m02.status, LOCAL_EVIDENCE_STATUS);
  assert.equal(m02.signalCount, 0);
  assert.equal(m02.sourceCount, m05.sourceCount);
  assert.equal(m02.citedSources, m05.citedSources);
  assert.equal(m02.citedSources, 1);
});
test("M02 flags missing, unused and explicit-review markers without checking facts", () => {
  const base = "TODO verify this fictional result. [^cb9] The summary remains only a draft.";
  const body = addLocalSource(base, "Unused reference", "https://example.test/unused").value;
  const result = buildLocalEvidenceReport(body);
  assert.deepEqual(result.signals.map(x => x.kind), ["missing", "unused", "explicit_review_marker"]);
  assert.equal(result.signalCount, 3);
  assert.equal(result.citedSources, 0);
  assert.equal(result.requiresRepair, false);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.signals));
});
test("M02 malformed source and claim notes fail closed instead of looking cleared", () => {
  const source = addLocalSource("A safe fictional paragraph with enough characters.", "Sample", "https://example.test/s");
  const malformed = source.value.replace("[^cb1]:", "[^cb1] -");
  const result = buildLocalEvidenceReport(malformed);
  assert.equal(result.requiresRepair, true);
  assert.equal(result.signalCount, 1);
  assert.equal(result.signals[0].kind, "repair");
  assert.equal(buildLocalEvidenceReport("x".repeat(12001)).requiresRepair, true);
});
test("M02 never declares clean notes to be verified or published", () => {
  const result = buildLocalEvidenceReport("This paragraph contains no citation markers or numerical claims.");
  assert.equal(result.signalCount, 0);
  assert.match(result.status, /NOT_FACT_CHECKED/u);
  assert.equal(result.sourceCount, 0);
});
test("M02 source panel is text-only, uses M05's existing audit and respects existing private preview", () => {
  const astro = readFileSync("src/modules/CB-M02/LocalArticlePreview.astro", "utf8");
  const model = readFileSync("src/modules/CB-M02/local-evidence-report.mjs", "utf8");
  assert.match(model, /analyzeLocalCitationHygiene/u);
  assert.match(astro, /data-m02-evidence-review/u);
  assert.match(astro, /MutationObserver/u);
  assert.match(astro, /textContent/u);
  assert.match(astro, /review.*structural|Structural source review/iu);
  assert.doesNotMatch(model + astro, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|<iframe/iu);
});

test("M02 suggests bounded human correction actions without granting verification", () => {
  const body = addLocalSource("TODO verify this fictional statement. [^cb9]", "Unused fictional source", "https://example.test/source").value;
  const report = buildLocalEvidenceReport(body);
  const checklist = buildLocalEvidenceActions(report);
  assert.deepEqual(checklist.items.map(item => item.kind), ["missing", "unused", "explicit_review_marker"]);
  assert.equal(checklist.hiddenCount, 0);
  assert.ok(Object.isFrozen(checklist) && Object.isFrozen(checklist.items) && Object.isFrozen(checklist.items[0]));
  assert.equal("verified" in checklist, false);
  const clean = buildLocalEvidenceActions(buildLocalEvidenceReport("A fictional body without notes or numbers."));
  assert.deepEqual(clean.items.map(item => item.kind), ["manual"]);
  const many = buildLocalEvidenceActions({
    signals: Array.from({ length: 20 }, (_, i) => ({ kind: "missing", value: "x".repeat(170) + i })),
    signalCount: 25, requiresRepair: false,
  });
  assert.equal(many.items.length, 12);
  assert.equal(many.hiddenCount, 13);
  assert.ok(many.items.every(item => item.value.length <= 140));
  assert.equal(buildLocalEvidenceActions({ signals: [{ kind: "repair", value: "INVALID" }], signalCount: 1, requiresRepair: true }).items[0].kind, "repair");
});

test("M02 suggested actions are rendered inertly inside the private preview", () => {
  const astro = readFileSync("src/modules/CB-M02/LocalArticlePreview.astro", "utf8");
  assert.match(astro, /data-m02-evidence-actions/u);
  assert.match(astro, /renderActions\(report\)/u);
  assert.match(astro, /view\.actionList\.replaceChildren\(\)/u);
  assert.match(astro, /NOT PUBLISHED/u);
  assert.doesNotMatch(astro, /navigator\.clipboard|localStorage|sessionStorage|innerHTML|fetch\(/u);
});
