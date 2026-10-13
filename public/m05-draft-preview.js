/* global document */
// Public local-only drafting utility. Does not call servers, log, store, or publish.
// Imports have no network dependencies; no Markdown/HTML is rendered as executable markup.
const MAX_TITLE = 140;
const MAX_AUTHOR = 80;
const MAX_SUMMARY = 400;
const MAX_BODY = 12000;
const MAX_SOURCE = 500;
const clean = (value, max) => String(value ?? "").trim().slice(0, max).replace(/\r\n?/gu, "\n");
const escapeMarkdown = (value) => value
  .replace(/&/gu, "&amp;")
  .replace(/</gu, "&lt;")
  .replace(/>/gu, "&gt;")
  .replace(/^#/gmu, "&#35;");
const escapeLegacyMarkdown = (value) => value.replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
// A heading's '#' must be encoded even when it is not the first character.
// Use a single pass so literal "&#35;" remains distinguishable from a real '#'.
const escapeTitleV2 = (value) => value.replace(/[&<>#]/gu, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "#": "&#35;",
})[character]);
const FORMAT_V2 = "> COINBLINK LOCAL DRAFT FORMAT: 2";

export function prepareLocalDraft(input) {
  const title = clean(input.title, MAX_TITLE).replaceAll("\n", " ").trim();
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
        && !/\s/u.test(sourceValue) && parsed.href.length <= MAX_SOURCE) {
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

function serializeLocalDraft(prepared, legacy = false) {
  if (!prepared.ready) throw new Error("A source-backed draft is required");
  const encode = legacy ? escapeLegacyMarkdown : escapeMarkdown;
  const title = legacy ? encode(prepared.title.replace(/[\n#]/gu, " ")) : escapeTitleV2(prepared.title);
  const summary = encode(prepared.summary);
  const body = encode(prepared.body);
  // Version 2 uses an empty author label for missing credits, rather than a
  // sentinel that could also be an author's literal name.
  const author = encode(legacy ? prepared.author || "Not provided" : prepared.author);
  const source = prepared.source;
  return [
    "# " + title, "",
    "> WORKING DRAFT ONLY. Not checked, approved, or published.", "",
    ...(legacy ? [] : [FORMAT_V2, ""]),
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

export function draftToMarkdown(prepared) {
  return serializeLocalDraft(prepared);
}

// Accept only the exact, non-published CoinBlink export structure.
// This is a data parser, not a general-purpose Markdown or HTML importer.
export function parseLocalDraftMarkdown(raw) {
  if (typeof raw !== "string" || raw.length > 64000 || raw.includes("\0")) {
    throw new Error("Unsupported or oversized Markdown draft");
  }
  const text = raw.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n");
  const header = "# ";
  const isVersion2 = text.includes("\n\n> WORKING DRAFT ONLY. Not checked, approved, or published.\n\n" + FORMAT_V2 + "\n\n**Author label:** ");
  const byline = "\n\n> WORKING DRAFT ONLY. Not checked, approved, or published.\n\n"
    + (isVersion2 ? FORMAT_V2 + "\n\n" : "") + "**Author label:** ";
  const source = "\n\n**Original source:** ";
  const summary = "\n\n## Summary\n\n";
  const body = "\n\n## Draft\n\n";
  const gates = "\n\n## Editorial gates\n\n";
  const exactGates = [
    "- [ ] Verify facts against original source and independent evidence",
    "- [ ] Check reuse rights and attribution",
    "- [ ] Request owner review before any publication",
  ].join("\n");
  if (!text.startsWith(header) || !text.endsWith(gates + exactGates + "\n")) {
    throw new Error("Not a CoinBlink working draft");
  }
  const markers = [byline, source, summary, body, gates];
  let cursor = header.length;
  const values = [];
  for (const part of markers) {
    const position = text.indexOf(part, cursor);
    if (position < cursor) throw new Error("Missing original draft sections");
    values.push(text.slice(cursor, position));
    cursor = position + part.length;
  }
  if (text.slice(cursor) !== exactGates + "\n") {
    throw new Error("Unexpected content after editorial gates");
  }
  const [title, author, originalSource, brief, article] = values;
  // Legacy exports encoded angle brackets, and the text is never assigned to innerHTML.
  const restore = (value, isTitle = false) => {
    const angles = value.replace(/&lt;/gu, "<").replace(/&gt;/gu, ">");
    // Decode the v2 heading escape before ampersands: literal &#35;
    // must not be mistaken for an originally encoded leading '#'.
    const restored = isVersion2 ? angles.replace(isTitle ? /&#35;/gu : /^&#35;/gmu, "#") : angles;
    return isVersion2 ? restored.replace(/&amp;/gu, "&") : restored;
  };
  const result = prepareLocalDraft({
    title: restore(title, true),
    author: !isVersion2 && restore(author) === "Not provided" ? "" : restore(author),
    source: originalSource,
    summary: restore(brief),
    body: restore(article),
  });
  // Never silently truncate or partially import an unfamiliar/malformed file.
  if (!result.ready || serializeLocalDraft(result, !isVersion2) !== text) {
    throw new Error("Draft format or fields failed validation");
  }
  return result;
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
    const importInput = root.querySelector("[data-m05-import]");
    const importStatus = root.querySelector("[data-m05-import-status]");
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
    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      importInput.value = "";
      if (!file) return;
      if (!/\.md$/iu.test(file.name) || file.size > 64000 || file.size === 0) {
        importStatus.textContent = "Choose a CoinBlink .md draft smaller than 64 KB.";
        return;
      }
      try {
        const restored = parseLocalDraftMarkdown(await file.text());
        for (const [key, field] of Object.entries(fields)) {
          field.value = restored[key];
        }
        refresh();
        importStatus.textContent = "Draft restored from this file in your browser only. Nothing was uploaded.";
        fields.title.focus();
      } catch {
        importStatus.textContent = "This file is not a valid CoinBlink working draft. Current text was kept.";
      }
    });
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
