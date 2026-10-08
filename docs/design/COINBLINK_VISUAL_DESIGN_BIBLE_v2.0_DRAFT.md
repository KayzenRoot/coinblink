# COINBLINK · VISUAL DESIGN BIBLE v2.0 DRAFT

**Date:** 2026-10-08. **State:** DESIGN PROPOSAL FOR ALL INTERNAL PAGES / NOT VISUALLY APPROVED.  
**Owner-approved direction:** complete public/editorial/admin/settings page design, single owner-admin, editorial illustration and animated explanation generation, future native token monitoring (token itself not scheduled).  
**Immutable authority:** [VISUAL DESIGN BIBLE v1.0](COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md) and original Home Golden 1536×864 SHA-256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`, Logo 1179×1040 SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`. **Neither original JPEG is in Git yet** (CB-ASSETS-001).  
**Source rule:** do not rewrite v1.0 or imply the following page designs already have user-approved screenshots. **This v2.0 extends all remaining pages as wire-specs**; actual source images/layouts are subject to separate previews/owner visual signoff.  
**Canonical product language:** English; pt-BR and es localized.

## 1. Visual DNA and practical rules

- Same brand: graphite near-black, translucent thin-boundary charcoal glass panels, metallic Coin/bright lime Blink, premium precision, controlled green pulse, original eye/coin/lightning mark. Hero bronze/gold only where appropriate to real Bitcoin imagery; avoid blanket rainbow gradients.
- v1.0 screenshot measurements override new general tokens for homepage. The **internal page starting tokens** below are proposed calibration values, NOT measured from newly approved internal-page images: page background #090D0D, elevated panel #151C1B, hover #1D2925, text primary #F0F6F2, secondary #9CAEA7, muted #718079, lime primary #B8F35A, subtle outline rgba(184,243,90,.17), neutral border rgba(255,255,255,.09); negative #FF796D, warning #FFCE78. Contrast and actual tokens require visual/a11y measurement.
- Full editorial desktop max-content ~1448px within 44px gutters at 1536 width; admin app shell max content fluid. Internal grid desktop 12 columns, gap 16–24px; dense home retains v1 exact tighter gaps. Reader page regular body max-width 720–760px. Proposed vertical rhythm 8px base, panel padding 18–24px, large content block gaps 24–40px. Borders 1px, radius 10–16px; apply lime only to states/actions and major brand accents.
- Typography: editorial headlines size ~42–56px on desktop article detail (scaled clamp 32–56), compact card 16–24px, category title 30–40px, body 17–19px/1.6–1.75, captions 12–14px; UI labels 12–14px. Numeric rows use tabular figures. Approved font families must be selected by licensed-font ADR and calibrated vs Golden.
- Status chips: never lime for every decorative tag. Live (only verifiably live), Delayed / As-of, Demo, Draft, Scheduled, Corrected, Sponsored, AI-assisted and Evidence reviewed must be visually differentiated and semantically labelled.
- Image/frame slots: top article lead 16:9, inline full-width chart 16:9 or 2:1, quote cards 3:2, portrait 4:5, social 1:1/4:5/9:16. Always show credit, illustrative/AI designation when material, alt text, aspect ratio, skeleton and fallback.
- Motion: page-enter opacity/translate 180–250ms, hover 120–180ms, data-glow 800–1200ms only when conveying update; animate data on meaningful change rather than perpetual loop. SVG/Spring/Canvas only if benchmarked. Prefer CSS transform/opacity; pause offscreen; respect prefers-reduced-motion, offer paused/video poster; no aggressive parallax over article text.
- i18n: all text from localized CMS/dictionaries, never English baked into image captions. Currency/date/time localized and "data as of" always explicit.
- Advertising: pre-agreed AdSlot seams clearly marked and default OFF until M13. Article ads never between title and byline or within factual diagrams; Golden Home takes precedence. No Google scripts in PR previews.

## 2. Global navigation / breakpoints / behavior

