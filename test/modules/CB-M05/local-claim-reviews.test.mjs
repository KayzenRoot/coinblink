import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  MAX_LOCAL_CLAIMS, LOCAL_CLAIM_HEADING, LOCAL_CLAIM_PENDING, LOCAL_CLAIM_NOTED,
  addLocalClaimReview, formatLocalClaimSourceStatus, listLocalClaimReviews,
  markLocalClaimReview, removeLocalClaimReview,
} from "../../../src/modules/CB-M05/local-claim-reviews.mjs";
import {
  addLocalSource, listLocalSources, removeLocalSource, LOCAL_SOURCE_HEADING,
} from "../../../src/modules/CB-M05/local-source-notes.mjs";
import {
  prepareLocalDraft, draftToMarkdown, parseLocalDraftMarkdown,
} from "../../../public/m05-draft-preview.js";

const prose = "This CoinBlink article mentions a statement that still needs checking.";
const sentence = "The project reported a substantial increase that still needs independent confirmation.";

test("claim source status copy distinguishes unattached, linked and missing references", () => {
  assert.equal(formatLocalClaimSourceStatus({ sourceId: null, sourceAvailable: true }),
    "No source attached");
  assert.equal(formatLocalClaimSourceStatus({ sourceId: 2, sourceAvailable: true }),
    "Linked to [^cb2] (not checked)");
  assert.equal(formatLocalClaimSourceStatus({ sourceId: 2, sourceAvailable: false }),
    "MISSING linked reference [^cb2]");
});

test("local claim queue is empty unless an author adds an explicit claim", () => {
  assert.deepEqual(listLocalClaimReviews(prose), []);
  const { value, item } = addLocalClaimReview(prose, sentence);
  assert.equal(item.state, LOCAL_CLAIM_PENDING);
  assert.equal(item.sourceId, null);
  assert.equal(item.id, 1);
  assert.ok(value.startsWith(prose + "\n\n" + LOCAL_CLAIM_HEADING));
  assert.match(value, /\[CB-CLAIM-01 \| NEEDS_HUMAN_REVIEW \| source=none\]/u);
  const claims = listLocalClaimReviews(value);
  assert.deepEqual(claims, [{ id: 1, state: LOCAL_CLAIM_PENDING, sourceId: null,
    claim: sentence, sourceAvailable: true }]);
  assert.ok(Object.isFrozen(claims));
  assert.ok(Object.isFrozen(claims[0]));
  assert.deepEqual(removeLocalClaimReview(value, 1), prose);
});

test("source association is optional, references stay separate and survive review notes", () => {
  const first = addLocalSource(prose, "Independent A", "https://a.example/report");
  const second = addLocalSource(first.value, "Independent B", "https://b.example/report");
  const one = addLocalClaimReview(second.value, sentence, 2);
  assert.equal(one.item.id, 1);
  assert.ok(one.value.indexOf(LOCAL_CLAIM_HEADING) < one.value.indexOf(LOCAL_SOURCE_HEADING));
  assert.equal(listLocalSources(one.value).length, 2);
  assert.equal(listLocalClaimReviews(one.value)[0].sourceAvailable, true);
  assert.throws(() => addLocalClaimReview(one.value, "Another statement requires human review.", 3), RangeError);

  const noted = markLocalClaimReview(one.value, 1, true);
  const claim = listLocalClaimReviews(noted)[0];
  assert.equal(claim.state, LOCAL_CLAIM_NOTED);
  assert.equal(claim.sourceId, 2);
  assert.equal(listLocalSources(noted).length, 2);
  const pending = markLocalClaimReview(noted, 1, false);
  assert.equal(listLocalClaimReviews(pending)[0].state, LOCAL_CLAIM_PENDING);
  assert.throws(() => markLocalClaimReview(pending, 9, true), RangeError);
});

test("deleting a source visibly invalidates the attachment, not the author's claim text", () => {
  const withSource = addLocalSource(prose, "Original", "https://news.example/story");
  const added = addLocalClaimReview(withSource.value, sentence, 1);
  const noSource = removeLocalSource(added.value, 1);
  assert.equal(listLocalSources(noSource).length, 0);
  assert.deepEqual(listLocalClaimReviews(noSource).map((claim) => ({
    sourceId: claim.sourceId, sourceAvailable: claim.sourceAvailable,
  })), [{ sourceId: 1, sourceAvailable: false }]);
  assert.ok(noSource.includes(sentence));
  assert.deepEqual(removeLocalClaimReview(noSource, 1), prose);
});

