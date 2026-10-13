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


test("versioned local drafts preserve literal entity strings and optional author labels", () => {
  for (const author of ["Not provided", ""]) {
    const original = prepareLocalDraft({
      ...valid,
      title: "Why &lt;literal&gt; differs from <markup>",
      author,
      summary: "A &lt;literal&gt; spelling and a real <tag> must both survive export and import.",
      body: "A body containing &amp;, &lt;, &gt;, &, <script> and > symbols must round-trip without changes.",
    });
    const markdown = draftToMarkdown(original);
    assert.match(markdown, /COINBLINK LOCAL DRAFT FORMAT: 2/u);
    assert.match(markdown, /&amp;lt;literal&amp;gt;/u);
    assert.doesNotMatch(markdown, /<script>/u);
    assert.deepEqual(parseLocalDraftMarkdown(markdown), original);
  }
});

test("legacy unversioned CoinBlink draft imports remain supported", () => {
  const original = prepareLocalDraft(valid);
  const previousFormat = draftToMarkdown(original).replace("> COINBLINK LOCAL DRAFT FORMAT: 2\n\n", "");
  assert.deepEqual(parseLocalDraftMarkdown(previousFormat), original);
});

test("max-length HTML-like text remains importable within the 64 KB local file limit", () => {
  const original = prepareLocalDraft({ ...valid, body: "<".repeat(12000) });
  const markdown = draftToMarkdown(original);
  assert.ok(markdown.length < 64000);
  assert.deepEqual(parseLocalDraftMarkdown(markdown), original);
});

test("v2 draft sections remain lossless when summary or body contains Markdown headings", () => {
  const original = prepareLocalDraft({
    ...valid,
    summary: "Summary begins here.\n\n## Draft\nThis heading is only original summary text.\n\n## Summary\nMore summary.",
    body: "Draft opening here.\n\n## Editorial gates\nThis is user-written body text.\n\n# Top heading\nStill text, not a real publication gate.",
  });
  assert.equal(original.ready, true);
  const markdown = draftToMarkdown(original);
  assert.equal(markdown.split("\n\n## Draft\n\n").length, 2);
  assert.equal(markdown.split("\n\n## Editorial gates\n\n").length, 2);
  assert.match(markdown, /&#35;# Draft/u);
  assert.match(markdown, /&#35;# Editorial gates/u);
  assert.deepEqual(parseLocalDraftMarkdown(markdown), original);
});

test("v2 literal heading entity escapes survive exact Markdown import", () => {
  const original = prepareLocalDraft({
    ...valid,
    summary: "Literal &#35; token and heading.\n# Section heading\nAnd literal &#35; again.",
    body: "Original tokens &#35; and &lt; remain intact.\n\n## Draft\nThis is still within the draft body.",
  });
  const markdown = draftToMarkdown(original);
  assert.match(markdown, /&amp;#35;/u);
  assert.deepEqual(parseLocalDraftMarkdown(markdown), original);
});

test("normalized Unicode source URL must fit export format before export is enabled", () => {
  const accepted = prepareLocalDraft({
    ...valid,
    source: "https://example.org/" + "é".repeat(30),
  });
  assert.equal(accepted.ready, true);
  assert.deepEqual(parseLocalDraftMarkdown(draftToMarkdown(accepted)), accepted);

  const expanded = prepareLocalDraft({
    ...valid,
    source: "https://example.org/" + "é".repeat(90),
  });
  assert.equal(expanded.ready, false);
  assert.ok(expanded.errors.includes("source"));
  assert.throws(() => draftToMarkdown(expanded), /source-backed draft/u);
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
