# ADR-CB-0001 · M00 Preview-first Technical Baseline

**Status:** MODULE-SCOPED TECHNICAL DECISION CANDIDATE, global Scope/Architecture/DoD remain OPEN (Issue #6).
**Owner directive:** start M00 with Cloudflare Workers Previews + Docker local + Codex, produce visible incremental results, no home/brand substitutions.
**Decision:** TypeScript strict + Astro with official compatible @astrojs/cloudflare adapter, React islands only where needed. One Cloudflare Worker for initial stateless application. Wrangler >=4.135.0 for Worker Previews, package versions pinned using lockfile after official compatibility test. Existing Node 22.17 and GEF CLI v1.1.2 preserved. No D1, KV, R2, Queues, Workflow or production resources required for stateless M00.

## Rationale
Astro fits article-heavy, SEO-oriented content while avoiding unnecessary browser hydration; SSR can later serve CMS, market data and private Admin. Cloudflare has official Astro Workers integrations. Worker Previews generate stable branch URLs and deployment-specific immutable URLs; page shell does not require a production deployment.
Official references:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/
- https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- https://developers.cloudflare.com/workers/previews/get-started/
- https://developers.cloudflare.com/workers/previews/resources/
- https://developers.cloudflare.com/workers/previews/configuration/
- https://developers.cloudflare.com/workers/previews/examples/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/

## Build lanes
1. Local development via docker compose, actual localhost:3000, mock data prominently labeled DEMO. Verify true Cloudflare workerd compatibility.
2. Read-only PR GitHub CI: npm ci, GEF, TypeScript, build, Playwright desktop 1536x864, tablet 768x1024, mobile 390x844; a11y/links/browser-console checks; report exact SHA.
3. Authorized preview lane: scoped Cloudflare account credentials in GitHub encrypted secrets (not in repo), trusted same-repo PR only, npx wrangler preview --name pr-N. Worker Builds integration is acceptable if produces PR URL and build provenance. Treat every preview URL as PUBLIC by default; use Cloudflare Access when nonpublic drafts/Admin appear.
4. Actual preview must report stable and immutable URL, timestamp, commit, /health and /preview-status sanitized status. No false live claims.
5. Merge gate: independent review, GEF exact-head green, owner screenshot review and verifiable preview link. Production requires its own release gate.

## Non-production isolation and security
- Explicit preview vars ENVIRONMENT=preview. Do not mount prod secrets or D1/KV/R2/Queue/analytics datasets and never assume preview is automatically isolated.
- Worker Previews can produce Queue messages but NOT consume them. M00 has no Queue binding; M03 later uses separate queue/consumer in non-production.
- Service bindings may call production. Avoid them until independently approved. Never expose bootstrap secrets, owner accounts or private drafts in previews.
- No pull_request_target workflow executing untrusted PR checkout with sensitive secrets. Guard GitHub Actions deploys against forked PRs.
- Verify Cloudflare plan costs/quotas before any deployment. Cloudflare account connection and Access permissions require authorized owner action; no access is assumed.
- Use preview-specific clean-up using exact PR name only, no broad deletion patterns. Document rollback.

## Alternatives
Cloudflare Pages preview may be approved if Astro Worker Preview proves incompatible after test. Vercel is not the owner-selected target and cannot silently replace Cloudflare. No premature D1/R2/Queues required for static shell.

## STOP and scope
This ADR is for M00 only and awaits module admission under GEF; it does NOT freeze all application architecture, payment, token, image pipeline or auth. M00 can prepare local code while Cloudflare credentials are pending, but cannot claim completion or a live preview without verified external Cloudflare account deploy. Golden JPEG binaries are verified outside Git, still not imported; M01 fidelity remains separately gated.