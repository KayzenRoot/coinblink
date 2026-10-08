# Planned Work Order CB-M05 · Editorial CMS, Auth & Workflow

**Stage:** P0 · admin foundation  
**Status:** PROPOSED / NOT ADMITTED  
**Execution model:** GEF Bootstrap v1.1.2; Codex authoring when available; no execution claim from planning artifact.  
**Preview route(s):** `/admin/login`, `/admin/setup`, `/admin/recovery` (three pre-session, separately protected flows); `/admin/articles`, `/admin/articles/new`, `/admin/articles/[id]/edit`, `/admin/media` (M17 placeholder), `/admin/settings`, `/admin/settings/integrations` (the latter require an authenticated Owner session)  
**Dependencies:** CB-M00.

## Objective
Secure Owner-only publishing command substrate: immutable sole human Owner identity, first-run secure activation and MFA, article CMS, provider integration Settings Vault, generated media review, scheduling and full audit.

## Source hierarchy / context
Read `AGENTS.md`, `.engineering/SOURCE-HIERARCHY.md`, current admitted GEF Checkpoint and Context Lock, full owner-approved Visual Bible and image manifest, `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`, `docs/product/CONTINUOUS_VISUAL_DELIVERY_PROTOCOL_v0.1.md`, the active Decision Ledger, and the specific module's contracts. Never use historical brainstorm as approved scope.

## Admitted boundary
ADMISSION STATUS: PROPOSED, NOT EXECUTABLE until CB-PLAN-001 architecture/product scopes are approved, active module Context Lock compiled, exact base HEAD pinned, dependency review and GEF preflight passed.

## End-to-end implementation deliverables
1. Build protected one-human-OWNER admin shell; NO public admin signup, out-of-band single-use activation, atomic one-Owner identity, email verification, password hashing, MFA/passkeys, sessions and secure recovery. Existing suggested multi-role human setup is superseded in V1. Future human roles require separate owner approval; machine identities remain scoped.
2. Authoring editor for articles, revisions/drafts, media library, multi-author collaboration-safe locking, version rollback and content previews.
3. Manage categories, tags, sources, authors, translations, SEO metadata, editor scheduling and publication states.
4. Editorial workflow: source candidate → fact-check → editorial review → approved/scheduled → published → corrected/withdrawn, with explicit permission gates.
5. Preview content in article/frontpage before publishing; validate OG cover and structured data; never put secret preview tokens in browser logs.
6. Admin navigation becomes stable host for analytics, social, market data, API customers and operations modules, with placeholder pages clearly marked unavailable.

## Data, contracts and privacy
Define the module's database entities/schema migrations, normalized events, role permissions, public/internal API contracts (if applicable), fixture strategy, latency/cache behavior, accessibility treatment, copyright/licensing provenance, data retention, error observability and secret boundaries. No new external paid services or posting/revenue side effects without approved ADR and explicit owner permission. Integrations start sandbox/mock and promote by a separated, documented external verification gate.

## Long Work Order execution and milestones
- **P0 · Vertical visual shell:** concrete navigation and canonical routes /admin/login, /admin/setup, /admin/recovery (pre-session with distinct safe gates), /admin/articles, /admin/articles/new, /admin/articles/[id]/edit, /admin/settings, /admin/settings/integrations; fixtures clearly marked. No legacy /admin/editor route. Commit and publish Preview, collect screenshot/health evidence.
- **P1 · Functional complete slice:** functional persistence/API/validations/workflows/permissions, provider fallbacks, meaningful content and action states. Add E2E and contract tests, update screenshots; debug in this same WO, not an unrelated WO.
- **P2 · Quality/production gates:** roles, privacy, abuse, performance, cost budget, a11y, import/export and rollback as relevant; collect owner feedback, resolve all actionable P1/P2, assert exact HEAD and repeat CI/Preview.
- **Milestone discipline:** one module PR with intermediate commits and screenshot links; STOP when a failed gate cannot be responsibly corrected within this same scope. Don't artificially split one coherent module across many repetitive WOs; also avoid massive cross-module PRs.

