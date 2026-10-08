# CoinBlink · Decisions Ledger (working, 2026-10-08)

This register **preserves the exact distinction between owner-approved direction, candidate approaches, and unapproved planning**. It does not substitute GEF governance, signed ADRs, Scope or DoD. Canonical engineering documentation and identifiers use English; historical planning and the source Visual Bible are intentionally kept in Brazilian Portuguese without rewriting owner-approved source.

| ID | Topic | State | Current authority / details |
|---|---|---|---|
| CB-DEC-001 | Project working identity | USER SELECTED; LEGAL CLEARANCE OPEN | **CoinBlink**, international news portal about crypto; naming still requires similarity check (including Coinwink), domains and trademarks, no registration claims |
| CB-DEC-002 | Product language hierarchy | USER APPROVED | English `en` primary; `pt-BR` and `es` secondary, proper i18n from the start |
| CB-DEC-003 | Dark desktop homepage design | VISUALLY APPROVED | Owner-selected 1536×864 dark homepage is the exact Golden Home reference. Do not replace with an inspired template |
| CB-DEC-004 | Logo visual identity | VISUALLY APPROVED | Metallic eye/coin with lime flash and CoinBlink wordmark; source raster golden logo 1179×1040. A production SVG is not yet approved |
| CB-DEC-005 | Brand mood | VISUALLY APPROVED | Premium graphite/dark, restrained neon-lime green, dense editorial dashboard, glassmorphism, cinematic Bitcoin hero |
| CB-DEC-006 | Fidelity acceptance | USER REQUIREMENT | Visual diff / overlays against immutable source files; deterministic 1536×864 screenshot first; no 100% claim until measured |
| CB-DEC-007 | Light theme | USER REQUIREMENT | Dark baseline plus accessible light alternative; final light design not yet visually approved |
| CB-DEC-008 | Product operating model | USER UPDATED, 2026-10-08 | **Codex Desktop LOCAL + Git/GitHub** is primary implementation workflow to conserve ChatGPT Plus allowance; Docker is local. Cloudflare previews remain a separate future deployment target after authorized account access. Codex Cloud implementation is not the current workflow; no preview deployed. |
| CB-DEC-009 | Engineering bootstrap | IMPLEMENTED | GEF `@gef-bootstrap/cli@1.1.2` + three pinned Matt Pocock Codex skills, audited in CB-BOOT-001 / PR #2 |
| CB-DEC-010 | Front-end stack | PROPOSED; ADR OPEN | Astro + React + TypeScript + Tailwind, selected Radix/shadcn, lightweight charts and Motion; validate with implementation constraints before ADR |
| CB-DEC-011 | Hosting/data stack | PROPOSED; ADR OPEN | Cloudflare Workers, D1, R2, caches, static/SSR hybrid; costs, quotas, deployment and security pending |
| CB-DEC-012 | Editorial AI | PRODUCT DIRECTION, CONTRACT OPEN | DeepSeek/AI-assisted research, primary-source evidence, fact-checking and original reporting. Exact JEV integration and decision gates require review |
| CB-DEC-013 | News distribution / monetization | PRODUCT DIRECTION, POLICY OPEN | Multisource news, X/Twitter distribution, paid banners/sponsor spaces; provider licenses, costs, user permissions unresolved |
| CB-DEC-014 | Master screenshot's headlines/prices | DEMO DATA ONLY | Do NOT publish screenshot mock numbers, dates or claims as factual/live news |
| CB-DEC-015 | Full product architecture, scope, DoD, API contracts | NOT APPROVED | Global product planning remains OPEN; the separate bounded M00-only source pack is Owner-approved in PR #30 and does not approve M01–M18 or production |
| CB-DEC-016 | Golden image file presence in Git | BLOCKED / NOT IMPORTED | Binary masters are preserved outside Git; intended paths/hashes in `assets/reference/reference-manifest.json`. Do not claim visual-ready source pack yet |

**Visual authority:** `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` explains the two Golden raster assets; if a sentence disagrees with the image, the **approved original image** is authoritative on visual appearance.

**Governance:** Owner future approvals must promote individual decisions via GEF rules; this ledger captures observed directions only. The past ideas Master is preserved intact for traceability, not promoted to engineering requirements.

## Owner-approved product and delivery directions · 2026-10-08

