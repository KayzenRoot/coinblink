# SonarCloud Issue #147 — read-only diagnosis

**Historical evidence status (2026-10-20):** COMPLETE (safe aggregate evidence only; not a claim of current issue state)
**Project / branch:** KayzenRoot_coinblink / main
**Observed main SHA:** aae3533973518e1af846c321a9df89d03a0918f5
**Checked:** 2026-10-20 11:18:49 UTC
**Evidence source:** SonarCloud public API, GET only; no credentials used.

## Historical main check (observed SHA only)

The GitHub check [SonarCloud Code Analysis #118552202578](https://github.com/KayzenRoot/coinblink/runs/118552202578) completed with **failure** on the exact observed main SHA. Its reported failed condition is **D Security Rating on New Code (minimum A)**. The check has zero GitHub annotations; that does not mean SonarCloud reported zero issues.

## SonarCloud aggregate

The primary query used componentKeys=KayzenRoot_coinblink, branch=main, sinceLeakPeriod=true, and ps=100.

- All three pages returned HTTP 200: 100, 100, and 62 records.
- API total: 262; retrieved: 262; unique issue keys: 262; duplicates: 0.
- Statuses: 226 OPEN, 2 RESOLVED, 34 CLOSED.
- Types: 260 CODE_SMELL and 2 VULNERABILITY.
- The two OPEN vulnerability records aggregate to one CRITICAL and one MAJOR.
- OPEN security impacts aggregate to one HIGH and one MEDIUM.

At the observed SHA, the aggregate contained unresolved vulnerability findings alongside the failing main check. The precise contribution to the historical D rating remains **UNCONFIRMED**, and the records were not rechecked at the current main SHA. This canonical public report omits all issue keys, rules, components, paths, lines, messages and exploit details. PR #181 does not include issues-sanitized.json; any additional detailed review or disclosure requires a separate Owner authorization and security screening.

## Related items and preservation

- [Issue #147](https://github.com/KayzenRoot/coinblink/issues/147) was OPEN at observation; subsequently CLOSED (`completed`) on 2026-10-20. Closure does not itself prove remediation.
- [Issue #169](https://github.com/KayzenRoot/coinblink/issues/169) remains OPEN.
- [PR #180](https://github.com/KayzenRoot/coinblink/pull/180) was OPEN at historical HEAD adc24255154c137daebebe2939a87103a6bc1a09; it has subsequently been MERGED. The historic Copilot creditStatus finding was separate from #147; this document does not modify PR #180.
- This evidence is being added only to [PR #181](https://github.com/KayzenRoot/coinblink/pull/181), on its authorized documentation branch.

## Later readback (2026-10-21; not a fresh SonarCloud issue extraction)

- Protected `main` observed at `c3001ccfb663ad0c84085e07783f8d4566b394a4`.
- SonarCloud check on that commit: **SUCCESS / Quality Gate passed**, reporting **226 new issues** and **0 Security Hotspots**. This does **not** establish remediation of each historic vulnerability; current issue-level status was not re-extracted.
- Issue #147 is CLOSED (`completed`), PR #180 is MERGED, and Issue #169 remains OPEN.
- Historic D, counts and severity bands above are tied only to the old reference SHA. The separate Draft PR #182 contains alternative public issue-level evidence that is deliberately **not** promoted into this aggregate report.

## Recommendation

1. Preserve the historical public evidence at aggregate level and retain its original date and SHA.
2. Require separate Owner authorization for detailed security review, safe storage, or any additional disclosure.
3. Recheck current issue-level states before remediation. Handle any code change in a separately authorized PR; do not change Quality Gates, issue states or baselines through this document.

## Scope completed

SonarCloud was queried only with GET. No code, issue, Quality Gate, main, PR #180, or other branch was changed. No merge, deployment, release, or checkpoint promotion occurred.