## Module-specific acceptance criteria
1. Unauthorized user blocked both UI and API.
2. Review approvals not bypassable by role.
3. Draft preview and publish cycle passes end-to-end.
4. Revision restore and audit log.
5. Preview screenshots of editorial UX.

## Required verification / evidence
Use repeatable unit/integration/E2E Playwright tests, accessibility checks, security negative cases, exact-head CI and deployed Worker Preview smoke. Evidence Bundle must include base/head SHA, provider mocks vs live status, URL, one screenshot per viewport (1536x864/390x844/768x1024), test logs, known gaps, costs, license/consent restrictions, correction count and next legal action.

## Out of scope
Other modules, legal publication rights not covered by this module, cross-module schema refactors without ADR, and creating a live public launch merely because the Preview works. Secrets stay out of Git. Demo quotes/news/stats are visibly mocked until backed by approved providers.

## Definition of Done and STOP
STOP CONDITION: code and UI actually running in PR preview, acceptance validated, documented review and all critical defects corrected on same PR, owner visual/function approval or explicit bounded delegation, exact-head CI green, checkpoint delta proposed and only then merge. If external app review, API payment, cloud account, secrets, image rights, or unapproved ADR blocks it, mark BLOCKED and retain a useful mock-mode preview with explicit badges; never fake live deployment, monetization or data.

## Review payload template
`CB-M05 | BASE_SHA | HEAD_SHA | P0_PREVIEW | P1_FUNCTIONAL | P2_TESTS | EVIDENCE_BUNDLE | LIVE_VS_MOCK | PRIVACY/LICENSING | RISKS | EXACT_HEAD_CI | VERDICT | CHECKPOINT_DELTA | NEXT_ACTION`

> This planned WO is intentionally long and module-wide. It becomes executable only after freezing its contract/ADR/dependencies and fingerprinted Context Lock. No blanket self-approval.

## Advertising section foundation

Provide locked-down /admin/advertising navigation stub with RBAC and not-connected status for future CB-M13. This foundational CMS/auth module does not send paid ads or invoice sponsors.

## Single Owner and full Settings vault requirement (owner directive 2026-10-08)

Read docs/design/COINBLINK_SETTINGS_AND_SINGLE_OWNER_v2.0_DRAFT.md and docs/design/COINBLINK_ADMIN_DESIGN_v2.0_DRAFT.md. Deliver all Settings category navigation with honest Not connected state; implement security-critical vault and general site/provider settings within THIS M05 WO, not many little sub-WOs. Crypto root secret/bootstrap must remain outside same database and web UI, while normal provider API keys are entered and managed via Owner Settings.

M05 P0: protected admin shell, login/activation/password+MFA setup screens, Settings Hub and masked provider cards preview, Owner-only routing with safe demo data. No live integrations or public signup.
M05 P1: atomic one-owner database claim, secure credential hashing/recovery/session management, server-side owner-session guards for privileged admin routes; separate credential/one-time-bootstrap/recovery challenge gates on /admin/login, /admin/setup and /admin/recovery; provider catalog, owner write-only HTTPS key input, safe AEAD envelope encryption with external KEK or permission-scoped Secrets Store intermediary, DB metadata, Test Connection, budget, rotate/revoke and audit; editorial creation/draft/fact approval pipeline.
M05 P2: adversarial tests for first-run race, foreign readers/API client, CSRF, session loss, secret GET/log leaks, DB-dump disclosure, tampered ciphertext, key rotation/revocation and preview/prod isolation; fallback safe state if secrets provider not authorized. Owner only human admin; service agents cannot bypass publish confirmation.

Data fields must include Provider, Env, Supported Service, Vault Reference/Encrypted Ciphertext, Masked ID, Last Tested, Health, Expiration, Quotas, Daily Cost Cap, Active, Rotation Time and Redacted Audit. Distinguish Save from Connection Tested from Live Service Enabled. A Settings web form is NOT entitled to hold root Cloudflare account admin credentials or the key-encryption root.