**Desktop ≥1280:** top persistent thin 60–64px nav matching v1 visual; left logo, News/Markets/Radar/Insights, global search, locale, theme button, newsletter; never expose /admin as public nav. Page title/breadcrumb in inner page content, not new banner that changes Golden home.
**Medium 768–1279:** condensed nav, 8-column content, market right rails collapse below article.  
**Mobile 360–767:** logo/nav hamburger, fixed? prefer non-obtrusive top header and bottom reading action strip only if accessible; single-column grids, 16px gutters, no sideways scroll, media width fluid; breadcrumb truncation reversible.
**Footer:** About, Contact, Advertise, Press, Editorial Policy, Sources, Corrections, Privacy, Terms, Cookies, Disclosures, Accessibility, Status, Developers and newsletter. Language switches maintain canonical equivalents/hreflang.
**States mandatory across every screen:** loading, empty, partial outage, offline, unauthorized, permission denied, error, no source rights, demo/preview, translated/untranslated and media not yet approved; focus, keyboard and screenreader announcements.
**Responsive screenshot evidence targets:** 1536×864, 1280×800, 768×1024, 390×844, 360×800. Article long-scroll screenshots may also use full-page capture and media inspection.

## 3. Public/reader route specification

The page IDs below are individually specified **design directions**, not screenshots or deployed views. Page access depends on future module admission; future routes are labelled.

### P01 · Approved Golden Homepage · `/en`

**Visual approval:** Approved *visual* only; golden raster has authority.  
**Desktop composition:** Existing 1536×864 screenshot: header ~61, wide Bitcoin hero + market panel 3.14:1, ticker, Trending, category shortcuts, Radar24h, Sentiment, promotion, Latest News and newsletter.  
**Visual reading sequence / interactive pattern:** Header logo → lead editorial story → market ticker → trending → news clusters; no banner may displace Golden components.  
**Data / motion / legal / empty-state constraint:** No rebuilding from a full-page screenshot background. No newly proposed ad placement without owner approval. English mock prices/headlines are not factual.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P02 · Latest News Index · `/en/news`

**Visual approval:** Proposed internal page visual.  
**Desktop composition:** Compact editorial masthead, Latest/Breaking filter rail, card mosaic of mixed 16:9 thumbnails + editorial metadata, right rail trending/market widget; dark glass surfaces.  
**Visual reading sequence / interactive pattern:** Latest / Trending / Most Read / Categories / time filter / source filter; 3-column summary cards on wide screen; pages via cursor.  
**Data / motion / legal / empty-state constraint:** Infinite scroll optional, keep crawlable pagination + keyboard controls, estimated reading time from actual body length.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P03 · Rich Immersive News Article · `/en/news/[slug]`

