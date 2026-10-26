import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { DEMO_READING_SPEED_WPM, measureLocalDraft } from "../../../src/modules/CB-M05/local-draft-metrics.mjs";
import { addLocalSource } from "../../../src/modules/CB-M05/local-source-notes.mjs";
import { addLocalClaimReview } from "../../../src/modules/CB-M05/local-claim-reviews.mjs";

test("empty and non-string draft bodies produce zero values, without side effects", () => {
  assert.deepEqual(measureLocalDraft(""), { words: 0, characters: 0, estimatedMinutes: 0 });
  assert.deepEqual(measureLocalDraft(null), { words: 0, characters: 0, estimatedMinutes: 0 });
  assert.deepEqual(measureLocalDraft({ body: "secret" }), { words: 0, characters: 0, estimatedMinutes: 0 });
  assert.ok(Object.isFrozen(measureLocalDraft("")));
});

test("the draft helper counts words and characters locally without assuming editorial approval", () => {
  assert.deepEqual(measureLocalDraft("A   careful\nlocal  draft"), {
    words: 4, characters: 24, estimatedMinutes: 1,
  });
  assert.equal(measureLocalDraft("🙂").characters, 1);
  assert.equal(DEMO_READING_SPEED_WPM, 200);
  const longDraft = Array.from({ length: 401 }, () => "word").join(" ");
  assert.deepEqual(
    { words: measureLocalDraft(longDraft).words, estimatedMinutes: measureLocalDraft(longDraft).estimatedMinutes },
    { words: 401, estimatedMinutes: 3 },
  );
});

test("reading indicators count article prose but exclude genuine source and review appendices", () => {
  const prose = "An author writes an independently reviewed original article.";
  const notes = addLocalSource(prose, "Original publisher", "https://publisher.example/report").value;
  const withClaims = addLocalClaimReview(
    notes, "The author noted a claim requiring a separate editorial check.", 1).value;
  assert.deepEqual(measureLocalDraft(notes), measureLocalDraft(prose));
  assert.deepEqual(measureLocalDraft(withClaims), measureLocalDraft(prose));
  assert.equal(measureLocalDraft(withClaims).words, 8);
  assert.equal(measureLocalDraft(withClaims).characters, Array.from(prose).length);
});

test("only a genuine complete appendix is excluded and malformed notes count conservatively", () => {
  const prose = "The article is still in review.";
  const onlyClaim = addLocalClaimReview(prose,
    "A quote needs a human verification before any article is published.").value;
  assert.deepEqual(measureLocalDraft(onlyClaim), measureLocalDraft(prose));
  const brokenClaim = onlyClaim.replace("NEEDS_HUMAN_REVIEW", "PUBLISHED");
  assert.ok(measureLocalDraft(brokenClaim).words > measureLocalDraft(prose).words);
  const onlySource = addLocalSource(prose, "Original", "https://original.example/report").value;
  const brokenSource = onlySource.replace("[^cb1]:", "[^cb1] -");
  assert.ok(measureLocalDraft(brokenSource).words > measureLocalDraft(prose).words);
  assert.deepEqual(measureLocalDraft(prose + "\n\n### CoinBlink source notes"),
    measureLocalDraft(prose + "\n\n### CoinBlink source notes"));
  assert.ok(measureLocalDraft(prose + "\n\n### CoinBlink source notes").words > measureLocalDraft(prose).words);
});

test("long reading estimates never count source metadata or quoted figures", () => {
  const prose = Array.from({ length: 401 }, () => "word").join(" ");
  const notes = addLocalSource(prose, "Source", "https://source.example/article").value;
  assert.deepEqual(measureLocalDraft(notes), measureLocalDraft(prose));
  assert.deepEqual({ words: measureLocalDraft(notes).words,
    estimatedMinutes: measureLocalDraft(notes).estimatedMinutes },
  { words: 401, estimatedMinutes: 3 });
});

test("drafting indicators are explicitly local, non-published and accessible in the component", () => {
  const source = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  assert.match(source, /data-m05-local-metrics/u);
  assert.match(source, /data-m05-metric-words/u);
  assert.match(source, /data-m05-metric-characters/u);
  assert.match(source, /data-m05-metric-minutes/u);
  assert.match(source, /aria-live="polite"/u);
  assert.match(source, /estimate.*not.*fact.check/u);
  assert.match(source, /\?url&no-inline/u);
  assert.match(source, /src=\{metricsScriptUrl\}/u);
  assert.match(source, /<script>\s*import "\.\/local-draft-preview\.client\.mjs";\s*<\/script>/u,
    "the shared editor module is processed by Astro into an external bundle");
  assert.doesNotMatch(source, /<script\s+is:inline[^>]*>\s*import /u, "inline module imports are not allowed");
  const externalModule = readFileSync(resolve("src/modules/CB-M05/local-draft-metrics.mjs"), "utf8");
  assert.match(externalModule, /MutationObserver/u);
  assert.match(externalModule, /measureLocalDraft/u);
  assert.doesNotMatch(externalModule, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\()\b/u);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon)\b/u);
});
