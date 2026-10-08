# CoinBlink · Owner Mission Control / Admin Cockpit v0.1

**Direction approved by user:** detailed personal admin command center with performance dashboards, graphs, per-article views and complete view of ongoing operations. **Schema/technology are proposals** until frozen by Architecture ADR. Main implementation WOs: CB-M05 (secure editor/admin foundation), CB-M06 (complete cockpit), CB-M07 (Social Studio), CB-M14 (Operations).

## Information architecture

`/admin` protected shell with navigation grouped into:
- **Overview:** executive KPI strip (visitors now/24h, views, stories live, growth, subscribers, social campaigns, platform cost/revenue, service status), quick actions and outstanding approvals.
- **Audience Analytics:** period filters (today, 7/30/90 days/custom), total pageviews, article pageviews, estimated distinct users, sessions, engaged sessions, page engagement, top entry/exit pages, traffic sources, UTM, campaign, language, geo aggregates, device/browser.
- **News Performance:** sortable table showing each article's publish date, author, category, actual human pageviews, rolling views curve, shares, scroll depth, attributed newsletter signup, average engaged time, conversion rate, freshness and source evidence state.
- **Editorial Operations:** source queue, fact-check failures, duplicate stories, scheduled publishing, corrections, author assignment, revisions and source health with manual override.
- **Social Studio:** composer + calendars + media templates + account connections + individual post outcomes + X/Instagram/TikTok analytics.
- **Markets & Sources:** provider freshness, token API spend, quotes stale count, Radar alerts, sentiment methodology, source health and licensed provider registry.
- **Money:** newsletter funnel, sponsor campaign revenue, API paid subscriptions, MRR/churn/ARPA (only when connected), provider and AI spend, profitability signals with cost attribution.
- **API Clients:** authenticated tenant/subscription list, issued key aliases (never full secrets), traffic, plan quotas, recent 4xx/5xx, suspension/revoke, cost-per-tenant.
- **AI Operations:** model usage/tokens/costs, story confidence evidence, rejected hallucinations, quality flags, prompt/version log with redaction.
- **Platform Health:** Cloudflare deploys/previews, web errors, DB/queue lag, service latency, 4xx/5xx, security events, audit log, alerts, backup/restore status, rate caps.
- **Settings & Permissions:** roles/teams, billing integrations, consent/data-retention, external account disconnect, secret health status only.

## Analytics definitions

Every metric must specify event contract, deduplication and consent legal basis, aggregation grain, provenance, retention and whether source is measured or estimated.

| Metric | Proposed calculation | Guardrail |
|---|---|---|
| `article_page_view` | Valid human view for canonical article slug + content ID; exclude obvious bots and prerender | Do not count screenshot generation/previews as public traffic |
| `article_uniques_est` | Privacy-safe dedup per content and reporting window, with consent policy | label "estimated" unless reliable consented identity exists |
| `page_engaged_30s` | Foreground dwell threshold and interactions excluding invisible tabs | no invasive background tracking |
| `scroll_75` | Single representative 75% threshold event per content/session | visibility and bots accounted |
| `homepage_story_click` | Home story card tap/click mapped to target article ID and campaign | CTR denominator must be genuine served card impressions |
| `site_search` | Sanitized normalized query usage count | do not store sensitive full query without policy |
| `newsletter_subscribe` | consented subscriber confirmation event | distinguish submitted vs verified opt-in |
| `social_site_visit` | UTM/referrer attributed incoming session from social | platform impressions/reach are NOT site visitors |
| `social_post_published` | Successful verified publish with platform content ID | never count enqueued job as published |
| `api_request_metered` | successful/failed entitled billable request by hashed key + plan | no secrets or raw PII in metric rows |
| `provider_spend` | observed provider billing/usage ledger with estimate fallback | estimated != billed |
| `editorial_correction` | published editorial correction event | respect public transparency, not merely delete |

## Dashboard technical guidelines

Suggested architecture: a first-party event ingestion endpoint writes deduplicated aggregation-friendly telemetry; minimize raw event retention, honor consent and GPC/legal requirements where applicable, encrypt and scope admin access. Cloudflare analytics/vendor combination must be decided by ADR. Preview/dev events always tracked to separate namespace and filtered by environment. Avoid exposing user-level personal data in exported reports.

Charts should include timeseries, categories, top-ten ranked performance, funnel from social to article to newsletter/API, comparison periods, maps only at safe aggregate granularity, sortable/searchable tables and CSV exports. Each chart has tested real data feed or visible demo label; no decorative arbitrary numbers.

## Owner-first usability

Dashboard layout visually aligned to CoinBlink dark graphite/lime brand (not a generic vendor UI), responsive desktop + tablet, saved views and filters, alerts with severity, action center and global search. One-click from anomaly (e.g. "BTC provider stale") to provider settings/incident; link article views to editor and source evidence; link social campaign CTR to its article and revenue; link API spike to affected tenant and rate limit.

## Audit and Definition of Done

M05 must establish auth and admin shell before data cards. M06 must prove per-news page view counting with reproducible fixtures and real aggregation tests, filtering by article/period, bots excluded and unauthorized access denied. M07 plugs into the same cockpit using distinct platform result states. No claiming "full analytics" if provider APIs omit restricted post-level reach metrics.
