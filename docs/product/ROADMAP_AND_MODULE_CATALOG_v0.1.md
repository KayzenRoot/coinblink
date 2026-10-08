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
