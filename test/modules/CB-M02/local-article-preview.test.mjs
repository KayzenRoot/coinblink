import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prepareLocalDraft, draftToMarkdown } from "../../../src/modules/CB-M05/local-draft-markdown.mjs";
import { parseLocalArticlePreview, MAX_LOCAL_ARTICLE_BYTES } from "../../../src/modules/CB-M02/local-article-preview.client.mjs";
const draft = prepareLocalDraft({
  title: "Fictional story <script>alert(1)</script>", author: "Demo author",
  summary: "A long enough fictional article summary used only in testing.",
  body: "Entirely fictional article body <img src=x onerror=alert(1)> that can never be published here.",
  source: "https://example.test/original",
});
const md = draftToMarkdown(draft);
test("M02 accepts exact canonical M05 draft without changing source or prose", () => {
  const parsed = parseLocalArticlePreview("test.md", Buffer.byteLength(md), md);
  assert.equal(parsed.title, draft.title);
  assert.equal(parsed.summary, draft.summary);
  assert.equal(parsed.body, draft.body);
  assert.equal(parsed.source, draft.source);
  assert.equal(MAX_LOCAL_ARTICLE_BYTES, 64000);
});
test("M02 rejects bad file name, invalid size and forged exports", () => {
  for (const [name,size,raw] of [
    ["draft.txt", 100, md], ["../draft.md", 100, md], ["draft.md", 0, md],
    ["draft.md", 64001, md], ["draft.md", 2, "# invalid"], ["draft.md", 10, null],
    ["draft.md", 10, "x".repeat(64001)], ["draft.md", -1, md]
  ]) assert.throws(() => parseLocalArticlePreview(name,size,raw));
});
test("M02 client is inert, tab-scoped and has stale-read cleanup", () => {
  const js = readFileSync("src/modules/CB-M02/local-article-preview.client.mjs","utf8");
  const page = readFileSync("src/modules/CB-M02/LocalArticlePreview.astro","utf8");
  assert.match(js, /parseLocalDraftMarkdown/u);
  assert.match(js, /request !== generation/u);
  assert.match(js, /pagehide/u);
  assert.match(js, /textContent/u);
  assert.match(page, /data-m02-draft-article/u);
  assert.doesNotMatch(js+page, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|<iframe/iu);
});
