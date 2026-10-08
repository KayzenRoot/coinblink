# Planned Work Order CB-M13 · Advertising, Sponsorship & Revenue Operations

**Stage:** P1 layout/readiness; P2 activation and revenue monetization  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** /admin/advertising; /admin/advertising/inventory; /admin/advertising/campaigns; /admin/advertising/creatives; /admin/advertising/analytics; /en/advertise  
**Dependencies:** CB-M02; CB-M06.

## Objective
Provide CoinBlink Advertising Studio: owner-managed network Google AdSense ads (when approved), direct company sponsor banners, internal newsletter and future course promotions, booking/inventory/campaigns/creatives and truthful revenue analytics, preserving approved Golden visuals. Read docs/product/ADVERTISING_AND_MONETIZATION_v0.1.md. No live paid campaigns, Google scripts or course sales are authorized by this plan.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Ad slot registry aligned with approved Golden Home without harming editorial layout; sponsored/affiliate labels and disclosure.
2. Owner sponsor CRM pipeline, inventory booking, campaign scheduling, creative approval, impression/engagement ledger, invoices optionally later.
3. Campaign-level conversion analytics, UTM tracking and invoice reconciliation; future programmatic ads plugin only after privacy/brand approval.
4. Content separation: never let sponsors influence factual news selection or AI research ranking without explicit editorial disclosure.
5. Adblock/failure layout, user consent management, advertiser reporting with privacy aggregation and anti-fraud safeguards.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /admin/revenue, /admin/sponsors, /en/advertise; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Sponsored labels visible and accessible.
2. No editorial/sponsor commingling.
3. Accurate campaign date/billing state.
4. Reporting privacy aggregation.
5. Ad slots not breaking 1536×864 Golden layout.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M13 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## Expanded owner-authorized advertising contract

The full detailed Advertising Studio / slot registry and trust, AdSense, direct sponsors, course promotions, priority, consent, analytics and revenue contract are specified in docs/product/ADVERTISING_AND_MONETIZATION_v0.1.md. It is an integral M13 acceptance input. M01/M02 must create only visually approved dormant slots before M13; M05 adds protected admin navigation, M06 connects verified metrics only once ready.

P0: working operator UI preview, typed ad models, inventoried desktop/mobile slot visualizations, mock sponsor, approvals and campaign calendar. P1: actual direct advertiser contracts, time/slot exclusive booking conflict checks, creative safety, moderated scheduled delivery, auditable first-party direct impression/click accounting, ownership and privacy. P2: conditional AdSense readiness adapter, certified CMP regional requirements, validated ads.txt, reporting (do not infer Google payouts from first-party clicks), idempotence, fraud controls, failsafe network/house fill, owner kill switch, exact-head CI and E2E. Course promotion slots do not create a course store. Do not claim revenue before provider approval and verified transactions.

Hard STOP: no real network scripts on PR previews, no public sponsor approval without signed contract/moderation, no ad covering main content, no nonconsensual tracking, no fabricated money.