test("Markdown v2 export and import preserve queue, sources and review state", () => {
  const withSource = addLocalSource(prose, "Publisher", "https://a.example/news?x=1&y=2");
  const added = addLocalClaimReview(withSource.value, sentence, 1);
  const noted = markLocalClaimReview(added.value, 1, true);
  const prepared = prepareLocalDraft({
    title: "CoinBlink claim review example",
    author: "Editor",
    source: "https://original.example/primary",
    summary: "This is a local editorial review demonstration with manually noted claims.",
    body: noted,
  });
  assert.equal(prepared.ready, true);
  const saved = draftToMarkdown(prepared);
  const recovered = parseLocalDraftMarkdown(saved);
  assert.deepEqual(recovered, prepared);
  assert.equal(recovered.body, noted);
  assert.equal(listLocalClaimReviews(recovered.body)[0].state, LOCAL_CLAIM_NOTED);
  assert.equal(listLocalSources(recovered.body).length, 1);
});

test("invalid claim text, unknown sources and malformed note blocks fail closed", () => {
  const bad = ["", "short", "bad\nnewline", "a|pipe is not permitted", "<script> hello world",
    "x".repeat(221)];
  for (const quote of bad) assert.throws(() => addLocalClaimReview(prose, quote), RangeError);
  assert.throws(() => addLocalClaimReview(prose, null), RangeError);
  assert.throws(() => addLocalClaimReview(prose, sentence, 1), RangeError);
  assert.throws(() => listLocalClaimReviews(prose + " " + LOCAL_CLAIM_HEADING), RangeError);
  const value = addLocalClaimReview(prose, sentence).value;
  assert.throws(() => listLocalClaimReviews(value.replace("NEEDS_HUMAN_REVIEW", "PUBLISHED")), RangeError);
  assert.throws(() => listLocalClaimReviews(value + "\n\nanother section"), RangeError);
  assert.throws(() => listLocalClaimReviews(value + "\n\n" + LOCAL_CLAIM_HEADING + "\n"), RangeError);
  assert.throws(() => listLocalClaimReviews("x".repeat(12001)), RangeError);
});

test("12-note limit and immutable numbering remain bounded without silent truncation", () => {
  let body = prose;
  for (let i = 0; i < MAX_LOCAL_CLAIMS; i++) {
    body = addLocalClaimReview(body, "Statement about editorial verification number " + i).value;
  }
  assert.equal(listLocalClaimReviews(body).length, 12);
  assert.throws(() => addLocalClaimReview(body, sentence), RangeError);
  assert.equal(listLocalClaimReviews(body)[11].id, 12);
  assert.equal(addLocalClaimReview(removeLocalClaimReview(body, 6), sentence).item.id, 6);
  assert.throws(() => addLocalClaimReview("x".repeat(12000), sentence), RangeError);
});

test("browser UI uses external same-origin module and text-only claims, not publication", () => {
  const ui = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  const module = readFileSync(resolve("src/modules/CB-M05/local-claim-reviews.mjs"), "utf8");
  const panel = ui.indexOf("data-m05-claim-panel");
  const editorEnd = ui.indexOf("</section>", ui.indexOf("m05-draft-notice"));
  assert.ok(editorEnd > 0 && panel > editorEnd);
  for (const name of ["input", "source", "add", "list", "count", "status"]) {
    assert.match(ui, new RegExp("data-m05-claim-" + name, "u"));
  }
  assert.match(ui, /data-m05-claim-add disabled/u);
  assert.match(ui, /src=\{claimScriptUrl\}/u);
  assert.match(ui, /\?url&no-inline/u);
  assert.match(ui, /aria-live="polite"/u);
  assert.match(module, /textContent/u);
  assert.match(module, /new MutationObserver\(render\)/u);
  assert.doesNotMatch(module, /^import /mu);
  assert.doesNotMatch(module, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon|innerHTML)\b/u);
  assert.doesNotMatch(ui, /<script>\s*import /u);
});
