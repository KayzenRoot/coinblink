/* global document, Blob, URL, setTimeout */
// Public local-only drafting utility. Does not call servers, log, store, or publish.
// Imports have no network dependencies; no Markdown/HTML is rendered as executable markup.
const MAX_TITLE = 140;
const MAX_AUTHOR = 80;
const MAX_SUMMARY = 400;
const MAX_BODY = 12000;
const MAX_SOURCE = 500;
const clean = (value, max) => String(value ?? "").trim().slice(0, max).replace(/\r\n?/gu, "\n");
const escapeMarkdown = (value) => value.replace(/</gu, "&lt;").replace(/>/gu, "&gt;");

export function prepareLocalDraft(input) {
  const title = clean(input.title, MAX_TITLE);
  const author = clean(input.author, MAX_AUTHOR);
  const summary = clean(input.summary, MAX_SUMMARY);
  const body = clean(input.body, MAX_BODY);
  const sourceValue = clean(input.source, MAX_SOURCE);
  let source = "";
  if (sourceValue) {
    try {
      const parsed = new URL(sourceValue);
      if (parsed.protocol === "https:" && !parsed.username && !parsed.password
        && parsed.hostname.includes(".") && !parsed.hostname.endsWith(".")
        && !/\s/u.test(sourceValue)) {
        source = parsed.href;
      }
    } catch { /* Invalid source addresses never reach an outbound link. */ }
  }
  const errors = [];
  if (title.length < 8) errors.push("title");
  if (summary.length < 20) errors.push("summary");
  if (body.length < 40) errors.push("body");
  if (!source) errors.push("source");
  return Object.freeze({
    title, author, summary, body, source,
    ready: errors.length === 0,
    errors: Object.freeze(errors),
  });
}

export function draftToMarkdown(prepared) {
  if (!prepared.ready) throw new Error("A source-backed draft is required");
  const title = escapeMarkdown(prepared.title.replace(/[\n#]/gu, " "));
  const summary = escapeMarkdown(prepared.summary);
  const body = escapeMarkdown(prepared.body);
  const author = escapeMarkdown(prepared.author || "Not provided");
  const source = prepared.source;
  return [
    "# " + title, "",
    "> WORKING DRAFT ONLY. Not checked, approved, or published.", "",
    "**Author label:** " + author, "",
    "**Original source:** " + source, "",
    "## Summary", "", summary, "",
    "## Draft", "", body, "",
    "## Editorial gates", "",
    "- [ ] Verify facts against original source and independent evidence",
    "- [ ] Check reuse rights and attribution",
    "- [ ] Request owner review before any publication", "",
  ].join("\n");
}

export function safeDraftFilename(title) {
  const slug = clean(title, MAX_TITLE)
    .normalize("NFKD").replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 60);
  return (slug || "coinblink-draft") + ".md";
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-m05-local-editor]");
  if (root) {
    const fields = {
      title: root.querySelector("[data-m05-draft-title]"),
      author: root.querySelector("[data-m05-draft-author]"),
      summary: root.querySelector("[data-m05-draft-summary]"),
      body: root.querySelector("[data-m05-draft-body]"),
      source: root.querySelector("[data-m05-draft-source]"),
    };
    const preview = {
      title: root.querySelector("[data-m05-preview-title]"),
      author: root.querySelector("[data-m05-preview-author]"),
      summary: root.querySelector("[data-m05-preview-summary]"),
      body: root.querySelector("[data-m05-preview-body]"),
      source: root.querySelector("[data-m05-preview-source]"),
      status: root.querySelector("[data-m05-preview-status]"),
    };
    const exportButton = root.querySelector("[data-m05-export]");
    const hint = root.querySelector("[data-m05-draft-hint]");
    const read = () => prepareLocalDraft(Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value]),
    ));
    const refresh = () => {
      const draft = read();
      preview.title.textContent = draft.title || "Untitled local draft";
      preview.author.textContent = draft.author || "Unassigned author label";
      preview.summary.textContent = draft.summary || "Summary preview";
      preview.body.textContent = draft.body || "Draft body preview";
      preview.source.textContent = draft.source || "No verified HTTPS source URL";
      preview.status.textContent = draft.ready
        ? "Ready to export locally, NOT fact-checked or approved."
        : "Complete title, summary (20+), body (40+) and a valid HTTPS source URL to export.";
      hint.textContent = draft.ready ? "Export creates a local file. No server receives your draft." : "";
      exportButton.disabled = !draft.ready;
    };
    Object.values(fields).forEach((field) => field.addEventListener("input", refresh));
    exportButton.addEventListener("click", () => {
      const draft = read();
      if (!draft.ready) return;
      const file = new Blob([draftToMarkdown(draft)], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(file);
      const download = document.createElement("a");
      download.href = url;
      download.download = safeDraftFilename(draft.title);
      document.body.append(download);
      download.click();
      download.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      hint.textContent = "Local Markdown export requested. Nothing was published or saved online.";
    });
    refresh();
  }
}
