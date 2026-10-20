# SonarCloud Issue #147 — read-only diagnosis

**Status:** COMPLETE (safe aggregate evidence only)
**Project / branch:** KayzenRoot_coinblink / main
**Observed main SHA:** aae3533973518e1af846c321a9df89d03a0918f5
**Checked:** 2026-10-20 11:18:49 UTC
**Evidence source:** SonarCloud public API, GET only; no credentials used.

## Main check

The GitHub check [SonarCloud Code Analysis #118552202578](https://github.com/KayzenRoot/coinblink/runs/118552202578) completed with **failure** on the exact observed main SHA. Its reported failed condition is **D Security Rating on New Code (minimum A)**. The check has zero GitHub annotations; that does not mean SonarCloud reported zero issues.

## SonarCloud aggregate

The primary query used componentKeys=KayzenRoot_coinblink, branch=main, sinceLeakPeriod=true, and ps=100.

- All three pages returned HTTP 200: 100, 100, and 62 records.
- API total: 262; retrieved: 262; unique issue keys: 262; duplicates: 0.
- Statuses: 226 OPEN, 2 RESOLVED, 34 CLOSED.
- Types: 260 CODE_SMELL and 2 VULNERABILITY.
- The two OPEN vulnerability records aggregate to one CRITICAL and one MAJOR.
- OPEN security impacts aggregate to one HIGH and one MEDIUM.

The aggregate confirms unresolved vulnerability findings coexist with the failing main check. It does **not** establish which record caused the D rating. Because unresolved HIGH/CRITICAL security findings are present and this repository is public, this report deliberately omits all issue keys, rules, components, paths, lines, messages, and exploit details. No issues-sanitized.json is published. Detailed triage requires Owner-approved private storage.

## Related items and preservation

- [Issue #147](https://github.com/KayzenRoot/coinblink/issues/147) remains OPEN.
- [Issue #169](https://github.com/KayzenRoot/coinblink/issues/169) remains OPEN.
- [PR #180](https://github.com/KayzenRoot/coinblink/pull/180) remains OPEN at SHA adc24255154c137daebebe2939a87103a6bc1a09, based on the observed main SHA. Its Sonar check passes on its own PR HEAD. The existing Copilot creditStatus comment is separate from Issue #147; PR #180 was not modified.
- This evidence is being added only to [PR #181](https://github.com/KayzenRoot/coinblink/pull/181), on its authorized documentation branch.

## Recommendation

1. Keep the current public evidence at aggregate level.
2. Have the Owner authorize a private destination and a security reviewer to inspect the withheld issue records and determine exploitability and affected code.
3. Track any remediation in a separately authorized work order/PR, then re-run SonarCloud on its exact HEAD. Do not change Quality Gates, issue states, or baselines as part of this read-only mission.

## Scope completed

SonarCloud was queried only with GET. No code, issue, Quality Gate, main, PR #180, or other branch was changed. No merge, deployment, release, or checkpoint promotion occurred.
