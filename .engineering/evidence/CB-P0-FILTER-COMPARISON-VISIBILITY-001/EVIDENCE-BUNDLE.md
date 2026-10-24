# CB-P0-FILTER-COMPARISON-VISIBILITY-001 · Evidence Bundle

## Source of truth / status
- Repository: `KayzenRoot/coinblink`; initial main `579ac8b20a283210b4de935f36f9f9cbfd5ab7a9`.
- Branch: `test/cb-p0-filter-comparison-visibility-001`; PR #228, **DRAFT**, no merge/deployment authorization.
- RED test-only HEAD: `9d2a898b1de87292331e6b4942828cb5a95b4185`. Product source still unchanged at RED.
- Initial requirements: `docs/product/CB-P0-FILTER-COMPARISON-VISIBILITY-001.md`.
- Final implementation HEAD: PENDING read-back confirmation. Final CI status: PENDING.

## Genuine hosted RED
- M03 [workflow run #40060906107](https://github.com/KayzenRoot/coinblink/actions/runs/40060906107): `Source contract tests` FAILED at `source-filter-ui.test.mjs:138`. Assertion `Filtered-out evidence must be cleared`: actual false, expected true. Other M03 unit tests 16 passed; Chromium step SKIPPED after test failure. **Real behavioral RED.**
- M04 [workflow run #40060906215](https://github.com/KayzenRoot/coinblink/actions/runs/40060906215): `Market unit tests` FAILED at `market-freshness-filter.test.mjs:136`. Assertion `Filtered-out asset details must be cleared`: actual false, expected true. Chromium step SKIPPED after test failure. **Real behavioral RED.**
- Main product files untouched until after both RED results confirmed. RED Build workflow #40060906127 SUCCESS; that successful build does not negate the two behavior failures.
- RED quality/other check statuses were not yet all inspected; no additional pass claims.

## Proposed/implemented correction scope, pending GREEN proof
- Existing M03 and M04 DOM client scripts invalidate comparison only when selected item becomes filtered out, and deny hidden-item comparisons.
- Existing two Node test files and two browser E2E files exercise filter/hide/recompare and recovery.
- No server/API/data rights change. No production, live feed, auth, D1, remote network, spending, scanner settings or dependencies changed.
- Only source-level minimal diffs are asserted here; complete final diff verification remains PENDING.

## Verification ledger
| Gate | Evidence state |
| --- | --- |
| M03 Node baseline RED | FAIL AS EXPECTED (confirmed) |
| M04 Node baseline RED | FAIL AS EXPECTED (confirmed) |
| M03/M04 corrected Node GREEN | PENDING |
| M03/M04 real Chromium | PENDING |
| All applicable PR-head CI, lint/typecheck/build | PENDING |
| SonarCloud 0 new issues / 0 hotspots | PENDING |
| Socket Project Report and Pull Request Alerts | PENDING |
| Gitleaks / Reviewdog / PR Assurance | PENDING |
| Exact PR-head diff/tree/zero blocking threads | PENDING |
| Local clone/instrumented module coverage | NOT_RUN / NOT_MEASURED |
| Previously measured SonarCloud new code coverage | 0.0% caveat, not improved by assumption |

## Risks / STOP
No estimate of module completion has changed. Do not declare GREEN/APPROVED, Ready or merge until actual exact-HEAD checks and review are recorded. Proposed checkpoint delta: **NONE until audited and approved**. PR #209 ECC and all other branches remain untouched.
