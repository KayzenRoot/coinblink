/* global document, MutationObserver */
// Heuristic local citation hygiene. No network calls, storage, providers, approval or fact checking.
// This URL-bundled module must be standalone: relative imports from the emitted
// /_astro/ asset would cause 404 errors under strict CSP. Mirror the exact
// definition format of local-source-notes.mjs, never trusting user-edited text.
const LOCAL_SOURCE_HEADING = "### CoinBlink source notes (unverified)";
const MAX_LOCAL_ARTICLE_LENGTH = 12000;
const MAX_LOCAL_SOURCES = 12;

function canonicalSourceMetadata(matched, ids, urls) {
  const id = Number(matched[1]);
  const title = matched[2];
  const rawUrl = matched[3];
  if (title.length < 1 || title.length > 90 || title !== title.trim()
      || /[\r\n\t|<>]/u.test(title) || title.includes("[") || title.includes("]") || title.includes("\\")
      || rawUrl.length > 500 || /[\s|<>]/u.test(rawUrl)) {
    throw new RangeError("Invalid source label or URL");
  }
  let url;
  try { url = new URL(rawUrl); }
  catch { throw new RangeError("Invalid source URL"); }
  if (url.protocol !== "https:" || url.username || url.password
      || !url.hostname.includes(".") || url.hostname.endsWith(".")
      || url.href.length > 500 || url.href !== rawUrl
      || ids.has(id) || urls.has(rawUrl)) {
    throw new RangeError("Noncanonical or duplicate source note");
  }
  return Object.freeze({ id, title, url: rawUrl });
}

function parseSourceNotes(body) {
  if (typeof body !== "string" || body.length > MAX_LOCAL_ARTICLE_LENGTH) {
    throw new RangeError("Local article exceeds the size limit");
  }
  const position = body.lastIndexOf(APPENDIX_MARKER);
  if (position < 0) {
    if (body.includes(LOCAL_SOURCE_HEADING)) {
      throw new RangeError("Malformed source-note section");
    }
    return Object.freeze({ prose: body, sources: Object.freeze([]) });
  }
  const prose = body.slice(0, position);
  const suffix = body.slice(position + APPENDIX_MARKER.length);
  if (prose.includes(LOCAL_SOURCE_HEADING) || !suffix || suffix.endsWith("\n\n")) {
    throw new RangeError("Duplicate or malformed source-note section");
  }
  const lines = suffix.endsWith("\n") ? suffix.slice(0, -1).split("\n") : suffix.split("\n");
  if (lines.length < 1 || lines.length > MAX_LOCAL_SOURCES) {
    throw new RangeError("Invalid reference count");
  }
  const ids = new Set();
  const urls = new Set();
  const sources = [];
  for (const line of lines) {
    const matched = /^\[\^cb([1-9]|1[0-2])\]: (.+) \| (https:\/\/\S+)$/u.exec(line);
    if (!matched) throw new RangeError("Malformed source note");
    const source = canonicalSourceMetadata(matched, ids, urls);
    ids.add(source.id);
    urls.add(source.url);
    sources.push(source);
  }
  return Object.freeze({ prose, sources: Object.freeze(sources) });
}

export const MAX_CITATION_HINTS = 8;
export const LOCAL_CITATION_AUDIT_STATUS = "LOCAL_HEURISTIC_ONLY_NOT_FACT_CHECKED";
const APPENDIX_MARKER = "\n\n" + LOCAL_SOURCE_HEADING + "\n";
const LOCAL_CLAIM_HEADING = "### CoinBlink claim review queue (local only)";
const LOCAL_CLAIM_MARKER = "\n\n" + LOCAL_CLAIM_HEADING + "\n";
const LOCAL_CLAIM_LINE = /^\[CB-CLAIM-(0[1-9]|1[0-2]) \| (NEEDS_HUMAN_REVIEW|REVIEW_NOTED_NOT_VERIFIED) \| source=(none|cb(?:[1-9]|1[0-2]))\] (.{10,220})$/u;

// Ignore the editor's own review queue when counting citations and text hints.
// Malformed or duplicate queue entries fail closed rather than appearing clean.
function stripLocalClaimNotes(body) {
  const start = body.lastIndexOf(LOCAL_CLAIM_MARKER);
  if (start < 0) {
    if (body.includes(LOCAL_CLAIM_HEADING)) throw new RangeError("Malformed claim-review queue");
    return body;
  }
  const prose = body.slice(0, start);
  const section = body.slice(start + LOCAL_CLAIM_MARKER.length);
  if (prose.includes(LOCAL_CLAIM_HEADING) || !section) {
    throw new RangeError("Duplicate or empty claim-review queue");
  }
  const entries = section.split("\n");
  if (entries.length > 12) throw new RangeError("Claim-review queue exceeds its limit");
  const ids = new Set();
  for (const line of entries) {
    const match = LOCAL_CLAIM_LINE.exec(line);
    if (!match || ids.has(Number(match[1])) || /[|<>\r\n]/u.test(match[4])) {
      throw new RangeError("Malformed or duplicate claim-review entry");
    }
    ids.add(Number(match[1]));
  }
  return prose;
}
const MARKER_PATTERN = /\[\^cb(\d+)\]/gu;
const REVIEW_PLACEHOLDER = /\b(?:TODO|FIXME|TBD|CITATION NEEDED|SOURCE NEEDED|FONTE PENDENTE|VERIFICAR FONTE|CHECAR FONTE)\b|\[(?:citation needed|source needed|fonte\??|verificar)\]/iu;
const NUMERIC_PERCENT = /\b\d+(?:[.,]\d+)?\s*%/iu;
const NUMERIC_CURRENCY = /\b(?:R|US)?\$\s*\d+(?:[.,]\d+)?/iu;

