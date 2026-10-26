import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  findInLocalDraft,
  replaceAllInLocalDraft,
  replaceSelectedInLocalDraft,
  MAX_DRAFT_LENGTH,
  MAX_REPLACEMENT_LENGTH,
  MAX_SEARCH_LENGTH,
} from "../../../src/modules/CB-M05/local-draft-search.mjs";
import { addLocalSource, listLocalSources } from "../../../src/modules/CB-M05/local-source-notes.mjs";
import { addLocalClaimReview, listLocalClaimReviews } from "../../../src/modules/CB-M05/local-claim-reviews.mjs";

test("literal find handles case sensitivity, punctuation, and multiline input", () => {
  const text = "CoinBlink. coinblink. CoinBlink.";
  assert.deepEqual(findInLocalDraft(text, "CoinBlink", { caseSensitive: true }).spans, [
    { start: 0, end: 9 }, { start: 22, end: 31 },
  ]);
  assert.equal(findInLocalDraft(text, "CoinBlink").count, 3);
  assert.equal(findInLocalDraft("a.b a-b a.b", "a.b").count, 2);
  assert.equal(findInLocalDraft("a\nb a\nb", "a\nb").count, 2);
  assert.equal(findInLocalDraft("a[b] a[b]", "[b]").count, 2);
});

test("the spans are valid textarea offsets after Unicode surrogate pairs", () => {
  const body = "🙂 alpha 🙂 alpha";
  const matches = findInLocalDraft(body, "alpha").spans;
  assert.deepEqual(matches, [{ start: 3, end: 8 }, { start: 12, end: 17 }]);
  assert.equal(body.slice(matches[1].start, matches[1].end), "alpha");
  assert.ok(Object.isFrozen(findInLocalDraft(body, "alpha")));
  assert.ok(Object.isFrozen(matches));
  assert.ok(Object.isFrozen(matches[0]));
});

test("all replacements preserve literal dollar markers and don't execute patterns", () => {
  const r = replaceAllInLocalDraft("coin coin COIN", "coin", "$&_$1");
  assert.deepEqual(r, { value: "$&_$1 $&_$1 $&_$1", replacements: 3 });
  assert.deepEqual(replaceAllInLocalDraft("one ONE one", "one", "x", { caseSensitive: true }), {
    value: "x ONE x", replacements: 2,
  });
  assert.deepEqual(replaceAllInLocalDraft("<script> <script>", "<script>", "&lt;script&gt;"), {
    value: "&lt;script&gt; &lt;script&gt;", replacements: 2,
  });
  assert.ok(Object.isFrozen(r));
});

test("invalid, oversize and empty queries fail closed without dropping original text", () => {
  assert.equal(findInLocalDraft("keep", "").count, 0);
  assert.equal(findInLocalDraft("keep", "x".repeat(MAX_SEARCH_LENGTH + 1)).count, 0);
  assert.equal(findInLocalDraft("x".repeat(MAX_DRAFT_LENGTH + 1), "x").count, 0);
  assert.throws(() => replaceAllInLocalDraft("keep", "", "y"), RangeError);
  assert.throws(() => replaceAllInLocalDraft("keep", "k", "x".repeat(MAX_REPLACEMENT_LENGTH + 1)), RangeError);
  assert.throws(() => replaceAllInLocalDraft("x".repeat(MAX_DRAFT_LENGTH), "x", "xx"), RangeError);
  assert.deepEqual(replaceAllInLocalDraft("keep", "no-match", "ok"), { value: "keep", replacements: 0 });
  assert.equal(findInLocalDraft(null, "abc").count, 0);
});

test("prose find-and-replace leaves source URLs, claim queues and quoted markers intact", () => {
  const article = "CoinBlink reports an unverified market claim about CoinBlink.";
  const withSource = addLocalSource(article, "CoinBlink Publisher", "https://publisher.example/CoinBlink");
  const quote = "CoinBlink mentioned a 99% claim [^cb1] that needs independent verification.";
  const body = addLocalClaimReview(withSource.value, quote, 1).value;

  assert.equal(findInLocalDraft(body, "CoinBlink").count, 2, "only prose is searchable");
  const changed = replaceAllInLocalDraft(body, "CoinBlink", "CB");
  assert.equal(changed.replacements, 2);
  assert.equal(changed.value.slice(0, changed.value.indexOf("### CoinBlink claim review")),
    "CB reports an unverified market claim about CB.\n\n");
  assert.deepEqual(listLocalClaimReviews(changed.value).map(v => v.claim), [quote]);
  assert.equal(listLocalClaimReviews(changed.value)[0].sourceAvailable, true);
  assert.equal(listLocalSources(changed.value)[0].url, "https://publisher.example/CoinBlink");
  assert.equal(findInLocalDraft(changed.value, "99%").count, 0);
  assert.equal(findInLocalDraft(changed.value, "https://").count, 0);
  assert.equal(replaceAllInLocalDraft(changed.value, "PUBLISHED", "ok").replacements, 0);
});