**Visual approval:** PRIORITY NEW DESIGN.  
**Desktop composition:** Article headline with category, kicker, timestamp, author, fact/source indicators. Below: prominent branded cover 16:9, alt/caption/credit; reading column, sticky TOC/right market context, editorial visuals/animated diagrams, named primary sources, related stories and labeled sponsor slots.  
**Visual reading sequence / interactive pattern:** Hero max-width 1250px; body text column ~720px, optional 290–330px right rail and 20–28px gap, reading typography ~18px/1.65; figcaption 12–13px; 16:9 hero and 21:9 or 1:1 illustrations as editorial layout warrants.  
**Data / motion / legal / empty-state constraint:** Animation inline and opt-in/reduced motion; no fabricated event photos, fake exchange logos, falsified data or made-up charts; original source links, updated/corrected state and media provenance visible.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P04 · Category Hub · `/en/category/[slug]`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Compact category color/icon accent and headline; featured article visual, category brief/market signal if relevant, newest grid, filters, sponsor tile only if approved.  
**Visual reading sequence / interactive pattern:** Category tabs DeFi/Bitcoin/Ethereum/Regulation/Security/Markets/AI etc are TAXONOMY DRAFT; segmented sort Latest/Trending/Explainers.  
**Data / motion / legal / empty-state constraint:** Taxonomy and headlines derived from CMS, never hard-coded perpetual feed.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P05 · Topic or Event Timeline · `/en/topics/[slug]`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Topic branded icon + timeline from oldest/latest, verified facts/evidence progress, short explainer and linked articles; right facts/links rail.  
**Visual reading sequence / interactive pattern:** Sort chronology, follow topic later, link official source.  
**Data / motion / legal / empty-state constraint:** No speculative timeline dates presented as confirmed.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P06 · Full-Site Search Results · `/en/search`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Large search input with keyboard shortcut, tabs News/Markets/Topics/Authors, active filter chips and compact results with thumbnails/snippets.  
**Visual reading sequence / interactive pattern:** Query, locale, date/category/source sort, clear/reset, pagination, no-result suggestions.  
**Data / motion / legal / empty-state constraint:** Search snippets safe/highlighted, no stored sensitive queries without policy.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P07 · Market Overview · `/en/markets`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Market hero summary, 24h movers, global totals if licensed, dynamic coin data table, compact sparklines, sentiment method and upcoming drivers, dark grid precision.  
**Visual reading sequence / interactive pattern:** Period switch, currency selection, column sort, search assets, freshness badge and vendor attribution.  
**Data / motion / legal / empty-state constraint:** Live vs delayed data visible, no simulated values shown as real.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P08 · Single Asset Detail · `/en/markets/[symbol]`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Asset identity and price+timestamp, performant 1D/7D/30D/1Y chart, markets table, volume/supply methods, relevant CoinBlink coverage, risk/invalidation and citations.  
**Visual reading sequence / interactive pattern:** Chart hover for data/time, interval selector, relevant news crosslinks.  
**Data / motion / legal / empty-state constraint:** Do not create financial advice, hypothetical price projections as certainties or unlicensed quotes.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P09 · Radar 24h / Breaking Signals · `/en/radar`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Command-style UTC timeline lanes, signal severity chip, source count, event cards and status updates; premium but readable.  
**Visual reading sequence / interactive pattern:** Filter category/severity/verified/latest, open evidence drawer and related story.  
**Data / motion / legal / empty-state constraint:** Sources must substantiate events, signal is not an investment recommendation.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P10 · Market Sentiment Explained · `/en/sentiment`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Large methodology-driven score/index if approved, source contributions, historical trend and explanatory caveats; small method cards.  
**Visual reading sequence / interactive pattern:** Time range and source filters, methodology panel.  
**Data / motion / legal / empty-state constraint:** No black box fear/greed misleading claims; missing data displayed as unavailable.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P11 · Analysis & Explainership · `/en/insights`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Long-form editorial featured insight, confidence methodology, primary-source boxes, related market charts, references/citations.  
**Visual reading sequence / interactive pattern:** Filter by research, on-chain, macro, regulation and weekly report.  
**Data / motion / legal / empty-state constraint:** Separate hard fact, interpretation and AI-generated draft; editor sign-off.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P12 · Blink Briefs · `/en/briefs`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** 30-second story cards: headline/what changed/why matters/sources/time; optional subtle progress bar; share as verified micro-brief.  
**Visual reading sequence / interactive pattern:** Quick read, open full article, social share, audio later.  
**Data / motion / legal / empty-state constraint:** No 'breaking' if stale; links to original reporting.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P13 · Author Profile · `/en/authors/[slug]`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Small portrait or avatar, credentials/bio, expertise, disclosure, recent publications, correction history and socials.  
**Visual reading sequence / interactive pattern:** Click article, author categories and verified external profiles.  
**Data / motion / legal / empty-state constraint:** No invented author credentials or fake headshots.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P14 · About CoinBlink · `/en/about`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Brand purpose header, editorial trust principles, team profiles only if real, methodology/funding and advertising independence cards.  
**Visual reading sequence / interactive pattern:** Links About → Editorial Policy → Corrections → Contact.  
**Data / motion / legal / empty-state constraint:** Do not claim awards, staff or registration without evidence.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P15 · Contact & Support · `/en/contact`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Two-column contact introduction and secure contact form; reason selector News Tip/Correction/Advertising/Partnership/Technical/Privacy, response guidance, trust/help cards.  
**Visual reading sequence / interactive pattern:** Name, optional company, email, subject, message, optional URL and consent checkbox; submit confirmation and ticket reference.  
**Data / motion / legal / empty-state constraint:** Rate limit, bot trap/CAPTCHA/privacy; never show personal owner email or API keys.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P16 · Advertise with CoinBlink · `/en/advertise`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Labeled sponsor landing, ad inventory preview thumbnails, supported placements, industry guardrails, inquiry form and rate-card REQUEST CTA.  
**Visual reading sequence / interactive pattern:** Campaign inquiry and proposal pipeline to Admin Advertising.  
**Data / motion / legal / empty-state constraint:** No guaranteed reach/visitor numbers, no fake sponsors.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P17 · Education / Future Courses · `/en/courses`

