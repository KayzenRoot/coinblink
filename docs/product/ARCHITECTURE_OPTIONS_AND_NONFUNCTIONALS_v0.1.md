# CoinBlink · Candidate Architecture and Non-functional Requirements v0.1

**Status:** PROPOSAL ONLY. Do not treat this file as an accepted ADR. User already approved visual golden, delivery style, command center, three social platforms and a future paid API, but tech stack and costs await confirmation.

## Recommended lean full-stack candidate

- **Frontend:** Astro or modern TypeScript app runtime with React islands where interactivity matters, UnoCSS/Tailwind token-driven styling, semantic HTML, accessible components and selective Motion/SVG effects. Benchmark actual Worker/SSR compatibility before ADR.
- **Hosting:** Cloudflare Workers with isolated **Worker Previews** per PR (Wrangler 4.135.0+), source-controlled build/CI. Cloudflare Pages is fallback if compatibility/implementation simplicity demonstrates superior fit; not deploy both stacks by accident.
- **Routing/API:** typed Hono or same-origin Worker HTTP router, OpenAPI/Zod schemas, separate public `/v1` vs private `/admin/api` capability surface, no secrets in client bundles.
- **Persistence:** D1 (structured smaller-scale editorial/core ops) considered first; explicit migration/trx limitations and operational constraints tested. R2 for media; KV for edge-friendly config/cache where applicable, Cloudflare Queues + Cron for ingestion and retries. Avoid adding every product to baseline without a cost/security justification.
- **Auth:** provider/account choice via security ADR; privileged owner MFA-capable identity, httpOnly/sameSite session cookies and server authorization checks, not JavaScript-only route guards.
- **Analytics:** first-party minimal telemetry collection, consent/legal basis and aggregate reporting; evaluate Cloudflare Web Analytics + own event backend or privacy-aligned vendor, avoid unapproved PII retention.
- **LLM:** provider abstraction with default low-cost inference, source evidence cache, strict daily token/cost ceilings; JEV as optional decision layer only with verified integration. No LLM access to owner billing/post actions without approval.
- **Payments:** provider to select after rights/cost estimate; hosted checkout/webhooks, avoid touching PCI card data.
- **Media:** production asset provenance, image optimization and optional local RTX content workflow; GPU processing occurs off Worker runtime with licensed output rights and reproducible artifact storage.
- **Container local:** Docker Compose suitable for local UI backend emulation and seeded demo, document differences from live Worker runtime. Cloud preview is authoritative to owner browser review.

## Proposed logical architecture

Browser (readers) -> CDN + Worker public app -> public/read API -> approved stories + licensed cached market data.
Browser (owner) -> protected admin app -> authorization boundary -> CMS, providers, analytics, social, AI jobs and billing monitors.
Ingest source worker -> provider credential vault -> queue/dedup/provenance -> editorial approval -> published content and API license-filter.
Social Studio -> human approval -> adapter job -> X/Instagram/TikTok official API -> platform result -> analytics attribution.
Paid API clients -> API key scope & tenant -> quotas/metering -> license-filtered data -> auditable invoicing ledger.

## Nonfunctional targets (numbers pending baseline)

- Core Web Vitals for public pages; explicit LCP/INP/CLS budgets before implementation admission, no invented benchmarking.
- Fault tolerance: no loss or duplicate publication for retries; idempotency keys on jobs/payments and social posts.
- Performance: bounded DB fan-out, cache TTL/freshness, graceful stale with `as_of` labels and high-traffic news burst readiness.
- Security: rate limits, RBAC, MFA support, CSP/CORS/CSRF/SSRF, signed media URLs, webhooks verified, data encryption and strict preview isolation.
- Localization and a11y: en/pt-BR/es, WAI-ARIA/keyboard/contrast, WCAG-informed acceptance checks, correct SEO locale.
- Costs: monthly cap per external API/service and high spend alert, source throttling and automation kill switch.
- Audit: immutable-ish version histories and revisions, correction trace, event/log retention and fail-closed gate violations.
- Data licensing: field-level provenance and restrictions decide public output before serialization. Third party syndication forbidden unless licensed.
- Backups: test restore and rollback before production launch.

## Architecture Decision Records needed before execution

ADR-A app/runtime, ADR-B previews and Cloudflare resource isolation, ADR-C database/queues/media, ADR-D auth/RBAC/privacy analytics, ADR-E provider licenses/caching, ADR-F CMS editorial workflow, ADR-G social official APIs/access audits, ADR-H public API metering and Stripe/other billing, ADR-I model/provider routing/JEV budget and approvals, ADR-J accessibility/visual regression acceptance.

Unresolved names are *decision opportunities*, not requests to provision paid accounts right now.
