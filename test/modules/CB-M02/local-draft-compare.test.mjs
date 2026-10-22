import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prepareLocalDraft, draftToMarkdown } from "../../../public/m05-draft-preview.js";
import { parseLocalArticlePreview } from "../../../public/m02-local-article-preview.js";
import { compareLocalDraftExports, LOCAL_REVISION_STATUS } from "../../../public/m02-local-draft-compare.js";

function imported(fields) {
  const value = prepareLocalDraft({
    title: "Fictional wallet workshop", author: "Fictional writer",
    summary: "A purely fictional editorial summary of wallet safety.",
    body: "A purely fictional paragraph of more than forty characters with no real claims.",
    source: "https://example.test/notes",
    ...fields,
  });
  const raw = draftToMarkdown(value);
  return parseLocalArticlePreview("local.md", Buffer.byteLength(raw), raw);
}
test("M02 compares only five fields across canonical M05 exports", () => {
  const before = imported({});
  const after = imported({
    title: "Fictional wallet workshop updated", author: "",
    body: 'Edited text <script>alert(1)</script> with more than forty valid prose characters.',
  });
  const result = compareLocalDraftExports(before, after);
  assert.equal(result.status, LOCAL_REVISION_STATUS);
  assert.equal(result.changedCount, 3);
  assert.deepEqual(result.changes.map(x => x.field), ["title", "author", "body"]);
  assert.match(result.changes.at(-1).afterExcerpt, /<script>alert\(1\)<\/script>/u);
  assert.equal(result.identicalContents, false);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.changes));
});
test("M02 identical exports cannot establish authentic article history", () => {
  const a = imported({});
  const result = compareLocalDraftExports(a, a);
  assert.equal(result.changedCount, 0);
  assert.equal(result.identicalContents, true);
  assert.equal(result.status, "LOCAL_EXPORT_COMPARISON_ONLY_NOT_PUBLISHED");
});
test("M02 bounds all excerpts and rejects noncanonical objects", () => {
  const a = imported({});
  const b = imported({ body: "D".repeat(600) });
  const changed = compareLocalDraftExports(a, b).changes.find(x => x.field === "body");
  assert.ok(changed.afterExcerpt.length <= 141);
  for (const invalid of [null, {}, { ...a, ready: false }, { ...a, body: "x".repeat(12001) }]) {
    assert.throws(() => compareLocalDraftExports(a, invalid));
  }
});
test("M02 comparison stays inert, private, and cancels stale reads", () => {
  const js = readFileSync("public/m02-local-draft-compare.js", "utf8");
  const page = readFileSync("src/modules/CB-M02/LocalDraftCompare.astro", "utf8");
  assert.match(js, /parseLocalArticlePreview/u);
  assert.match(js, /ticket !== generations\[key\]/u);
  assert.match(js, /pagehide/u);
  assert.match(js, /replaceChildren/u);
  assert.match(js, /textContent/u);
  assert.doesNotMatch(js + page, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|<iframe/iu);
});
