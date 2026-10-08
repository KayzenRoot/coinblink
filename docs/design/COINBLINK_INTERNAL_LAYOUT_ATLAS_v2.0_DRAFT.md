# CoinBlink · Internal Layout Atlas v2.0 DRAFT

**Authority:** only original v1 approved Golden Homepage is visually frozen. This Atlas details 18 proposed internal-page screen families for production planning; no screenshot approval is claimed. Part of CB-DESIGN-002 and referenced by v2 Visual Bible.

## Shared coordinates at desktop 1536×864

Reader site viewport 1536×864: header ~60px, content max width 1448px, gutters ~44px, content 12 columns with 16–24px gap for most inner pages (Golden home has denser exact v1 grid). For a full news story, reading text max ~720–760px; high-impact images may expand to 1120–1200px centered while author/title rail retains flow. Admin sidebar ~256px and header ~60px, fluid 12-column panel grid. These dimensions are DESIGN TARGETS, not measurements verified from internal screenshots.

Color/token reference: graphite #090D0D, panel #151C1B, text #F0F6F2, muted #9CAEA7, selected action lime #B8F35A; use 1px translucent boundary and 10–16px radius sparingly. Verify text contrast, numeric readability and localized typography before exact final implementation. Gold only for real Bitcoin editorial illustrative subjects. Reduced-motion and RTL future direction do not allow inaccessible motion.

## Screen-family layout details

### L01 · Rich News Detail

**Applies to:** /en/news/[slug].  
**Desktop coordinate strategy:** 12 columns; primary 8 (approx 840–920px), right rail 3 (280–320px) plus gutter; actual prose max 740px.  
**First-scroll hierarchy and user journey:** Title + category/date/author/source, 16:9 1200px hero caption, Blink Brief, deep paragraphs and verified inline graphics, TOC/context rail, sources, corrections, related stories.  
**Tablet/mobile layout:** Mobile: body 1 col and 17px text, media 100% with captions, rail after body or expandable, no sticky video/ad; avoid title clipped by header.  
**Acceptance / empty/error/ethics:** Screenshot P03 above fold, full scroll of article, proper credit/AI label, dataviz source/axis/freshness, video pause and reduced-motion case.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L02 · Editorial Home Feed

**Applies to:** /en/news.  
**Desktop coordinate strategy:** Hero featured 7 columns and latest grid 5; subsequent 3 cards across with 8–12px dense editorial spacing.  
**First-scroll hierarchy and user journey:** Featured story → newest filter bars → editorial section mix → time-sorted cards → sponsor labeled slot if owner approved.  
**Tablet/mobile layout:** Tablet 2 cards across, mobile one column; category/filter chips scroll without hidden buttons.  
**Acceptance / empty/error/ethics:** News cards clickable via semantic links, loading skeleton aligns, no fictitious headlines passed as live.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L03 · Article Category Hub

**Applies to:** /en/category/[slug].  
**Desktop coordinate strategy:** Title slab 12 cols, leading image story 7 + concise other stories 5, below 3-column editorial cards.  
**First-scroll hierarchy and user journey:** Category heading → lead → source approved brief → topical subnav → timeline/card grid → continuation.  
**Tablet/mobile layout:** Mobile filters collapse, no lost card metadata, sponsored label never same as news card.  
**Acceptance / empty/error/ethics:** Verified source rights, category slug SEO, explicit locale and canonical.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L04 · Markets & Asset

**Applies to:** /en/markets and /en/markets/[symbol].  
**Desktop coordinate strategy:** Asset overview 12-col filter+table, detail chart spans 8/9 columns with quote/source info 3/4 side rail.  
**First-scroll hierarchy and user journey:** Asset identity → price and timestamp → chart periods/axis labels → volume/liq method → related CoinBlink news.  
**Tablet/mobile layout:** Mobile chart one column, axis still readable with min touch 44px; overflow via accessible chart table.  
**Acceptance / empty/error/ethics:** Fresh/delayed as-of, source link, rejected simulated live prices, 24h chart source trust.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L05 · Radar and Sentiment

**Applies to:** /en/radar and /en/sentiment.  
**Desktop coordinate strategy:** 12-col top context; left timeline 8 cols and methodology side 4; sentiment on 8-col history plot plus method rail.  
**First-scroll hierarchy and user journey:** Severity/filter controls → verified sources per event → interpretation and uncertainty → related stories.  
**Tablet/mobile layout:** Mobile timeline stacked, chart accessible data table, no flashing crypto alarms.  
**Acceptance / empty/error/ethics:** No false predictive labels or unsupported event/time entries.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L06 · Search and Filters

