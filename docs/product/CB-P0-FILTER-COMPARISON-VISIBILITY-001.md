# CB-P0-FILTER-COMPARISON-VISIBILITY-001 · Filter-safe mock comparisons

## OBJECTIVE
In the existing M03 synthetic provenance and M04 offline markets laboratories, do not show or regenerate a comparison using entries hidden by active search/status filters. Keep the workflow usable by permitting another manual comparison after the same canonical entries become visible again.

## CONTEXT / CONTEXT LOCK
- Initial protected main: `579ac8b20a283210b4de935f36f9f9cbfd5ab7a9`.
- Branch: `test/cb-p0-filter-comparison-visibility-001`; PR #228 (Draft).
- Existing M03/M04 P0 demo comparisons and check matrix are already merged. No new product module or alternative data source is introduced.
- Risk: LOW functional DOM-only correction, STANDARD due to shared UI regression verification. If main moves, mark context STALE before integration.

## SCOPE (NECESSARY)
- M03 and M04 existing client filter/comparison scripts: clear the comparison detail when a current filter hides either selected entry, and refuse compare attempts when either selected entry is hidden.
- Two test-first Node DOM-model regressions; two Playwright browser extensions checking the hidden/visible transitions.
- Documentation and evidence only. Existing fixture catalog, rights/readiness classifications, text-only DOM, native selectors, responsive and accessibility checks remain unchanged.

## OUT OF SCOPE
- Source ingestion, live feeds, market prices/quotes, claims of verification or rights clearance, publishing, signing, API keys, authenticated routes, sessions, D1, any HTTP egress, persistence, external integrations.
- No changes to M05/M07, ECC #209, other PRs, workflows, dependency manifests, Sonar/Socket rules, rulesets, checkpoint, main, deployment or spending.

## FILES / SOURCES TO READ
- `AGENTS.md`; `README.md`; `docs/BUILD_FIRST.md`; `docs/CHAT_WORKFLOW_AND_HANDOFF.md`.
- `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`.
- `src/modules/CB-M03/source-lab.client.js`; `src/modules/CB-M04/market-lab.client.js`.
- `test/modules/CB-M03/source-filter-ui.test.mjs`; `test/modules/CB-M04/market-freshness-filter.test.mjs`.
- `e2e/m03-source-demo.spec.mjs`; `e2e/m04-market-demo.spec.mjs`.

## REQUIREMENTS / ARCHITECTURE RULES
1. Read only existing canonical, server-rendered mock data; no remote request.
2. Filter change affects the comparison detail only if either selected item is no longer visible. Other valid comparisons remain stable.
3. Attempting to compare a hidden/missing/same item fails closed, does not render details and explains that visible, distinct items are required.
4. When visible again, do not automatically recreate comparison: explicit user click only.
5. Use `textContent`, no `innerHTML`, no storage or new endpoint. Retain no-LIVE/no-rights notices.

## CONSTRAINTS
Smallest diff, no new package, browser-only local/offline demo. The original product files must remain unchanged through test-only RED; implement only after genuine observed failing behavior.

## ACCEPTANCE CRITERIA
- Node test reproduces hidden-detail retention on unmodified baseline for both modules; then all module Node tests PASS after correction.
- Actual Chromium: filter that hides compared item scrubs detail; compare still denied; restoring visibility permits explicit compare; axe, network isolation and responsive checks continue passing.
- Build and all applicable exact-HEAD quality/security/PR checks pass. SonarCloud 0 PR-new issues and hotspots, Socket checks PASS.
- No other module behavior, source rights, publication flags or access pathways change.
- Preserve prior SonarCloud measured new-code coverage caveat 0.0%; do not infer instrumented coverage from passing tests.

## TESTS / EVIDENCE
RED M03 run `40060906107` and M04 run `40060906215` failed their newly added Node behavior assertions; Build on RED SHA succeeded. Post-fix CI and browser results must be captured from their actual exact-HEAD runs. Local full-suite/build: NOT_RUN (no mounted clone/toolchain).

## DELIVERABLES / REVIEW FORMAT
Draft PR #228, minimal six implementation/test paths plus this bounded Work Order and Evidence Bundle. Review: exact base/head SHA, changed-file and diff inventory, explicit RED→GREEN tests, CI/quality/security, risks, verdict (APPROVED/CORRECTION REQUIRED/BLOCKED), proposed Checkpoint Delta but no promotion.

## STOP CONDITION
Stop without merge/deploy if checks, CI, Sonar/Socket, review state or diff integrity are unverified. Exact SHA-specific Owner authorization is required for future squash merge. No further unrelated module increment before terminal verdict.
