import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  addLocalSource, insertLocalCitation, removeLocalSource, listLocalSources,
} from "../../../src/modules/CB-M05/local-source-notes.mjs";
import {
  addLocalClaimReview, listLocalClaimReviews, markLocalClaimReview,
} from "../../../src/modules/CB-M05/local-claim-reviews.mjs";
import { analyzeLocalCitationHygiene } from "../../../src/modules/CB-M05/local-citation-audit.mjs";
import { evaluateLocalEditorialChecklist } from "../../../src/modules/CB-M05/local-editorial-checklist.mjs";
import { measureLocalDraft } from "../../../src/modules/CB-M05/local-draft-metrics.mjs";
import { findInLocalDraft, replaceAllInLocalDraft } from "../../../src/modules/CB-M05/local-draft-search.mjs";
import {
  prepareLocalDraft, draftToMarkdown, parseLocalDraftMarkdown,
} from "../../../public/m05-draft-preview.js";

const statement = "The briefing mentions a 23% change, which needs independent review.";
const primary = "https://example.org/primary?year=2026&edition=2";
const secondary = "https://example.net/secondary";

function makeArticle(body) {
  return {
    title: "CoinBlink local editorial flow",
    author: "Demo editor",
    source: "https://example.org/original",
    summary: "A complete synthetic article to test the editor's local workflow.",
    body,
  };
}

test("P0 workflow: draft, source, citation, claim, export and import preserve exactly the same body", () => {
  let body = "Draft text for CoinBlink. " + statement;
  const savedOne = addLocalSource(body, "Primary synthetic reference", primary);
  body = savedOne.value;
  body = addLocalSource(body, "Secondary synthetic reference", secondary).value;
  const next = insertLocalCitation(body, savedOne.reference.id, 29);
  body = next.value;
  const claim = addLocalClaimReview(body, statement, savedOne.reference.id);
  body = claim.value;

  const before = listLocalSources(body);
  assert.equal(before.length, 2);
  assert.equal(before.find((source) => source.id === 1)?.cited, 1);
  assert.equal(before.find((source) => source.id === 2)?.cited, 0);

  const review = listLocalClaimReviews(body);
  assert.equal(review.length, 1);
  assert.equal(review[0].sourceId, 1);
  assert.equal(review[0].state, "NEEDS_HUMAN_REVIEW");
  assert.equal(review[0].sourceAvailable, true);

  const issues = analyzeLocalCitationHygiene(body);
  assert.equal(issues.malformedNotes, false);
  assert.deepEqual(issues.missingDefinitionIds, []);
  assert.deepEqual(issues.unusedSourceIds, [2]);
  assert.equal(issues.citedSources, 1);

  const prepared = prepareLocalDraft(makeArticle(body));
  assert.equal(prepared.ready, true);
  const markdown = draftToMarkdown(prepared);
  const reopened = parseLocalDraftMarkdown(markdown);
  assert.deepEqual(reopened, prepared);
  assert.equal(reopened.body, body);
  assert.deepEqual(listLocalSources(reopened.body), before);
  assert.deepEqual(listLocalClaimReviews(reopened.body), review);
  assert.deepEqual(analyzeLocalCitationHygiene(reopened.body).unusedSourceIds, [2]);
  assert.equal(measureLocalDraft(reopened.body).words > 0, true);
});

test("P0 workflow: editing the prose keeps source IDs, references and pending claim notes", () => {
  const seed = "Editorial notes start here. " + statement;
  let body = addLocalSource(seed, "Original news source", primary).value;
  body = insertLocalCitation(body, 1, 0).value;
  body = addLocalClaimReview(body, statement, 1).value;
  const selected = findInLocalDraft(body, "Editorial notes");
  assert.equal(selected.count, 1);
  const replaced = replaceAllInLocalDraft(body, "Editorial notes", "Reported context");
  assert.equal(replaced.replacements, 1);
  assert.equal(listLocalSources(replaced.value)[0].cited, 1);
  assert.equal(listLocalClaimReviews(replaced.value)[0].state, "NEEDS_HUMAN_REVIEW");

  const revised = markLocalClaimReview(replaced.value, 1, true);
  assert.equal(listLocalClaimReviews(revised)[0].state, "REVIEW_NOTED_NOT_VERIFIED");
  assert.equal(analyzeLocalCitationHygiene(revised).status, "LOCAL_HEURISTIC_ONLY_NOT_FACT_CHECKED");
  assert.equal(prepareLocalDraft(makeArticle(revised)).ready, true);
  assert.equal(parseLocalDraftMarkdown(draftToMarkdown(prepareLocalDraft(makeArticle(revised)))).body, revised);
});

test("P0 workflow: removing a source preserves a human review item but clearly invalidates its linkage", () => {
  const seeded = addLocalSource("Report to review before publication.", "Sample publisher", primary).value;
  const withClaim = addLocalClaimReview(seeded, statement, 1).value;
  const removed = removeLocalSource(withClaim, 1);
  assert.equal(listLocalSources(removed).length, 0);
  assert.equal(listLocalClaimReviews(removed)[0].sourceAvailable, false);
  assert.equal(listLocalClaimReviews(removed)[0].sourceId, 1);
  assert.match(removed, /NEEDS_HUMAN_REVIEW/u);
  assert.doesNotMatch(removed, /https:\/\/example\.org\/primary/u);
  const roundTrip = parseLocalDraftMarkdown(draftToMarkdown(prepareLocalDraft(makeArticle(removed))));
  assert.equal(roundTrip.body, removed);
});

test("P0 workflow: all drafting preparation checkboxes remain mere self-attestations", () => {
  const draft = makeArticle("An original article body with more than forty characters.");
  const result = evaluateLocalEditorialChecklist(draft, {
    factReview: true, sourceAttribution: true, ownerPacket: true,
  });
  assert.equal(result.completed, result.total);
  assert.equal(result.status, "LOCAL_PREPARATION_ONLY_NOT_VERIFIED_OR_APPROVED");
  assert.match(result.status, /NOT_VERIFIED_OR_APPROVED/u);
});

test("P0 module boundaries: no module-level persistence or remote facts are introduced", () => {
  for (const file of [
    "local-claim-reviews.mjs", "local-citation-audit.mjs",
    "local-draft-metrics.mjs", "local-draft-search.mjs",
    "local-editorial-checklist.mjs", "local-source-notes.mjs",
  ]) {
    const code = readFileSync(resolve("src/modules/CB-M05", file), "utf8");
    assert.doesNotMatch(code, /\b(?:localStorage|sessionStorage|document\.cookie|navigator\.sendBeacon)\b/u, file);
    assert.doesNotMatch(code, /\bfetch\s*\(/u, file);
  }
});
