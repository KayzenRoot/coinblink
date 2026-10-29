// CB-M03-P1-PRIVATE-INTAKE-001: evaluate collected headlines against the
// private-review admission gate.
//
// The registry is deliberately empty. A source may only enter private review
// after an owner-approved rights reference exists, so today every candidate is
// denied. This module measures that truth instead of inventing a licence, and
// it stores nothing: the review is a projection of the current collection.
import { evaluateSourceEligibility } from "./ingestion/source-eligibility.mjs";

export const LIVE_INTAKE_REGISTRY = Object.freeze([]);
export const LIVE_INTAKE_NO_SOURCE = "NO_TRUSTED_SOURCE_REGISTERED";
export const LIVE_INTAKE_GATE_DENIED = "GATE_DENIED";
export const LIVE_INTAKE_NO_DATE = "NO_PUBLICATION_TIME";

function utcSeconds(iso) {
  if (typeof iso !== "string") return null;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString().replace(/\.\d{3}Z$/u, "Z");
}

/** A stable, pattern-safe identifier derived from the publisher's own path. */
function externalIdOf(link) {
  try {
    const path = new URL(link).pathname
      .replace(/[^A-Za-z0-9._:-]/gu, "-")
      .replace(/^[^A-Za-z0-9]+/u, "");
    return path.slice(0, 255) || "root";
  } catch {
    return "unparsable";
  }
}

function sourceSummary(items, registry) {
  const registered = new Set(registry.map((source) => source?.id).filter((id) => typeof id === "string"));
  const counts = new Map();
  for (const item of items) {
    const current = counts.get(item.sourceId) ?? { id: item.sourceId, name: item.sourceName, denied: 0, admitted: 0 };
    if (item.decision === "PRIVATE_REVIEW_ONLY") current.admitted += 1;
    else current.denied += 1;
    counts.set(item.sourceId, current);
  }
  return Object.freeze([...counts.values()].map((entry) => Object.freeze({
    id: entry.id,
    name: entry.name,
    registered: registered.has(entry.id),
    admitted: entry.admitted,
    denied: entry.denied,
  })));
}

/**
 * Project one live collection through the admission gate.
 * @param {unknown} snapshot - a LIVE_HEADLINES snapshot from readLiveNews
 * @param {{registry?: Array<object>}} [options] - trusted server-side registry
 */
export function buildLiveIntakeReview(snapshot, options = {}) {
  if (snapshot === null || typeof snapshot !== "object" || snapshot.status !== "LIVE_HEADLINES" ||
      !Array.isArray(snapshot.items)) {
    throw new TypeError("a LIVE_HEADLINES snapshot is required");
  }
  const { registry = LIVE_INTAKE_REGISTRY } = options ?? {};
  if (!Array.isArray(registry)) throw new TypeError("the trusted registry must be an array");
  const items = [];
  let skippedUndated = 0;
  for (const item of snapshot.items) {
    if (item === null || typeof item !== "object") continue;
    const publishedAt = utcSeconds(item.publishedAt);
    if (publishedAt === null) {
      skippedUndated += 1;
      continue;
    }
    const candidate = {
      sourceId: item.sourceId,
      externalId: externalIdOf(item.link),
      originUrl: item.link,
      title: item.title,
      publishedAt,
    };
    const decision = evaluateSourceEligibility(candidate, registry);
    const denied = decision.status !== "PRIVATE_REVIEW_ONLY";
    items.push(Object.freeze({
      externalId: candidate.externalId,
      title: item.title,
      link: item.link,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      decision: decision.status,
      reason: denied ? (registry.length === 0 ? LIVE_INTAKE_NO_SOURCE : LIVE_INTAKE_GATE_DENIED) : null,
      rightsRef: denied ? null : decision.rightsRef,
    }));
  }
  const frozen = Object.freeze(items);
  const admitted = frozen.filter((item) => item.decision === "PRIVATE_REVIEW_ONLY").length;
  return Object.freeze({
    status: "INTAKE_GATE_MEASURED",
    mode: "PRIVATE_REVIEW_INTAKE",
    publicationAllowed: false,
    storageAllowed: false,
    rightsStatus: "NO_RIGHTS_REFERENCE_APPROVED",
    registrySize: registry.length,
    evaluated: frozen.length,
    admitted,
    denied: frozen.length - admitted,
    skippedUndated,
    sources: sourceSummary(frozen, registry),
    items: frozen,
  });
}
