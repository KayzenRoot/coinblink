# CB-M01-LEARN-SEARCH-001 · Product increment · Evidence Bundle

**Type:** Real M01 functionality, not merely planning. **State:** DRAFT / NOT MERGED. **Data:** DEMO_ONLY, no LIVE market/news or content publication.

## Context lock
- GitHub: `KayzenRoot/coinblink`.
- Starting protected main: `502ecd3bea687dac97826bdcf21d9300c69a4331`.
- New isolated branch: `feature/cb-m01-learning-search-20261025`.
- Existing header/brand/favicons, Golden raster assets, typography and above-the-fold layout: IMMUTABLE.
- This is **not** the separate `CB-M01-VIS-PREVIEW-001` brand laboratory and grants no brand site integration.

## Customer-visible increment
Users can search six SSR-rendered evergreen educational Crypto 101 guides by title, description and safety check, in English or Portuguese, without API, external requests, cookie, localStorage, analytics or any claim of live news. Accent-insensitive matching supports PT-BR. Search is keyboard-accessible; Escape and clear reset; empty state is explicit; JavaScript disabled still displays all six semantic `details/summary` guides.

The feature stays below the approved Golden 1536×864 first fold and does not alter any immutable identity/vector rights constraint.

## Minimal authorized diff
- `src/modules/CB-M01/GoldenHome.astro` (below-fold learning section only, one CSS import, one client script import)
- `src/modules/CB-M01/home-copy.mjs` (four localized UI strings)
- `src/modules/CB-M01/learning-search.client.mjs` (read-only local filter)
- `src/modules/CB-M01/learning-search.css` (locally scoped styles)
- `e2e/m01-learning-search.spec.mjs` (EN/PT, zero network writes and no-JS behavior)
- `.github/workflows/m01-m05-browser.yml` (add specific regression test)
- `.engineering/evidence/CB-M01-LEARN-SEARCH-001/EVIDENCE_BUNDLE.md` (this file)

No changes to `public/brand/**`, Golden JPEGs, header JS, layout, `src/pages/**`, CMS, M05, GEF, checkpoints, rulesets, deployment or rights.

## QA gates (must read back actual GH run after PR creation)
- Node 22.19.0, `npm ci --ignore-scripts`, lint, Astro typecheck, build, native brand 8/8 if applicable.
- M01–M05 browser regression, including new search E2E, full no-JS fallback, EN/PT accessibility and admin route guard.
- GitHub required checks Build, SonarCloud, Socket and all other relevant PR checks.
- No severe a11y findings, no external requests, no cookies, no writes, no risk to demo content provenance.
- Exact HEAD/baseline, diff, checks, review threads, CodeQL/secret scanning as available.
- Screenshot/video evidence from Playwright CI only if captured; do not invent proof. Newly generated artifacts must be HEAD-associated.

## STOP CONDITION
`DRAFT_QA_PASS_WAITING_OWNER` if all verified; `BLOCKED_NO_MERGE` if a gate fails or cannot be read. This branch must not merge absent new explicit Owner permission. No deploy, commercial publish, rights update, costs or canonical checkpoint promotion.

## Correction Delta - 2026-10-25 - targeted Sonar maintainability triage

Source: owner-provided SonarCloud screenshots for PR #245 showing 3 OPEN MEDIUM Maintainability findings, two 'Extract this nested ternary operation into an independent statement' in learning-search.client.mjs and one 'Remove this !important and resolve the specificity conflict instead' in learning-search.css. The screenshots show the same nested-ternary message twice; no HIGH/CRITICAL issue is indicated in those screenshots.

- Refactor only locale-dependent singular/plural suffix assignment to separate if (pt) branches with one non-nested ternary apiece, preserving Portuguese/English output exactly.
- Remove only !important from the learning-section hidden rule. Existing .cb-home .learn-filter[hidden], .cb-home .learn-card[hidden] and .cb-home .learn-filter button[hidden] selectors are more specific than their display rules, including baseline golden-home.css.
- No changes to guide content, search matching, keyboard controls, no-JS fallback, routes, Golden brand files, header, favicon, deployment or rights.
- Pre-commit validation: deterministic source match and blob SHA guards PASS. Corrected HEAD CI lint, typecheck, build, Chromium E2E and Sonar triage PENDING. Previous 21/21 checks and 66 browser tests applied ONLY to old HEAD 6f36c1703dfa0da01ec6c87537b20c8e0b57bf0d.
- Gate: revalidate all applicable checks and Sonar findings on corrected HEAD, zero HIGH/CRITICAL or other blocking issues, effective GitHub protection and mergeability before any conditional merge. No bypass.

STOP: Await corrected HEAD evidence and issue classification; no deploy, publication, production brand integration, paid APIs or checkpoint promotion.

## Correction Delta 2 - 2026-10-25 - HIGH maintainability cognitive complexity

- User-provided SonarCloud screenshot identified the remaining issue on `src/modules/CB-M01/learning-search.client.mjs`: `Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed`, impact **HIGH Maintainability**. In the corrected previous HEAD `fd2c68b7f28ba2d67d7b0c52fa4aa82d13e1264e`, SonarCloud reported one new issue (Quality Gate PASS, but HIGH finding still blocks approval).
- Context lock: protected `main` `502ecd3bea687dac97826bdcf21d9300c69a4331`, PR #245 parent `fd2c68b7f28ba2d67d7b0c52fa4aa82d13e1264e`; preserve six SSR guide entries, local search, no-JS, English/PT-BR, `DEMO_ONLY`, Golden/SVG, header, favicon, rights, security and release restrictions.
- Necessary targeted refactor: extract localized singular/plural match count formatting to `formatMatchCount(visible)` outside `update`, reducing conditional nesting within `update` while maintaining identical string output. No new API/network, side effects or telemetry.
- Extend the existing M01 E2E to assert the six-guide plural result on queries `GUIDE`/`GUIA` as well as the pre-existing singular, empty, Escape, clear and no-JS coverage.
- At commit time source SHA guards/diff and exact string substitution are proven. This document does **not** claim new HEAD CI, SonarCloud or runtime PASS until read back from GitHub.
- Acceptance gate: all exact new HEAD applicable checks success (Build, SonarCloud, Socket, lint/typecheck, regression), no remaining new HIGH/CRITICAL Sonar finding, no unclassified blocker, zero unresolved review threads, unchanged main and effective branch protection. Squash merge NORMAL only under the user's previously stated conditional PR-specific authorization, if every gate is positively verified and no SHA drift.

STOP: `CORRECTION REQUIRED` if Sonar new HIGH remains, a required check fails, or unverified; otherwise `READY_ELIGIBLE` for conditional squash only. Absolutely no bypass/deploy/gastos/rights approval/checkpoint promotion.
