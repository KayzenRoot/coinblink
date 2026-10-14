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
