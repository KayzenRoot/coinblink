# CoinBlink · Architecture Decisions Boundary

**Status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED.** PR #32 admitted this bounded M00 architecture at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. **Do not** interpret this as full product architecture approval.

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
