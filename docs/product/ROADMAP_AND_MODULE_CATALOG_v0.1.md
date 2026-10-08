# CoinBlink · Roadmap & Module Catalog v0.1

**State:** Planning proposal. Owner approved the **work style**, not yet the product Architecture ADR or module acceptance freeze.

## Implementation sequence and one-large-WO discipline

A long WO means **a complete coherent module**, not one uncontrolled giant change covering unrelated product domains. One module should deliver navigable UI, validated backend/data contract, tests, admin visibility, preview link, errors corrected in the same PR, and a checkpoint delta. A module can have multiple commits and internal milestones without multiplying WOs.

Each `CB-Mxx` contract is stored in `.engineering/planned-work-orders/CB-Mxx.md`. Files are PROPOSED until dependency and source preflight, frozen Scope and Context Lock, approved ADRs, exact base SHA and admitted GEF Work Order. No active Codex prompt is implied by their presence.

| Proposed order | Module | Priority | Requires | Customer-visible preview |
|---|---|---|---|---|
| 01 | **CB-M00** Delivery Platform & Live Previews | NOW / gating | Cloudflare ADR/account/GEF | preview health + isolated URL |
| 02 | **CB-M05** Editorial CMS, Auth & Workflow | P0 | M00 | secure admin shell/editor |
| 03 | **CB-M01** Golden Design System & Homepage | P0 | M00 + original JPG asset gate | Golden home vs pixel overlay |
| 04 | **CB-M02** Public News Experience & Discovery | P0 | M01 + M05 | news/article/category/search |
| 05 | **CB-M03** Sources, Ingestion & Provenance | P0 | M05 | admin provider ingestion + approved article candidate |
| 06 | **CB-M04** Markets, Ticker & Radar 24h | P0 | M01 | markets/coin detail + source freshness |
| 07 | **CB-M06** Owner Command Center & Analytics | P0 | M05 + M02 | cockpit charts, every article's views |
| 08 | **CB-M07** Social Studio X/Instagram/TikTok | P0 | M05 + M06 | compose, campaign calendar, sandbox adapters |
| 09 | **CB-M08** AI Research Desk & Impact Engine | P1 | M03 + M04 + M05 | fact/evidence review, explainers |
| 10 | **CB-M09** Internationalization, SEO & Accessibility | P1 | M02 + M05 | en/pt-br/es and SEO metadata |
| 11 | **CB-M10** Newsletter, Alerts & Reader Retention | P1 | M02 + M05 + M06 | subscriber funnel and admin campaigns |
| 12 | **CB-M11** Public Developer API & Documentation | P1 | M02 + M03 + M04 | /developers, versioned mock API |
| 13 | **CB-M14** Security, Reliability & Platform Operations | P1 | M00 + M05 + M03 | admin operations dashboard |
| 14 | **CB-M12** Paid API Billing, Plans & Customer Console | P2 | M11 + M06 | pricing, sandbox subscriptions |
| 15 | **CB-M13** Advertising, Sponsorship & Revenue Ops | P2 | M02 + M06 | revenue dashboard and sponsor pages |
| 16 | **CB-M16** Personalization, Watchlists & Smart Alerts | P2 | M02 + M04 + M10 | user watchlist and alert preview |
| 17 | **CB-M15** Launch Gate & Growth Operations | LAST | critical P0/P1 modules | launch readiness, real production approval |

**Visual delivery order:** M00 first even before app design, to prevent months of blind development. M05 may proceed while image upload CB-ASSETS-001 is still resolving, but M01 **cannot** claim visual fidelity without original images. If implementation order changes, revise this roadmap and dependent WOs under GEF admission. No undocumented parallel work on shared critical-path changes.

## Product surfaces / artifact organization

- Reader site `/`, `/en`, `/pt-br`, `/es` -> M01/M02/M04/M08/M09/M10/M16.
- Admin `/admin` -> M05 secure shell, M06 owner command, M07 social, M03 sources, M14 operational health, M12 API customers.
- Developer site `/developers` and `/v1` -> M11; paid entitlements M12.
- Infrastructure/preview -> M00, dedicated no-production migration and secrets gate.
- Raw visual sources and actual Golden photos -> CB-ASSETS-001; no generated approximations.

## Scope-per-WO expectations

**Minimum full module contract:** real routes in preview, backend+domain schema when relevant, API adapters with mocks vs live clearly labeled, role-sensitive admin screen, observability, migration safety, unit+integration+E2E, screenshot QA/a11y, app security, GEF Evidence Bundle, independent review. Long execution can take multiple Codex sessions but remains one WO until terminal verdict; don't reopen finished scope just to consume remaining effort.

**Time compression principles:** plan contracts before writing code; pin dependencies; aggressively reuse design components and data adapters; run independent CI as early as P0; build frontend/backend with testable seams; avoid vague "make everything perfect" tasks, context explosion and unnecessary refactors. One PR per module, not one PR per button.

## Explicit exclusions / risk

Not a promise of a fully automated Codex Cloud dispatch: this ChatGPT-GitHub connection currently supports direct GitHub authoring and review, but has no reliable first-party create-task action for Codex Cloud. Reserve Codex-only source-writing according to GEF unless an owner-authorized documented exception applies. No live customer charges, X/IG/TikTok posting, or real news publication without credentials, permissions and explicit human approval.

## Tracked module backlog on GitHub

All planned module Issues exist, but **NONE is admitted for execution**. They are planning inventory, not concurrent work in progress. Activate only one critical path WO at a time after its product contract and context lock are approved.

