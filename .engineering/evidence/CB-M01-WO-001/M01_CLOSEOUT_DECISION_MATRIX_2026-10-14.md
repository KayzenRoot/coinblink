# CoinBlink · CB-M01-WO-001 · Acelerated closeout decision matrix

**Created:** 2026-10-14 · **Mode:** evidence-only technical status; **NOT** a final Owner/administrator GO to merge or publish.  
**PR:** [#58](https://github.com/KayzenRoot/coinblink/pull/58), source HEAD before this evidence addition `25364d756179ec5958f2350a06a2044ac2c91880`.  
**Governance main:** merged brand admission PR #75 commit `310969049d756b6ba5c0aff4e386c693030656a0`, followed by admission status reconciliation candidate PR #76. The M01 feature branch must be brought up to date with canonical main as required by strict CI before any future integration; an earlier workflow PASS does not authorize a stale merge.  
**Original Golden:** `assets/reference/coinblink-home-master-dark-1536x864.jpg` SHA256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`. Original approved AI-generated logo SHA256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`; it remains unchanged.

## Owner decisions and boundaries

- **Accepted for DEMO:** Owner explicitly approved the M01 homepage visual, recorded in [OWNER_VISUAL_ACCEPTANCE_DEMO_2026-10-14.md](./OWNER_VISUAL_ACCEPTANCE_DEMO_2026-10-14.md), SHA-pinned to the R26 1536x864 screenshot. Current R27/R28 did not modify application visuals.
- **Latest directive:** Owner says “Autorizo vamos finalizar a m01”. This authorizes advancing scoped work and resolving governance blockers, **not a declaration that product DoD is met, copyright/trademark rights are resolved, API sources are licensed, or M01 PR #58 is approved for public production**.
- **Admin-only governance:** ruleset #24888106 allows one admin (required approving count = 0), retains strict seven checks, squash PR, resolved threads, force-push/deletion protections. This removes the need to invent an external GitHub reviewer.
- **Commercial/legal gate:** [Issue #72](https://github.com/KayzenRoot/coinblink/issues/72) remains **OPEN**. No asset-by-asset clearance and no legal or trademark sign-off. All commercial and release flags remain unchanged and false.
- **Brand successor:** exact five Owner-accepted R32 SVGs and Phase A governed work [Issue #74](https://github.com/KayzenRoot/coinblink/issues/74); admission-only PR #75 merged. Post-merge status is being reconciled in PR #76. Import will occur **separately** in `public/brand/**`, not by modifying M01 module or this PR. **M01 does not need its old header/image silently replaced to pass the already accepted DEMO visual review**.

## Requirement-by-requirement status

| Work Order / DoD requirement | State | Verified evidence | What is still required |
|---|---|---|---|
| P0 Golden-inspired responsive semantic homepage at `/en` | **DONE_EVIDENCED_FOR_DEMO** | M01 component/stylesheet and hosted Playwright/desktop/tablet/mobile screenshot QA; R26 ImageGen assets and current vector fallback | Do not claim pixel-perfect parity with immutable Golden; no further art rounds unless Owner requests |
| P0 truthful data semantics | **DONE_EVIDENCED_FOR_DEMO** | UI uses `DEMO/MOCK`, local filters and newsletter submission inert; M01/market content not LIVE | Actual price/news/article provider rights and source freshness require their modules/agreements |
| P1 interactive local states, image fallbacks and safe mock seams | **DONE_EVIDENCED_FOR_DEMO** | R26/27 contract/browser tests, error/fallback and animation reduced-motion/Save-Data; no new live feed or paid function | Genuine backend/auth/articles are independent WOs/gates; global DoD must not be weakened by labeling mocks LIVE |
| P2 responsive, keyboard, axe, CLS/LCP smoke, CSP and no external media | **DONE_EVIDENCED_FOR_DEMO with LAB LIMITATIONS** | [Actions #38638595017](https://github.com/KayzenRoot/coinblink/actions/runs/38638595017) six exact-head check runs + CodeRabbit commit status SUCCESS; 192 Node + 34 Playwright checks on Ubuntu and Windows at M01 HEAD; R27 Chromium/Edge 3 viewport QA; R28 diagnostics | Firefox/WebKit were not available in R27; local aggregated fixture/Wrangler timeouts remain evidence, not proof of runtime regression |
| Original asset identity + static/ImageGen and Blender motion provenance | **TECHNICAL_PROVENANCE_RECORDED** | R17/20+ provenance, R23–R26 source hashes and manifest, R32 brand vector separately | Commercial rights remain pending in #72; do not set `commercialPublicationAllowed=true` by technical origin alone |
| Owner visual signoff | **ACCEPTED_FOR_DEMO_ONLY** | Owner exact R26 screenshot acceptance at 1536x864 and evidence on PR #58 | Separate rights and any later Owner public-facing commercial release approval |
| M01 owned CI at latest prospective integration HEAD | **OLDER_HEAD_PASS, CURRENT_INTEGRATION_READINESS_PENDING** | PR #58 commit `25364d756179ec5958f2350a06a2044ac2c91880` successful [Actions #38638595017](https://github.com/KayzenRoot/coinblink/actions/runs/38638595017) | Need new exact-head CI after this report commit, and reverify against latest canonical `main` after brand governance |
| Independent admin decision for M01 merge | **NOT_ISSUED** | Existing COMMENTED audits, [Issue #60](https://github.com/KayzenRoot/coinblink/issues/60) | Owner/admin must issue explicit scoped GO identifying full legal scope and current SHA/checks |
| Asset/brand/trademark rights for public launch | **BLOCKED_RIGHTS** | [Issue #72](https://github.com/KayzenRoot/coinblink/issues/72) OPEN; generative source disclosure only | Review source terms and potential third-party marks, document CLEARED/REWORK/BLOCKED per asset; no unsupported legal conclusion |
| Formal checkpoint transition to CB-M01 DONE | **NOT_DONE** | Canonical `.engineering/CHECKPOINT.json` main records M00 COMPLETE / 5%, M01 ADMITTED | DoD & legal/integration requirements, governed separate checkpoint delta after applicable approved merge; never self-promote |

## Smallest accurate next action, avoid endless QA loops

1. Finish brand governance PR #76 and **separate** R32 SVG import PR without touching this feature branch's Golden visual.
2. Only if a real M01 regression occurs after base synchronization, fix it once inside `src/modules/CB-M01/**` and owned tests, with exact-head CI.
3. [Issue #72](https://github.com/KayzenRoot/coinblink/issues/72) is the material owner/legal blocker. Record each asset/mark's origin and permitted use, rework any failing asset, preserve DEMO fallback meanwhile.
4. Once release/integration policy permits, Integration Steward reviews final PR #58 exact HEAD, performs controlled main-base update + checks (no force-push), and obtains explicit single-admin `ADMIN_GO_NO_GO` for the precise action. Commercial publishing and deploy remain independent decisions.
5. After a successful authorized M01 merge, prepare a **separate** tested Checkpoint Delta; the code merge alone does not change official module count or progress.

### Technical STOP CONDITION

`M01_DEMO_TECHNICALLY_READY` can be supported by existing evidence, but **`M01_FORMALLY_COMPLETE=false`** and **`M01_PR58_MERGE_AUTHORIZED=false`** until the frozen DoD, rights/branding and governance steps above are met. Do not invent progress percentages or collapse these distinctions. The requested next phase is to **remove the shortest actual blockers**, not to recreate stills or animation loops.

## R35 exact-head readback and closeout addendum · 2026-10-15

This addendum records a fresh, read-only GitHub readback and local Node 22 validation. The six browser screenshots and two machine-readable reports under [`r35-browser-qa/`](./r35-browser-qa/) were added as versioned evidence; all earlier evidence remains intact.

### Authority and PR state

- Authenticated GitHub account: `KayzenRoot`. Canonical `main` at readback: `5a4e8c6872a48f3ce4095ecb7c111fcec92d3ac8`. The merged admission PRs #75 and #76 are present on that main. The checkpoint remains `M00_COMPLETE`, `IMPLEMENTATION_IN_PROGRESS`, 5%; no checkpoint file was changed.
- PR [#58](https://github.com/KayzenRoot/coinblink/pull/58) remains OPEN, not draft, at code HEAD `45b128e898a9daf880cda18ab44bcbe038c2e129`. Remote branch and local branch matched before this evidence-only commit. Its base is still `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; it is two commits behind current `main` and GitHub reports `BEHIND`. No rebase or base update was performed.
- Issue [#72](https://github.com/KayzenRoot/coinblink/issues/72) remains OPEN. Rights remain `PENDING_OWNER_OR_LEGAL`; `commercialPublicationAllowed=false`; `authorizedToMerge=false`. The Owner's acceptance remains scoped to DEMO.
- The earlier “finish PR #76” next-action text above is historical and superseded: #76 is merged. The separate brand asset import is in draft PR [#77](https://github.com/KayzenRoot/coinblink/pull/77); no brand/header/favicon files were mixed into #58.

### Validation at the code HEAD before this evidence commit

On Node.js `v22.23.3`, local `npm ci`, `npm test`, `npm run lint`, and `npm run typecheck` passed. `npm test` reported 192/192 Node tests, the Astro build and no-session-binding guard passed, and Playwright E2E passed 34/34. Typecheck covered 79 files with zero errors, warnings, or hints. These local runs validate code HEAD `45b128e`; they do not by themselves validate the evidence commit that follows.

GitHub reported all six required checks successful on that same code HEAD: [Ubuntu GEF](https://github.com/KayzenRoot/coinblink/actions/runs/38655185285/job/116163138878), [Windows GEF](https://github.com/KayzenRoot/coinblink/actions/runs/38655185285/job/116163138984), [Docker smoke](https://github.com/KayzenRoot/coinblink/actions/runs/38655185285/job/116163138850), [SonarCloud](https://github.com/KayzenRoot/coinblink/runs/116163476733), [Socket PR Alerts](https://github.com/KayzenRoot/coinblink/runs/116163145607), and [Socket Project Report](https://github.com/KayzenRoot/coinblink/runs/116163129576). CodeRabbit's green commit status says “Review skipped: automatic reviews are disabled”; this is **not** a review. The PR had no unresolved review threads at readback. All hosted evidence above predates this evidence-only commit and must be refreshed at its resulting exact HEAD.

### R35 browser evidence

Both reports say `passed`, use base `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` and code HEAD `45b128e898a9daf880cda18ab44bcbe038c2e129`, and cover desktop, tablet, and mobile. The integrated `/en` route report recorded zero console errors, page errors, and external requests; reduced-motion used the static master. The isolated fixture report is explicitly separate and does not claim shared-route integration. Report SHA-256 values below are for the exact LF-normalized bytes staged for GitHub: `integrated-visual-check.json` `ffee814077d7f2d5e0f1f3789750685feb289b9ed066dfbcca8ef08fa9742d59`; `visual-check.json` `7c04bbb7c08dd0bdbb51a1289679316f173037ea26524b6f2111c2b83ea6cb97`.

| Capture | Viewport | SHA-256 |
|---|---:|---|
| Integrated | 1536×864 | `d8ac859713579d80ccd714df526b40b9e79edee653d80652b5ff2444db782d53` |
| Integrated | 768×1024 | `8b430a3ba8de28fd2a715ca4bd9e2c020e3b5666a1bb0233e75664be812e9067` |
| Integrated | 390×844 | `b16bd137efa09251f9616ee40e829e68e4fe114d7c0d49548344a073e2de3347` |
| Fixture | 1536×864 | `a0facfd3f601fed2467940f804ef2655b7bc42294632c56216ba12c4703f80b0` |
| Fixture | 768×1024 | `6465b5de497569143ae59731f30184a84947ee0eaf6f26c4016adf1924b9a0d8` |
| Fixture | 390×844 | `ea39f0c44592384c5d679027d93aac675f959395800fd57c58e5ecff101782ad` |

### R35 outcome

No M01 regression requiring an application-code correction was reproduced. The evidence supports `M01_DEMO_READY_FOR_OWNER_ADMIN_DECISION`; it does **not** change the status to DONE. Live provider rights/data, commercial rights, the strict-base update, fresh exact-head checks/review, and an explicit scoped administrative decision remain outstanding. `M01_FORMALLY_COMPLETE=false`; `M01_PR58_MERGE_AUTHORIZED=false`; no merge, deploy, or checkpoint promotion occurred.
