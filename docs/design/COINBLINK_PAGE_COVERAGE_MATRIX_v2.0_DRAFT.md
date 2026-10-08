# CoinBlink · Comprehensive Route & Visual Coverage Matrix v2.0 DRAFT

**Date:** 2026-10-08 · **Coverage:** 38 public/reader screens + 48 Owner-Admin screens = **86 route/view contracts**. Documented designs are NOT code, screenshot approval or deployed URLs. Locale en is canonical; pt-BR and es variants are required where meaningful. Exact article slug/id dynamic routes are templates; 86 is not a count of unique final deployed static URLs.

**Design Authority:** immutable Golden Homepage and Logo assets + frozen v1.0 design (approved visually for Home only); [internal public pages proposal](COINBLINK_VISUAL_DESIGN_BIBLE_v2.0_DRAFT.md); [owner admin screens proposal](COINBLINK_ADMIN_DESIGN_v2.0_DRAFT.md). Original JPEG bytes not yet in Git.

## Public / Reader (38 view contracts)

| ID | Route template | Screen | Approval |
|---|---|---|---|
| P01 | /en | Approved Golden Homepage | Golden v1 APPROVED; code absent |
| P02 | /en/news | Latest News Index | DRAFT (home visually approved only) |
| P03 | /en/news/[slug] | Rich Immersive News Article | DRAFT (home visually approved only) |
| P04 | /en/category/[slug] | Category Hub | DRAFT (home visually approved only) |
| P05 | /en/topics/[slug] | Topic or Event Timeline | DRAFT (home visually approved only) |
| P06 | /en/search | Full-Site Search Results | DRAFT (home visually approved only) |
| P07 | /en/markets | Market Overview | DRAFT (home visually approved only) |
| P08 | /en/markets/[symbol] | Single Asset Detail | DRAFT (home visually approved only) |
| P09 | /en/radar | Radar 24h / Breaking Signals | DRAFT (home visually approved only) |
| P10 | /en/sentiment | Market Sentiment Explained | DRAFT (home visually approved only) |
| P11 | /en/insights | Analysis & Explainership | DRAFT (home visually approved only) |
| P12 | /en/briefs | Blink Briefs | DRAFT (home visually approved only) |
| P13 | /en/authors/[slug] | Author Profile | DRAFT (home visually approved only) |
| P14 | /en/about | About CoinBlink | DRAFT (home visually approved only) |
| P15 | /en/contact | Contact & Support | DRAFT (home visually approved only) |
| P16 | /en/advertise | Advertise with CoinBlink | DRAFT (home visually approved only) |
| P17 | /en/courses | Education / Future Courses | FUTURE/DRAFT |
| P18 | /en/courses/[slug] | Future Course Detail | FUTURE/DRAFT |
| P19 | /en/newsletter | Newsletter Subscribe | DRAFT (home visually approved only) |
| P20 | /en/watchlist | Watchlist & Following | FUTURE/DRAFT |
| P21 | /en/alerts | Reader Alerts | FUTURE/DRAFT |
| P22 | /en/sources | Sources & Editorial Method | DRAFT (home visually approved only) |
| P23 | /en/editorial-policy | Editorial Policy & AI Disclosure | DRAFT (home visually approved only) |
| P24 | /en/corrections | Corrections Ledger | DRAFT (home visually approved only) |
| P25 | /en/privacy | Privacy Policy | DRAFT (home visually approved only) |
| P26 | /en/terms | Terms of Use | DRAFT (home visually approved only) |
| P27 | /en/cookies | Cookies & Consent | DRAFT (home visually approved only) |
| P28 | /en/accessibility | Accessibility Statement | DRAFT (home visually approved only) |
| P29 | /developers | Developers Landing | DRAFT (home visually approved only) |
| P30 | /developers/docs | Developer API Documentation | DRAFT (home visually approved only) |
| P31 | /developers/pricing | API Plans | FUTURE/DRAFT |
| P32 | /developers/console | Developer Customer Console | FUTURE/DRAFT |
| P33 | /status | Service Status | DRAFT (home visually approved only) |
| P34 | /en/token | Future Native Token Info | FUTURE/DRAFT |
| P35 | /404 | Not Found | DRAFT (home visually approved only) |
| P36 | /500 | Error and Maintenance | DRAFT (home visually approved only) |
| P37 | /en/legal/disclosures | Financial / Advertising Disclosures | DRAFT (home visually approved only) |
| P38 | /en/press | Press & Brand Resources | DRAFT (home visually approved only) |

## Owner/Admin (48 view contracts)

All require session and server-side owner authentication. No public admin registration, no multi-human admins in V1. Platform API clients cannot access them.

