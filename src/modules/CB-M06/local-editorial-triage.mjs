// CB-M06: private read-only triage over an already authenticated LOCAL D1 listing.
// No new read, publication action, licensing assertion, global totals or telemetry.
import { createLocalEditorialInsights } from "./local-editorial-insights.mjs";

export function createLocalEditorialTriage(queue, insights) {
  if (!insights || typeof insights !== "object" ||
      insights.mode !== "LOCAL_SYNTHETIC" || insights.source !== "CMS_D1_LOCAL" ||
      insights.status !== "MEASURED_LOCAL") {
    throw new TypeError("LOCAL triage requires an authenticated measured insights snapshot");
  }
  // Reuse the canonical strict validator for bounded rows, timestamps and IDs.
  const validated = createLocalEditorialInsights(queue, insights.asOfUTC);
  if (validated.listingScope !== insights.listingScope ||
      validated.listedDraftsCount !== insights.listedDraftsCount ||
      validated.missingCreditListed !== insights.missingCreditListed ||
      validated.olderThanSevenDaysListed !== insights.olderThanSevenDaysListed) {
    throw new TypeError("LOCAL triage snapshot is inconsistent with the authenticated list");
  }
  const observedSeconds = Date.parse(insights.asOfUTC) / 1000;
  const items = queue.rows.map(row => {
    if (typeof row.title !== "string" || row.title.length < 8 ||
        row.title.length > 140 || row.title.trim() !== row.title) {
      throw new TypeError("Invalid LOCAL triage title");
    }
    const missingCredit = row.creditStatus === "CREDIT_MISSING";
    const aged = observedSeconds - row.updatedAtSeconds >= 7 * 86400;
    const attention = missingCredit && aged ? "CREDIT_AND_AGED"
      : missingCredit ? "CREDIT_MISSING"
        : aged ? "AGED_DRAFT" : "VERIFY_SOURCE";
    const reasons = Object.freeze([
      ...(missingCredit ? ["CREDIT_MISSING"] : []),
      ...(aged ? ["NO_EDIT_7_DAYS"] : []),
      "SOURCE_VERIFICATION_PENDING",
    ]);
    return Object.freeze({
      id: row.id, title: row.title, revision: row.revision,
      updatedAtSeconds: row.updatedAtSeconds,
      attention, reasons, creditMissing: missingCredit, aged,
      publishingStatus: "DRAFT_ONLY",
    });
  });
  const rank = item => Number(item.creditMissing) * 2 + Number(item.aged);
  items.sort((a,b) => rank(b) - rank(a) ||
    a.updatedAtSeconds - b.updatedAtSeconds || a.id.localeCompare(b.id));
  const total = items.length;
  return Object.freeze({
    mode: "LOCAL_SYNTHETIC", source: "CMS_D1_LOCAL",
    status: "MEASURED_LOCAL", asOfUTC: insights.asOfUTC,
    listingScope: insights.listingScope, totalListed: total,
    requiringCredit: items.filter(item => item.creditMissing).length,
    agedListed: items.filter(item => item.aged).length,
    requiringBoth: items.filter(item => item.creditMissing && item.aged).length,
    verificationStatus: "NOT_VERIFIED", publishingStatus: "DISABLED",
    items: Object.freeze(items),
  });
}
