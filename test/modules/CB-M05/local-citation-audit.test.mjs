import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  analyzeLocalCitationHygiene, LOCAL_CITATION_AUDIT_STATUS, MAX_CITATION_HINTS,
} from "../../../src/modules/CB-M05/local-citation-audit.mjs";
import {
  addLocalSource, insertLocalCitation, LOCAL_SOURCE_HEADING,
} from "../../../src/modules/CB-M05/local-source-notes.mjs";
import {
  prepareLocalDraft, draftToMarkdown, parseLocalDraftMarkdown,
} from "../../../public/m05-draft-preview.js";

const prose = "This independent CoinBlink article needs human review and attribution.";

test("detects unused reference notes, without counting their definitions as citations", () => {
  const one = addLocalSource(prose, "Publisher A", "https://a.example/story");
  const two = addLocalSource(one.value, "Publisher B", "https://b.example/story");
  const result = analyzeLocalCitationHygiene(two.value);
  assert.equal(result.status, LOCAL_CITATION_AUDIT_STATUS);
  assert.equal(result.sourceCount, 2);
  assert.equal(result.citedSources, 0);
  assert.deepEqual(result.unusedSourceIds, [1, 2]);
  assert.deepEqual(result.missingDefinitionIds, []);
  assert.deepEqual(result.hints, []);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.unusedSourceIds));
});

test("detects cited, unused and orphaned markers, excluding the entire appendix", () => {
  const one = addLocalSource(prose + " [^cb3] [^cb13]", "Publisher A", "https://a.example/report");
  const two = addLocalSource(one.value, "Publisher B", "https://b.example/report");
  const marked = insertLocalCitation(two.value, 1, 4);
  const checked = analyzeLocalCitationHygiene(marked.value);
  assert.equal(checked.sourceCount, 2);
  assert.equal(checked.citedSources, 1);
  assert.deepEqual(checked.missingDefinitionIds, [3, 13]);
  assert.deepEqual(checked.unusedSourceIds, [2]);
});

test("local citations and notes survive Markdown v2 round trip without new draft format", () => {
  const source = addLocalSource(prose, "Data publisher", "https://data.example/report?x=1&y=2");
  const linked = insertLocalCitation(source.value, 1, 20);
  const prepared = prepareLocalDraft({
    title: "Citations in CoinBlink article",
    author: "Editor",
    source: "https://publisher.example/original",
    summary: "The draft includes independently inspectable references and a human review queue.",
    body: linked.value,
  });
  assert.equal(prepared.ready, true);
  const recovered = parseLocalDraftMarkdown(draftToMarkdown(prepared));
  assert.deepEqual(recovered, prepared);
  const result = analyzeLocalCitationHygiene(recovered.body);
  assert.deepEqual(result.missingDefinitionIds, []);
  assert.deepEqual(result.unusedSourceIds, []);
  assert.equal(result.citedSources, 1);
});

test("review cues are explicit heuristics, not automated verification", () => {
  const text = "TODO verify exchange statement\n\nThe token moved 23% in one session."
    + "\n\nR$ 500 million reported, needs a source.\n\nThis is merely explanatory text.";
  const result = analyzeLocalCitationHygiene(text);
  assert.equal(result.totalHints, 3);
  assert.deepEqual(result.hints.map((hint) => hint.kind), [
    "explicit_review_marker", "numeric_claim_without_local_citation",
    "numeric_claim_without_local_citation",
  ]);
  assert.equal(result.status, "LOCAL_HEURISTIC_ONLY_NOT_FACT_CHECKED");
  assert.ok(result.hints.every((hint) => Object.isFrozen(hint)));
  const cited = analyzeLocalCitationHygiene("The token moved 23%.[^cb1]");
  assert.equal(cited.totalHints, 0);
  assert.deepEqual(cited.missingDefinitionIds, [1]);
  assert.equal(analyzeLocalCitationHygiene("No numbers and no review tags.").totalHints, 0);
});

test("heuristics never inspect the source-note appendix for numeric values", () => {
  const source = addLocalSource(prose, "Coin 99 report", "https://example.org/data?value=42%25");
  const audit = analyzeLocalCitationHygiene(source.value);
  assert.equal(audit.totalHints, 0);
  assert.deepEqual(audit.unusedSourceIds, [1]);
});

test("the output caps displayed excerpts without hiding the true number of signals", () => {
  const text = Array.from({ length: MAX_CITATION_HINTS + 5 }, (_, i) => (
    "TODO verify paragraph " + i + "."
  )).join("\n\n");
  const result = analyzeLocalCitationHygiene(text);
  assert.equal(result.totalHints, MAX_CITATION_HINTS + 5);
  assert.equal(result.hints.length, MAX_CITATION_HINTS);
  assert.ok(result.hints.every((hint) => hint.excerpt.length <= 120));
  assert.ok(Object.isFrozen(result.hints));
});

test("malformed source-note appendix and oversized inputs do not produce green clearance", () => {
  const note = addLocalSource(prose, "Original source", "https://example.net/report");
  assert.equal(analyzeLocalCitationHygiene(note.value.replace("[^cb1]:", "[^cb1] -")).malformedNotes, true);
  assert.equal(analyzeLocalCitationHygiene(prose + " " + LOCAL_SOURCE_HEADING).malformedNotes, true);
  assert.equal(analyzeLocalCitationHygiene("x".repeat(12001)).status, "INVALID_LOCAL_DRAFT");
  assert.equal(analyzeLocalCitationHygiene(null).malformedNotes, true);
  assert.equal(analyzeLocalCitationHygiene("").malformedNotes, false);
});

test("review dashboard remains outside editor fields, local, CSP-safe and text-only", () => {
  const component = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  const module = readFileSync(resolve("src/modules/CB-M05/local-citation-audit.mjs"), "utf8");
  const panel = component.indexOf("data-m05-citation-audit");
  const editorEnd = component.indexOf("</section>", component.indexOf("m05-draft-notice"));
  assert.ok(editorEnd > 0 && panel > editorEnd);
  for (const key of ["count", "findings", "status"]) {
    assert.match(component, new RegExp("data-m05-audit-" + key, "u"));
  }
  assert.match(component, /src=\{auditScriptUrl\}/u);
  assert.match(component, /\?url&no-inline/u);
  assert.match(module, /textContent/u);
  assert.match(module, /new MutationObserver\(render\)/u);
  assert.doesNotMatch(module, /\\bimport\\s+(?:\\{|\\*|["'])/u, "URL-served browser module must not load unresolved relative imports");
  assert.match(module, /parseSourceNotes/u);
  assert.doesNotMatch(module, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon|innerHTML)\b/u);
  assert.doesNotMatch(component, /<script>\s*import /u);
});
