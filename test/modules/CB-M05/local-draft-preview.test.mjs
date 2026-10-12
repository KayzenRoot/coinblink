import assert from "node:assert/strict";
import test from "node:test";
import { prepareLocalDraft, draftToMarkdown, parseLocalDraftMarkdown, safeDraftFilename } from "../../../public/m05-draft-preview.js";

const valid = Object.freeze({
  title: "A verifiable original draft headline",
  author: "CoinBlink Research",
  source: "https://example.org/original-report",
  summary: "A concise description of the original public source and its relevance.",
  body: "This is a separately authored article draft awaiting checks for every material claim.",
});

test("source-backed local draft can be exported with explicit unpublished review gates", () => {
  const result = prepareLocalDraft(valid);
  assert.equal(result.ready, true);
  assert.ok(Object.isFrozen(result));
  assert.deepEqual(result.errors, []);
  const text = draftToMarkdown(result);
  assert.match(text, /^# A verifiable original draft headline/mu);
  assert.match(text, /WORKING DRAFT ONLY/u);
  assert.match(text, /Original source:\*\* https:\/\/example.org\/original-report/u);
  assert.match(text, /Owner review before any publication/iu);
  assert.equal(safeDraftFilename(result.title), "a-verifiable-original-draft-headline.md");
});

test("invalid sources or incomplete inputs fail closed, with no Markdown export", () => {
  for (const source of [
    "", "javascript:alert(1)", "http://example.org/story",
    "https://user:pass@example.org/", "https://example.org@evil.example/story",
    "https://localhost/", "https://example.org /bad", "file:///tmp/test",
  ]) {
    const result = prepareLocalDraft({ ...valid, source });
    assert.equal(result.ready, false, source);
    assert.ok(result.errors.includes("source"), source);
    assert.throws(() => draftToMarkdown(result), /source-backed draft/u);
  }
  const empty = prepareLocalDraft({});
  assert.deepEqual(empty.errors, ["title", "summary", "body", "source"]);
  assert.equal(empty.ready, false);
});

test("preview text is bounded and exported Markdown neutralizes direct HTML tags", () => {
  const result = prepareLocalDraft({
    ...valid,
    title: "Headline <script>alert(1)</script>",
    summary: "Summary <img src=x onerror=alert(1)> with enough surrounding words.",
    body: "Body text <script>alert(1)</script> that will be exported as escaped Markdown text.",
    author: "<b>Fake identity</b>",
  });
  assert.equal(result.ready, true);
  const markdown = draftToMarkdown(result);
  assert.doesNotMatch(markdown, /<script>|<img|<b>/u);
  assert.match(markdown, /&lt;script&gt;/u);
  assert.equal(safeDraftFilename("Relação / <script> ⚠"), "relacao-script.md");
  const giant = prepareLocalDraft({ ...valid, body: "x".repeat(13000), title: "H".repeat(500) });
  assert.equal(giant.title.length, 140);
  assert.equal(giant.body.length, 12000);
});

test("exported working drafts round-trip on local Markdown import without information loss", () => {
  const draft = prepareLocalDraft(valid);
  const original = draftToMarkdown(draft);
  const restored = parseLocalDraftMarkdown(original);
  assert.deepEqual(restored, draft);
  assert.equal(draftToMarkdown(restored), original);
  assert.deepEqual(parseLocalDraftMarkdown("\uFEFF" + original.replace(/\n/gu, "\r\n")), draft);
});

test("local importer does not run HTML and maintains the original export format", () => {
  const data = prepareLocalDraft({
    ...valid,
    title: "Source <script>title</script> alerts",
    body: "Some <script>alert('invalid')</script> content should be text only in this article draft.",
  });
  const original = draftToMarkdown(data);
  const restored = parseLocalDraftMarkdown(original);
  assert.equal(restored.title, data.title);
  assert.equal(restored.body, data.body);
  assert.equal(draftToMarkdown(restored), original);
});

test("importer rejects non-CoinBlink Markdown, malformed sections and oversized files", () => {
  const original = draftToMarkdown(prepareLocalDraft(valid));
  for (const raw of [
    "", null, "<script>evil</script>", "# Arbitrary markdown article",
    original.replace("WORKING DRAFT ONLY.", "PUBLISHED."),
    original.replace("## Summary", "## Spoofed section"),
    original.replace("https://example.org", "javascript:"),
    original.replace("Original source:", "External source:"),
    original.replace("Request owner review before any publication", "Publishing already approved"),
    original + "# extra content",
    "\0" + original,
    "a".repeat(25000),
  ]) {
    assert.throws(() => parseLocalDraftMarkdown(raw), /draft|Markdown|section|validation|Unsupported|content/iu);
  }
});

test("importing and re-exporting never adds authorization, publication or synthetic proof", () => {
  const returned = parseLocalDraftMarkdown(draftToMarkdown(prepareLocalDraft(valid)));
  assert.ok(returned.ready);
  assert.equal("published" in returned, false);
  assert.equal("approved" in returned, false);
  assert.equal("verified" in returned, false);
});
