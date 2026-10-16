import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  MAX_LOCAL_ARTICLE_LENGTH, MAX_LOCAL_SOURCES, LOCAL_SOURCE_HEADING,
  addLocalSource, insertLocalCitation, listLocalSources, removeLocalSource,
} from "../../../src/modules/CB-M05/local-source-notes.mjs";
import {
  prepareLocalDraft, draftToMarkdown, parseLocalDraftMarkdown,
} from "../../../public/m05-draft-preview.js";

const prose = "CoinBlink reports original editorial context requiring independent checks.";
const urlOne = "https://publisher.example/article?x=1&y=2";

test("local source notes are plain, URL-unverified, and append once without modifying prose", () => {
  const added = addLocalSource(prose, "Publisher one", urlOne);
  assert.equal(added.reference.id, 1);
  assert.ok(added.value.startsWith(prose + "\n\n" + LOCAL_SOURCE_HEADING));
  assert.ok(added.value.includes("[^cb1]: Publisher one | " + urlOne));
  assert.ok(Object.isFrozen(added));
  const notes = listLocalSources(added.value);
  assert.deepEqual(notes, [{ id: 1, title: "Publisher one", url: urlOne, cited: 0 }]);
  assert.ok(Object.isFrozen(notes));
  assert.ok(Object.isFrozen(notes[0]));
  assert.equal(listLocalSources(prose).length, 0);
});

test("multiple citations preserve source IDs and are removed with their reference", () => {
  const first = addLocalSource(prose, "Report alpha", "https://a.example/report");
  const second = addLocalSource(first.value, "Relatório beta", "https://b.example/report");
  assert.equal(second.reference.id, 2);
  const linked = insertLocalCitation(second.value, 2, 9);
  assert.equal(linked.value.slice(9, linked.caret), "[^cb2]");
  assert.equal(listLocalSources(linked.value).find((ref) => ref.id === 2)?.cited, 1);
  const repeat = insertLocalCitation(linked.value, 2, 18);
  assert.equal(listLocalSources(repeat.value).find((ref) => ref.id === 2)?.cited, 2);
  const removed = removeLocalSource(repeat.value, 2);
  assert.ok(!removed.includes("[^cb2]"));
  assert.equal(listLocalSources(removed).length, 1);
  assert.deepEqual(removeLocalSource(removed, 1), prose);
  assert.throws(() => insertLocalCitation(removed, 9), RangeError);
});

test("citations never insert into the appendix, including invalid/outside caret positions", () => {
  const added = addLocalSource(prose, "Source", "https://publisher.example/article");
  const result = insertLocalCitation(added.value, 1, 99999);
  assert.ok(result.value.indexOf("[^cb1]") < result.value.indexOf(LOCAL_SOURCE_HEADING));
  assert.equal(listLocalSources(result.value)[0].cited, 1);
  assert.throws(() => insertLocalCitation(prose, 1), RangeError);
  assert.throws(() => removeLocalSource(prose, 1), RangeError);
});

test("invalid URLs, duplicate sources, unsupported titles and poisoned footnotes fail closed", () => {
  for (const bad of [
    "http://example.com/x", "javascript:alert(1)", "https://user:pass@example.com/x",
    "https://localhost/", "https://publisher.example/ space", "https://publisher.example.|x",
    "https://publisher.example/" + "a".repeat(501),
  ]) assert.throws(() => addLocalSource(prose, "Publisher", bad), RangeError, bad);
  for (const label of ["", " ".repeat(3), "bad\nname", "a|b", "<script>", "x".repeat(91)]) {
    assert.throws(() => addLocalSource(prose, label, urlOne), RangeError, label);
  }
  const added = addLocalSource(prose, "Publisher", urlOne);
  assert.throws(() => addLocalSource(added.value, "Other", urlOne), RangeError);
  assert.throws(() => listLocalSources(added.value.replace("[^cb1]:", "[^cb1] -")), RangeError);
  assert.throws(() => listLocalSources(added.value + "\n\ntrailing text"), RangeError);
  assert.throws(() => addLocalSource(prose + " " + LOCAL_SOURCE_HEADING, "Title", urlOne), RangeError);
});

test("capacity and draft limit are strict and may not truncate text silently", () => {
  let body = prose;
  for (let i = 1; i <= MAX_LOCAL_SOURCES; i++) {
    body = addLocalSource(body, "Publisher " + i, "https://publisher.example/article/" + i).value;
  }
  assert.equal(listLocalSources(body).length, MAX_LOCAL_SOURCES);
  assert.throws(() => addLocalSource(body, "Overflow", "https://overflow.example/x"), RangeError);
  assert.throws(() => addLocalSource("x".repeat(MAX_LOCAL_ARTICLE_LENGTH), "One", urlOne), RangeError);
  const orphaned = prose + " [^cb1]";
  assert.equal(addLocalSource(orphaned, "Two", urlOne).reference.id, 2);
});

test("v2 Markdown local export/import round-trips source notes and citations unchanged", () => {
  const article = addLocalSource(prose, "Economic report", urlOne);
  const cited = insertLocalCitation(article.value, 1, 18);
  const prepared = prepareLocalDraft({
    title: "Source-based CoinBlink article",
    author: "Editor",
    source: "https://original.example/primary",
    summary: "This article describes an ongoing source-backed editorial review.",
    body: cited.value,
  });
  assert.equal(prepared.ready, true);
  const markdown = draftToMarkdown(prepared);
  assert.ok(markdown.includes("## Draft"));
  assert.ok(markdown.includes("CoinBlink source notes (unverified)"));
  const parsed = parseLocalDraftMarkdown(markdown);
  assert.deepEqual(parsed, prepared);
  assert.equal(parsed.body, cited.value);
  assert.equal(listLocalSources(parsed.body)[0].cited, 1);
  assert.equal(listLocalSources(parsed.body)[0].url, urlOne);
});

test("the UI is scoped outside the original editor, CSP-safe, and makes no external requests", () => {
  const component = readFileSync(resolve("src/modules/CB-M05/LocalDraftLab.astro"), "utf8");
  const module = readFileSync(resolve("src/modules/CB-M05/local-source-notes.mjs"), "utf8");
  const panel = component.indexOf("data-m05-sources-panel");
  const originalEditorEnd = component.indexOf("</section>", component.indexOf("m05-draft-notice"));
  assert.ok(originalEditorEnd > 0 && panel > originalEditorEnd);
  for (const field of ["label", "url", "add", "list", "count", "status"]) {
    assert.match(component, new RegExp("data-m05-source-" + field, "u"));
  }
  assert.match(component, /src=\{sourcesScriptUrl\}/u);
  assert.match(component, /\?url&no-inline/u);
  assert.match(component, /aria-live="polite"/u);
  assert.match(component, /data-m05-source-add disabled/u, "empty demo action must begin disabled");
  assert.match(module, /name\.addEventListener\("input", render\)/u);
  assert.match(module, /url\.addEventListener\("input", render\)/u);
  assert.match(module, /addButton\.disabled = !canAdd/u);
  assert.match(module, /MutationObserver\(render\)/u);
  assert.match(module, /textContent/u);
  assert.doesNotMatch(module, /\b(?:localStorage|sessionStorage|document\.cookie|fetch\s*\(|navigator\.sendBeacon|innerHTML)\b/u);
  assert.doesNotMatch(component, /<script>\s*import /u);
});
