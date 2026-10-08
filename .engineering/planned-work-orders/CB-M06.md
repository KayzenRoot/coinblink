# Planned Work Order CB-M06 · Owner Command Center & Privacy-Safe Analytics

**Stage:** P0 · administrator priority  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/admin, /admin/analytics, /admin/analytics/articles, /admin/ops`  
**Dependencies:** CB-M05; CB-M02.

## Objective
Executive operating cockpit: audience by article and source, acquisition, engagement, revenue and service health.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Real control room layout: real-time overview, top content, article views and uniques, sessions, returning/new visitors, referrer/UTM channel, geography in safe aggregation, devices and locale.
2. Time comparisons Today/7/30/90d, per-article details, CTR to articles, engaged-read proxy, scroll depth, newsletter conversions, internal navigation/search and social campaign attribution.
3. Metric definitions with server/client events, bot filtering, consent management, privacy-safe identifiers, retention and transparent estimation; no fingerprinting or secret tracking.
4. Operational panels: editorial queue, latest posts, stories awaiting fact-check, provider health, market freshness, queues, errors, failed webhooks, API spend and deployment signals.
5. Revenue cards for sponsors/ads/newsletter/premium API, only live if source ledger connected; clearly mark provisional/estimated totals.
6. Admin per-module deep links, saved filters, CSV exports with access control, drilldowns and scheduled digests, action alerts/incident banners.
7. Privacy permission tests, analytics accuracy reconciliation, delayed data indicators and meaningful empty states with demo badges.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /admin, /admin/analytics, /admin/analytics/articles, /admin/ops; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Per-article view counts reproducibly tested.
2. Explicit metric definitions and source provenance.
3. Owner-only session and server-side permissions enforced; unauthenticated users, public readers, Developer API customers and service agents cannot view protected Owner analytics. No human Viewer, Analyst or Editor role in V1.
4. No unsafe PII or third party tracking without consent.
5. Working charts on preview, not decorative dummy stats.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M06 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## Advertising revenue integration seam

Show future advertising integration in Owner Command Center: qualified impressions (direct), sponsor bookings/receivables, AdSense provider-reported revenue, house/course click-through, per-article yield and campaign drill-down. Initial cards say not connected. Never fabricate revenue or equate analytics clicks to billed Google earnings.

## One human Owner authority

The full Command Center uses one Owner session only in V1. All article view metrics, revenue, social, media and provider spend are aggregated into Owner-only charts. Do not create extra human Analyst/Editor administrator roles under the earlier provisional RBAC plan. Machine events and external Developer API customers remain independently scoped and never gain Owner privileges.

