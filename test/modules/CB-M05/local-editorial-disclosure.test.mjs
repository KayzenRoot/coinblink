import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const component = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
const expected = [
  ["m05-local-search", "Find and replace"],
  ["m05-editorial-panel", "Editorial preparation checklist"],
  ["m05-sources-panel", "Sources and citations"],
  ["m05-audit-panel", "Citation quality signals"],
  ["m05-claim-panel", "Claims requiring human review"],
];

test("native disclosure tools are collapsed by default and retain the module panels", () => {
  const matches = [...component.matchAll(/<details class="m05-tool-disclosure" data-m05-tool-disclosure="([^"]+)">/gu)];
  assert.equal(matches.length, expected.length);
  assert.deepEqual(matches.map((item) => item[1]), expected.map(([name]) => name));
  assert.doesNotMatch(component, /<details[^>]*\sopen(?:\s|=|>)/u);
  assert.equal([...component.matchAll(/<\/details>/gu)].length, expected.length);
  for (const [name, label] of expected) {
    const wrapper = '<details class="m05-tool-disclosure" data-m05-tool-disclosure="' + name + '">';
    const start = component.indexOf(wrapper);
    const sectionStart = component.indexOf('<section class="' + name + '"', start);
    const summaryStart = component.indexOf("<summary>", start);
    const summaryEnd = component.indexOf("</summary>", summaryStart);
    const sectionEnd = component.indexOf("</section>", sectionStart);
    const detailsEnd = component.indexOf("</details>", start);
    assert.ok(start >= 0 && summaryStart > start && summaryEnd < sectionStart);
    assert.ok(sectionStart > summaryEnd && sectionEnd > sectionStart && detailsEnd > sectionEnd);
    assert.match(component.slice(summaryStart, summaryEnd), new RegExp(label, "u"));
  }
});

test("original editor inputs and same-origin modules survive progressive disclosure", () => {
  const editorStart = component.indexOf('data-m05-local-editor>');
  const editorEnd = component.indexOf("</section>", editorStart);
  assert.ok(editorEnd > editorStart);
  assert.ok(component.indexOf('data-m05-tool-disclosure="m05-local-search"') > editorEnd);
  for (const selector of [
    "data-m05-draft-title", "data-m05-draft-author", "data-m05-draft-summary",
    "data-m05-draft-body", "data-m05-draft-source", "data-m05-import",
    "data-m05-source-add", "data-m05-claim-add", "data-m05-editorial-findings", "data-m05-audit-findings",
  ]) assert.ok(component.includes(selector), selector);
  for (const url of ["metricsScriptUrl", "searchScriptUrl", "editorialScriptUrl",
    "sourcesScriptUrl", "auditScriptUrl", "claimScriptUrl"]) {
    assert.ok(component.includes("src={" + url + "}"));
  }
  assert.match(component, /<script>\s*import "\.\/local-draft-preview\.client\.mjs";\s*<\/script>/u,
    "the shared browser entry is processed by Astro into an external bundle");
  assert.doesNotMatch(component, /<script\s+is:inline[^>]*>\s*import /u);
  assert.doesNotMatch(component, /\b(?:fetch\s*\(|localStorage|sessionStorage|document\.cookie)\b/u);
});

test("native summaries have visible keyboard focus and responsive labels", () => {
  assert.match(component, /\.m05-tool-disclosure\s*>\s*summary:focus-visible/u);
  assert.match(component, /\.m05-tool-disclosure\[open\]\s*>\s*summary/u);
  assert.match(component, /\.m05-tool-description/u);
  assert.doesNotMatch(component, /onclick\s*=|<button[^>]*data-m05-tool-disclosure/u);
});
