# Planned Work Order CB-M07 · Social Studio for X, Instagram & TikTok

**Stage:** P0 · distribution  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/admin/social, /admin/social/compose, /admin/social/calendar, /admin/social/accounts`  
**Dependencies:** CB-M05; CB-M06.

## Objective
Operate three social channels from one workflow while respecting API capabilities, human approval and attribution.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Media-aware editor: choose source story, generate manual or assisted candidate post, editable hook/caption/hashtags/CTA, separate X thread, Instagram feed/reel/card, TikTok video/photo storyboards.
2. Content calendar in day/week/month, campaign/UTM association, responsible editor, approval checklist, publication scheduling, draft/ready/published/error statuses.
3. Channel adapter contracts with OAuth scoped credentials, encrypted token storage, token expiry/refresh, retries, idempotency and per-platform API capability matrix.
4. X API publish/delete workflow with owner authorization, media attachments if license and API tier allow. Evaluate ongoing cost and provider API limits.
5. Instagram professional account eligible Graph/Instagram Login publishing workflows, media container creation/status, permission/app review constraints, explicit media conversion.
6. TikTok Content Posting API creator consent, rights, app audit restrictions; unaudited apps only private visibility; provide prepared downloadable package/manual handoff when public direct-post unavailable.
7. Image/reel template generator reusing approved CoinBlink styles, alt text, localized variants, vertical safe areas, no platform watermark violations; export stills/video compatible with user hardware after media module decision.
8. Publication/engagement performance: X/IG/TikTok links, per-post metrics from permitted API fields, clicks to CoinBlink via UTMs, normalized reporting with missing-metric indicators.
9. Fail-closed human approval for claims, market data, financial advice and direct posting, social disconnect button, duplicate safeguards, complete audit trail.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /admin/social, /admin/social/compose, /admin/social/calendar, /admin/social/accounts; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Preview full content creation and scheduling using sandbox adapters.
2. No live post without explicit approval.
3. Rate limits, 401 and policy failures simulate correctly.
4. TikTok app audit status visibly enforced.
5. Platform metrics show missing, not estimated as fact.
6. Account disconnect and consent revoke.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M07 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## Single-owner social final approval

Only the registered human Owner may configure provider account connections and authorize real social posts in V1; service jobs may prepare drafts/schedules with scoped service permission but cannot bypass Owner's content/platform approval. No additional Social Publisher account should be provisioned until a later owner-approved multi-user migration.

