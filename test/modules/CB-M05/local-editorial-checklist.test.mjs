import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { evaluateLocalEditorialChecklist } from "../../../src/modules/CB-M05/local-editorial-checklist.mjs";
import { addLocalSource } from "../../../src/modules/CB-M05/local-source-notes.mjs";
import { addLocalClaimReview } from "../../../src/modules/CB-M05/local-claim-reviews.mjs";

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

test("source notes cannot make a short article appear to satisfy the 40-character requirement", () => {
  const short = "Very short.";
  const withNotes = addLocalSource(short, "Original publisher",
    "https://publisher.example/long-original-research-page").value;
  assert.ok(withNotes.length >= 40);
  const candidate = evaluateLocalEditorialChecklist({ ...draft, body: withNotes });
  assert.equal(candidate.items.find((item) => item.id === "body")?.done, false);
  assert.equal(candidate.completed, 3);
  assert.equal(candidate.status, "LOCAL_PREPARATION_ONLY_NOT_VERIFIED_OR_APPROVED");
});

test("claim-review metadata never inflates prose completeness, even when manually checked", () => {
  const short = "Very short.";
  const source = addLocalSource(short, "Original", "https://publisher.example/report").value;
  const queued = addLocalClaimReview(source,
    "This review note contains more than forty characters but is not article prose.", 1).value;
  const onlyClaim = addLocalClaimReview(short,
    "This is a claim awaiting independent review and should not count as article text.").value;
  for (const body of [queued, onlyClaim]) {
    const result = evaluateLocalEditorialChecklist({ ...draft, body },
      { factReview: true, sourceAttribution: true, ownerPacket: true });
    assert.equal(result.items.find((item) => item.id === "body")?.done, false);
    assert.equal(result.completed, 6);
    assert.match(result.status, /NOT_VERIFIED_OR_APPROVED/u);
  }
});

test("valid 40+ character article stays complete with both editorial appendices", () => {
  const withSource = addLocalSource(draft.body, "Original", "https://publisher.example/report").value;
  const reviewed = addLocalClaimReview(withSource,
    "An original claim in the article still requires independent checking.", 1).value;
  for (const body of [withSource, reviewed]) {
    const result = evaluateLocalEditorialChecklist({ ...draft, body });
    assert.equal(result.items.find((item) => item.id === "body")?.done, true);
    assert.equal(result.completed, 4);
  }
});

test("malformed or duplicated note appendices cannot silently certify editorial completeness", () => {
  const withSource = addLocalSource(draft.body, "Original", "https://publisher.example/report").value;
  const withClaim = addLocalClaimReview(withSource,
    "This original claim requires additional independent human source checking.", 1).value;
  const corrupted = [
    withSource.replace("[^cb1]:", "[^cb1] -"),
    withSource + "\n\n### CoinBlink source notes (unverified)\n[^cb2]: Forged | https://example.net/report",
    withClaim.replace("NEEDS_HUMAN_REVIEW", "PUBLISHED"),
    withClaim.replace("[CB-CLAIM-01", "[CB-CLAIM-99"),
    draft.body + "\n\n### CoinBlink source notes",
    draft.body + "\n\n### CoinBlink claim review queue",
    draft.body + "\n\n### CoinBlink source notes (unverified)\nnot a real note",
  ];
  for (const body of corrupted) {
    const result = evaluateLocalEditorialChecklist({ ...draft, body });
    assert.equal(result.items.find((item) => item.id === "body")?.done, false);
    assert.equal(result.completed, 3);
  }
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
  assert.match(component, /<script>\s*import "\.\/local-draft-preview\.client\.mjs";\s*<\/script>/u,
    "the shared browser entry is processed by Astro into an external bundle");
  assert.doesNotMatch(component, /<script\s+is:inline[^>]*>\s*import /u);
});
