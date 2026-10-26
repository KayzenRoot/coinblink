# CB-P0-OWNER-REVIEW-QUEUE-001 · M05 Current-Revision Owner Decisions → M06 Private Review Queue

**Exact main baseline:** `8f05937d1a1e66c9300f4ec1a5f291c03c64efe6`; **exclusive branch:** `feat/cb-p0-owner-review-queue-001`.
## Evidence-grounded gap and nonduplication
M05 already stores immutable Owner process reviews and their bounded history (#219/#220). M06's review queue can open a saved draft but cannot show its current-revision Owner decision, filter by decision, or count pending reviews. Existing M03→M05, M05→M02, M07→M05, M08→M05 and Owner history remain untouched; none of the 13 open unrelated PRs including ECC #209 owns this change.

## P0 vertical
1. Existing synthetic Owner-session-protected same-origin `GET /local/articles` adds ONLY an exact-revision `current_review_decision` label via indexed immutable LOCAL D1 records. The existing 100-row limit, owner_id=1, and same-origin checks remain. No notes, previous revision decisions, routes, writes or migrations.
2. M06's private read-only queue labels listed rows `CURRENT_REVISION_UNREVIEWED`, `PRIVATE_PREVIEW_REVIEWED`, or `PRIVATE_CHANGES_REQUESTED`. Unknown legacy model fixtures are `NOT_OBSERVED`, not wrongly called unreviewed. Reject forged `PUBLISH_APPROVED` and invalid types.
3. Three listed-only counts and filter options expose real process status. No complete-table statistics, source verification, licence clearance, scheduling or publishing privilege inferred.
4. After successful immutable Owner review of exact revision, refresh the already authenticated read-only queue. Revision change invalidates former decision; no N+1 requests or live provider connection. Logout/401 scrub status and private listings.

## Validation/STOP
Node model tests; local D1 GET revision scoping/no notes, unauthenticated 401 and cross-site 403; Chromium virtual passkey, revision change, filter, sign-out scrub and no egress. Hosted CI, SonarCloud 0 new issues/0 hotspots, Socket Project Report + PR Alerts, Gitleaks, independently submitted APPROVED from kayzenweb3 at exact HEAD. Preserve any Sonar LCOV new-code gap. PR stays Draft, absolutely no merge, deployment, real publishing, remote D1, cost, settings/checkpoints or changes to ECC #209 and other PRs.
