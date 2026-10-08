# CoinBlink · Continuous Visual Delivery Protocol v0.1

**Owner requirement:** progress must be observable *while building*, not merely when a giant feature is over. Each large module WO must produce a navigable Cloudflare Preview and a local Docker development option where technically feasible. This is an accepted **delivery target**; preview infrastructure is not live at the time this proposal is written.

## Architecture decision target

Prefer **Cloudflare Workers Previews** for one full-stack application: isolated code/config per PR with stable PR URL and immutable deployment URLs. Cloudflare documents availability from September 2026 and Wrangler **4.135.0+**, configured via a preview section and `npx wrangler preview`:
- https://developers.cloudflare.com/workers/previews/get-started/
- https://developers.cloudflare.com/workers/previews/examples/
- https://developers.cloudflare.com/workers/previews/compare-workflows/
Cloudflare Pages Git previews are the fallback for a static frontend whose API needs separate Worker configuration:
- https://developers.cloudflare.com/pages/configuration/preview-deployments/

Do not mistake versioned Worker URLs that share production resources for isolated previews. **The Cloudflare Account, token and project setup require the owner's secure provider authorization; never store tokens in public Git.** Separate D1/KV/R2/Queues (and other non-auto-isolated account resources) for Preview and Production.

## Every code Work Order delivery contract

1. **Before implementation:** approved Scope+ADR/WO, exact Git base HEAD and Context Lock, secret prerequisites and provider-cost permissions; if a gate is missing, no irreversible release.
2. **P0 Visual shell:** Codex commits a small navigable vertical shell with fixture marker. CI starts and produces URL/health/readiness and 1536×864/390×844 screenshots; user can open preview.
3. **P1 Working core:** implement real data entities, endpoints, UI actions, proper auth and error states, backups/migration as relevant. Publish after each meaningful internal milestone. Keep same stable PR URL, update immutable version URL.
4. **P2 Verify:** Playwright E2E, unit/integration/contract, responsive/a11y, security negatives, performance budgets and provider budget limits. Compare Golden Home overlays for visible home components only, no fake pixel-perfect claims.
5. **Review:** post CodeRabbit and Codex reviews, inspect exact-head CI, screenshots, URL health and audit; fix within same WO and rerun.
6. **Merge:** only after required checks pass and owner/approved review gate; checkpoint delta promoted only under GEF semantics.
7. **Continuous monitoring:** production deploy only from release-admitted main/tag; failed previews, broken links and stale demo data visible in operator dashboard.

## PR evidence contract

- `PREVIEW_STABLE_URL`, `PREVIEW_IMMUTABLE_URL`, timestamp, commit SHA and `DEMO|SANDBOX|LIVE` data-status labels.
- screenshots: desktop 1536×864 for approved master overlay, 768×1024 tablet, 390×844 mobile, admin dashboard at agreed viewports and short interaction recording when valuable.
- smoke: /health, canonical nav, login redirects, preview content, browser console errors, no missing fonts/icons/broken images, accessibility.
- performance: LCP/CLS/INP and size budgets agreed before admission; no fake threshold passing.
- accessibility: keyboard and visible focus, contrast, alt text, reduced motion, screenreader critical journeys.
- outcomes: list P0/P1/P2 pass, unresolved issues by severity, exact HEAD sha, CI links, security/privacy/license gates, dependencies consumed, cost change.

## Preview security

Public URL can expose private drafts or internal admin surfaces if not protected. Apply Cloudflare Access or equivalent Preview auth, and require actual application login to reach admin routes. Preview data uses synthetic fixtures or isolated accounts and separate secrets; never clone production user emails, paid API keys, article drafts or tokens to an open staging site. Use minimal preview access, rotate secrets and delete closed PR previews.

## Local Docker mode

A `docker compose up --build` or documented single command should expose `localhost:3000` with same UI routes and deterministic fixtures, although provider-specific Worker features may require a compatible emulator and can be documented as non-identical. Production deployment is NEVER to localhost. Document reproducible reset and teardown scripts.

## Negative gates

No visual QA before authentic Golden images present and hashed. No false "live market" label for fixtures. No assumption that a PR comment successfully started Codex Cloud. If Cloudflare account not connected, PR may have local screenshots as partial evidence, but implementation Work Order cannot be called visually deliverable until accessible Preview exists. No unconditional auto-merge of failing CI or unreviewed security changes.
