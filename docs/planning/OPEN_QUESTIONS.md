# CoinBlink · Open Product and Architecture Questions

Product planning is deliberately **OPEN**. Do not convert a candidate technology or an historical brainstorm idea into a shipping requirement without an approval record.

## Decisions still needed before site architecture is frozen

1. **Product Scope V1:** prioritize exact desktop homepage fidelity versus complete site navigability, real news articles, categories, search, prices, Radar 24h and editorial tools for the first public milestone.
2. **Editorial truth and attribution:** list permitted RSS/official/paid providers, rate limits, reprint rights and source primary citation rules; rules for the AI Research Desk, Fact/Evidence Gate and human editorial approval.
3. **Market data:** live vs delayed token prices, token logo/icon licensing, chart license/attribution, stable fallbacks and cost budgets.
4. **i18n publishing:** which article content is translated at launch, editorial review of translations, hreflang canonical behavior, language switching.
5. **Hosting and budgets:** Cloudflare plan, Workers/Pages architecture, D1/R2 storage and cash budget including API overages; how preview deployments and real-time services are isolated.
6. **Brand clearance:** trade-name similarity review (including Coinwink), desired domains, registered trademark and social handles.
7. **Performance and visual QA:** approved fonts, production hero layered assets, original SVG logo rights and exact screenshot diff tolerances, mobile design sign-off.
8. **Privacy and analytics:** cookie-consent regions, newsletter provider, analytics consent, retention and ad/affiliate disclosure policies.
9. **Promotion / launch:** public staging notice, deployment environment isolation, secrets storage, production rollback, incident handling and domain setup.
10. **Cloud Codex dispatch:** reliable authenticated task invocation remains unavailable from this ChatGPT conversation; GitHub authenticated edit/review available. Do not equate GitHub PR comments with Codex Cloud task execution.

## Non-negotiable current constraints

- Golden Home and Logo images are master design references, not HTML screenshots to be shipped as non-interactive UI.
- `en` is canonical; `pt-BR` and `es` are planned from the beginning.
- Product news, crypto prices and indicators cannot be generated from mock demo data and passed as actual current market facts.
- No claim of trademark clearance or professional production readiness without checks.
- Source Pack (Scope, Architecture, DoD, Requirements, policies) remains draft until individually approved.

## Newly prioritized owner questions (October 2026)

- **MVP cut:** exact Golden homepage + one end-to-end article + real article analytics + admin CMS, or more of the live market/social panel before first public beta?
- **Admin command:** choose count definitions (unique visitor estimated vs page views, engagement) and consent jurisdiction, admin login provider/MFA.
- **Social account authorization:** registered X developer app, eligible professional Instagram account, TikTok audit status, media rights. Launch editor and calendar first; keep actual social POST sandbox until approval.
- **Paid API:** which fields are owned or legally redistributable; release the docs/read API earlier, billing after verified demand and unit economics?
- **Preview release:** connect Cloudflare Account with authorized token and isolated bindings, as a separately gated platform setup. Worker Previews or Pages based on accepted stack ADR.
- **Module schedule:** accept or adjust 19 proposed module-wide WOs (M18 future only) and release order in `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`.

## Next controlled Work Orders

- **CB-DOCS-001: COMPLETED** (PR #4 merged). Full source text preserved, JPG originals not yet committed.
- **CB-ASSETS-001 (proposed):** upload immutable original Golden image bytes, SHA-256 verify in Git and promote visible visual reference index.
- **CB-PLAN-001 (active planning):** draft modular blueprint, large GEF WOs, continuous preview protocol and owner decision rounds; module scope/architecture remain unapproved until accepted.
- **CB-CI-002 (proposed):** governed preview deployment to Cloudflare after scope and security architecture approval.

## Advertising planning decisions pending

- Pick exact banner positions by comparing home layout against Golden screenshot; ad slots must remain optional until visual approval.
- Choose AdSense sign-up timing after quality original articles, site ownership, privacy/CMP and ads.txt configuration; do not guarantee acceptance or earnings.
- Decide sponsor pricing, category exclusivity, minimum booking, invoice/payment processor and prohibited crypto-finance advertisers; first rate card can remain draft.
- Future course scope (landing page/syllabus, qualified instructors, checkout, refunds and consumer terms) requires separate product acceptance; ad campaigns can precede actual products.
- Privacy for Brazil/international audience and Google-certified CMP for personalized publisher ads where required, honest advertiser reporting and bot-resistant measurement.

## Owner-only Settings, internal design and token questions

- **Authentication architecture:** one-time owner activation with out-of-band bootstrap, verified email, MFA/passkey, recovery; choose authorized provider, session lifetime and tenant separation. No public admin signup or second privileged user.
- **API key vault design:** choose Cloudflare Secrets Store scoped manager vs application-encrypted DB with separate KMS/KEK; budget, provider scope, rotation, secret provenance and exit/recovery. Bootstrap root key cannot be editable through web Settings.
- **Editorial media generation:** which image/video providers and terms, allowed local ComfyUI worker (not always-on), rights/likeness policy, cost cap, attribution and factual media acceptance, animation formats and performance limits.
- **Inner page aesthetics:** approve screenshots for article rich cover/inline media, contact, markets, search, developer, Advertising and high-priority admin/Settings; 38+48 DRAFT textual designs do not replace actual Golden approval.
- **Publishing automation:** choose default generate draft vs source-grounded draft approval only; Owner remains last publish decision.
- **Token future:** no selected network, contract, ticker, utility, supply, vesting, legal structure or custody. Token issuance is OUT OF SCOPE; monitoring design stays disabled until independently approved.
- **Scope and module order:** M17 media production integrates M05 and M08; M18 future is not scheduled. Product Scope/Architecture/DoD not yet frozen.

## M00 active execution prerequisites

- Verify M00-only Astro/adapter/Wrangler strict version compatibility with latest official Cloudflare integration and limits, without freezing unrelated product modules.
- Cloudflare Account access: scoped Workers script edit token, account ID, Workers Builds/Git integration and (later) Zero Trust Access. **NOT YET CONNECTED**; use GitHub Actions secret manager / provider account only, never paste tokens in chat.
- Local app shell must be real in Codex/CI, not just a planning PR. Cloudflare preview with responsive screenshots is required before module DONE.
- GEF product Source Pack/checkpoint JSON still absent, check policy before declaring active admission; do not manufacture missing approved product contracts.
