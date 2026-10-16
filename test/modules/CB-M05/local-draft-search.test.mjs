import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  findInLocalDraft,
  replaceAllInLocalDraft,
  MAX_DRAFT_LENGTH,
  MAX_REPLACEMENT_LENGTH,
  MAX_SEARCH_LENGTH,
} from "../../../src/modules/CB-M05/local-draft-search.mjs";

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

test("local UI has keyboard-accessible controls, same-origin external JS, and no persistence or publishing", () => {
  const component = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  const module = readFileSync(resolve("src/modules/CB-M05/local-draft-search.mjs"), "utf8");
  for (const control of ["query", "replacement", "case", "count", "next", "selected", "all", "status"]) {
    assert.match(component, new RegExp("data-m05-(?:search|replace)-" + control, "u"));
  }
  assert.match(component, /src=\{searchScriptUrl\}/u);
  assert.match(component, /\?url&no-inline/u);
  assert.match(component, /role="status"/u);
  assert.doesNotMatch(component, /<script>\s*import /u);
  assert.match(module, /textContent/u);
  assert.doesNotMatch(module, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon|innerHTML|publish\s*\()\b/u);
});
