// Owner dashboard P0: immutable summary of an already-authorized LOCAL D1 listing.
// No new database query, analytics, publication, endpoint or real Owner login.
export const OWNER_DASHBOARD_MODE = 'LOCAL_SYNTHETIC';
export const OWNER_DASHBOARD_SOURCE = 'CMS_D1_LOCAL';
export const OWNER_DASHBOARD_LIST_LIMIT = 100;

/**
 * Only call after GET /local/articles (or its /admin test alias) succeeds for
 * the synthetic Owner session. The source intentionally returns at most 100 rows.
 * Nothing about the complete table count or other services is inferred.
 * @param {unknown} drafts
 * @param {unknown} asOfUTC
 */
export function createLocalOwnerDashboard(drafts, asOfUTC) {
  if (!Array.isArray(drafts) || drafts.length > 100 ||
      drafts.some(row => !row || typeof row !== 'object' || Array.isArray(row)) ||
      typeof asOfUTC !== 'string' || !Number.isFinite(Date.parse(asOfUTC)) ||
      new Date(asOfUTC).toISOString() !== asOfUTC) {
    throw new TypeError('An authenticated, bounded LOCAL draft list and UTC observation time are required');
  }
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC',
    source: 'CMS_D1_LOCAL',
    asOfUTC,
    listedDraftsCount: drafts.length,
    listingLimit: 100,
    draftsStatus: 'MEASURED_LOCAL',
    newsStatus: 'NOT_CONNECTED',
    sourcesStatus: 'NOT_CLEARED',
    marketsStatus: 'UNAVAILABLE',
    publishingStatus: 'DISABLED',
  });
}
