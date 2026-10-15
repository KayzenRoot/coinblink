/* global document, MutationObserver, Event */
// M05 P0: local-only source notes. This module NEVER fetches sources or verifies claims.
// References are plain-text footnotes in the article body so v2 Markdown export/import
// preserves them without touching shared public routes, parsers, or persistent storage.
export const MAX_LOCAL_SOURCES = 12;
export const MAX_LOCAL_SOURCE_TITLE = 90;
export const MAX_LOCAL_SOURCE_URL = 500;
export const MAX_LOCAL_ARTICLE_LENGTH = 12000;
export const LOCAL_SOURCE_HEADING = "### CoinBlink source notes (unverified)";
const APPENDIX_MARKER = "\n\n" + LOCAL_SOURCE_HEADING + "\n";

function normalizedTitle(title) {
  if (typeof title !== "string" || title !== title.trim() || title.length < 1
      || title.length > MAX_LOCAL_SOURCE_TITLE || /[\r\n\t|<>]/u.test(title)
      || title.includes("[") || title.includes("]") || title.includes("\\")) {
    throw new RangeError("Source label must be 1 to 90 plain-text characters");
  }
  return title;
}

function normalizedSourceUrl(raw) {
  if (typeof raw !== "string" || raw.length < 1 || raw.length > MAX_LOCAL_SOURCE_URL
      || /\s/u.test(raw) || raw.includes("|") || raw.includes("<") || raw.includes(">")) {
    throw new RangeError("A plain HTTPS source URL is required");
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new RangeError("A valid HTTPS source URL is required");
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password
      || !parsed.hostname.includes(".") || parsed.hostname.endsWith(".")
      || parsed.href.length > MAX_LOCAL_SOURCE_URL) {
    throw new RangeError("Use an HTTPS URL without credentials");
  }
  return parsed.href;
}

function scanSources(body) {
  if (typeof body !== "string" || body.length > MAX_LOCAL_ARTICLE_LENGTH) {
    throw new RangeError("Draft body exceeds its local limit");
  }
  const offset = body.lastIndexOf(APPENDIX_MARKER);
  if (offset === -1) {
    if (body.includes(LOCAL_SOURCE_HEADING)) {
      throw new RangeError("Unsupported or edited source-note appendix");
    }
    return { text: body, entries: [] };
  }
  const text = body.slice(0, offset);
  const suffix = body.slice(offset + APPENDIX_MARKER.length);
  if (text.includes(LOCAL_SOURCE_HEADING) || !suffix || suffix.endsWith("\n\n")) {
    throw new RangeError("Duplicate or malformed source-note appendix");
  }
  const lines = suffix.endsWith("\n") ? suffix.slice(0, -1).split("\n") : suffix.split("\n");
  if (!lines.length || lines.length > MAX_LOCAL_SOURCES) {
    throw new RangeError("Unsupported number of source notes");
  }
  const entries = [];
  const ids = new Set();
  const urls = new Set();
  for (const line of lines) {
    const match = /^\[\^cb([1-9]|1[0-2])\]: (.+) \| (https:\/\/\S+)$/u.exec(line);
    if (!match) throw new RangeError("Malformed source-note line");
    const id = Number(match[1]);
    const title = normalizedTitle(match[2]);
    const url = normalizedSourceUrl(match[3]);
    if (match[3] !== url || ids.has(id) || urls.has(url)) {
      throw new RangeError("Duplicate or noncanonical source note");
    }
    ids.add(id);
    urls.add(url);
    entries.push({ id, title, url });
  }
  return { text, entries };
}

function assembleSources(text, entries) {
  const suffix = entries.length
    ? APPENDIX_MARKER + entries.map((ref) => "[^cb" + ref.id + "]: " + ref.title + " | " + ref.url).join("\n")
    : "";
  const result = text + suffix;
  if (result.length > MAX_LOCAL_ARTICLE_LENGTH) {
    throw new RangeError("Source notes would exceed the 12,000-character draft limit");
  }
  return result;
}

/** Return immutable local source entries and citation counts, without trusting a URL.
 * @param {string} body
 */
export function listLocalSources(body) {
  const { text, entries } = scanSources(body);
  return Object.freeze(entries.map((ref) => Object.freeze({
    ...ref,
    cited: text.split("[^cb" + ref.id + "]").length - 1,
  })));
}

/** Add one HTTPS source note to this draft. No network traffic is performed.
 * @param {string} body
 * @param {string} title
 * @param {string} rawUrl
 */
export function addLocalSource(body, title, rawUrl) {
  const { text, entries } = scanSources(body);
  if (entries.length >= MAX_LOCAL_SOURCES) throw new RangeError("Limit of 12 local sources reached");
  const cleanTitle = normalizedTitle(title.trim());
  const url = normalizedSourceUrl(rawUrl);
  if (entries.some((ref) => ref.url === url)) throw new RangeError("Source URL is already listed");
  const reserved = new Set(entries.map((ref) => ref.id));
  // Don't reuse a footnote ID still present in the author's text as an orphan marker.
  const id = Array.from({ length: MAX_LOCAL_SOURCES }, (_, i) => i + 1)
    .find((candidate) => !reserved.has(candidate) && !text.includes("[^cb" + candidate + "]"));
  if (!id) throw new RangeError("No unused local source IDs are available");
  const reference = Object.freeze({ id, title: cleanTitle, url });
  const value = assembleSources(text, [...entries, reference]);
  return Object.freeze({ value, reference });
}

