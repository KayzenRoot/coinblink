# CB-M01-VIS-PREVIEW-001 | HIGH_ASSURANCE Evidence Bundle

**STATE:** DRAFT / NOT MERGED. **BASE LOCK:** `502ecd3bea687dac97826bdcf21d9300c69a4331`. **DATA RIGHTS:** DEMO_ONLY.

## Purpose
Test-only local visual comparison of the five previously approved R32 brand assets at representative M01 header dimensions on five viewports. This increment is strictly independent of the product M01 learning-search PR and does **not** integrate the SVGs into the actual application header or favicon.

## Allowed paths
- `test/brand/m01-visual-preview.html`: isolated static semantics, dark/light wordmark mock, symbol, stacked-dark-only and favicon-as-image (without `rel=icon`).
- `test/brand/m01-visual-preview-qa.mjs`: allowlisted read-only ephemeral local HTTP server; Golden Home/Logo and SVG SHA-256; Chromium, axe and screenshot report; explicit cleanup.
- `.github/workflows/m01-visual-preview.yml`: standalone read-only exact-head Node 22.19.0 Chromium CI; screenshots uploaded to expiring CI artifacts.
- `.engineering/evidence/CB-M01-VIS-PREVIEW-001/EVIDENCE_BUNDLE.md`: static scope and gate record.

## Original Golden locks
- Home: `assets/reference/coinblink-home-master-dark-1536x864.jpg` SHA-256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`.
- Logo: `assets/reference/coinblink-logo-approved-original-1179x1040.jpg` SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`.
- No raster changes permitted.

## Vector locks
- Symbol: `240d6e4c7e929920f0b7cbef37278aea09b6e55ac405e2d34ed7e55368a01de2`
- Horizontal dark: `9da72437b4df9d896b85d8fc313e6734dd21db6905d7a5cf7419f0e353b3ab8c`
- Horizontal light: `f054553a21372a5ca44837e6c75cf96450e461afbb49ed4629ffb5c2ee032825`
- Stacked dark-only: `707ac8a765cf99aa1dcd2b74364fac7b650238f78aaebfc392b6cec281adcfdd`
- Favicon artifact, NOT installed: `0f446faef5fc69f4bdc76fffa03cf0b0e6feb6e4ddb4aceefce8e97e4d1e6e16`

## Runtime acceptance gates
- Checkout exact PR HEAD before tests.
- Real binary SHA-256: five SVGs, two original Golden images.
- Local server `127.0.0.1` ephemeral, GET/HEAD and exact file allowlist only, no remote requests.
- Five viewports: 1536x864, 1280x800, 768x1024, 390x844 and 360x800.
- Decoded SVGs, no horizontal overflow, no JS/console errors, zero external network writes, no global `rel=icon` and no stacked/light misuse.
- Keyboard skip link and no critical/serious WCAG 2.1 A/AA axe failures.
- SHA-256 of five Chromium screenshots, evidence outside the repository in CI artifacts.
- Existing brand native 8/8, protected Build/Sonar/Socket, PR assurance, Gitleaks and workflow guard all applicable exact-HEAD checks.

## Rights and implementation blocks
`status=DEMO_ONLY`, `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, `siteIntegrationAllowed=false`, `headerIntegrationAllowed=false`, `faviconInstalledGlobally=false`.

This lab **does not** grant visual approval, production identity deployment, public preview publishing, global M01 completion, legal clearance or checkpoint promotion.

## Evidence read-back
Runtime SHA, GitHub Actions run ID, screenshots, axe report, actual all-check statuses and reviewers are **NOT_RUN / PENDING** until observed from live GitHub Action results. No preclaimed success.

## STOP CONDITION
`DRAFT_NO_MERGE` until exact-head CI and visual evidence verified and the Owner separately authorizes integration. Any SHA drift, active external request, unexpected app route/asset edit, security regression or failure must stop as `BLOCKED_NO_MERGE`. No deploy or spending.

## Correction Delta · Sonar findings from Owner screenshots (2026-10-25)

- Base drift reconciled: original PR branch HEAD `8c4aca12581f0dc4547721aaad45d2c08b54aca0`; protected main advanced to `0f23494081259bbf70d953dd3edc581b67506606` from the independent #245 search squash. No rebase/force-push performed; PR visual lab remains isolated and mergeable pending fresh checks.
- Screenshots identify repeated Sonar LOW Maintainability `Unexpected await inside a loop` in `test/brand/m01-visual-preview-qa.mjs`, MEDIUM Maintainability `Remove this !important` in `test/brand/m01-visual-preview.html`, and two LOW Reliability/MEDIUM Maintainability `Remove redundant word image` from the 32px and 48px favicon preview alt attributes. Remaining issues must be reconciled against next exact-HEAD Sonar run, not assumed fixed solely from partial screenshots.
- Corrected `qa.mjs` to hash/read the five SVGs and two original Golden rasters via Promise.all; preserve the original strict assertions/allowlist. The five Chromium viewports are **still evaluated sequentially and in original order** through a promise chain, with per-context finally cleanup, to avoid memory-concurrent regressions and remove unnecessary await-in-loop warnings.
- HTML corrections only remove two redundant `image` words and two `!important` qualifiers from already-static reduced-motion style. Maintain semantic alt, keyboard skip link, dark/light restrictions, fixed raster/SVG hashes and favicon-as-image-only policy.
- Added no new files or dependencies; no changes to production routes, source pages, Golden JPEGs, vectors, header, installed favicon, legal rights, LIVE content, CMS or production deployment. `DEMO_ONLY` invariant retained.
- Prior HEAD local brand CI was PASS but had Sonar 21 new issues. No claim of corrected HEAD CI/Sonar until GitHub readback. Required before any possible squash: full refreshed checks against current main, Sonar zero blocking findings, browser five-viewport no-network/axe proof, no blocking review threads, PR HEAD/main unchanged, no bypass and Owner conditional authorization.

**STOP CONDITION:** `CORRECTION_REQUIRED` for new HIGH/CRITICAL or failed tests, `BLOCKED_NO_MERGE` if important evidence cannot be verified; `READY_FOR_CONDITIONAL_SQUASH` only after every check and review gate passes. Rights restrictions remain `DEMO_ONLY / PENDING_OWNER_OR_LEGAL` even after a test-only merge.
