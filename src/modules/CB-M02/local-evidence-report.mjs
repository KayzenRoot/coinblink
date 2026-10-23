// M02 private reader: reuse M05's existing structural citation audit. Never fact-check.
import { analyzeLocalCitationHygiene } from "../CB-M05/local-citation-audit.mjs";

export const LOCAL_EVIDENCE_STATUS = "LOCAL_STRUCTURAL_REVIEW_NOT_FACT_CHECKED";

export function buildLocalEvidenceReport(body) {
  const audit = analyzeLocalCitationHygiene(body);
  const signals = [];
  if (audit.malformedNotes) {
    signals.push(Object.freeze({ kind: "repair", value: audit.status }));
  } else {
    for (const id of audit.missingDefinitionIds) {
      signals.push(Object.freeze({ kind: "missing", value: "[^cb" + id + "]" }));
    }
    for (const id of audit.unusedSourceIds) {
      signals.push(Object.freeze({ kind: "unused", value: "[^cb" + id + "]" }));
    }
    for (const hint of audit.hints) {
      signals.push(Object.freeze({ kind: hint.kind, value: hint.excerpt }));
    }
  }
  return Object.freeze({
    status: LOCAL_EVIDENCE_STATUS,
    requiresRepair: audit.malformedNotes,
    sourceCount: audit.sourceCount,
    citedSources: audit.citedSources,
    signalCount: audit.malformedNotes ? 1
      : audit.missingDefinitionIds.length + audit.unusedSourceIds.length + audit.totalHints,
    hiddenHints: audit.totalHints - audit.hints.length,
    signals: Object.freeze(signals),
  });
}
