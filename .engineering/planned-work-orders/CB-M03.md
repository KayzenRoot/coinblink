# Planned Work Order CB-M03 · Source Connectors, Ingestion & Provenance

**Stage:** P0 · content supply  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/admin/sources and /admin/ingestion`  
**Dependencies:** CB-M00; CB-M05 editorial entity schema.

## Objective
Compliant news harvesting and source evidence lineage without plagiarism or rights violations.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Create approved provider registry: official blogs, RSS, public APIs, paid licensed wire services with redistribution rights matrix and source priority.
2. Build resilient scheduling, fetch workers, queues, cursor checkpoints, conditional GET/cache, retry with backoff, dedup/canonicalization and anti-loop idempotency.
3. Model original URL, provider license, timestamp, source fetched-at, evidence digest, corrections, relevance, canonical entity/topic and upstream fact links.
4. Propose multi-source clustering and verifiable story claims with attribution, editorial queue, human escalation and source health metrics.
5. Keep raw third-party text in restricted/internal store where licenses permit; public display original independently-authored content and quotations only under approved rights.
6. Admin tables for sources, budget, last run, HTTP errors, duplicates, license state, actionable retry and kill switch.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /admin/sources and /admin/ingestion; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Simulated feed and failure integration tests.
2. Provenance trace from source to editorial candidate.
3. License restrictions enforced.
4. No duplicate publishes on replay.
5. Queue/backoff/quotas tests.
6. Admin preview demonstrable.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M03 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## Cloudflare Queue Preview safety

Worker Previews may PRODUCE Queue messages but do NOT become the Queue consumer. Production Queues could route test events into a production consumer. M03 Preview ingestion must be labeled SIMULATED; no preview binds a production Queue. Consumer integration tests run against a dedicated non-production Queue and separately deployed non-production consumer Worker, or invoke a controlled local test consumer directly. Verify Queue isolation, producer permissions and no production side effects before M03 admission. Document in M00 Cloudflare resource ADR. Source: https://developers.cloudflare.com/workers/previews/resources/ .
