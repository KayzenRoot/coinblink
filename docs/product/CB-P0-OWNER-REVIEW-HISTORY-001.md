# CB-P0-OWNER-REVIEW-HISTORY-001 · Scoped P0 Work Order

**Source:** verified `main=788710d71b54658cdae0a8e733a8e2bdefd1ee60` immediately following the normal squash merge of PR #219. Target: M05 LOCAL-only synthetic Owner CMS.

## Audit / why this is NECESSARY
- M03 synthetic provenance → M05 D1 (#218) and M05 saved Markdown → M02 manual preview (#217) are already merged. Do not recreate them.
- M07-E board → protected draft editor is already implemented and covered by existing Chromium tests, despite open Issue #171's older planning language.
- M05 Owner review (#219) persists one immutable process decision per saved revision, but the existing GET/UI surfaces only the decision of the CURRENT revision. Previous immutable decisions therefore have no accessible Owner history.
- M05 contract insists on one Owner, no LIVE privilege, no rights clearance and no publishing from fixture review.

## Scope / constraints
- Extend existing authenticated GET `/local/articles/:id/review` with an ordered, bounded, read-only `history` of up to 100 immutable decisions and `historyLimit:100`, reading the existing D1 table. No new endpoint, schema, credentials, external provider call or privileged mutation.
- Current review remains bound to exact saved revision; superseded history is explicitly labeled not current. All decisions remain process notes, never publication or source-rights clearance.
- Render history with `textContent` only inside an Owner-only collapsible details panel; scrub on logout/401/change/new draft, and prevent late responses from restoring data across session/draft generations. Refresh visible history after successful POST.
- Preserve M05 WebAuthn session, same-origin and Fetch Metadata guard, existing XSS and D1 immutability protections, and M02 private manual export.
- Negative/regression tests: unauthenticated/cross-site/unknown-param/405/missing-draft, stale revisions, immutable record, no DB write on GET, ordering, current vs superseded, browser injection safety, private logout scrub and zero network egress.
- Explicit exclusions: ECC #209, M07 work, public routes, real authentication, scheduled/public publishing, LIVE news, remote D1, paid API, changes to CI rules or checkpoints, deploy or merge.

## Required evidence / STOP CONDITION
Exact-HEAD GitHub build, lint/typecheck, Node D1, M05 Chromium, module regressions, Gitleaks, SonarCloud 0 new issues/0 new hotspots, Socket Project Report SUCCESS and PR Alerts SUCCESS or justified no dependency change. Independent `kayzenweb3` review. Keep PR Draft / BLOCKED until evidence proves gates. No merge/deploy; only a later exact-specific Owner authorization may permit merge.
