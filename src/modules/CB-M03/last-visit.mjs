// CB-M03-P1-LAST-VISIT-001: mark headlines newer than the reader's last visit.
//
// The timestamp lives only in this browser. Nothing is sent, no account is
// involved and a missing or corrupted value simply means "no markers today".
export const LIVE_LAST_VISIT_KEY = "coinblink.live.last-visit.v1";

/** Parse a stored ISO timestamp into milliseconds, or null when unusable. */
export function parseLastVisit(value) {
  if (typeof value !== "string" || value === "") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True only when the headline carries a valid time strictly after the visit. */
export function isNewSince(publishedAt, lastVisitMs) {
  if (!Number.isFinite(lastVisitMs)) return false;
  if (typeof publishedAt !== "string" || publishedAt === "") return false;
  const published = Date.parse(publishedAt);
  return Number.isFinite(published) && published > lastVisitMs;
}

/** How many of the listed headlines are newer than the stored visit. */
export function countNewSince(items, lastVisitMs) {
  if (!Array.isArray(items)) return 0;
  let count = 0;
  for (const item of items) {
    if (item !== null && typeof item === "object" && isNewSince(item.publishedAt, lastVisitMs)) {
      count += 1;
    }
  }
  return count;
}
