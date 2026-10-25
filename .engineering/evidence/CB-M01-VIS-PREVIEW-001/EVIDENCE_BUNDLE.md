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
