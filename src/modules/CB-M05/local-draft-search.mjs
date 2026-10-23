/* global document, MutationObserver */
// Local-only find and replace for M05 drafts. No storage, network or HTML rendering.
export const MAX_SEARCH_LENGTH = 100;
export const MAX_REPLACEMENT_LENGTH = 200;
export const MAX_DRAFT_LENGTH = 12000;
const ESCAPABLE = /[.*+?^$(){}|[\]\\]/gu;

// Protect author-controlled source footnotes and claim-review queue from
// ordinary prose find/replace. Standalone browser asset: no relative imports.
const SOURCE_HEADING = "### CoinBlink source notes (unverified)";
const SOURCE_HEADING_PREFIX = "### CoinBlink source notes";
const CLAIM_HEADING = "### CoinBlink claim review queue (local only)";
const CLAIM_HEADING_PREFIX = "### CoinBlink claim review queue";
const SOURCE_MARKER = "\n\n" + SOURCE_HEADING + "\n";
const CLAIM_MARKER = "\n\n" + CLAIM_HEADING + "\n";
const SOURCE_LINE = /^\[\^cb([1-9]|1[0-2])\]: (.+) \| (https:\/\/\S+)$/u;
const CLAIM_LINE = /^\[CB-CLAIM-(0[1-9]|1[0-2]) \| (NEEDS_HUMAN_REVIEW|REVIEW_NOTED_NOT_VERIFIED) \| source=(none|cb(?:[1-9]|1[0-2]))\] (.{10,220})$/u;

function readLines(section, marker, limit) {
  const tail = section.slice(marker.length);
  const lines = tail.endsWith("\n") ? tail.slice(0, -1).split("\n") : tail.split("\n");
  if (!tail || lines.length < 1 || lines.length > limit) {
    throw new RangeError("Malformed local editorial notes");
  }
  return lines;
}

function validSourceUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { throw new RangeError("Invalid source-note URL"); }
  if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password
      || url.href !== rawUrl || rawUrl.length > 500) {
    throw new RangeError("Noncanonical source-note URL");
  }
}

function validateSourceNotes(section) {
  const sourceIds = new Set();
  for (const line of readLines(section, SOURCE_MARKER, 12)) {
    const matched = SOURCE_LINE.exec(line);
    if (!matched || sourceIds.has(matched[1]) || matched[2].length > 90
        || matched[2].includes("[") || matched[2].includes("]")
        || matched[2].includes("\\") || /[|<>\r\t]/u.test(matched[2])) {
      throw new RangeError("Invalid source-note line");
    }
    validSourceUrl(matched[3]);
    sourceIds.add(matched[1]);
  }
}

function validateClaimNotes(section) {
  const claimIds = new Set();
  for (const line of readLines(section, CLAIM_MARKER, 12)) {
    const matched = CLAIM_LINE.exec(line);
    if (!matched || claimIds.has(matched[1]) || /[|<>\r\n]/u.test(matched[4])) {
      throw new RangeError("Invalid or duplicate claim-review item");
    }
    claimIds.add(matched[1]);
  }
}

function editableProse(body) {
  const sourceAt = body.lastIndexOf(SOURCE_MARKER);
  const withClaims = sourceAt < 0 ? body : body.slice(0, sourceAt);
  if (withClaims.includes(SOURCE_HEADING_PREFIX)) {
    throw new RangeError("Malformed or duplicate source notes");
  }
  if (sourceAt >= 0) validateSourceNotes(body.slice(sourceAt));

  const claimAt = withClaims.lastIndexOf(CLAIM_MARKER);
  const prose = claimAt < 0 ? withClaims : withClaims.slice(0, claimAt);
  if (prose.includes(CLAIM_HEADING_PREFIX)) {
    throw new RangeError("Malformed or duplicate claim-review queue");
  }
  if (claimAt >= 0) validateClaimNotes(withClaims.slice(claimAt));
  return Object.freeze({ prose, notes: body.slice(prose.length) });
}

function checkedProseEdit(prose, notes) {
  const value = prose + notes;
  if (value.length > MAX_DRAFT_LENGTH) {
    throw new RangeError("Result would exceed the 12,000-character draft limit");
  }
  // Reject an edit that transforms article prose into a well-formed editorial
  // appendix (or creates malformed notes). Notes must be byte-for-byte intact.
  const verified = editableProse(value);
  if (verified.prose !== prose || verified.notes !== notes) {
    throw new RangeError("Replacement cannot create or alter editorial notes");
  }
  return value;
}

function matchPattern(query, caseSensitive) {
  if (typeof query !== "string" || query.length < 1 || query.length > MAX_SEARCH_LENGTH) return null;
  return new RegExp(query.replace(ESCAPABLE, String.raw`\$&`), caseSensitive ? "gu" : "giu");
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
  let prose;
  try { prose = editableProse(body).prose; }
  catch { return Object.freeze({ count: 0, spans: Object.freeze(spans) }); }
  for (const match of prose.matchAll(pattern)) {
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
  const { prose, notes } = editableProse(body);
  let replacements = 0;
  const revisedProse = prose.replace(pattern, () => {
    replacements += 1;
    return replacement;
  });
  const value = checkedProseEdit(revisedProse, notes);
  return Object.freeze({ value, replacements });
}

/**
 * Replace only a currently selected exact prose match, never a metadata span.
 * @param {string} body
 * @param {string} query
 * @param {string} replacement
 * @param {number} start
 * @param {number} end
 * @param {{caseSensitive?: boolean}} [options]
 */
export function replaceSelectedInLocalDraft(body, query, replacement, start, end, options = {}) {
  if (typeof body !== "string" || typeof replacement !== "string"
      || replacement.length > MAX_REPLACEMENT_LENGTH
      || !Number.isInteger(start) || !Number.isInteger(end)
      || !findInLocalDraft(body, query, options).spans.some((span) =>
        span.start === start && span.end === end)) {
    throw new RangeError("Selection or replacement is not a valid prose match");
  }
  const { prose, notes } = editableProse(body);
  const revisedProse = prose.slice(0, start) + replacement + prose.slice(end);
  return Object.freeze({
    value: checkedProseEdit(revisedProse, notes),
    caret: start + replacement.length,
  });
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-m05-local-editor]");
  const body = root?.querySelector("[data-m05-draft-body]");
  const toolbar = document.querySelector("[data-m05-local-search]");
  const preview = root?.querySelector("[data-m05-preview-body]");
  const findInput = toolbar?.querySelector("[data-m05-search-query]");
  const replaceInput = toolbar?.querySelector("[data-m05-search-replacement]");
  const matchCount = toolbar?.querySelector("[data-m05-search-count]");
  const status = toolbar?.querySelector("[data-m05-search-status]");
  const caseToggle = toolbar?.querySelector("[data-m05-search-case]");
  const findButton = toolbar?.querySelector("[data-m05-search-next]");
  const replaceSelectedButton = toolbar?.querySelector("[data-m05-replace-selected]");
  const replaceAllButton = toolbar?.querySelector("[data-m05-replace-all]");

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
      const hasMatch = scan().spans.some((span) => span.start === start && span.end === end);
      if (!hasMatch) {
        report("Find and select an exact match before replacing it.");
        return;
      }
      try {
        const result = replaceSelectedInLocalDraft(
          body.value, findInput.value, replaceInput.value, start, end, options());
        applyBody(result.value);
        body.focus();
        body.setSelectionRange(start, result.caret);
        report("One occurrence replaced locally. Re-export Markdown to keep the change.");
      } catch {
        report("Replacement rejected: check length, selection and editorial note integrity.");
      }
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
