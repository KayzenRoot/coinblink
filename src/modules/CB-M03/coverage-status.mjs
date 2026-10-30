// CB-M11-P1-COVERAGE-STATUS-001: content-free coverage counts.
//
// The projection reads one collected snapshot, groups headlines with the same
// mechanical cross-coverage rules the reader uses, and reports only counts.
// No headline, link, excerpt or article timestamp leaves this module.
import { clusterLiveHeadlines } from "./live-clusters.mjs";
import { LIVE_NEWS_SOURCES } from "./rss-sources.mjs";

const MODE = "LIVE_THIRD_PARTY";
const DISCLAIMER = "Counts only. This response contains no headline text, links or article timestamps.";

function emptyProjection(status, reason) {
  return Object.freeze({
    status,
    mode: MODE,
    reason,
    stories: 0,
    headlines: 0,
    rights: "NO_CONTENT",
    publishers: Object.freeze([]),
    disclaimer: DISCLAIMER,
  });
}

/**
 * @typedef {object} CoverageStatus
 * @property {string} status
 * @property {string} mode
 * @property {string | null} [reason]
 * @property {string} [collectedAt]
 * @property {number} stories
 * @property {number} headlines
 * @property {string} rights
 * @property {ReadonlyArray<{id: string, stories: number}>} publishers
 * @property {string} disclaimer
 */

/**
 * @param {unknown} snapshot
 * @returns {Readonly<CoverageStatus>}
 */
export function buildCoverageStatus(snapshot) {
  if (snapshot === null || typeof snapshot !== "object" || typeof snapshot.status !== "string") {
    throw new TypeError("a live-news snapshot is required");
  }
  if (snapshot.status === "DISABLED" || snapshot.status === "UNAVAILABLE") {
    return emptyProjection(
      snapshot.status === "DISABLED" ? "disabled" : "unavailable",
      typeof snapshot.reason === "string" ? snapshot.reason : null,
    );
  }
  if (snapshot.status !== "LIVE_HEADLINES") throw new TypeError("unknown live-news snapshot status");
  const clusters = clusterLiveHeadlines(snapshot.items);
  const counts = new Map();
  for (const cluster of clusters) {
    const seen = new Set();
    for (const member of cluster.members) {
      if (seen.has(member.sourceId)) continue;
      seen.add(member.sourceId);
      counts.set(member.sourceId, (counts.get(member.sourceId) ?? 0) + 1);
    }
  }
  const publishers = LIVE_NEWS_SOURCES
    .map((source) => ({ id: source.id, stories: counts.get(source.id) ?? 0 }))
    .sort((left, right) => right.stories - left.stories || left.id.localeCompare(right.id))
    .map((row) => Object.freeze(row));
  return Object.freeze({
    status: "ok",
    mode: MODE,
    collectedAt: snapshot.collectedAt,
    stories: clusters.length,
    headlines: Array.isArray(snapshot.items) ? snapshot.items.length : 0,
    rights: snapshot.rightsStatus,
    publishers: Object.freeze(publishers),
    disclaimer: DISCLAIMER,
  });
}
