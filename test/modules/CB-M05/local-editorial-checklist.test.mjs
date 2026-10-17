import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { evaluateLocalEditorialChecklist } from "../../../src/modules/CB-M05/local-editorial-checklist.mjs";

const draft = {
  title: "CoinBlink news summary",
  summary: "A detailed summary of the public development update.",
  body: "This original article draft reports several events and needs independent confirmation.",
  source: "https://example.com/report",
};

test("empty and malformed inputs are never certified", () => {
  for (const input of [undefined, null, {}, { title: 123, body: [] }]) {
    const result = evaluateLocalEditorialChecklist(input);
    assert.equal(result.total, 7);
    assert.equal(result.completed, 0);
    assert.equal(result.status, "LOCAL_PREPARATION_ONLY_NOT_VERIFIED_OR_APPROVED");
    assert.ok(Object.isFrozen(result));
    assert.ok(Object.isFrozen(result.items));
    assert.ok(result.items.every((item) => Object.isFrozen(item)));
  }
});

test("draft completeness checks are distinct from human review assertions", () => {
  const result = evaluateLocalEditorialChecklist(draft);
  assert.equal(result.completed, 4);
  assert.deepEqual(result.items.filter((item) => item.done).map((item) => item.id), [
    "title", "summary", "body", "source",
  ]);
  assert.equal(result.status, "LOCAL_PREPARATION_ONLY_NOT_VERIFIED_OR_APPROVED");
  const full = evaluateLocalEditorialChecklist(draft, {
    factReview: true, sourceAttribution: true, ownerPacket: true,
  });
  assert.equal(full.completed, 7);
  assert.match(full.status, /NOT_VERIFIED_OR_APPROVED/u);
});

test("HTTPS syntax is necessary but never proof of source truth or existence", () => {
  for (const url of ["http://example.com", "https://user:pass@example.com", "https://example.com invalid",
    "https://example.com.", "https://localhost/report", "javascript:alert(1)"]) {
    const result = evaluateLocalEditorialChecklist({ ...draft, source: url });
    assert.equal(result.items.find((item) => item.id === "source")?.done, false, url);
  }
  assert.equal(evaluateLocalEditorialChecklist(draft).items.find((item) => item.id === "source")?.done, true);
});

test("only exact boolean true counts as a completed manual task", () => {
  const result = evaluateLocalEditorialChecklist(draft, {
    factReview: "true", sourceAttribution: 1, ownerPacket: true,
  });
  assert.equal(result.completed, 5);
  assert.equal(result.items.filter((item) => item.id === "factReview")[0].done, false);
  assert.equal(result.items.find((item) => item.id === "sourceAttribution").done, false,
    "a non-boolean value cannot silently approve source attribution");
});

test("component is separate from the existing editor and uses a same-origin CSP-safe module", () => {
  const component = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  const module = readFileSync(resolve("src/modules/CB-M05/local-editorial-checklist.mjs"), "utf8");
  const formStart = component.indexOf('data-m05-local-editor>');
  const panelStart = component.indexOf('data-m05-editorial-checklist');
  const editorEnd = component.indexOf('</section>', component.indexOf('m05-draft-notice'));
  assert.ok(formStart > -1 && editorEnd > formStart && panelStart > editorEnd);
  for (const item of ["fact-review", "source-attribution", "owner-packet", "score", "findings", "note"]) {
    assert.match(component, new RegExp("data-m05-editorial-" + item, "u"));
  }
  assert.match(component, /src=\{editorialScriptUrl\}/u);
  assert.match(component, /\?url&no-inline/u);
  assert.match(component, /aria-live="polite"/u);
  assert.match(module, /MutationObserver\(clearManual\)/u);
  assert.match(module, /textContent/u);
  assert.doesNotMatch(module, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon|innerHTML)\b/u);
  assert.doesNotMatch(component, /<script>\s*import /u);
});
