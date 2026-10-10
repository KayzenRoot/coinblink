# CoinBlink · Global staged V1 baseline

**Status: OWNER_APPROVED_GLOBAL / FROZEN.**

This status becomes canonical only after a reviewed merge. The Owner instructed Continue immediately after the specific question to approve the first V1 functional milestone: exact Golden Home, a secure one-human-Owner editorial CMS, and one source-backed article journey, with the other planned modules retained. The approval applies to staged scope and fixed safety invariants, not to paid/live provider access or any unselected security implementation. Main base: 842fc5a0e54bdaed37066abd830fd1b346368b2b. M00 is COMPLETE at 5%; M01-M17 NOT_ADMITTED and M18 FUTURE_NOT_ADMITTED. This source pack does not admit a new module.

## Frozen cross-module architecture

- Reuse existing tested Astro/TypeScript strict and Node 22 Worker/SSR stack with protected manual Cloudflare Preview and the scoped Windows Docker Compose environment. No new runtime stack is needed to start approved work.
- Every admitted module owns an isolated module implementation root and reviewed versioned producer contract. A dedicated Integration Steward owns shared Astro routes/middleware/layout, package manifests, CI, env declarations and shared database migration history. Agents cannot edit shared files concurrently.
- All unadmitted module planning and contract fixtures are synthetic/offline and visibly labelled MOCK; no missing provider API or licensed data is presumed LIVE.
- Exactly one permanent human Owner. An eventual real M05 implementation needs an out-of-band single-use activation invitation, verified email, strong password verifier, MFA or passkeys, secure HttpOnly sessions, audited recovery, server authorization, CSRF/rate limits and Owner-only privileged Settings. Metadata for authors does not create another privileged human.
- Until a separate security and storage ADR and permission approval, M05 P0 can render only fixture-based admin UX without real privileged sessions or stored API keys. M05 P1 secrets vault must use write-only inputs, redaction, protected encryption and its root KEK outside the same DB; no Cloudflare account-admin token in the browser.
- Article and source producer contracts must define provenance/rights, content states, corrections, versioning, locale, errors, authentication and evidence/publish rules before their consumers integrate.
- Multiple local agents are bounded by observed CPU/free RAM, isolated worktrees and separate PRs; tests cover contracts and module behavior, with heavyweight Playwright/Docker through a bounded shared queue. Required checks run on exact HEAD and after serial main merges.

## Deliberately deferred architecture ADRs

Choose the actual database (including possible D1 Free), migration/backup and tenancy, auth library/session/MFA/recovery implementation, secrets-management root/intermediary, provider licensing and queues, metrics privacy, mail/social APIs and production architecture separately. This global baseline does not provision or authorize any new external resource.

## Historical M00-only architecture boundary, retained below

### CoinBlink · Architecture Decisions Boundary

**Historical M00-only status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED.** PR #32 admitted this bounded M00 architecture at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. **Do not** interpret this as full product architecture approval.

## M00 baseline recommended
- TypeScript strict; Node.js 22 per `package.json` with pinned npm. Preserve installed GEF 1.1.2 and dependency-provenance gates; retain REVIEW when provenance is unverified.
- Astro SSR/hybrid with official `@astrojs/cloudflare` adapter for public editorial routes and future React islands where needed; select compatible verified package versions on execution.
- Stateless **single** Cloudflare Worker for M00; no D1, KV, R2, Queues, Durable Objects, production service bindings, remote provider APIs, or secrets needed to build local P0.
- Explicitly disable Astro automatic session storage for this stateless module, `session: false` or verified selected-version equivalent. Validate deployed Wrangler has no SESSION KV binding.
- Docker Compose localhost:3000 with true health endpoint. Initial one-command local run does not depend on Cloudflare credentials.
- Wrangler >=4.135.0 and real Cloudflare per-PR Worker Preview only after credentials scoped/authorized, plan/quotas inspected and nonproduction isolation checked. Production deployment is separate.
- GitHub Actions test lane can operate without secrets, trusted preview deploy lane must not run untrusted fork source with sensitive token. A Cloudflare provider access failure is a deployment status, **not** a local compilation blocker.
- Plain /health/preview-status sanitized output; never reveal internal owner info or API credentials.
- The app preview is preliminary branded structure, not a copy of the Golden approved screenshot or fabricated functionality.

## Explicitly OPEN global architecture
Database choice (D1 vs other), single-owner auth/secret vault, social provider adapters, licensed market data/API, editorial AI/media, token chain and custody, and production hosting costs are unapproved at this source pack stage. Full product scope remains open at Issue #6. Consult `docs/product/ARCHITECTURE_OPTIONS_AND_NONFUNCTIONALS_v0.1.md` as proposal only.

## Admission binding
The detailed scoped ADR is `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md`; its M00 status was reconciled after the PR #32 admission. GEF source lineage and the exact allowed baseline are recorded in the execution Context Lock; no proposed docs beyond the admitted Work Order become executable by implication.
