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


// P0 LOCAL-only editorial activity from the already-authenticated, bounded
// GET /local/articles result. Never derives global totals or publishes titles.
export function createLocalEditorialActivity(drafts) {
  if (!Array.isArray(drafts) || drafts.length > 100) {
    throw new TypeError('Editorial activity requires a bounded authenticated LOCAL listing');
  }
  const ids = new Set();
  const rows = drafts.map(draft => {
    if (!draft || typeof draft !== 'object' || Array.isArray(draft) ||
        typeof draft.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(draft.id) ||
        ids.has(draft.id) || typeof draft.title !== 'string' ||
        draft.title.length < 8 || draft.title.length > 140 ||
        draft.status !== 'draft' ||
        !Number.isSafeInteger(draft.revision) || draft.revision < 1 ||
        !Number.isSafeInteger(draft.updated_at) ||
        draft.updated_at < 0 || draft.updated_at > 253402300799) {
      throw new TypeError('Invalid LOCAL editorial activity row');
    }
    ids.add(draft.id);
    return {
      id: draft.id,
      title: draft.title,
      revision: draft.revision,
      updatedAtSeconds: draft.updated_at,
      updatedAtUTC: new Date(draft.updated_at * 1000).toISOString(),
    };
  });
  rows.sort((a, b) => b.updatedAtSeconds - a.updatedAtSeconds ||
    a.id.localeCompare(b.id));
  const recent = Object.freeze(rows.slice(0, 5).map(row => Object.freeze({
    id: row.id, title: row.title, revision: row.revision,
    updatedAtUTC: row.updatedAtUTC,
  })));
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC',
    source: 'CMS_D1_LOCAL',
    status: 'MEASURED_LOCAL',
    listingScope: rows.length === 100 ? 'UP_TO_100_LISTED' : 'MEASURED_LOCAL',
    revisedListedDraftsCount: rows.filter(row => row.revision > 1).length,
    lastUpdatedUTC: rows[0]?.updatedAtUTC ?? null,
    recent,
  });
}

/**
 * A private read-only review queue computed strictly from an authenticated
 * and bounded LOCAL D1 draft listing. The presence of a source URL never
 * proves verification, rights, licensing or publication readiness.
 */
export function createLocalReviewQueue(drafts) {
  // This function is also embedded into the protected LOCAL UI via toString().
  // All helpers must therefore remain self-contained inside its function body.
  // PRIVATE Owner notes never belong in M06 queue rows.
  const ownerProcessStatus = new Map([
    ['PREVIEW_REVIEWED', 'PRIVATE_PREVIEW_REVIEWED'],
    ['CHANGES_REQUESTED', 'PRIVATE_CHANGES_REQUESTED'],
  ]);
  function currentOwnerProcessStatus(decision) {
    if (decision === undefined) return 'NOT_OBSERVED';
    if (decision === null) return 'CURRENT_REVISION_UNREVIEWED';
    return ownerProcessStatus.get(decision) ?? null;
  }
  // Also validates duplicate IDs, draft status, revisions and Unix seconds.
  createLocalEditorialActivity(drafts);
  const rows = drafts.map(draft => {
    const ownerProcessStatus = currentOwnerProcessStatus(draft.current_review_decision);
    if (typeof draft.author_label !== 'string' || draft.author_label.length > 80 ||
        typeof draft.source_url !== 'string' || draft.source_url.length > 500 ||
        ownerProcessStatus === null) {
      throw new TypeError('Invalid LOCAL review metadata');
    }
    // Missing field in legacy model-only fixtures is NOT_OBSERVED.
    // Real authenticated D1 returns an exact-revision decision or null.
    return Object.freeze({
      id: draft.id,
      title: draft.title,
      revision: draft.revision,
      updatedAtSeconds: draft.updated_at,
      creditStatus: draft.author_label.trim() ? 'CREDIT_PRESENT_UNVERIFIED' : 'CREDIT_MISSING',
      sourceStatus: 'SOURCE_VERIFICATION_PENDING',
      publishingStatus: 'DRAFT_ONLY', ownerProcessStatus,
    });
  });
  rows.sort((a,b) => b.updatedAtSeconds - a.updatedAtSeconds || a.id.localeCompare(b.id));
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC', source: 'CMS_D1_LOCAL',
    status: 'MEASURED_LOCAL',
    listingScope: rows.length === 100 ? 'UP_TO_100_LISTED' : 'MEASURED_LOCAL',
    totalListed: rows.length,
    missingCreditListed: rows.filter(row => row.creditStatus === 'CREDIT_MISSING').length,
    currentUnreviewedListed: rows.filter(row => row.ownerProcessStatus === 'CURRENT_REVISION_UNREVIEWED').length,
    privatePreviewReviewedListed: rows.filter(row => row.ownerProcessStatus === 'PRIVATE_PREVIEW_REVIEWED').length,
    privateChangesRequestedListed: rows.filter(row => row.ownerProcessStatus === 'PRIVATE_CHANGES_REQUESTED').length,
    rows: Object.freeze(rows),
  });
}