**Applies to:** /en/search.  
**Desktop coordinate strategy:** Top search bar 12 cols; result 8 columns, filter rail 3–4; compact cards with highlighted spans and category/time.  
**First-scroll hierarchy and user journey:** Search input and hotkey → selected filters → results with verified timestamp → related suggestions.  
**Tablet/mobile layout:** Filters become drawer on mobile, count updates announced to screenreader, preserve query in route.  
**Acceptance / empty/error/ethics:** Error, empty, no results, provider outage and pagination tested.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L07 · Contact and Trust

**Applies to:** /en/contact.  
**Desktop coordinate strategy:** Above-fold text+trust summary 5 cols and form 7 cols; footer with editorial policy and support information.  
**First-scroll hierarchy and user journey:** Intro → category of request → labeled fields → content policy/privacy note → send confirmation ticket id.  
**Tablet/mobile layout:** On mobile form below introduction; full text labels, validation and rate limit preserve draft.  
**Acceptance / empty/error/ethics:** No actual owner email/identity leaked, anti-spam, DSAR and correction workflow separation.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L08 · Developer Docs

**Applies to:** /developers/docs.  
**Desktop coordinate strategy:** Left 240px sticky endpoint nav, center 650–800px method+contract, right 300px code response; full width 12-col max.  
**First-scroll hierarchy and user journey:** Versioned endpoint tabs → parameters → code sample → structured response → freshness/license/quota and errors.  
**Tablet/mobile layout:** Mobile: endpoint selector drawer, code horizontally scrolls, copy button with accessible feedback.  
**Acceptance / empty/error/ethics:** Never includes valid key in code, errors 401/403/429 documented, original news redistribution rights.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L09 · Owner Mission Control

**Applies to:** /admin.  
**Desktop coordinate strategy:** Left 256px nav; header 60px; top row 4 KPI cards, chart+chart 8:4, then 3 panel queue and article table.  
**First-scroll hierarchy and user journey:** Action alerts → human visit counts by story → publication queue → providers/cloud health → cost/revenue/drill links.  
**Tablet/mobile layout:** Tablet nav icons, mobile KPI 2 or 1 per row, charts vertically stacked, owner security badges always visible.  
**Acceptance / empty/error/ethics:** All statistics measured/estimated/demo/unavailable, no other user can load admin, M05 auth.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L10 · Owner Article Editor

**Applies to:** /admin/articles/new.  
**Desktop coordinate strategy:** Nav 256px, editor canvas 720–860px; outline 200px and inspector 290–360px; sticky draft status bar.  
**First-scroll hierarchy and user journey:** Source candidate → title/dek → fact paragraphs → media/storyboard slots → SEO/translation/source panel → Preview → Approve/Schedule.  
**Tablet/mobile layout:** Mobile edit accordion: outline/canvas/inspector, no permanent three-column horizontal drag.  
**Acceptance / empty/error/ethics:** No bypass manual factual gate, autosave version, generated media remains draft until approved.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L11 · AI Media Studio

**Applies to:** /admin/media/create.  
**Desktop coordinate strategy:** Three-pane: source fact refs ~280px, large 16:9 canvas, right provider/style/cost inspector ~300px, bottom output history.  
**First-scroll hierarchy and user journey:** Choose factual story → creative purpose → aspect & budget → generate mock/real draft → review claims/rights → select or reject → insert in article.  
**Tablet/mobile layout:** Mobile source and settings become tabs, canvas aspect ratio reserved, generated image never fills entire editor as background.  
**Acceptance / empty/error/ethics:** Prompt injection negative test, charts source validated, rights/alt/labeled AI, per-story spending cap.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L12 · Owner Integration Settings

**Applies to:** /admin/settings/integrations.  
**Desktop coordinate strategy:** Nav left 256px, Settings list 224px, center 680px provider form, right 290px status/docs; masked values.  
**First-scroll hierarchy and user journey:** Provider catalog → Add Key write-only → Save encrypted -> Test Connection -> Set Limit -> Enable -> Rotate/Revoke.  
**Tablet/mobile layout:** Mobile 1-column wizard with explicit Save/Test and session-step-up; mask input, no clipboard auto-copy secret.  
**Acceptance / empty/error/ethics:** Root KEK external, server auth+MFA, ciphertext tamper failure, raw secret absent network GET/browser DOM/logs.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L13 · Owner Advertising Studio

