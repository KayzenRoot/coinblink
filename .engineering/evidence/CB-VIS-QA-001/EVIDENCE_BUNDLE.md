# CB-VIS-QA-001 · Evidence Bundle (proposal, not a release)

**Classification:** `DEMO_ONLY` · **Review state:** DRAFT / NOT MERGED · **Write boundary:** this isolated branch only.

## Source Lock / Preflight

- Repository: `KayzenRoot/coinblink`
- Approved protected-main starting commit: `1fb1c41fbe51833394676ee4b150f8213be82007` (post-squash PR #77).
- Source PR #77 HEAD: `130e2604581f5c3612b752ea9daa1662f2dd195a`.
- Work item: `CB-VIS-QA-001`. New branch: `codex/cb-vis-qa-001-brand-ci-20261025`.
- The **published PR HEAD and GitHub Actions checks** are the authoritative exact-head values. This static file intentionally does not self-reference a commit SHA.
- Scope: add only `.github/workflows/brand-demo-qa.yml` and this evidence bundle. No modifications to existing product assets, tests, golden images, app routes, checkpoints or existing CI.

## Actual quality gap addressed

Existing `.github/workflows/ci-quality.yml` runs 87 focused Node tests but **does not include** `test/brand/brand-assets.test.mjs`. The original R35 `unit-tests.log` includes 8/8 PASS historically, not tied to the merged PR #77 head or post-merge main.

The new GitHub Actions workflow has two separate **read-only** jobs:

1. `Brand / 8 native Node tests (Golden SHA-256)`: pins Node 22.19.0, checks out the **exact** PR HEAD (or push SHA), verifies `git rev-parse HEAD`, executes `node --test test/brand/brand-assets.test.mjs`, requires 8 tests, 8 PASS and zero FAIL. Separately verifies SHA-256 of `assets/reference/coinblink-logo-approved-original-1179x1040.jpg` equals `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`.
2. `Brand / offline Chromium 3 viewports`: uses locked npm dependencies and the existing allowlisted loopback-only R35 browser harness; checks 5 XML sources, **38 rendered and accessible image samples** at each of desktop 1536×864, tablet 768×1024 and mobile 390×844, six screenshot hashes, no network-external requests, no JS/console errors and no overflow. CI-generated PNGs and JSON are preserved as GitHub Actions artifacts **only**, not committed over immutable R35 screenshots.

Each job uploads its exact-head transcript or Chromium captures with 14-day artifact retention. Failures must remain visible (do not convert failures to success). This workflow uses no deploy, secrets, paid service, elevated event trigger, review write or privileged GitHub token.

## Immutable Source Inventory (five approved R32 vectors)

| Asset | Bytes | SHA-256 |
|---|---:|---|
| coinblink-symbol.svg | 4,042 | `240d6e4c7e929920f0b7cbef37278aea09b6e55ac405e2d34ed7e55368a01de2` |
| coinblink-horizontal-dark.svg | 18,085 | `9da72437b4df9d896b85d8fc313e6734dd21db6905d7a5cf7419f0e353b3ab8c` |
| coinblink-horizontal-light.svg | 18,087 | `f054553a21372a5ca44837e6c75cf96450e461afbb49ed4629ffb5c2ee032825` |
| coinblink-stacked.svg | 18,040 | `707ac8a765cf99aa1dcd2b74364fac7b650238f78aaebfc392b6cec281adcfdd` |
| favicon.svg | 3,718 | `0f446faef5fc69f4bdc76fffa03cf0b0e6feb6e4ddb4aceefce8e97e4d1e6e16` |

Golden raster: 121,728 bytes; original and post-merge Git blob `60771965fa0eb3b19fc38db51b36cc295563f6ab` (unchanged).

## Governance / Stop gates

- Remain `DEMO_ONLY`: `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, `siteIntegrationAllowed=false`, `headerIntegrationAllowed=false`, `faviconInstalledGlobally=false`.
- The stacked logo variant is dark-surface-only; this work **does not** claim a corrected light variant or visual clearance.
- No canonical checkpoint change, global M01 DONE, deployment or trademark clearance. Issue #72 was closed as optional commercial paperwork; closure is **not** clearance.
- PR #77 is already squash-merged. Issue #74 may receive a scoped factual progress comment; issue resolution remains separate.
- **STOP CONDITION:** new branch and Draft PR exist; require native 8/8, Chromium pass, CI Build/Sonar/Socket, PR Assurance and review; if any required check fails or has insufficient evidence, remain DRAFT / NO MERGE. A later merge requires separate specific Owner authorization.

## Exact-head Evidence Readback (dynamic, not preclaimed)

The branch commit and PR URL, run IDs, native TAP stdout, SHA-256 assertion, Chromium JSON and screenshot artifacts, all check results and review status must be read from the actual PR GitHub API and Actions pages. Until observed, mark `NOT_RUN` or `PENDING`, never `PASS`.
