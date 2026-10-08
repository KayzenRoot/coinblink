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

## Next controlled Work Orders

- **CB-DOCS-001:** preserve source documents, scope/decision classification, reference image hashes and any documented image transfer blocker.
- **CB-ASSETS-001 (proposed):** upload immutable original Golden image bytes, SHA-256 verify in Git and promote visible visual reference index.
- **CB-PLAN-001 (proposed):** approve V1 scope and governed architecture, deterministic QA, exact deployment plan; no application implementation until then.
- **CB-CI-002 (proposed):** governed preview deployment to Cloudflare after scope and security architecture approval.
