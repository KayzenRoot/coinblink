/* global document, MutationObserver, Event */
// Local-only find and replace for M05 drafts. No storage, network or HTML rendering.
export const MAX_SEARCH_LENGTH = 100;
export const MAX_REPLACEMENT_LENGTH = 200;
export const MAX_DRAFT_LENGTH = 12000;
const ESCAPABLE = /[.*+?^$(){}|[\]\\]/gu;
function matchPattern(query, caseSensitive) {
  if (typeof query !== "string" || query.length < 1 || query.length > MAX_SEARCH_LENGTH) return null;
  return new RegExp(query.replace(ESCAPABLE, "\\$&"), caseSensitive ? "gu" : "giu");
}

/** Span offsets are UTF-16 code units, as expected by textarea.setSelectionRange().
 * @param {string} body
 * @param {string} query
 * @param {{caseSensitive?: boolean}} [options]
 */
export function findInLocalDraft(body, query, options = {}) {
  const spans = [];
  const pattern = matchPattern(query, options.caseSensitive);
  if (typeof body !== "string" || body.length > MAX_DRAFT_LENGTH || !pattern) {
    return Object.freeze({ count: 0, spans: Object.freeze(spans) });
  }
  for (const match of body.matchAll(pattern)) {
    spans.push(Object.freeze({ start: match.index, end: match.index + match[0].length }));
  }
  return Object.freeze({ count: spans.length, spans: Object.freeze(spans) });
}

/** Replacement strings are LITERAL, even when they contain '$&' or '$1'.
 * @param {string} body
 * @param {string} query
 * @param {string} replacement
 * @param {{caseSensitive?: boolean}} [options]
 */
export function replaceAllInLocalDraft(body, query, replacement, options = {}) {
  if (typeof body !== "string" || typeof replacement !== "string"
      || body.length > MAX_DRAFT_LENGTH || replacement.length > MAX_REPLACEMENT_LENGTH) {
    throw new RangeError("Local draft or replacement exceeds the allowed limit");
  }
  const pattern = matchPattern(query, options.caseSensitive);
  if (!pattern) throw new RangeError("Search must contain 1 to 100 characters");
  let replacements = 0;
  const value = body.replace(pattern, () => {
    replacements += 1;
    return replacement;
  });
  if (value.length > MAX_DRAFT_LENGTH) {
    throw new RangeError("Result would exceed the 12,000-character draft limit");
  }
  return Object.freeze({ value, replacements });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-m05-local-editor]");
  const body = root?.querySelector("[data-m05-draft-body]");
  const preview = root?.querySelector("[data-m05-preview-body]");
  const findInput = root?.querySelector("[data-m05-search-query]");
  const replaceInput = root?.querySelector("[data-m05-search-replacement]");
  const matchCount = root?.querySelector("[data-m05-search-count]");
  const status = root?.querySelector("[data-m05-search-status]");
  const caseToggle = root?.querySelector("[data-m05-search-case]");
  const findButton = root?.querySelector("[data-m05-search-next]");
  const replaceSelectedButton = root?.querySelector("[data-m05-replace-selected]");
  const replaceAllButton = root?.querySelector("[data-m05-replace-all]");

  if (body && findInput && replaceInput && matchCount && status && caseToggle
      && findButton && replaceSelectedButton && replaceAllButton) {
    const options = () => ({ caseSensitive: caseToggle.checked });
    const scan = () => findInLocalDraft(body.value, findInput.value, options());
    const update = () => {
      const result = scan();
      matchCount.textContent = String(result.count);
      findButton.disabled = !result.count;
      replaceSelectedButton.disabled = !result.count;
      replaceAllButton.disabled = !result.count;
    };
    const report = (message) => { status.textContent = message; };
    const applyBody = (value) => {
      body.value = value;
      body.dispatchEvent(new Event("input", { bubbles: true }));
    };

    findButton.addEventListener("click", () => {
      const matches = scan().spans;
      if (!matches.length) {
        report("No matching text found in this local draft.");
        return;
      }
      const next = matches.find(({ start }) => start >= body.selectionEnd) ?? matches[0];
      body.focus();
      body.setSelectionRange(next.start, next.end);
      report("Matching text selected. Nothing was changed.");
    });

    replaceSelectedButton.addEventListener("click", () => {
      const { selectionStart: start, selectionEnd: end } = body;
      const match = scan().spans.find((span) => span.start === start && span.end === end);
      if (!match) {
        report("Find and select an exact match before replacing it.");
        return;
      }
      const updated = body.value.slice(0, start) + replaceInput.value + body.value.slice(end);
      if (updated.length > MAX_DRAFT_LENGTH) {
        report("Replacement would exceed the 12,000-character draft limit.");
        return;
      }
      applyBody(updated);
      body.focus();
      body.setSelectionRange(start, start + replaceInput.value.length);
      report("One occurrence replaced locally. Re-export Markdown to keep the change.");
    });

    replaceAllButton.addEventListener("click", () => {
      try {
        const result = replaceAllInLocalDraft(body.value, findInput.value, replaceInput.value, options());
        if (result.replacements) applyBody(result.value);
        report(result.replacements
          ? String(result.replacements) + " occurrences replaced locally. Re-export Markdown to keep changes."
          : "No occurrences to replace.");
      } catch {
        report("Replacement cannot be applied within the safe draft limits.");
      }
    });

    body.addEventListener("input", update);
    findInput.addEventListener("input", () => { update(); report(""); });
    replaceInput.addEventListener("input", () => report(""));
    caseToggle.addEventListener("change", update);
    if (preview && typeof MutationObserver !== "undefined") {
      new MutationObserver(update).observe(preview, { childList: true, characterData: true, subtree: true });
    }
    update();
  }
}