**Visual approval:** FUTURE PLACEHOLDER.  
**Desktop composition:** Educational landing cards with taxonomy beginner/security/onchain, instructor credential verification, accessible curriculum modules, no false enrollment.  
**Visual reading sequence / interactive pattern:** Register interest only until actual course platform and purchase policies approved.  
**Data / motion / legal / empty-state constraint:** Payments, refund and regulated advice review required before selling.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P18 · Future Course Detail · `/en/courses/[slug]`

**Visual approval:** FUTURE PLACEHOLDER.  
**Desktop composition:** Course cover trailer poster, syllabus accordion, prerequisites, instructor, duration, outcomes/limits, consumer rights and CTA.  
**Visual reading sequence / interactive pattern:** Interest form or real checkout only after separate admission.  
**Data / motion / legal / empty-state constraint:** No active Buy/Enroll button without product+payment provider and policy.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P19 · Newsletter Subscribe · `/en/newsletter`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Dark sponsor-safe newsletter hero, genuine sample issue, cadence controls, benefits and consent-led email form.  
**Visual reading sequence / interactive pattern:** Signup verification, locale & topics, unsubscribe preferences.  
**Data / motion / legal / empty-state constraint:** No implied readership count or fabricated testimonials.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P20 · Watchlist & Following · `/en/watchlist`

**Visual approval:** FUTURE PERSONALIZATION.  
**Desktop composition:** Own watchlist coin rows, localized update freshness, alert controls; guest local state without login where feasible.  
**Visual reading sequence / interactive pattern:** Add/remove symbol, alerts, quiet hours with consent.  
**Data / motion / legal / empty-state constraint:** May require reader account decision; NOT an admin account.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P21 · Reader Alerts · `/en/alerts`

**Visual approval:** FUTURE PERSONALIZATION.  
**Desktop composition:** News topic and market trigger rule cards, notification channel and quiet hours.  
**Visual reading sequence / interactive pattern:** Create/edit/pause/delete alerts, explain source and frequency.  
**Data / motion / legal / empty-state constraint:** No trading auto-execution; privacy and consent critical.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P22 · Sources & Editorial Method · `/en/sources`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Transparent provider/source methodology, content licensing labels, correction/report link and independence policy.  
**Visual reading sequence / interactive pattern:** Source category navigation and methodology popover.  
**Data / motion / legal / empty-state constraint:** List only actually used sources/licensing.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P23 · Editorial Policy & AI Disclosure · `/en/editorial-policy`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Article-like legal/readability layout with toc, fact gates, disclosure of AI images and synthetic media, correction workflow.  
**Visual reading sequence / interactive pattern:** Contact/report correction entry points.  
**Data / motion / legal / empty-state constraint:** No publishing until content approved.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P24 · Corrections Ledger · `/en/corrections`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Revision timeline cards: story, claim changed, when, why, previous/updated factual statement, source links.  
**Visual reading sequence / interactive pattern:** Filter by date/category, open affected article.  
**Data / motion / legal / empty-state constraint:** Corrections must be transparent and preserve audit.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P25 · Privacy Policy · `/en/privacy`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Accessible long-form legal layout with toc, data categories, audience regions, cookies, retention and deletion requests.  
**Visual reading sequence / interactive pattern:** Region-aware contact and consent review.  
**Data / motion / legal / empty-state constraint:** Legal text draft until policy approval, do not invent compliance signoff.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P26 · Terms of Use · `/en/terms`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Readable contractual text with toc, publisher disclaimer, market info, syndicated limits, API/advertising and user rights.  
**Visual reading sequence / interactive pattern:** Version date and notice of changes.  
**Data / motion / legal / empty-state constraint:** Not legal advice, counsel review before release.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P27 · Cookies & Consent · `/en/cookies`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Consent explanation with preference categories, revocation, providers, targeted ad options and simple controls.  
**Visual reading sequence / interactive pattern:** Settings modal/dialog and granular opt-in by region.  
**Data / motion / legal / empty-state constraint:** Scripts must follow user consent; UI settings alone not compliance proof.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P28 · Accessibility Statement · `/en/accessibility`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Contact, accessibility commitment, known limitations, keyboard accessibility help and date.  
**Visual reading sequence / interactive pattern:** Request accommodation/report barrier.  
**Data / motion / legal / empty-state constraint:** No false WCAG certification claims.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P29 · Developers Landing · `/developers`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Developer pitch, first-party API examples, sample response with provenance/freshness, documentation and legal license requirements.  
**Visual reading sequence / interactive pattern:** Explore docs; later create developer account.  
**Data / motion / legal / empty-state constraint:** No monetized production API until rights+security.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P30 · Developer API Documentation · `/developers/docs`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Left sticky endpoint navigation, typed methods, code example, example response schema, quota/freshness table and rights labels.  
**Visual reading sequence / interactive pattern:** Code tabs curl/TS/Python, sandbox response, API status.  
**Data / motion / legal / empty-state constraint:** Do not embed customer secrets in examples.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P31 · API Plans · `/developers/pricing`

