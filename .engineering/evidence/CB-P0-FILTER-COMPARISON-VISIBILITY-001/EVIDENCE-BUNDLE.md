# CB-P0-FILTER-COMPARISON-VISIBILITY-001 · Evidence Bundle

## Source of truth / status
- Repository: `KayzenRoot/coinblink`; initial main `579ac8b20a283210b4de935f36f9f9cbfd5ab7a9`.
- Branch: `test/cb-p0-filter-comparison-visibility-001`; PR #228, **DRAFT**, no merge/deployment authorization.
- RED test-only HEAD: `9d2a898b1de87292331e6b4942828cb5a95b4185`. Product source still unchanged at RED.
- Initial requirements: `docs/product/CB-P0-FILTER-COMPARISON-VISIBILITY-001.md`.
- Verified implementation/test HEAD before this evidence-only update: `51728da606bc17cb7e1f349b64fbdd5d114f09f7`. On that HEAD, all seven observed GitHub Actions workflows SUCCESS; exact evidence-update SHA and its rerun status require a new read-back.

## Genuine hosted RED
- M03 [workflow run #40060906107](https://github.com/KayzenRoot/coinblink/actions/runs/40060906107): `Source contract tests` FAILED at `source-filter-ui.test.mjs:138`. Assertion `Filtered-out evidence must be cleared`: actual false, expected true. Other M03 unit tests 16 passed; Chromium step SKIPPED after test failure. **Real behavioral RED.**
- M04 [workflow run #40060906215](https://github.com/KayzenRoot/coinblink/actions/runs/40060906215): `Market unit tests` FAILED at `market-freshness-filter.test.mjs:136`. Assertion `Filtered-out asset details must be cleared`: actual false, expected true. Chromium step SKIPPED after test failure. **Real behavioral RED.**
- Main product files untouched until after both RED results confirmed. RED Build workflow #40060906127 SUCCESS; that successful build does not negate the two behavior failures.
- RED quality/other check statuses were not yet all inspected; no additional pass claims.

## Proposed/implemented correction scope, pending GREEN proof
- Existing M03 and M04 DOM client scripts invalidate comparison only when selected item becomes filtered out, and deny hidden-item comparisons.
- Existing two Node test files and two browser E2E files exercise filter/hide/recompare and recovery.
- No server/API/data rights change. No production, live feed, auth, D1, remote network, spending, scanner settings or dependencies changed.
- Verified PR snapshot at implementation SHA `51728da606bc17cb7e1f349b64fbdd5d114f09f7`: exactly 8 changed paths (2 source, 2 Node, 2 Chromium, 2 documentation), +187/-4 lines, against original main `579ac8b20a283210b4de935f36f9f9cbfd5ab7a9`. No other code path changed. Reconfirm after evidence-only commit.

## Verification ledger
| Gate | Evidence state |
| --- | --- |
| M03 Node baseline RED | FAIL AS EXPECTED (confirmed) |
| M04 Node baseline RED | FAIL AS EXPECTED (confirmed) |
| M03/M04 corrected Node GREEN | M03 17/17 PASS in [#40061038615](https://github.com/KayzenRoot/coinblink/actions/runs/40061038615); M04 13/13 PASS in [#40061038595](https://github.com/KayzenRoot/coinblink/actions/runs/40061038595), both at implementation SHA |
| M03/M04 real Chromium | M03 2/2 PASS in #40061038615; M04 1/1 PASS in #40061038595; actual Chromium acceptance steps SUCCESS |
| All observed implementation-head GitHub Actions | **7/7 SUCCESS at `51728da6...`:** M03, M04, integrated journey [#40061038647](https://github.com/KayzenRoot/coinblink/actions/runs/40061038647), Build [#40061038601](https://github.com/KayzenRoot/coinblink/actions/runs/40061038601), CI Quality [#40061038605](https://github.com/KayzenRoot/coinblink/actions/runs/40061038605), Reviewdog [#40061038623](https://github.com/KayzenRoot/coinblink/actions/runs/40061038623), PR Assurance [#40061038603](https://github.com/KayzenRoot/coinblink/actions/runs/40061038603). Rerun checks for documentation-only HEAD PENDING. |
| SonarCloud 0 new issues / 0 hotspots | **NOT_VERIFIED** by available GitHub status connector; never equate passed Build/PR Assurance with SonarCloud findings. |
| Socket Project Report and Pull Request Alerts | **NOT_VERIFIED** by available GitHub status connector; no dependency changes but scan not evidenced. |
| Gitleaks / Reviewdog / PR Assurance | CI Quality Gitleaks SUCCESS, Reviewdog SUCCESS, PR Assurance SUCCESS at `51728da6...` (read-only diagnostics, not human APPROVED). |
| Exact PR-head diff/tree/zero blocking threads | 8 changed files, PR mergeable true and no review threads or submitted reviews in verified implementation-head snapshot; **recheck after evidence-only commit**. |
| Local clone/instrumented module coverage | NOT_RUN / NOT_MEASURED |
| Previously measured SonarCloud new code coverage | 0.0% caveat, not improved by assumption |

## Risks / STOP
No estimate of module completion has changed. **Behavioral GREEN confirmed** at implementation SHA `51728da6...`. Do not declare release APPROVED/Ready or merge until actual evidence-commit exact-HEAD checks, SonarCloud/Socket, branch protection and review are recorded. Proposed checkpoint delta: **NONE until audited and approved**. PR #209 ECC and all other branches remain untouched.
