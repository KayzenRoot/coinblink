/* global document, MutationObserver */
// Heuristic local citation hygiene. No network calls, storage, providers, approval or fact checking.
import { LOCAL_SOURCE_HEADING, listLocalSources, MAX_LOCAL_ARTICLE_LENGTH } from "./local-source-notes.mjs";

export const MAX_CITATION_HINTS = 8;
export const LOCAL_CITATION_AUDIT_STATUS = "LOCAL_HEURISTIC_ONLY_NOT_FACT_CHECKED";
const APPENDIX_MARKER = "\n\n" + LOCAL_SOURCE_HEADING + "\n";
const MARKER_PATTERN = /\[\^cb(\d+)\]/gu;
const REVIEW_PLACEHOLDER = /\b(?:TODO|FIXME|TBD|CITATION NEEDED|SOURCE NEEDED|FONTE PENDENTE|VERIFICAR FONTE|CHECAR FONTE)\b|\[(?:citation needed|source needed|fonte\??|verificar)\]/iu;
const NUMERIC_CLAIM = /(?:\b\d+(?:[.,]\d+)?\s*%|\b(?:R\$|US\$|\$)\s*\d+(?:[.,]\d+)?)/iu;

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
    const hasNumeric = NUMERIC_CLAIM.test(text) && !/\[\^cb\d+\]/u.test(text);
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

  let sources;
  try {
    sources = listLocalSources(body);
  } catch {
    return Object.freeze({
      status: "MALFORMED_SOURCE_NOTES_REPAIR_REQUIRED", malformedNotes: true,
      sourceCount: 0, citedSources: 0, missingDefinitionIds: freezeNumbers([]),
      unusedSourceIds: freezeNumbers([]), hints: Object.freeze([]), totalHints: 0,
    });
  }

  const idx = body.lastIndexOf(APPENDIX_MARKER);
  const prose = idx < 0 ? body : body.slice(0, idx);
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
        status.textContent = "Cannot evaluate modified or invalid source notes. Review the article manually.";
        note("Source notes are malformed, or the article exceeds the local size limit.");
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