**Visual approval:** FUTURE COMMERCIAL.  
**Desktop composition:** Neutral pricing comparison and feature gates; billing state/overages/rights clear.  
**Visual reading sequence / interactive pattern:** Sandbox plan buttons; actual checkout later.  
**Data / motion / legal / empty-state constraint:** No displayed arbitrary active prices as real.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P32 · Developer Customer Console · `/developers/console`

**Visual approval:** FUTURE COMMERCIAL.  
**Desktop composition:** Customer-only keys/usage/billing, rate limit graphs and key rotation; visually separate admin settings.  
**Visual reading sequence / interactive pattern:** Customer login with isolated role.  
**Data / motion / legal / empty-state constraint:** Customer key cannot grant CoinBlink owner privilege.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P33 · Service Status · `/status`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Site/product uptime, incidents and changes with neutral status, historical timeline and provider freshness.  
**Visual reading sequence / interactive pattern:** Subscribe to incidents optional.  
**Data / motion / legal / empty-state constraint:** Only real metrics shown as live.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P34 · Future Native Token Info · `/en/token`

**Visual approval:** FUTURE / NOT APPROVED TOKEN.  
**Desktop composition:** Reserved neutral project update page with no ticker/network/price; only approved future verified roadmap metadata.  
**Visual reading sequence / interactive pattern:** No Buy/Connect Wallet CTA before regulatory/technical approval.  
**Data / motion / legal / empty-state constraint:** No coin creation, chain, airdrop or tokenomics implied.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P35 · Not Found · `/404`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Branded dark editorial 404 illustration with link back to news/search and no fake stories.  
**Visual reading sequence / interactive pattern:** Search or homepage return.  
**Data / motion / legal / empty-state constraint:** Accessible, lightweight.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P36 · Error and Maintenance · `/500`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Reliable branded status, small incident reference, retry and service status.  
**Visual reading sequence / interactive pattern:** Retry via safe action, status link.  
**Data / motion / legal / empty-state constraint:** Never expose stack traces or keys.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P37 · Financial / Advertising Disclosures · `/en/legal/disclosures`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Plain-language ad/affiliate sponsorship and market risk disclosures with easy linked sections.  
**Visual reading sequence / interactive pattern:** Link from all sponsored/market content.  
**Data / motion / legal / empty-state constraint:** No implication of investment recommendations.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

### P38 · Press & Brand Resources · `/en/press`

**Visual approval:** Proposed internal visual.  
**Desktop composition:** Brand kit preview, rights/contact requests and downloadable approved assets only.  
**Visual reading sequence / interactive pattern:** Press inquiry.  
**Data / motion / legal / empty-state constraint:** Golden logo may not be reproduced from substitute art.  
**Responsive behavior:** Desktop wide main + sidebar when appropriate; tablet condensed rail or section-bottom; mobile one-column with image-first cards, 16px gutters, 44px min targets and no hidden crucial metadata.  
**Required screen proofs:** desktop 1536×864, mobile 390×844, loading, zero-state and error state; genuine content is never mocked as live.

