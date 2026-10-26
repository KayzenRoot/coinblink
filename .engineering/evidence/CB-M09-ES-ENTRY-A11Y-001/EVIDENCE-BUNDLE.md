# CB-M09-ES-ENTRY-A11Y-001 | Evidence Bundle

## Baseline / immutable source
- Original main: b283e1cd40f6934a8bf0edef52b38a7e2ba5b289.
- PR: https://github.com/KayzenRoot/coinblink/pull/229 (DRAFT).
- Branch: feat/cb-m09-es-entry-a11y-001.
- Allowed changes: src/pages/es.astro; src/layouts/BaseLayout.astro; src/modules/CB-M09/NewsLocaleSwitch.astro; test/modules/CB-M02/m09-spanish-news.test.mjs; e2e/m09-spanish-news.spec.mjs; this Evidence Bundle; docs/product/CB-M09-ES-ENTRY-A11Y-001.md.

## Hosted genuine RED (product untouched)
- Test-only HEAD 2a71a8b2295b7aaf905885d41662a67f0d27d92a.
- M02/M09 workflow run https://github.com/KayzenRoot/coinblink/actions/runs/40082134581: 33 Node cases, 30 pass, 3 fail expected.
- Fail 1: ENOENT src/pages/es.astro, the Spanish entry truly did not exist.
- Fail 2: expected Spanish 'Saltar al contenido' in BaseLayout, but only English fallback existed.
- Fail 3: Spanish news locale switcher did not offer 'Volver al inicio' link back to /es.
- Real Chromium NOT_RUN at RED because Node preflight deliberately failed.

## Hosted GREEN implementation baseline
- Implementation HEAD: 9077c4b63cf06bf1ad85b7fd4d4c8578ec5fc003.
- M02/M09 workflow run https://github.com/KayzenRoot/coinblink/actions/runs/40082229113: 33/33 Node PASS, 15/15 real Chromium PASS; browser proves /es at desktop/tablet/mobile, keyboard skip, axe, noindex, no external requests/writes and back-link.
- Local integrated journey run https://github.com/KayzenRoot/coinblink/actions/runs/40082228967: SUCCESS at implementation HEAD.
- Build #40082228949, quality #40082229049, reviewdog #40082229073, PR Assurance #40082229056: SUCCESS at implementation HEAD.
- SonarCloud Code Analysis: SUCCESS, zero new issues and zero new hotspots, observed at implementation HEAD.
- Socket Security Project Report and PR Alerts: both SUCCESS, no net dependency changes at implementation HEAD.
- M01-M05 Chromium regression https://github.com/KayzenRoot/coinblink/actions/runs/40082228940: result requires separate read-back; DO NOT treat pending as passed.

## Final documentation-head validation policy
- Document commits change the PR HEAD. Recheck the entire exact final HEAD after this bundle exists. Do not reuse earlier checks as proof of a newer SHA.
- Existing instrumented SonarCloud coverage on new code: 0.0%. Preserve this caveat even with real Node and browser passing.
- No local clone, external browser beyond hosted runner, live price/news feed, real Owner, credential, remote D1, paid service or production deployment attempted.
- Exact Git diff must remain seven authorized files; no upstream, main, ECC PR #209, other PR, ruleset, or checkpoint mutation.
- Independent review threads and branch protection must be rechecked before Owner merge request; no owner merge authorization exists for PR #229.

## STOP verdict at first recorded GREEN snapshot
- FUNCTIONAL GREEN verified on implementation SHA for M02/M09, but release decision is held until all exact final-HEAD gates, M01-M05 regressions and Sonar/Socket/security are individually revalidated.
- Current PR stays DRAFT, no merge/deploy. This report records actual observations, not an assertion of completed final release gates.

## Exact implementation and documentation GREEN audit | 2026-10-24
- On prior documented HEAD 9e997c1095f71ea138ec912868dd25d19a5e6966, GitHub check-run API verified **14/14 completed SUCCESS**, zero failed/pending; seven of seven matching workflow runs SUCCESS.
- M02/M09 hosted https://github.com/KayzenRoot/coinblink/actions/runs/40082420787: **33/33 Node PASS** and **15/15 Chromium PASS**, including all Spanish DEMO entry, keyboard, accessibility, noindex and no-I/O conditions.
- Integrated https://github.com/KayzenRoot/coinblink/actions/runs/40082420865: **38/38 Chromium PASS**.
- M01-M05 https://github.com/KayzenRoot/coinblink/actions/runs/40082420899: **62/62 Chromium PASS**; EN/PT existing features remained operational.
- Build #40082420884, CI quality #40082420848 (Node/LCOV baseline, lint/typecheck, Gitleaks), reviewdog #40082420904 and PR Assurance #40082420844: all SUCCESS on the documented HEAD.
- SonarCloud PR #229: Code Analysis SUCCESS, **0 new issues, 0 hotspots, 0.0% instrumented new-code coverage**; no claim of coverage improvement.
- Socket Security PR Alerts and Project Report SUCCESS; no net dependency changes. Scan success is not a blanket guarantee about pre-existing dependencies.
- Git comparison from original main: **exactly seven authorized paths, seven commits ahead, zero behind** before this evidence-only supplement; no other file or package change.
- This appended evidence changes the exact PR HEAD. **Re-run and re-check all final HEAD gates before any readiness or merge request; the historical 14/14 result above belongs solely to 9e997c...**
- No merge authorized; preserve DRAFT, isolated branch and source main. New checkpoint delta NONE. Product remains offline demonstration only.
