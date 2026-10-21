// CB-M06 LOCAL-only editorial command-center insights.
// Derives bounded counts from an already-authenticated D1 review queue.
// No audience analytics, publishing, licensing assertion, I/O or draft text.
export function createLocalEditorialInsights(queue, asOfUTC) {
  if (!queue || typeof queue !== 'object' || queue.mode !== 'LOCAL_SYNTHETIC' ||
      queue.source !== 'CMS_D1_LOCAL' || queue.status !== 'MEASURED_LOCAL' ||
      !Array.isArray(queue.rows) || queue.rows.length > 100 ||
      queue.totalListed !== queue.rows.length ||
      queue.listingScope !== (queue.rows.length === 100 ? 'UP_TO_100_LISTED' : 'MEASURED_LOCAL') ||
      typeof asOfUTC !== 'string' || !Number.isFinite(Date.parse(asOfUTC)) ||
      new Date(asOfUTC).toISOString() !== asOfUTC) {
    throw new TypeError('Authenticated, bounded LOCAL review queue and canonical UTC observation required');
  }
  const observedSeconds = Date.parse(asOfUTC) / 1000;
  const todayUTC = Math.floor(observedSeconds / 86400);
  const startOfSevenDays = todayUTC - 6;
  const daily = Array.from({ length: 7 }, (_, index) => ({
    dayUTC: new Date((startOfSevenDays + index) * 86400000).toISOString().slice(0, 10),
    lastEditedListedDrafts: 0,
  }));
  let missingCredit = 0;
  let revised = 0;
  let olderThanSevenDays = 0;
  let editedLast24Hours = 0;
  const ids = new Set();
  for (const row of queue.rows) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(row.id) || ids.has(row.id) ||
        !Number.isSafeInteger(row.revision) || row.revision < 1 ||
        !Number.isSafeInteger(row.updatedAtSeconds) || row.updatedAtSeconds < 0 ||
        row.updatedAtSeconds > observedSeconds ||
        !['CREDIT_MISSING', 'CREDIT_PRESENT_UNVERIFIED'].includes(row.creditStatus) ||
        row.sourceStatus !== 'SOURCE_VERIFICATION_PENDING' ||
        row.publishingStatus !== 'DRAFT_ONLY') {
      throw new TypeError('Invalid or future-dated private LOCAL review metadata');
    }
    ids.add(row.id);
    if (row.creditStatus === 'CREDIT_MISSING') missingCredit++;
    if (row.revision > 1) revised++;
    if (observedSeconds - row.updatedAtSeconds >= 7 * 86400) olderThanSevenDays++;
    if (observedSeconds - row.updatedAtSeconds < 86400) editedLast24Hours++;
    const dayIndex = Math.floor(row.updatedAtSeconds / 86400) - startOfSevenDays;
    if (dayIndex >= 0 && dayIndex < daily.length) daily[dayIndex].lastEditedListedDrafts++;
  }
  return Object.freeze({
    mode: 'LOCAL_SYNTHETIC', source: 'CMS_D1_LOCAL',
    status: 'MEASURED_LOCAL', listingScope: queue.listingScope, asOfUTC,
    listedDraftsCount: queue.rows.length,
    missingCreditListed: missingCredit, revisedListed: revised,
    olderThanSevenDaysListed: olderThanSevenDays,
    editedLast24HoursListed: editedLast24Hours,
    dailyLastEditsUTC: Object.freeze(daily.map(row => Object.freeze(row))),
    sourceVerificationStatus: 'PENDING', publishingStatus: 'DISABLED',
  });
}
