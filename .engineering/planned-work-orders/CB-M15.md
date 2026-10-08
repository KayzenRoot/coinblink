# Planned Work Order CB-M15 · Launch Gate & Growth Operations

**Stage:** P2 · ship  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/admin/launch-readiness and public staging site`  
**Dependencies:** CB-M01; CB-M02; CB-M03; CB-M04; CB-M05; CB-M06; CB-M14.

## Objective
Make live launch safe, measurable and reversible rather than prematurely publishing a skeleton.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Launch checklist brand/domain/legal clearance, CMS editorial trial, market license, international SEO, PWA/mobile and analytics consent.
2. Content seeding and real approved articles, terms/privacy, health/status and incident ownership, accessibility and performance budgets.
3. Deploy production with release tags, rollback switch and progressive flags, synthetic monitoring and staging sign-off.
4. Editorial launch campaigns and social link tracking, Google News/structured metadata prerequisites, newsletter opt-in workflow.
5. First 7/30-day post-launch dashboard and growth experiment backlog.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /admin/launch-readiness and public staging site; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Staging visual QA passed against Golden.
2. Provider rights and editorial approvals.
3. End-to-end rollback works.
4. No live mock metrics/news.
5. Production owner sign-off before publish.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M15 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.
