import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { DEMO_READING_SPEED_WPM, measureLocalDraft } from "../../../src/modules/CB-M05/local-draft-metrics.mjs";

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

test("drafting indicators are explicitly local, non-published and accessible in the component", () => {
  const source = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  assert.match(source, /data-m05-local-metrics/u);
  assert.match(source, /data-m05-metric-words/u);
  assert.match(source, /data-m05-metric-characters/u);
  assert.match(source, /data-m05-metric-minutes/u);
  assert.match(source, /aria-live="polite"/u);
  assert.match(source, /estimate.*not.*fact.check/u);
  assert.match(source, /MutationObserver/u);
  assert.match(source, /measureLocalDraft/u);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon)\b/u);
});
