# Planned Work Order CB-M00 · Delivery Platform & Live Previews

**Stage:** P0 · critical prerequisite  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/preview-status and /admin/preview-status`  
**Dependencies:** CB-BOOT-001; CB-PLAN-001 stack ADR.

## Objective
Reproducible monorepo/app delivery, secure PR previews on Cloudflare, local Docker parity and visual test harness.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Select the Cloudflare deployment target via ADR; prefer Workers Previews using pinned Wrangler 4.135.0+; keep Pages Git integration as a documented alternative if the selected runtime is incompatible.
2. Create app shell and isolated preview environments, per-PR stable URL and immutable deployment URL, protected production deployment, quality gates and a preview status route.
3. Configure reusable environment templates, example env with NO real credentials, secrets through provider vault, resource isolation for D1/KV/R2/Queues, preview cleanup after merged/closed PR.
4. Add Playwright Chromium screenshots in CI at 1536×864 plus representative tablet/mobile viewport, accessibility smoke, broken-link check, and upload screenshot and diff artifacts.
5. Integrate one-click link from GitHub PR with URL and immutable commit digest, live readiness probe, deployment status and rollback instructions.
6. Provide local Docker Compose development profile on localhost:3000 with one command startup and ephemeral fixtures, parity documentation and health tests.
7. Add PR budget and timeout controls, automatic stale deploy cleanup, structured Cloudflare logs, no sensitive environment data exposed to public previews.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /preview-status and /admin/preview-status; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Fresh clone and npm ci.
2. PR creates accessible non-production preview URL and healthcheck.
3. Both Docker local and cloud preview render equivalent shell.
4. CI records exact SHA and screenshots and alerts on failure.
5. No preview reuses prod secrets or mutable prod state.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M00 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.