| ID | Route template | Screen | Approval |
|---|---|---|---|
| A01 | /admin/login | Owner Sign-in | DRAFT |
| A02 | /admin/setup | One-Time Owner Activation | DRAFT |
| A03 | /admin/recovery | Owner Recovery | DRAFT |
| A04 | /admin | Mission Control Overview | DRAFT |
| A05 | /admin/analytics | Traffic & Audience | DRAFT |
| A06 | /admin/analytics/articles | Article KPI Grid | DRAFT |
| A07 | /admin/analytics/articles/[id] | Story Analytics Detail | DRAFT |
| A08 | /admin/articles | Newsroom Content Table | DRAFT |
| A09 | /admin/articles/new | New Rich News Editor | DRAFT |
| A10 | /admin/articles/[id]/edit | Existing Story Editor | DRAFT |
| A11 | /admin/editorial/review | Fact & Publish Review | DRAFT |
| A12 | /admin/media | Media Library | DRAFT |
| A13 | /admin/media/create | AI Media Studio | DRAFT |
| A14 | /admin/research | AI Research Desk | DRAFT |
| A15 | /admin/sources | Provider Sources | DRAFT |
| A16 | /admin/ingestion | Ingestion Jobs | DRAFT |
| A17 | /admin/markets | Market Provider Control | DRAFT |
| A18 | /admin/social | Social Operation | DRAFT |
| A19 | /admin/social/compose | Cross-Platform Creative | DRAFT |
| A20 | /admin/social/calendar | Social Calendar | DRAFT |
| A21 | /admin/social/accounts | Connected Channels | DRAFT |
| A22 | /admin/advertising | Advertising Command Center | DRAFT |
| A23 | /admin/advertising/inventory | Ad Inventory Heatmap | DRAFT |
| A24 | /admin/advertising/campaigns | Sponsor Calendar | DRAFT |
| A25 | /admin/advertising/creatives | Sponsor Media Review | DRAFT |
| A26 | /admin/api | Data API Operations | DRAFT |
| A27 | /admin/api/customers | API Customers | DRAFT |
| A28 | /admin/revenue | Revenue & Costs | DRAFT |
| A29 | /admin/newsletter | Newsletter Operator | DRAFT |
| A30 | /admin/ops | System Health | DRAFT |
| A31 | /admin/ops/audit | Audit Trail | DRAFT |
| A32 | /admin/ops/security | Security Overview | DRAFT |
| A33 | /admin/settings | Settings Hub | DRAFT |
| A34 | /admin/settings/integrations | API Keys and Providers | DRAFT |
| A35 | /admin/settings/site | Site and Brand | DRAFT |
| A36 | /admin/settings/editorial | Editorial Rules | DRAFT |
| A37 | /admin/settings/ai-media | AI and Media Providers | DRAFT |
| A38 | /admin/settings/social | Social Provider Configuration | DRAFT |
| A39 | /admin/settings/markets | Market API Configuration | DRAFT |
| A40 | /admin/settings/analytics | Analytics and Privacy | DRAFT |
| A41 | /admin/settings/monetization | Ads, API Plans and Payment | DRAFT |
| A42 | /admin/settings/security | Owner Account and MFA | DRAFT |
| A43 | /admin/settings/notifications | Alerts Delivery | DRAFT |
| A44 | /admin/settings/backup | Backup and Recovery | DRAFT |
| A45 | /admin/settings/token | Future Token Configuration | FUTURE disabled |
| A46 | /admin/token | Future Token Monitoring | FUTURE disabled |
| A47 | /admin/settings/legal | Legal and Consent | DRAFT |
| A48 | /admin/settings/cloud | Hosting and Environment | DRAFT |

## Shared acceptance matrix

| Screen family | Desktop QA | Mobile QA | Content/data | Security |
|---|---|---|---|---|
| Home and news | Golden home 1536×864, article full page 1536, grids | 390×844 / 360×800 | attribution and original media, illustrative vs real, no fake headlines | publish gate and legal ad slots |
| Search/categories/markets | filter behavior and chart labels | one column, touch, graph scroll | timestamp/source/freshness | rate limit input and licenses |
| Legal/contact | readable text and form | 390×844 | versioned policies, tickets, consent | CSRF, spam, privacy |
| Developer | sidebar+contract examples | collapsible doc navigation | docs not secret, live data status | separate tenant auth from owner |
| Owner dashboards | 1536×864, tabular precise charts | useful quick status, no inaccessible dense table | measured/estimated/demo and date range | one-human Owner server guard |
| Owner article/media | factual review+cover animation controls | editor outline collapsible | AI disclosure, source/rights/caption/alt | owner final approve, provider vault |
| Owner Settings | masked provider keys & test results | secret entry safe on touch | vault ref/status/cost fields | MFA step-up, external root, no plaintext |
| Future Token | explicit disabled / no network | disabled placeholders | never fabricated chain stats | no issuance/trading/wallet secret controls |

**Remaining design decisions:** screenshots approved for every family, final motion timings and font licensing, mobile Golden adaptation, Settings encryption architecture ADR, media provider+budget ADR, third-party API rights/consent, ad placements Golden diff, token network/tokenomics/legal checks (future). Any router naming changes must update matrix and own Work Order under GEF governance.