/** Insert a footnote marker at a caret in prose, never inside the appendix.
 * @param {string} body
 * @param {number} id
 * @param {number} [caret]
 */
export function insertLocalCitation(body, id, caret) {
  const { text, entries } = scanSources(body);
  if (!entries.some((ref) => ref.id === id)) throw new RangeError("Source ID does not exist");
  const offset = Number.isInteger(caret) && caret >= 0 && caret <= text.length ? caret : text.length;
  const marker = "[^cb" + id + "]";
  const prose = text.slice(0, offset) + marker + text.slice(offset);
  return Object.freeze({ value: assembleSources(prose, entries), caret: offset + marker.length });
}

/** Removing a source also removes its matching inline footnote markers.
 * @param {string} body
 * @param {number} id
 */
export function removeLocalSource(body, id) {
  const { text, entries } = scanSources(body);
  if (!entries.some((ref) => ref.id === id)) throw new RangeError("Source ID does not exist");
  const marker = "[^cb" + id + "]";
  return assembleSources(text.split(marker).join(""), entries.filter((ref) => ref.id !== id));
}

// Separate from the original editor inputs so its tested input contract remains stable.
if (typeof document !== "undefined") {
  const editor = document.querySelector("[data-m05-local-editor]");
  const panel = document.querySelector("[data-m05-sources-panel]");
  const body = editor?.querySelector("[data-m05-draft-body]");
  const preview = editor?.querySelector("[data-m05-preview-body]");
  const name = panel?.querySelector("[data-m05-source-label]");
  const url = panel?.querySelector("[data-m05-source-url]");
  const addButton = panel?.querySelector("[data-m05-source-add]");
  const list = panel?.querySelector("[data-m05-source-list]");
  const count = panel?.querySelector("[data-m05-source-count]");
  const status = panel?.querySelector("[data-m05-source-status]");
  if (body && panel && name && url && addButton && list && count && status) {
    const report = (message) => { status.textContent = message; };
    const apply = (text) => {
      body.value = text;
      body.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const render = () => {
      list.replaceChildren();
      try {
        const refs = listLocalSources(body.value);
        count.textContent = String(refs.length) + " / " + String(MAX_LOCAL_SOURCES);
        addButton.disabled = refs.length >= MAX_LOCAL_SOURCES;
        if (!refs.length) {
          const empty = document.createElement("li");
          empty.textContent = "No extra references yet. Your original source field remains separate.";
          list.append(empty);
        }
        for (const ref of refs) {
          const entry = document.createElement("li");
          const content = document.createElement("span");
          content.textContent = "[^cb" + ref.id + "] " + ref.title + " | " + ref.url
            + " | " + ref.cited + " citation(s), URL NOT checked";
          entry.append(content);
          const insert = document.createElement("button");
          insert.type = "button";
          insert.textContent = "Insert [^cb" + ref.id + "]";
          insert.setAttribute("aria-label", "Insert citation for source " + ref.id);
          insert.addEventListener("click", () => {
            try {
              const result = insertLocalCitation(body.value, ref.id, body.selectionStart);
              apply(result.value);
              body.focus();
              body.setSelectionRange(result.caret, result.caret);
              report("Citation inserted locally. This does not verify the source.");
            } catch {
              report("Cannot insert citation within the current draft length.");
            }
          });
          const remove = document.createElement("button");
          remove.type = "button";
          remove.textContent = "Remove source " + ref.id;
          remove.setAttribute("aria-label", "Remove source and its citations " + ref.id);
          remove.addEventListener("click", () => {
            try {
              apply(removeLocalSource(body.value, ref.id));
              report("Source and corresponding citations removed from this local draft.");
            } catch {
              report("Source could not be removed; the draft was preserved.");
            }
          });
          entry.append(insert, remove);
          list.append(entry);
        }
      } catch {
        count.textContent = "Review required";
        addButton.disabled = true;
        const error = document.createElement("li");
        error.textContent = "Source notes were edited or damaged. Fix the appendix manually; other draft text was kept.";
        list.append(error);
      }
    };

    addButton.addEventListener("click", () => {
      try {
        const result = addLocalSource(body.value, name.value, url.value);
        apply(result.value);
        name.value = "";
        url.value = "";
        report("Reference added to article body. Insert a citation and re-export Markdown to keep it.");
        name.focus();
      } catch {
        report("Enter a distinct HTTPS URL and plain-text label; max 12 sources and 12,000 draft characters.");
      }
    });
    body.addEventListener("input", render);
    if (preview && typeof MutationObserver !== "undefined") {
      new MutationObserver(render).observe(preview, { childList: true, characterData: true, subtree: true });
    }
    render();
  }
}
