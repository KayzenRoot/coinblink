# CoinBlink Advertising & Sponsorship Studio v0.1

Status: USER-APPROVED PRODUCT DIRECTION; architecture and placements DRAFT/NOT ADMITTED. Recorded 2026-10-08.
Owned by planned Work Order CB-M13 (Issue #20), with presentation seams in CB-M01/CB-M02, admin navigation in CB-M05 and reporting integration in CB-M06.
No Google publisher account, sponsor bookings, customer billing, course checkout, or ad code is live.

## Four revenue channels

1. **Google AdSense (publisher network)** for eligible CoinBlink website page ads. Google Ads is the platform for buyers of advertising. Publisher enrollment requires site ownership, approved/ready site, content and policy review. Earnings or eligibility never guaranteed.
2. **Direct company banners and sponsorships:** advertiser CRM, placement reservations, contract/insertion-order, editorial and creative approval, flight dates, invoicing, billing reconciliation and honest reporting.
3. **CoinBlink house advertisements:** newsletter, owned tools, educational products and future courses. Course promotion placements may launch before an actual storefront. Course sales, student management, payment, refunds, taxes and claims require separate approved scope.
4. **Future affiliates:** referral promotions only for eligible legitimate offers with proper disclosures, rights and regulatory compliance. No get-rich-quick or misleading crypto promotions.

## Candidate ad placement registry

Locations absent from the user-approved Golden Homepage are visually PROPOSED; no layout changes accepted until owner signs off on Golden overlay, mobile design and responsive states.

| Key | Surface and placement | Example responsive format | Allowed type |
| --- | --- | --- | --- |
| home_after_trending | Between major homepage editorial sections | responsive 728x90 or labeled native | network / sponsor / house |
| home_sponsor_card | Existing approved promotional/CTA area | 16:9 card adapting to mobile | sponsor / house |
| home_leaderboard | Below navigation only if Golden visual approval | 970x90 / 728x90, 320x100 mobile | optional network or sponsor; off initially |
| article_below_lead | After first substantive article paragraph | 728x90 / 320x100 | network / sponsor |
| article_sidebar_primary | Sidebar adjacent to article body | 300x250 / 300x600, inline mobile fallback | network / sponsor |
| article_inline_1 | Between long article sections, not too early or too frequent | adaptive in-article | network / sponsor |
| article_end | Below conclusion, above related news | native responsive | sponsor / courses / house |
| category_feed_inline | Between news cards but visibly separate from news | labeled native card | sponsor / house |
| newsletter_sponsor | Newsletter web page / permitted digest | native labeled | sponsor / house, never embed AdSense email script |

Every advert clearly carries Advertising/Sponsored or equivalent localized label. Reserve sizes to minimize CLS, cap density, preserve legibility, never obscure ticker/hero/menu/chart, and never impersonate journalistic content. Honor reduced motion and keyboard focus; no unrequested intrusive video/audio, misleading clicks or fake close buttons.

## Owner Command Center /admin/advertising

Navigation:
- Overview: booked/sold/unfilled inventory, actual vs forecast gross revenue, network-reported earnings, validated first-party direct impressions, reach by placement, campaign flags and owner action list.
- Inventory: visual map and device/locale variants; enabled, paused, reserved and fallback modes; per-placement permissions and Golden visual status.
- Advertisers: account/contact records with restricted PII, legitimate business / destination screening, negotiated rate cards, agreements and history.
- Campaigns: calendar, day/time/timezone schedules, placements, budget caps, pacing, exclusivity booking conflicts, advertiser approvals, draft/approved/scheduled/live/paused/expired states.
- Creatives: uploaded banner artwork or video, dimensions/aspect, alt text, content rights, ad copy, destination URL allowlist, phishing/malware screening, language and internal preview before publication.
- AdSense: verification status (not connected, pending, Ready, policy issue) only if provider-reported; authorized publisher code and ads.txt; geolocation-dependent consent; separate network reporting where available.
- House and courses: create campaign draft promoting CoinBlink newsletter or future courses, separate course eligibility and checkout readiness.
- Analytics: source-labeled Google network estimates/reported/paid revenue, direct sponsor invoiced/collected amounts, effective CPM, CTR for eligible verified first-party campaigns, share of voice/fill, leads and UTM traffic. Separate measured from sampled/demo/estimated and never manufacture earnings.
- Controls: owner emergency stop, moderation/approval and advertiser disable, campaign rollback, invoice review, detailed audit trail and permissions.

## Proposed entities, security and measurement

ad_slots(slot key, surface, locale, breakpoint, formats, layout-golden-status, allowed sources, active), advertisers(verified status/contact), ad_campaigns(type, owner approval, budget, timing, locale/region, goal), ad_creatives(media hash, rights, safe destination, moderation), ad_bookings(slot+time, exclusive flag, conflict check), ad_deliveries(event id, dedupe and bot assessment), ad_clicks(only measurable first-party direct/house actions), ad_financials(invoice/paid/provider reported), ad_audit(actor, old/new state), ad_consent(minimal lawful/consent state).

Do NOT attempt to estimate Google-reported earnings by tracking Google ad clicks in local scripts; do not encourage invalid traffic. AdSense publisher reports are authoritative where permitted, and network policies decide what is measurable. Synthetic visual tests and all PR previews must never load real network ads or count billable impressions. Other platforms' ads cannot automatically be combined with AdSense in the same slot without network-specific policy checks.

Privacy/legal: Brazilian LGPD, relevant international GDPR/ePrivacy and Google publisher policies; a Google-certified CMP integrated with IAB TCF is required for personalized Google publisher ads shown to EEA/UK/Swiss visitors. Determine consent basis per locale, minimize data, secure owner and advertiser access, honor disclosures and user rights.

## Long-module execution plan

- **Earlier module seam**: M01 and M02 implement default-off responsive AdSlot building blocks ONLY once the Golden visual positions are approved; M05 adds an access-controlled Advertising navigation node; M06 prepares metrics integration with disconnected placeholders.
- **M13 P0**: polished full-feature admin advertising screens, article/home/banner previews on working Cloudflare Preview, mock advertiser/campaign calendar, campaign workflow state machine and reproducible fixtures. No real ads.
- **M13 P1**: real direct sponsorship booking/scheduling, conflicts and exclusivity, moderated creatives, consent-aware first-party delivery telemetry, limits, admin approval and reporting, protected public advertiser inquiry form. Add AdSense adapter behind feature flag only if owner has publisher account and approved domain.
- **M13 P2**: revenue ledger reconciliation, domain/publisher ads.txt validation with REAL publisher ID, policy and CMP gates, invalid-traffic suppression, bot and duplicate tests, responsive Golden visual diff, performance/accessibility/security, independent review and exact HEAD CI.
- **M15 go-live**: business terms/privacy, actual Google Ready/site status, verified authorized ads.txt/consent, supported advertiser and course landing pages, campaign approvals, signoff. If not ready, launch editorial site with monetization disabled.

## Acceptance and STOP CONDITION

(1) Owner sees and controls all slots and campaigns in protected preview and can pause immediately. (2) No deceptive ads, no overlap or change to approved Golden visual without sign-off. (3) Date/exclusivity booking conflicts rejected. (4) Network/direct/house precedence and fallback deterministic, safe blank state. (5) No Google code before approval/required consent; no live ads on preview. (6) Analytics label actual/estimated/demo and do not mix vendor impressions with first-party counts. (7) Direct ad fraud/invalid-traffic and role controls tested. (8) Course promotions never imply an active course store. (9) External account/payment/data costs require explicit owner authorization. (10) Unit/integration/E2E, mobile, a11y, security and exact-head CI pass before merge.

STOP and mark BLOCKED if publisher onboarding, provider consent, verified course destination, image rights or signed advertiser terms are absent; functional mock-based ad operations can still be shown but not called monetization live.

## Official implementation-time verification

Google AdSense publisher help: https://support.google.com/adsense/
Google consent requirements: https://support.google.com/adsense/answer/13554116?hl=pt-BR
Google ads.txt documentation: https://support.google.com/adsense/answer/12171612?hl=pt-BR
Google placement policies: https://support.google.com/adsense/answer/1346295?hl=pt-BR
