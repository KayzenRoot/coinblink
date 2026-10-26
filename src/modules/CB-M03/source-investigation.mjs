// CB-M03 P0: evidence-aware, read-only inspection of invented sources.
// No network, D1, publication, publisher assertions or private editorial data.
import { inspectSyntheticSource, listSyntheticSources, validateSyntheticSourceUrl } from "./source-lab.mjs";

const empty = Object.freeze({ status: "NOT_FOUND", report: null });

export function inspectSyntheticProvenance(id) {
  if (typeof id !== "string" || !/^demo-source-[a-z]{1,16}$/u.test(id)) return empty;
  const row = listSyntheticSources().items.find(item => item.id === id);
  if (!row) return empty;
  const outcome = inspectSyntheticSource(row);
  const checks = Object.freeze([
    Object.freeze({ code: "URL", label: "Example-only source address",
      state: validateSyntheticSourceUrl(row.originUrl) ? "SYNTHETIC_ONLY" : "INVALID" }),
    Object.freeze({ code: "RIGHTS", label: "Explicit reuse permission",
      state: row.licensing === "APPROVED" ? "MOCK_ASSERTION_ONLY" : "NOT_CLEARED" }),
    Object.freeze({ code: "CAPTURE", label: "Evidence collection timestamp",
      state: row.fetchedAt === null ? "NOT_CAPTURED" : "UNVERIFIED" }),
    Object.freeze({ code: "DIGEST", label: "Verifiable source evidence digest",
      state: row.evidenceDigest === null ? "NO_DIGEST" : "UNVERIFIED" }),
  ]);
  return Object.freeze({ status: "MOCK_REPORT_NOT_PUBLISHED",
    report: Object.freeze({
      id: row.id, label: row.label, licensing: row.licensing,
      inspection: outcome.state, publiclyUsable: false,
      mode: "MOCK", checks,
      action: outcome.state === "UNAVAILABLE" ? "AWAIT_PROVIDER_AND_RIGHTS" : "AWAIT_LICENSE_AND_EVIDENCE",
    }),
  });
}

export function summarizeSyntheticProvenance() {
  const rows = listSyntheticSources().items;
  const unavailable = rows.filter(row => inspectSyntheticSource(row).state === "UNAVAILABLE").length;
  return Object.freeze({ mode: "MOCK", state: "REVIEW_ONLY_NO_INGESTION",
    total: rows.length, rightsDenied: rows.length - unavailable, unavailable,
    captured: 0, publiclyUsable: 0,
  });
}

export function compareSyntheticProvenance(a, b) {
  const left = inspectSyntheticProvenance(a).report;
  const right = inspectSyntheticProvenance(b).report;
  if (!left || !right || left.id === right.id) {
    return Object.freeze({ status: "INVALID_PAIR", left: null, right: null });
  }
  const pick = report => Object.freeze({ id: report.id,
    label: report.label, inspection: report.inspection, licensing: report.licensing,
    blockers: Object.freeze(report.checks.filter(check => check.state !== "SYNTHETIC_ONLY")
      .map(check => check.code)) });
  return Object.freeze({ status: "MOCK_COMPARISON_NOT_PUBLICATION",
    left: pick(left), right: pick(right), bothBlocked: true });
}