| ID | Topic | State | Evidence / boundary |
|---|---|---|---|
| CB-DEC-017 | Large module-wide Work Orders | USER APPROVED DELIVERY STYLE | Prefer one comprehensive implementation WO per cohesive module, with internal milestones/commits, corrections in same PR and GEF exact-head review. Do not remove DoD/gates to accelerate |
| CB-DEC-018 | Continuous visual progress | USER APPROVED DELIVERY TARGET | Every implementation module must produce accessible preview with screenshot/health; Codex Cloud+GitHub+Cloudflare direction, Docker localhost alternative. Preview infrastructure still NOT CONNECTED |
| CB-DEC-019 | Owner Command Center | USER APPROVED PRODUCT DIRECTION | Comprehensive private admin cockpit for live/period analytics, every article's views, editorial operations, provider health, social, budgets, monetization and API customers. Metric/storage designs await ADR |
| CB-DEC-020 | X + Instagram + TikTok | USER APPROVED CHANNELS | Admin creation/editing/scheduling/approval/metrics. Actual account access, app audits, API costs and permissions OPEN; no automatic publication authorized |
| CB-DEC-021 | Paid external developer API | USER APPROVED PRODUCT DIRECTION | Third-party sites/apps should be able to subscribe to CoinBlink news, quotes and future insights. Recommendation: architecture from start, public metered API after source rights, billing activation later. Pricing/contract OPEN |
| CB-DEC-022 | Administration-first detailed instrumentation | USER APPROVED PRODUCT DIRECTION | Per-story views, article clicks and channel attribution must be measurable and charted with privacy and honest metrics. Consent implementation/metric semantics OPEN |
| CB-DEC-023 | Work Order timing / rapid implementation | USER PRIORITY | Finish soon through scoped long WOs, early previews, parallel test tooling and one coherent module per PR; no uncontrolled mega WOs or auto-merge bypass |
| CB-DEC-024 | Cloudflare Worker Previews | OWNER-APPROVED M00 DIRECTION / DEPLOYMENT NOT AUTHORIZED | M00 architecture baseline is in the approved PR #30 source pack; exact Worker compatibility, plan/cost, account authority and deployment remain unverified. Preview credentials and production resources are not authorized |
| CB-DEC-025 | Product module catalog (17 units) | PROPOSED IMPLEMENTATION STRUCTURE | `.engineering/planned-work-orders/` remains non-executable. M00 has a bounded source approval, but still requires a canonical GEF checkpoint, current Context Lock, exact-head checks/review and separate formal admission; M01–M18 remain NOT ADMITTED |
| CB-DEC-026 | Revenue streams | RECOMMENDED, NOT FINANCIALLY APPROVED | Sponsors/ads, newsletter, affiliate disclosures, developer API, embeddable widgets, premium insight reports (future) |

## Owner direction · Advertising and promotions (2026-10-08)

| ID | Decision | Status | Boundary |
|---|---|---|---|
| CB-DEC-027 | Ad spaces on homepage and article pages | USER APPROVED DIRECTION | New Golden screenshot placement details require visual review |
| CB-DEC-028 | Monetize publisher ads from Google | USER APPROVED DIRECTION | Google AdSense, NOT the Google Ads advertiser product; publisher account and site review OPEN |
| CB-DEC-029 | Sell direct sponsor banners to companies | USER APPROVED DIRECTION | Rate cards, contractual terms, moderation and invoicing OPEN |
| CB-DEC-030 | Promote future courses / house products | USER APPROVED DIRECTION | Actual course storefront, sales/fulfillment, prices and refund terms OPEN |
| CB-DEC-031 | Full advertising admin controls | USER APPROVED DIRECTION | Campaigns, creative, inventory, reports, dates, earnings and owner kill switch, implementation contract proposed in M13 |
| CB-DEC-032 | Consent, visual ad placement and vendor billing methods | PROPOSED | Govern via dedicated monetization ADR, Google approval and privacy gates before live ads |

## Owner directions 2026-10-08 · full internal Design Bible, settings, media and future token

| ID | Requirement | State | Decision boundary |
|---|---|---|---|
| CB-DEC-033 | Specify every internal/public/admin page with detail comparable to approved Home | USER APPROVED DIRECTION | v2.0 textual internal page designs are DRAFT, NOT visually owner-approved screenshot designs |
| CB-DEC-034 | Rich newsroom articles with original image and animated/graphic illustrations | USER APPROVED DIRECTION | Automatic **draft** creative generation with source evidence, chart correctness, rights, captions, human approval and cost cap |
| CB-DEC-035 | Native CoinBlink token eventually | FUTURE USER IDEA | NO network, ticker, tokenomics, contract or issuance; plan only M18/disabled admin monitoring |
| CB-DEC-036 | Only one human administrator | USER APPROVED SECURITY REQUIREMENT | Exactly one Owner human account; no public privileged signup or multi-admin; initial activation is secure one-time ceremony |
| CB-DEC-037 | Fully configurable admin Settings, API keys saved for site operation | USER APPROVED PRODUCT DIRECTION | Owner enters ordinary service keys within protected UI; secrets encrypted or held in secure vault, root encryption/bootstrap outside same database |
| CB-DEC-038 | Initial owner email/password account | USER APPROVED DIRECTION | Verified email, strong password+MFA/passkeys, server-side session auth, secure recovery; tech selection TBD |
| CB-DEC-039 | Exact settings database/vault/auth design | PROPOSED / ADR OPEN | Cloudflare Secrets Store vs AES-GCM envelope + external KEK, OAuth provider scopes, schema, consent and rates pending admission |
| CB-DEC-040 | New inner-page visual composition and typography | PROPOSED / VISUAL SIGNOFF OPEN | 38 public + 48 admin page layouts, grids and motion targets require screenshot review; Home v1.0 remains visual authority |
| CB-DEC-041 | Editorial media engine M17 and token dashboard M18 | PROPOSED LONG MODULE WOs | M17 after CMS/source providers; M18 indefinite FUTURE until legal/token technical go/no-go |
| CB-DEC-042 | Bounded CoinBlink M00 source pack | USER APPROVED M00 ONLY / GEF ADMISSION PENDING | Owner approval at PR #30 comment `6067708856`, for source HEAD `84f6c02a119259806d230470efc115162d733855`; approval covers the bounded M00 Scope/Requirements/Architecture/Security/DoD only. GEF checkpoint, active Context Lock and implementation admission remain separate gates |
| CB-DEC-043 | Formal admission candidate for CB-M00-WO-001 | PROPOSED / CB-GOV-005 PENDING EXACT-HEAD CHECKS, REVIEW AND OWNER AUDIT | Candidate is based on canonical main `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`; only M00 may become admitted on reviewed merge. Application implementation stays NOT_STARTED at 0%, CB-M01..CB-M17 remain NOT_ADMITTED, CB-M18 remains FUTURE_NOT_ADMITTED, and Issue #6 stays open |

