# CoinBlink · Product Blueprint v0.1 (Proposed Architecture of the Product)

**Date:** 2026-10-08  
**Status:** owner-approved DIRECTION + DRAFT product contracts; not a frozen Scope/DoD/Architecture.  
**Repository:** `KayzenRoot/coinblink`.  
**Language:** canonical publication `en`, secondary `pt-BR` and `es`.

## North star

Build CoinBlink as a trustworthy, visually premium, globally legible cryptocurrency news and market intelligence publication, plus an internal **Mission Control** for its owner, a compliance-aware three-platform **Social Studio**, and a future paid **CoinBlink Data API**.

CoinBlink is **not** a trading exchange, guaranteed signal service, unlicensed data reseller, autopublishing spam network, or price prediction machine.

## Product surfaces

1. **Public newsroom:** high-fidelity approved homepage, latest/trending categories, article page, original author/source attribution, tags/search, market cards/ticker, Radar 24h, market sentiment methodology, explainers, site trust pages, multi-language publishing. Approved screenshot governs appearance at 1536×864; full source is `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md`.
2. **Owner Command Center:** secure, actionable `/admin` with dashboard, exact article performance and date filters, visitor acquisition, publishing/editorial queues, markets/providers, social campaigns, revenue, API usage, AI costs, cloud deployment and incident health.
3. **Editorial pipeline:** approved sources ingest, cluster/dedup, evidence+fact gate, draft/review/approve/publish, localized variations, update/correction/retraction and full audit trail.
4. **Social Studio:** create/adapt posts for X, Instagram and TikTok with visual template previews, calendar, scheduling, manual and API publishing modes, approval and tracking.
5. **Developer products:** public read API to first-party news metadata and rights-cleared market data; metering, API keys, docs, tenant console, later paid plans and recurring billing.
6. **Growth/retention:** email/newsletter, alerts/watchlists, sponsorship and ethical advertising, SEO, alerts, educational explainers and transparent premium extensions.

## Roles / security boundaries

- **Owner:** all configuration, billing, revenue, provider spend, publish approvals, incident controls and irreversible operations; strong authentication.
- **Admin / Managing Editor:** editorial workflows, permissions limited by owner, schedules, approvals and trend analytics.
- **Editor / Reporter:** create drafts and suggest social posts, manage own content, no unreviewed production deploy or secrets access.
- **Social Publisher:** prepare creative, queue and only publish to authorized connected accounts after explicit approval gate.
- **Data Analyst:** read aggregated stats, export entitled aggregated data, never auth secrets/user PII.
- **API Customer:** only their own keys, usage, bills and allowed public API contract; isolated tenant.
- **Reader:** public content, authorized newsletter and optional personalization.
- **Service Agent:** least-privilege automated editorial and provider tasks, denied unilateral irreversible publication until gated.

## Data lifecycle and integrity

Provider feed/document → authenticated source+license → deterministic ingestion+detection → story cluster/evidence → editorial draft → claim review → human approval → localized article → published canonical URL → aggregation/analytics → social preview/approved distribution → API distribution when rights allow → update/correct/withdraw with propagation.

Each external statement must preserve primary source, source timestamp, fetched timestamp, licensing restrictions, attribution text, revised timestamp, claimed vs inferred category and confidence. Do not publish invented headlines, unsupported market numbers or sponsored content disguised as neutral news.

## Metrics that matter

- Public content: impressions where instrumented, human page views, unique visitors (consent-aware estimates), article-level engaged read, CTR and referral distribution, error rate, publish freshness and correction rate.
- Distribution: campaign reach as available, platform posts sent/failed, attributed site sessions, newsletter signups, post URL clicks, efficiency and API costs.
- Operations: source uptime/lag, stale quotes, ingest duplication, editorial backlog, moderation/claim alerts, job retries, Core Web Vitals and Cloudflare costs.
- Business: ad sponsorship bookings, reported revenue, newsletter growth, API trials/subscribers, API call volume, cost/request, ARPA/MRR/churn once billing actually exists.

All metric definitions must indicate `measured`, `estimated`, `sampled`, `unavailable` or `demo`; historical backfill must never be presented as if exact.

## Build and demo promise

**The site stays viewable while building.** Every implementation module has one large GEF WO/PR with P0 visual shell, P1 working end-to-end journey and P2 hardening plus tests, with a protected, shareable Cloudflare Preview URL posted in the PR. Default local Docker `localhost:3000` remains available. The first platform WO must establish the preview lane before UI WOs can be accepted.

Use dedicated 1536×864 screenshot and mobile screenshots on each relevant PR. Image-fidelity checks require the original two Golden JPEGs and precise hashes; they are missing from Git and tracked as CB-ASSETS-001.

## Phase scope recommendation (NOT YET FROZEN)

- **Alpha platform:** previews; brand/home Golden reconstruction; auth/CMS and command center shell.
- **Editorial beta:** public articles/search, licensed ingestion, trusted markets, full owner analytics and first supervised X/IG/TikTok drafting.
- **Growth beta:** AI evidence desk, three-language editorial, newsletter/alerts, developer API foundation and security observability.
- **Commercial:** approved public API billing, sponsors/ads, reader personalization and first public launch gates.

Critical launch prioritization: an editorially functioning portal + actionable owner cockpit + **working preview first**. Paid public API framework should be architected from the outset, while actually selling rights-cleared market/news data waits for contracts, metering, pricing and abuse controls.

## Product-level stop conditions

No production marketing/claims while historical ideas remain merely proposed. No unlicensed article copying or unlicensed market data resale. No social publication on unapproved accounts or unaudited TikTok client as public direct post. No production deployment with demo figures. No billing until provider cost/rights have been verified. No whole-product frozen status before approved Scope, Architecture, Security/Test Plan, DoD and GEF checkpoint are promoted through owner governance.

## Owner-approved Advertising Studio direction · 2026-10-08

Reserve tasteful, clearly labelled banner inventory on homepage, news articles, category lists and eligible promotional locations. Admin advertising management handles Google AdSense (publisher network, only after approval), direct contracted sponsor campaigns, house campaigns for CoinBlink and future courses. CB-M01/CB-M02 create only visually approved slots; M05/M06 reserve admin/metric contracts; one comprehensive M13 work order manages campaign creation/scheduling/measurement/rights/consent. Keep Golden home faithful. Refer to docs/product/ADVERTISING_AND_MONETIZATION_v0.1.md.