**Applies to:** /admin/advertising.  
**Desktop coordinate strategy:** Owner nav plus inventory panel 8 cols and advertiser/campaign status 4, booking calendar and creative preview below.  
**First-scroll hierarchy and user journey:** Actual provider status → inventory map → sponsor contracts → creative approve → schedule → attributed performance.  
**Tablet/mobile layout:** Mobile advertising map as sorted slot cards; no overlay banners over content.  
**Acceptance / empty/error/ethics:** AdSense Ready/cookies legal gate, no real Ads in PR preview, money source distinguished.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L14 · Social Content Studio

**Applies to:** /admin/social/compose.  
**Desktop coordinate strategy:** Source story selector + wide editor 7 cols, 5 cols mobile device per platform; preview mode 1:1/4:5/9:16.  
**First-scroll hierarchy and user journey:** Reviewed article → platform rewrite per channel → attach rights-cleared media → Owner approves each channel → schedule or manual export.  
**Tablet/mobile layout:** Mobile full-width device preview with small text list and keyboard accessible variant tabs.  
**Acceptance / empty/error/ethics:** App audit/tokens and cost limits, no unsupported publishing claim.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L15 · Sole Owner Login and Activation

**Applies to:** /admin/login and /admin/setup.  
**Desktop coordinate strategy:** Solo centered 420px panel under small brand treatment on charcoal background, no staff signup, no public account management.  
**First-scroll hierarchy and user journey:** Verified email → one-time activation code from out-of-band trust -> password+MFA/passkey setup → recovery codes → sign-in; later secure reset.  
**Tablet/mobile layout:** Mobile narrow centered panel with no horizontal overflow, accessible password manager support.  
**Acceptance / empty/error/ethics:** Atomic one owner claim and session hardening, failed attempts rate limit, root secret never in client.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L16 · Future Token Monitor

**Applies to:** /admin/token.  
**Desktop coordinate strategy:** Uses familiar dark command center shell but no token metric chart when absent; future contract placeholder clearly disabled.  
**First-scroll hierarchy and user journey:** Owner planning reference only; when future admitted verified network+contract and read-only transfer/holders/volume/liq charts.  
**Tablet/mobile layout:** Mobile empty state informative and accessible, no wallet seed field or trade CTA.  
**Acceptance / empty/error/ethics:** No blockchain, ticker or supply chosen; never show fake token 0-dollar market charts.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L17 · Marketing / Course / Newsletter

**Applies to:** /en/newsletter /en/advertise /en/courses.  
**Desktop coordinate strategy:** Lead visual 7 cols and CTA form/card 5; optional responsive 3-col feature/benefit row; course future cards visually neutral.  
**First-scroll hierarchy and user journey:** Genuine newsletter opt-in / sponsor inquiry; course waitlist only until actual lawful content & checkout available.  
**Tablet/mobile layout:** Mobile stacked form 44px inputs, consent checkbox and inline errors.  
**Acceptance / empty/error/ethics:** No fabricated subscriber count, deceptive sales claims, AdSense payment eligibility not implied.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

### L18 · Legal/Source/Correction

**Applies to:** /en/privacy /en/terms /en/editorial-policy /en/corrections.  
**Desktop coordinate strategy:** Left 220px sticky content TOC, central 760px longform reading text, right 260px policy/source support links.  
**First-scroll hierarchy and user journey:** Dates, version, editable anchor TOC, source transparency and report-correction/contact details.  
**Tablet/mobile layout:** Mobile TOC collapses into dropdown, anchors/ARIA titles accessible.  
**Acceptance / empty/error/ethics:** No pretend legal approval, correct revision and source status.  
**States to evidence:** brand + content, loading skeleton, error/offline, hover/focus/active, full-scroll, 1536×864 and 390×844 screenshots, user review before marking visually approved.

## Cross-page QA and component kit

Shared components: actual CoinBlink logo/header/nav, credibility chips, source context drawer, source-verified charts, responsive image/figure with credits, media caption and AI illustration labels, dark glass card, editorial ad label and reserved AdSlot, dynamic articles, consent banner, filter chips, accessible chart table, status badge, contact form, role-secured owner sidebar, masked write-only secret input and responsive media canvas.

Every public page has appropriate meta title/description, canonical/hreflang per locale, breadcrumbs/structured data when applicable, no UI-generated false market data, relative vs absolute time precision, image original license, broken source fallbacks and clear Sponsored tag. Every Admin screen checks auth and server-side authorization, does not leak secrets/PII to browser log or preview analytics, provides precise disabled states and audit events.

The 18 atlas families map to 38 reader/public and 48 owner/admin route/view contracts in COINBLINK_PAGE_COVERAGE_MATRIX_v2.0_DRAFT.md. All page layouts remain DRAFT; the source v1 Home remains unchanged. No product code or preview deployment exists.