- [CB-M00 · Issue #7](https://github.com/KayzenRoot/coinblink/issues/7) · [long planned WO](../../.engineering/planned-work-orders/CB-M00.md)
- [CB-M01 · Issue #8](https://github.com/KayzenRoot/coinblink/issues/8) · [long planned WO](../../.engineering/planned-work-orders/CB-M01.md)
- [CB-M02 · Issue #9](https://github.com/KayzenRoot/coinblink/issues/9) · [long planned WO](../../.engineering/planned-work-orders/CB-M02.md)
- [CB-M03 · Issue #10](https://github.com/KayzenRoot/coinblink/issues/10) · [long planned WO](../../.engineering/planned-work-orders/CB-M03.md)
- [CB-M04 · Issue #11](https://github.com/KayzenRoot/coinblink/issues/11) · [long planned WO](../../.engineering/planned-work-orders/CB-M04.md)
- [CB-M05 · Issue #12](https://github.com/KayzenRoot/coinblink/issues/12) · [long planned WO](../../.engineering/planned-work-orders/CB-M05.md)
- [CB-M06 · Issue #13](https://github.com/KayzenRoot/coinblink/issues/13) · [long planned WO](../../.engineering/planned-work-orders/CB-M06.md)
- [CB-M07 · Issue #14](https://github.com/KayzenRoot/coinblink/issues/14) · [long planned WO](../../.engineering/planned-work-orders/CB-M07.md)
- [CB-M08 · Issue #15](https://github.com/KayzenRoot/coinblink/issues/15) · [long planned WO](../../.engineering/planned-work-orders/CB-M08.md)
- [CB-M09 · Issue #16](https://github.com/KayzenRoot/coinblink/issues/16) · [long planned WO](../../.engineering/planned-work-orders/CB-M09.md)
- [CB-M10 · Issue #17](https://github.com/KayzenRoot/coinblink/issues/17) · [long planned WO](../../.engineering/planned-work-orders/CB-M10.md)
- [CB-M11 · Issue #18](https://github.com/KayzenRoot/coinblink/issues/18) · [long planned WO](../../.engineering/planned-work-orders/CB-M11.md)
- [CB-M12 · Issue #19](https://github.com/KayzenRoot/coinblink/issues/19) · [long planned WO](../../.engineering/planned-work-orders/CB-M12.md)
- [CB-M13 · Issue #20](https://github.com/KayzenRoot/coinblink/issues/20) · [long planned WO](../../.engineering/planned-work-orders/CB-M13.md)
- [CB-M14 · Issue #21](https://github.com/KayzenRoot/coinblink/issues/21) · [long planned WO](../../.engineering/planned-work-orders/CB-M14.md)
- [CB-M15 · Issue #22](https://github.com/KayzenRoot/coinblink/issues/22) · [long planned WO](../../.engineering/planned-work-orders/CB-M15.md)
- [CB-M16 · Issue #23](https://github.com/KayzenRoot/coinblink/issues/23) · [long planned WO](../../.engineering/planned-work-orders/CB-M16.md)

**Existing prerequisites:** [CB-ASSETS-001 · Issue #5](https://github.com/KayzenRoot/coinblink/issues/5) is still blocked on actual Golden JPEG binary transfer. [CB-PLAN-001 · Issue #6](https://github.com/KayzenRoot/coinblink/issues/6) owns this draft roadmap/admission decisions.

## Advertising priorities and review dependency corrections

Advertising is **an approved product direction**, not a new unrelated work order. CB-M13 (Issue #20) now implements complete Advertising Studio, including Google AdSense publisher ads, directly booked business banners, and CoinBlink/newsletter/future course house campaigns. First M01/M02 leave dormant approved layout slots; M05 protected admin navigation and M06 honest revenue cards. M13 may be advanced in sequence to follow M02+M06 if ad revenue becomes a commercial priority, without delaying the first working site for a Google approval. All live ads remain blocked until account and legal privacy review.

Review corrections: CB-M04 now depends on CB-M05 secure admin base. CB-M15 now depends explicitly on CB-M09 international SEO and CB-M10 newsletter consent. CB-M03 preview Queue events are simulated; an isolated nonproduction consumer is required for integration tests. Visual fidelity, safe ads density and honest ad revenue status are mandatory.

## 2026-10-08 new Owner requirements and added planned modules

Design Bible v2.0 DRAFT now covers 38 public/reader routes and 48 Admin routes. The original v1.0 Golden Home and Logo remain frozen and are NOT in Git as JPG originals. Each page design proposal needs later screenshot approval in a preview.

- **Owner Admin V1:** EXACTLY ONE human Owner/Administrator, created by one-time out-of-band activation. No public privileged signup; no other Admin or Editor human roles in V1. CB-M05 now owns full settings navigation, encrypted API key vault, MFA, password recovery, source/provider configuration and editorial CMS.
- **CB-M17 (Issue #27):** rich editorial image, animation, infographic, verified-data chart and short vertical story artwork production. Plan as one complete media generator WO following M00+M05+M03, integrating M08 evidence and M07 social exports. Never auto-publish an illustration or real event photo without final Owner review.
- **CB-M18 (Issue #26):** FUTURE token research/analytics, no chain, ticker, contract, supply or deployment selected. DO NOT schedule implementation now. Reserve disabled admin token monitor and settings route; legal/tokenomics/custody approval essential.
- **Design WO CB-DESIGN-002 (Issue #25):** draft high-fidelity specs of *all* reader and owner pages. Text drafts do not automatically approve visual composition.
- **New implementation compatibility:** M02 owns rich article layout; M05 owns only Owner human auth, Settings and manual editorial final publish; M17 media generator supplies visual story artifacts; M08 fact engine provides evidence; M06 analytics dashboard is visible only behind owner auth.
- **Existing WO count:** 17 prior module contracts plus 2 new planned future/creative modules = **19 total**. Only M00..M17 are candidates for near/medium-term implementation (subject to source pack and ADR). M18 is explicitly FUTURE/NOT ADMITTED.
