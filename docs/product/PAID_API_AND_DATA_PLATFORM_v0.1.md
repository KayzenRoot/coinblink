# CoinBlink · Public Data API and Paid Developer Platform v0.1

**Owner direction approved:** expose CoinBlink data to other sites/apps through a commercially paid API. **Recommended staging:** design public API contract and entitlement-ready source schema during early modules, implement /v1 public API in CB-M11, enable billing/plan monetization only in CB-M12 after licensing and cost gates.

## Why separate M11 from M12

A live paid API requires: owned/licensed content rights, per-request provider costs, predictable freshness, API observability, stable contracts, predictable uptime, customer support and pricing that covers demand. Charge too soon and a promising revenue stream becomes a liability. **Create the architecture now; sell access later** as an explicit go/no-go owner gate.

## Public data classes and rights

| Public dataset | Suggested release | Hard requirement |
|---|---|---|
| CoinBlink first-party original article metadata, title, excerpt, attribution, canonical URL, tags/categories and timestamps | API Alpha | editorial rights/provenance and no full third-party syndication without agreement |
| Licensed live/delayed market prices with symbol/price/time/freshness and exchange metadata | Beta only | vendor contractual redistribution rights, rate limits and data product restrictions |
| News/radar cluster aggregates, event counts, status and topic trends | Beta | methodology disclosure, licensing, primary-source evidence |
| CoinBlink original AI-written analysis summaries / impact tags with citations | Pro later | verified editorial review, disclaimers and uncertainty |
| Raw syndicated article full texts, private analytics, user records, social tokens or keys | Excluded by default | explicit distinct legal agreements and data/security approval required |

## Draft API routes and schemas (proposal)

- `GET /v1/articles?locale=en&limit=20&cursor=...`
- `GET /v1/articles/{id}` (first-party fields only by default)
- `GET /v1/categories`, `GET /v1/topics`, `GET /v1/radar?window=24h`
- `GET /v1/markets/assets`, `GET /v1/markets/quotes?symbols=BTC,ETH` (provider rights gate)
- `GET /v1/insights?asset=BTC` (future evidence/AI rights gate)
- `GET /v1/status` with freshness/incident, throttled public metadata
- `GET /developers/docs/openapi.json` plus typed samples and SDK examples.

API response design: JSON with stable `id`, `locale`, `published_at`, `updated_at`, `data_fresh_at`, `source_attribution`, `is_delayed` flag where needed, `methodology`, `license`, pagination cursor and structured error metadata. No invented timestamps or unspecified timezones.

## Tenant, auth and use gating

Self-serve signup only after billing/account ADR. Key records stored as hashed secrets, never retrievable full secret, only short prefix; scopes `news:read`, `markets:read`, `insights:read` and plan-specific entitlements. Different key per environment with rotation/revoke, per-key/IP abuse constraints, fair-use/TOS, data resale contract clauses, webhook signature and replay protection.

HTTP `401/403/429` semantics, `Retry-After`, monthly/monthly-rolling quota, request metering, status/health and latency distribution, circuit breaker for provider rate spike. Billing metering counts observed provider execution with clear inclusion/exclusion of rejected/cached calls.

## Commercial plan packaging (names proposed, prices not approved)

- **Sandbox:** free tiny quota, demo datasets and watermark/legal restrictions, no production redistribution permission.
- **Starter:** low-cost editorial headline metadata API, modest quota and support via docs.
- **Pro:** extended quota, Radar aggregations and rights-cleared market data, higher freshness contract.
- **Business:** SLA and volume contracts, custom rights, invoicing and white-label integrations subject to contracts.

Potential products: CoinBlink API, CoinBlink News Widgets embeddable on partner sites, cryptocurrency mini ticker widgets and paid insights digests. Design them to consume the same public API and licensing rules, NOT bypass API quotas.

## Recommended economic release gate

Record observed monthly cost of ingestion, CDN/cache, storage, API worker CPU time, egress, currency/FX/billing fees, support and licensing. Only then model floor price, gross margin, churn scenarios and cap rates; no speculative guaranteed revenue.

## Admin owner visibility

Dashboard by subscription/tenant, billable calls, failures, latency, provider cost attribution, active/expired keys, fraud spikes, subscription paid/past_due/cancelled, MRR/ARPA/churn when actually backed by billing provider; fraud and data redistribution alerts.

**External risk:** vendor API licensing frequently distinguishes merely *displaying* quotes on owned pages from *reselling/redistributing* them to third parties. Public API launch is automatically BLOCKED until each data field has signed or otherwise verifiable redistribution permission.