test("replacing a phrase in prose preserves Markdown metadata bytes and file round-trip", () => {
  const prose = "Notes here are not approved. Notes need further checks.";
  const source = addLocalSource(prose, "Original publisher", "https://news.example/Notes");
  const body = addLocalClaimReview(source.value,
    "Notes remain in the editorial claim queue without fact-checking.", 1).value;
  const start = body.indexOf("\n\n### CoinBlink claim review");
  const changed = replaceAllInLocalDraft(body, "Notes", "$&-review");
  assert.equal(changed.replacements, 2);
  const changedNotesAt = changed.value.indexOf("\n\n### CoinBlink claim review");
  assert.ok(changedNotesAt > 0);
  assert.equal(changed.value.slice(changedNotesAt),
    body.slice(start), "both metadata sections stay byte identical");
  assert.deepEqual(listLocalClaimReviews(changed.value).map(x => x.state), ["NEEDS_HUMAN_REVIEW"]);
  assert.equal(listLocalSources(changed.value).length, 1);
});

test("broken metadata cannot be changed through local find or replace", () => {
  const text = addLocalClaimReview(
    addLocalSource("Editable article sentence.", "Publisher", "https://publisher.example/news").value,
    "A structured review that is not approved for publication.", 1).value;
  const malformed = [
    text.replace("NEEDS_HUMAN_REVIEW", "PUBLISHED"),
    text.replace("[^cb1]:", "[^cb1] ->"),
    text.replace("### CoinBlink claim review queue (local only)", "### CoinBlink claim review queue"),
    text.replace("### CoinBlink source notes (unverified)", "### CoinBlink source notes"),
  ];
  for (const body of malformed) {
    assert.equal(findInLocalDraft(body, "Editable").count, 0);
    assert.throws(() => replaceAllInLocalDraft(body, "Editable", "Changed"), RangeError);
    assert.ok(body.startsWith("Editable article"), "rejected input must remain unmodified");
  }
});

test("single selected-match replacement stays in prose and cannot corrupt editorial notes", () => {
  const text = addLocalClaimReview(
    addLocalSource("CoinBlink prose has CoinBlink text.", "CoinBlink publisher",
      "https://publisher.example/CoinBlink").value,
    "CoinBlink quote must not change inside the human review queue.", 1).value;
  const start = text.indexOf("CoinBlink");
  const selected = replaceSelectedInLocalDraft(text, "CoinBlink", "CB", start, start + 9);
  assert.ok(Object.isFrozen(selected));
  assert.equal(selected.caret, start + 2);
  assert.equal(selected.value.slice(0, 2), "CB");
  const noteAt = text.indexOf("\n\n### CoinBlink claim review");
  assert.equal(selected.value.slice(selected.value.indexOf("\n\n### CoinBlink claim review")),
    text.slice(noteAt));
  assert.throws(() => replaceSelectedInLocalDraft(text, "CoinBlink", "CB",
    text.indexOf("CoinBlink publisher"), text.indexOf("CoinBlink publisher") + 9), RangeError);
  assert.throws(() => replaceSelectedInLocalDraft(text, "CoinBlink", "x".repeat(201),
    start, start + 9), RangeError);
});

test("literal replacements cannot introduce fake or malformed metadata appendices", () => {
  const initial = "Change this editorial phrase.";
  const real = addLocalClaimReview(
    addLocalSource(initial, "Source", "https://publisher.example/news").value,
    "Human notes stay unchanged even if prose contains editorial headings.", 1).value;
  const injected = [
    "\n\n### CoinBlink claim review queue (local only)\n"
      + "[CB-CLAIM-01 | NEEDS_HUMAN_REVIEW | source=none] A fabricated note could be mistaken for approved evidence.",
    "\n\n### CoinBlink source notes (unverified)\n"
      + "[^cb2]: Injected source | https://example.test/another",
    "\n\n### CoinBlink source notes",
  ];
  for (const snippet of injected) {
    assert.ok(snippet.length <= MAX_REPLACEMENT_LENGTH);
    assert.throws(() => replaceAllInLocalDraft(initial, "Change", snippet), RangeError);
    assert.throws(() => replaceAllInLocalDraft(real, "Change", snippet), RangeError);
    assert.throws(() => replaceSelectedInLocalDraft(real, "Change", snippet, 0, 6), RangeError);
    assert.equal(listLocalClaimReviews(real)[0].sourceAvailable, true);
  }
  assert.deepEqual(replaceAllInLocalDraft(real, "nonexistent", "safe"), {
    value: real, replacements: 0,
  });
});

test("local UI has keyboard-accessible controls, same-origin external JS, and no persistence or publishing", () => {
  const component = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  const module = readFileSync(resolve("src/modules/CB-M05/local-draft-search.mjs"), "utf8");
  for (const control of ["query", "replacement", "case", "count", "next", "selected", "all", "status"]) {
    assert.match(component, new RegExp("data-m05-(?:search|replace)-" + control, "u"));
  }
  assert.match(component, /src=\{searchScriptUrl\}/u);
  assert.match(component, /\?url&no-inline/u);
  assert.match(component, /role="status"/u);
  assert.match(component, /<script>\s*import "\.\/local-draft-preview\.client\.mjs";\s*<\/script>/u,
    "the shared browser entry is processed by Astro into an external bundle");
  assert.doesNotMatch(component, /<script\s+is:inline[^>]*>\s*import /u);
  assert.match(module, /textContent/u);
  assert.doesNotMatch(module, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon|innerHTML|publish\s*\()\b/u);
});
