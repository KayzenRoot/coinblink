# CoinBlink · Scoped Implementation Boundary

**Status: OWNER_APPROVED_M00_ONLY / M00_ADMITTED.** This does not mean the entire product Scope is FROZEN. Owner explicitly accepted this bounded source contract on 2026-10-08, PR #30 comment 6067708856; PR #32 admitted M00 at `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`. Full product Scope remains open.

## Included in first admitted execution candidate CB-M00-WO-001
- TypeScript/Astro Worker-compatible functional site preview scaffold, intentionally not a finished Golden Home.
- Real `/en`, `/health`, `/preview-status` and branded 404 route, honest "under construction" states, no invented news/quotes.
- Docker Compose on `localhost:3000`, Node 22 engine, reproducible lockfile/environment, basic local verification.
- Tested per-PR deployment design for Cloudflare Workers Previews, trusted source-only pipeline and environment isolation. **Cloudflare account permission gates only remote deployment, NOT local P0 implementation.**
- Playwright screenshots on 1536×864, 768×1024 and 390×844, HTML semantics, keyboard focus, console-error/overflow checks; CI on Linux + Windows plus security scans and exact-HEAD evidence.
- Preserve GEF bootstrap, approved source/brand contracts and pending Golden JPG import. No use of synthetic logo substitute. No irreversible remote costs.

## Excluded from M00
Complete Golden Homepage rendering (M01), public article/CMS/business data, root/admin credential onboarding (M05), social publishing, image inference (M17), paid API billing, revenue network deployment, real market prices, production Cloudflare release, or blockchain/token issuance (M18 indefinite future).

## Scope boundary
Existing module contracts M01–M18 remain PLANNED/NOT_ADMITTED, globally open. Existing planning Issue #6 remains open. Closing M00 scope does not freeze the whole product. If actual GEF v1.1.2 doctor/preflight **requires** global approved product sources even for this slice, report the missing gate rather than silently promoting those broader draft decisions.

## Staged admission
P0 local and CI is independent of Cloudflare account credentials; P1 remote Preview needs separate authorization; P2 exact-head audit, independent review and visual acceptance. The Owner approved this bounded M00 scope in PR #30 comment 6067708856. Independent review and Git merge make the approved source pack canonical on `main`; separate GEF `doctor`/checkpoint validation and an evidence-backed Work Order admission gate executable implementation. GEF validation does not grant or revoke the Owner's scope approval.
