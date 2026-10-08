# Planned Work Order CB-M01 · Golden Design System & Homepage

**Stage:** P0 · first visual milestone  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/en, /pt-br and /es home shells, first /en screenshot`  
**Dependencies:** CB-M00; CB-ASSETS-001.

## Objective
Rebuild the approved CoinBlink 1536×864 dark Homepage visually and functionally, not by using the screenshot as a flat page.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Verify original approved golden reference JPEG bytes and logo SHA-256 before producing any design derivation; construct editable/responsive design system, logos/icon exports and asset provenance.
2. Implement top navigation, ticker, Bitcoin cinematic breaking hero, Live Market Overview, Trending Now, categories, Radar 24h, Market Sentiment, promo card, Latest News and newsletter in the exact approved hierarchy.
3. Create reusable dark graphite + lime palette tokens, typography, spacing, cards and glass effects calibrated against the Golden Home; avoid default generic SaaS layout.
4. Add accessibility/keyboard contrast, skeletons/empty/loading/error states, interactions, tooltips and reduced-motion alternatives, with local fixtures clearly marked as demonstration.
5. Implement light theme token foundation as unapproved separate design prototype; don't claim light identity approved.
6. Compare 1536×864 screenshot with source using overlay, visual regression, component region crops and difference reports; record residual mismatches with owner sign-off and no fabricated 100% match.
7. Mobile and tablet adaptive layouts preserving brand, fast initial load and responsive hero assets; preview all breakpoints.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /en, /pt-br and /es home shells, first /en screenshot; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Golden masters in Git and hashes exact.
2. All master home blocks present in preview.
3. Screenshot at 1536x864 and regions attached.
4. Axe/a11y and cross-browser smoke.
5. Owner visual approval gate before 'visual frozen'.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M01 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## Advertising placement seam (owner-approved direction)

Build reusable accessible, responsive, default-OFF AdSlot presentation seams only at visually owner-approved positions such as home_after_trending and approved existing sponsor card. No live AdSense scripts, no sponsor placement that disrupts Golden fidelity; M13 owns advertising campaigns and scripts. See docs/product/ADVERTISING_AND_MONETIZATION_v0.1.md.