## 4. Highest-priority article template detailed anatomy

### Above the fold (at 1536×864)
1. 60px brand header aligned to Home; dark institutional news identity.
2. Secondary narrow breadcrumb: Home / Category / Story; category chip uses restrained accent.
3. Desktop central story title region max 1160px, headline 48px target, informative deck 19px and author/source/published/updated/evidence row 12–14px.
4. Cover 16:9, 1120px max-width (responsive below), visually compelling *yet clearly illustrative if synthetic*, accessible caption and source license/credit. Article body begins in same first scroll where reasonable; no intrusive ad above the first paragraph.
5. Sticky share tools, table of contents and contextual source/market side rail on desktops; collapse into responsive accordions on tablets/mobiles.

### Deep-reading rhythm
- Lead paragraph → fact summary capsule or "Blink Brief" → body H2/H3 sections with paragraph widths 720–760px → source-backed chart diagram/media every 2–4 meaningful sections only when it informs, not per fixed word count → source list and corrections → related stories + labeled optional sponsorship.
- Inline artwork generated from article *approved claim briefs*, not unreviewed scraped text. Each creative attached to exact claim refs/timestamp, prompt/template version, image/video model/provider, price estimate, original content license and an editor review state.
- Animated charts show verified arrays and source citations with axis labels/timezone; do not fabricate price movements, trades or on-chain events. Non-data motion may illustrate generalized processes, labeled "Concept illustration".
- Video/animated media click-to-play default (autoplay only muted/decorative if accessible, resource budget allows); poster static fallback, captions/transcript and pause toggle. Scroll-activated transitions cannot block reading.
- Rich story actions: source detail drawer, copy link, verified share image, 30s brief, read next and report correction. Do not auto-create social claims before article approval.

## 5. Media integrity and visual acceptance gates

1. A source image and rendered screenshot are independent assets. Original Golden Home and Logo stay immutable; internal designs require fresh **owner approval by screenshots**, not declaration.
2. Use server-side render and optimize: AVIF/WebP derivatives and correctly sized srcset, lazy beyond-fold media, preserve original master and attribution; reject distorted/hallucinated diagrams.
3. AI illustrations never masquerade as eyewitness photography; third-party rights/likeness/trademarks need human review. Prompt injection in upstream article text must not control model tools or secrets.
4. All charts cite exact dataset and use actual source timestamps, unit/axis and incomplete-data warnings.
5. Accessibility: alt, captions, keyboard, high contrast, reduced motion, focus path, screen-reader fact checks. LCP/CLS/INP targets are APPROVAL PENDING, measure before freeze.
6. E2E per route with screenshot matrices, broken media fallback tests, different title lengths in en/pt-BR/es, locale growth stress, anchor navigation and adblock/dark/light.
7. PR preview URL must exist and be isolated before any implementation module can claim visually deliverable. No public image generation token available to browser.
8. Design freeze requires user approval of each page family or an explicit delegated acceptance envelope, exact-head GEF CI and versioned visual snapshots; textual v2.0 alone is DRAFT.

## 6. Detailed companion chapters

- [Admin & Command Center design](COINBLINK_ADMIN_DESIGN_v2.0_DRAFT.md): all owner screens, editorial CMS, advertising, social, API customer, operations and future token console.
- [Sole Owner & Settings Security design](COINBLINK_SETTINGS_AND_SINGLE_OWNER_v2.0_DRAFT.md): first-run bootstrap, MFA/session security, API provider key vault and complete settings taxonomy.
- [Creative Media Design & Pipeline](COINBLINK_EDITORIAL_MEDIA_ENGINE_v2.0_DRAFT.md): brand-aware covers, story illustrations, charts, animation, video, manual review and budget gates.
- [Future Token Intelligence brief](../product/FUTURE_NATIVE_TOKEN_BRIEF_v0.1.md): explicitly no chain, ticker, contract or launch.
- [Cross-route completeness ledger](COINBLINK_PAGE_COVERAGE_MATRIX_v2.0_DRAFT.md): pages by module, evidence and owner approval.
- [Original frozen Design Bible v1.0](COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md): immutable Golden Home design source.
