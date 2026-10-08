# Planned Work Order CB-M02 · Public News Experience & Discovery

**Stage:** P0 · reader experience  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/en/news, /en/news/:slug, /en/category/:slug, /en/search`  
**Dependencies:** CB-M01; CB-M05 article schema.

## Objective
Public articles, categories, search, topic hubs, read-next and editorial navigation.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Create compact article cards, breaking badges, reading pages, story timeline, author/source panels, structured headline byline and publication/update timestamps.
2. Build category and tags discovery, filtering, search with highlighted snippets, pagination, trending/latest feeds and saved share/deep links.
3. Implement canonical URL and editorial attribution displays, official primary-source links, corrections notices and transparent AI assistance badges.
4. Set site-wide skeletons and error/offline states and optional editorial sidebar while keeping pixel-fidelity home unchanged.
5. Mobile-first article typography, navigation, accessibility, keyboard, link previews, lazy media and Web Vitals budgets.
6. Support demo fixture content only behind clear non-production flag until editorial pipeline provides approved live articles.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation, route(s) /en/news, /en/news/:slug, /en/category/:slug, /en/search; fixture data clearly labeled; compare with current design system. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Real end-to-end reader flows on preview.
2. Search/filter deterministic tests and empty states.
3. No fabricated live headlines.
4. Author/source provenance and correction routes.
5. Readability, performance and a11y.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M02 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## In-article sponsored units (owner-approved direction)

Reserve dormant responsive, clearly labelled ad placement seams after the lead, between substantive article sections, in wide desktop rail and below article body. Never disguise them as news, interleave excessively or initialize third-party scripts. M13 owns activation/consent/billing. All locations require responsive visual review and article readability tests.

## v2 rich news article design contract

Use docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v2.0_DRAFT.md P03 and docs/design/COINBLINK_EDITORIAL_MEDIA_ENGINE_v2.0_DRAFT.md. Implement accurate 16:9 cover, 720–760px reading column, fact/source links, figure captions, related stories, optional default-off ad slots, sticky context rail, inline diagrams/video poster and accessibility. Source-backed charts use actual timestamped series; M17 produces approved assets later. Initial missing generative API is not permission to fabricate artwork or claim generator live.