function freezeNumbers(values) {
  return Object.freeze([...values].sort((a, b) => a - b));
}

function makeHints(prose) {
  const hints = [];
  let total = 0;
  // Split into paragraphs, not individual sentences: indicators are *suggestions*,
  // never claims that a paragraph or individual statistic is verified or false.
  for (const paragraph of prose.split(/\n\s*\n/gu)) {
    const text = paragraph.trim();
    if (!text) continue;
    const hasPlaceholder = REVIEW_PLACEHOLDER.test(text);
    const hasNumeric = (NUMERIC_PERCENT.test(text) || NUMERIC_CURRENCY.test(text)) && !/\[\^cb\d+\]/u.test(text);
    if (!hasPlaceholder && !hasNumeric) continue;
    total += 1;
    if (hints.length < MAX_CITATION_HINTS) {
      hints.push(Object.freeze({
        kind: hasPlaceholder ? "explicit_review_marker" : "numeric_claim_without_local_citation",
        excerpt: text.replace(/\s+/gu, " ").slice(0, 120),
      }));
    }
  }
  return Object.freeze({ hints: Object.freeze(hints), total });
}

/**
 * Validate *structural* citation hygiene in a local article body.
 * All counts exclude the source-note definitions appendix. A citation marker is
 * NOT evidence that an underlying claim was checked.
 * @param {unknown} body
 */
export function analyzeLocalCitationHygiene(body) {
  if (typeof body !== "string" || body.length > MAX_LOCAL_ARTICLE_LENGTH) {
    return Object.freeze({
      status: "INVALID_LOCAL_DRAFT", malformedNotes: true,
      sourceCount: 0, citedSources: 0, missingDefinitionIds: freezeNumbers([]),
      unusedSourceIds: freezeNumbers([]), hints: Object.freeze([]), totalHints: 0,
    });
  }

  let parsed;
  try {
    parsed = parseSourceNotes(body);
  } catch {
    return Object.freeze({
      status: "MALFORMED_SOURCE_NOTES_REPAIR_REQUIRED", malformedNotes: true,
      sourceCount: 0, citedSources: 0, missingDefinitionIds: freezeNumbers([]),
      unusedSourceIds: freezeNumbers([]), hints: Object.freeze([]), totalHints: 0,
    });
  }

  let prose;
  try {
    prose = stripLocalClaimNotes(parsed.prose);
  } catch {
    return Object.freeze({
      status: "MALFORMED_CLAIM_NOTES_REPAIR_REQUIRED", malformedNotes: true,
      sourceCount: 0, citedSources: 0, missingDefinitionIds: freezeNumbers([]),
      unusedSourceIds: freezeNumbers([]), hints: Object.freeze([]), totalHints: 0,
    });
  }
  const { sources } = parsed;
  const used = new Set();
  for (const match of prose.matchAll(MARKER_PATTERN)) used.add(Number(match[1]));
  const known = new Set(sources.map((source) => source.id));
  const missing = freezeNumbers([...used].filter((id) => !known.has(id)));
  const unused = freezeNumbers(sources.filter((source) => !used.has(source.id)).map((source) => source.id));
  const { hints, total } = makeHints(prose);
  return Object.freeze({
    status: LOCAL_CITATION_AUDIT_STATUS, malformedNotes: false,
    sourceCount: sources.length, citedSources: sources.length - unused.length,
    missingDefinitionIds: missing, unusedSourceIds: unused,
    hints, totalHints: total,
  });
}

if (typeof document !== "undefined") {
  const editor = document.querySelector("[data-m05-local-editor]");
  const panel = document.querySelector("[data-m05-citation-audit]");
  const body = editor?.querySelector("[data-m05-draft-body]");
  const preview = editor?.querySelector("[data-m05-preview-body]");
  const badge = panel?.querySelector("[data-m05-audit-count]");
  const findings = panel?.querySelector("[data-m05-audit-findings]");
  const status = panel?.querySelector("[data-m05-audit-status]");
  if (body && panel && badge && findings && status) {
    const render = () => {
      const audit = analyzeLocalCitationHygiene(body.value);
      findings.replaceChildren();
      const note = (message) => {
        const li = document.createElement("li");
        li.textContent = message;
        findings.append(li);
      };
      if (audit.malformedNotes) {
        badge.textContent = "Repair needed";
        status.textContent = "Cannot evaluate malformed source or claim-review notes. Review the article manually.";
        note("Source or claim-review notes are malformed, or the article exceeds the local size limit.");
        return;
      }
      const count = audit.missingDefinitionIds.length + audit.unusedSourceIds.length + audit.totalHints;
      badge.textContent = String(count) + " review signal(s)";
      if (audit.missingDefinitionIds.length) {
        note("Citations without a defined source: "
          + audit.missingDefinitionIds.map((id) => "[^cb" + id + "]").join(", "));
      }
      if (audit.unusedSourceIds.length) {
        note("Sources not cited in article text: "
          + audit.unusedSourceIds.map((id) => "[^cb" + id + "]").join(", "));
      }
      for (const hint of audit.hints) {
        note((hint.kind === "explicit_review_marker" ? "Review placeholder: " : "Numeric claim to review: ")
          + hint.excerpt);
      }
      if (audit.totalHints > audit.hints.length) {
        note(String(audit.totalHints - audit.hints.length) + " additional review cues not displayed.");
      }
      if (!count) note("No structural citation flags detected. This is NOT a fact check or approval.");
      status.textContent = "Local pattern scan only. Links, statistics, authorship, truth and rights are NOT checked.";
    };
    body.addEventListener("input", render);
    if (preview && typeof MutationObserver !== "undefined") {
      new MutationObserver(render).observe(preview, { childList: true, characterData: true, subtree: true });
    }
    render();
  }
}
