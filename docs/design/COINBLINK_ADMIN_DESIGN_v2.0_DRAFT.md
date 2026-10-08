# CoinBlink · ADMIN VISUAL DESIGN BIBLE v2.0 DRAFT

**Status:** screen specification proposal. The user requires a **single human Owner/Administrator** in V1. No untrusted user registration can create or change the owner. Historical suggestions about multiple editors/admins are replaced for V1, while future roles remain separate optional architecture migrations requiring user decision.

## Consistent admin visual language

Owner desktop shell begins at 1536×864: ~256px anchored left sidebar, 60–64px top status header, 24px horizontal main content gutter, 12-column responsive data grid. Cards use graphite thin-border glass treatment and restrained lime cues; legitimate operational labels are more important than glowing decoration. KPI type 27–32px tabular, labels 12–14px, table density 34–48px row as content permits. Charts have axes/time zone/source, accessible data table alternatives and actual vs estimated vs demo indicators.

Navigation groups: Overview; Editorial and Stories; AI Media; Markets and Research; Traffic Analytics; Social Studio; Advertising; Developer API; Newsletter; Operations; Settings. Future Token appears DISABLED, not a live financial product. Global topbar: preview/prod badge, command search, Create Story, alerts, locale/time zone, one owner profile menu.

Laptop: compact sidebar icon rail 72px; tablet: drawer and two columns; mobile 360–767: stacked cards, nav overlay, minimum 44px targets, never bury critical warnings, secrets or error actions. Use 1536×864, 768×1024 and 390×844 screenshots for core screens.

## Screens

### A01 · Owner Sign-in (/admin/login)

**Visual anatomy:** Branded narrow 420px form centered within dark gradient shell; eye logo, no registration.  
**Functions, security and content contract:** Verified email/password, MFA/passkey challenge, rate limit and neutral errors.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A02 · One-Time Owner Activation (/admin/setup)

**Visual anatomy:** Initial dark activation wizard with progress and expiring invitation status.  
**Functions, security and content contract:** Out-of-band bootstrap, verify email, password+MFA enrollment, atomic single-OWNER claim.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A03 · Owner Recovery (/admin/recovery)

**Visual anatomy:** Discrete recovery flow and device/security checklist, no public owner existence disclosure.  
**Functions, security and content contract:** Verified recovery codes or hardware-backed recovery, session revocation after change.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A04 · Mission Control Overview (/admin)

**Visual anatomy:** 263px left nav, 60px topbar, true KPIs, two time-series charts, action queue.  
**Functions, security and content contract:** Human views, top articles, provider errors, social jobs, spend/revenue grouped by verified sources.  
**Implementation module:** M05/M06.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A05 · Traffic & Audience (/admin/analytics)

**Visual anatomy:** Time range control, time-series with attribution, acquisition funnel, devices and locale.  
**Functions, security and content contract:** Views vs estimated distinct visitors, bot exclusion, UTMs, engagement, source/consent.  
**Implementation module:** M06.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A06 · Article KPI Grid (/admin/analytics/articles)

**Visual anatomy:** Ranked filterable table with covers, publish times, sparklines and per-story metrics.  
**Functions, security and content contract:** Drill into article view-count and conversions; export aggregate filtered reports.  
**Implementation module:** M06.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A07 · Story Analytics Detail (/admin/analytics/articles/[id])

**Visual anatomy:** Story summary + traffic timeline, acquisition and read depth charts.  
**Functions, security and content contract:** Compare article revisions, sources, preview vs production, social referrals.  
**Implementation module:** M06.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A08 · Newsroom Content Table (/admin/articles)

**Visual anatomy:** Status tabs Draft/Review/Scheduled/Published/Corrected, images and quick Create Story.  
**Functions, security and content contract:** Filter, queue, preview, edit, version history and date scheduling.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A09 · New Rich News Editor (/admin/articles/new)

**Visual anatomy:** Three-column workflow: body editing central, story sections/outline left, right media/evidence/SEO.  
**Functions, security and content contract:** Draft autosave, sourcing, generated covers/graphics, localization and review.  
**Implementation module:** M05/M17.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A10 · Existing Story Editor (/admin/articles/[id]/edit)

**Visual anatomy:** Same rich editor with revision timeline and correction explanations.  
**Functions, security and content contract:** Approve/schedule/retract only after correct factual evidence and owner permissions.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A11 · Fact & Publish Review (/admin/editorial/review)

**Visual anatomy:** Side-by-side source proof and candidate story with claim statuses.  
**Functions, security and content contract:** Approve/reject correction/claim; no silent auto publish.  
**Implementation module:** M05/M08.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A12 · Media Library (/admin/media)

**Visual anatomy:** Dense attractive thumbnail wall with license/provider/facts/AI flags.  
**Functions, security and content contract:** Select/edit/approve/revoke asset, check alt/caption and budget usage.  
**Implementation module:** M17.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A13 · AI Media Studio (/admin/media/create)

**Visual anatomy:** Canvas preview middle, composition controls left, evidence and original data right.  
**Functions, security and content contract:** Generate concept cover, 16:9 feature, graph, subtle animation and vertical social media, editorial approve.  
**Implementation module:** M17.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A14 · AI Research Desk (/admin/research)

**Visual anatomy:** Evidence map and timeline with source corroboration and contradictions.  
**Functions, security and content contract:** Create sourced brief, human-verify claims, cap model spending.  
**Implementation module:** M08.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A15 · Provider Sources (/admin/sources)

**Visual anatomy:** Provider cards and table with rights/quota/freshness, errors and incident badges.  
**Functions, security and content contract:** Add source and source licensing, test availability, disable safely.  
**Implementation module:** M03.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A16 · Ingestion Jobs (/admin/ingestion)

**Visual anatomy:** Queue state chart, retries, deduplicated ingestion candidates.  
**Functions, security and content contract:** Pause/retry, quarantine unsafe text and preview isolation.  
**Implementation module:** M03.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A17 · Market Provider Control (/admin/markets)

**Visual anatomy:** Quote freshness heatmap, live/delayed warnings, API cost and source status.  
**Functions, security and content contract:** Test market providers, rotate quotas, prevent mock as real.  
**Implementation module:** M04.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A18 · Social Operation (/admin/social)

**Visual anatomy:** X/Instagram/TikTok accounts and campaign status, effectiveness cards.  
**Functions, security and content contract:** Compose, moderate, monitor jobs and no direct post without scopes.  
**Implementation module:** M07.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A19 · Cross-Platform Creative (/admin/social/compose)

**Visual anatomy:** Device mock previews for X text/thread, IG carousel and TikTok vertical story.  
**Functions, security and content contract:** Platform-specific copy, citations, media, CTA, explicit approval.  
**Implementation module:** M07/M17.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A20 · Social Calendar (/admin/social/calendar)

**Visual anatomy:** Week/month editorial scheduling cards with channel chips and states.  
**Functions, security and content contract:** Reschedule, pause and prevent duplicate posting.  
**Implementation module:** M07.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A21 · Connected Channels (/admin/social/accounts)

**Visual anatomy:** Provider account status, scopes, expiration and TikTok app audit notice.  
**Functions, security and content contract:** OAuth connection/revocation and no plaintext tokens.  
**Implementation module:** M07.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A22 · Advertising Command Center (/admin/advertising)

**Visual anatomy:** Inventory overview, network vs direct earnings, creative approvals and kill-switch.  
**Functions, security and content contract:** Google AdSense readiness, sponsor deals, house promotions, truthful billing.  
**Implementation module:** M13.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A23 · Ad Inventory Heatmap (/admin/advertising/inventory)

**Visual anatomy:** Page layouts + approved slot overlays, desktop/mobile formatting preview.  
**Functions, security and content contract:** Book, reserve, disable and inspect Golden visual impact.  
**Implementation module:** M13.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A24 · Sponsor Calendar (/admin/advertising/campaigns)

**Visual anatomy:** Advertiser CRM table+monthly campaigns and booking collisions.  
**Functions, security and content contract:** Contract, approve, schedule, pause, reconcile invoices.  
**Implementation module:** M13.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A25 · Sponsor Media Review (/admin/advertising/creatives)

**Visual anatomy:** Ad banner formats and mobile preview side-by-side with safety metadata.  
**Functions, security and content contract:** Approve creatives/destination, alt/label/legal copy.  
**Implementation module:** M13.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A26 · Data API Operations (/admin/api)

**Visual anatomy:** Requests/tenant/latency graphs, plan controls and licensing status.  
**Functions, security and content contract:** Manage quotas/health, not expose secret keys.  
**Implementation module:** M11/M12.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A27 · API Customers (/admin/api/customers)

**Visual anatomy:** Account plan/usage, billing and partial key prefix, revocation.  
**Functions, security and content contract:** Rotate/revoke tenant access, export aggregate permitted data.  
**Implementation module:** M11/M12.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A28 · Revenue & Costs (/admin/revenue)

**Visual anatomy:** Separate reported network, billed sponsor and collected funds with real margin.  
**Functions, security and content contract:** Cost and income reconciliation, no fake MRR.  
**Implementation module:** M06/M12/M13.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A29 · Newsletter Operator (/admin/newsletter)

**Visual anatomy:** Subscriber consent counts, digest preview and campaign status.  
**Functions, security and content contract:** Create schedule, verify opt-in and suppress bounced recipients.  
**Implementation module:** M10.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A30 · System Health (/admin/ops)

**Visual anatomy:** Preview vs production deploys, errors, latency, queues and costs.  
**Functions, security and content contract:** Incident controls, tested rollback, backup status.  
**Implementation module:** M14.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A31 · Audit Trail (/admin/ops/audit)

**Visual anatomy:** Readable event timeline with actor/action/object, time+severity.  
**Functions, security and content contract:** Investigate redacted changes and export reports.  
**Implementation module:** M14.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A32 · Security Overview (/admin/ops/security)

**Visual anatomy:** Owner MFA, logins, active devices, secret age and alerts.  
**Functions, security and content contract:** Revoke session, step-up before changing credentials.  
**Implementation module:** M05/M14.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A33 · Settings Hub (/admin/settings)

**Visual anatomy:** Search and status-tile catalog for all modules, categories and setup progress.  
**Functions, security and content contract:** Save versioned config, show owner-only and unavailable external approvals.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A34 · API Keys and Providers (/admin/settings/integrations)

**Visual anatomy:** Masked provider cards and write-only secret edit form with test connection.  
**Functions, security and content contract:** Save encrypted key, rotate/revoke, budget/quotas, audit and masked metadata.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A35 · Site and Brand (/admin/settings/site)

**Visual anatomy:** Domain/theme/locale, Golden logo preview, SEO defaults, navigation.  
**Functions, security and content contract:** Change site text or feature flags with preview and rollback.  
**Implementation module:** M05/M01.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A36 · Editorial Rules (/admin/settings/editorial)

**Visual anatomy:** Article truth gate, source quality, corrections and review controls.  
**Functions, security and content contract:** Set policy, owner confirmation for publish rules.  
**Implementation module:** M05/M08.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A37 · AI and Media Providers (/admin/settings/ai-media)

**Visual anatomy:** Models, budgets, local/external render mode and quality preset cards.  
**Functions, security and content contract:** Encrypted provider key entry, generate sandbox test image, owner approval required.  
**Implementation module:** M05/M17.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A38 · Social Provider Configuration (/admin/settings/social)

**Visual anatomy:** Account permissions, app reviews, scopes, post mode and channel quotas.  
**Functions, security and content contract:** OAuth verified connection or manual export fallback.  
**Implementation module:** M05/M07.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A39 · Market API Configuration (/admin/settings/markets)

**Visual anatomy:** Source/quotas/rights/freshness and fallback priority.  
**Functions, security and content contract:** Test source, track license and budget.  
**Implementation module:** M05/M04.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A40 · Analytics and Privacy (/admin/settings/analytics)

**Visual anatomy:** Consent basis, retention, bot filter and privacy-safe reporting.  
**Functions, security and content contract:** Toggle by region and purge/retention gates.  
**Implementation module:** M05/M06.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A41 · Ads, API Plans and Payment (/admin/settings/monetization)

**Visual anatomy:** Publisher approval, valid ads.txt, revenue settings and payment sandbox.  
**Functions, security and content contract:** No paid live activation without account/legal signoff.  
**Implementation module:** M05/M13/M12.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A42 · Owner Account and MFA (/admin/settings/security)

**Visual anatomy:** Verified owner email, sessions, passkeys/recovery, sign-in notifications.  
**Functions, security and content contract:** Step-up required for critical setting, no owner #2.  
**Implementation module:** M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A43 · Alerts Delivery (/admin/settings/notifications)

**Visual anatomy:** Owner notifications and quiet hours, source/cost/spend/security flags.  
**Functions, security and content contract:** Test notification and retry handling.  
**Implementation module:** M05/M14.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A44 · Backup and Recovery (/admin/settings/backup)

**Visual anatomy:** Data retention/restore snapshots and last verified drill.  
**Functions, security and content contract:** No unprotected one-click destructive restore.  
**Implementation module:** M14.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A45 · Future Token Configuration (/admin/settings/token)

**Visual anatomy:** Clearly disabled card showing network undecided and no contract.  
**Functions, security and content contract:** Only future verified analytics/provider config, never mint/trade.  
**Implementation module:** M18 FUTURE.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A46 · Future Token Monitoring (/admin/token)

**Visual anatomy:** Locked neutral empty state; future holders, transfers, volume and treasury modules.  
**Functions, security and content contract:** No fabricated market cap, liquidity or supply; no wallet connect.  
**Implementation module:** M18 FUTURE.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A47 · Legal and Consent (/admin/settings/legal)

**Visual anatomy:** Localized policies, company identity placeholders and status.  
**Functions, security and content contract:** Lawyer-reviewed version history, no fabricated registrations.  
**Implementation module:** M05/M14.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

### A48 · Hosting and Environment (/admin/settings/cloud)

**Visual anatomy:** PR preview and deployment status, masked binding metadata.  
**Functions, security and content contract:** No server root credential exposed to settings UI.  
**Implementation module:** M00/M05.  
**States:** unconfigured, pending, disabled, active/verified if entitled, empty, error/retry, unauthorized and privacy-safe demo.  
**Acceptance:** accessible keyboard actions, preview-mobile layouts, owner-only route guard, server authorization, real or clearly labelled fake metrics, browser screenshot at critical breakpoints.

## Single-Owner boundaries and key operator journeys

Pre-session exception: A01 /admin/login, A02 /admin/setup and A03 /admin/recovery are **accessible before an authenticated Owner session** solely to satisfy their distinct credential/MFA, one-time expiring bootstrap invitation or recovery proof challenges. These must NOT use an existing-owner-session middleware. The remaining **45 admin routes** require current Owner session + server-side authorization and are inaccessible to any unprivileged user. Admin Login A01 and Owner Activation A02 are unrelated to the public newsletter or paid API customer login. No /admin/register route. Activation uses a single-use out-of-band deployment-bootstrap secret, independently verified email, strong password/passkey and MFA, atomic permanent one-OWNER DB uniqueness guarantee and exhausted setup token. Recovery cannot just send admin privilege to any email submitter; protect with recovery codes/factors and alerting.

Owner should be able to perform all ordinary provider onboarding through Settings without terminal manipulation: provider catalog -> write-only API key entry -> encrypted vault backend -> masked status and test connection -> attach service/quotas -> rotate/revoke after step-up -> audit. **Exceptions**: external deployment-bootstrap trust root and master decryption KEK cannot be stored solely beside the ciphertext in the same DB, and Cloudflare admin root credentials must not be entered into a publicly accessible settings backend. Set those externally through authorized provider secret management or deployment ceremony.

News publishing journey: owner creates sourced article -> AI Media drafts images/diagrams only with verified facts -> editor preview including mobile and alt text -> owner final approval -> publish/schedule -> view actual traffic and costs. Ad journey: owner approves legitimate advertiser and labeled creative -> placement/contract/time -> sponsor booking and consent -> performance/revenue audit. Social: owner approves each real platform post; app review restrictions remain visible. Future token remains a noninteractive zero-data planning status until separately approved chain/contracts.

## Screenshots / Design Freeze

High-risk screen families require owner visual approval of A04 Mission Control, A09 News Editor, A13 AI Media Generator, A22 Advertising, A33 Settings Hub, A34 Secret Integration Input, A42 owner MFA, and A46 future token placeholder. Other admin screens follow the same approved system and still require representative screenshots/tests. No approved screenshot yet exists for these internal views.

Read companion documents: COINBLINK_VISUAL_DESIGN_BIBLE_v2.0_DRAFT.md, COINBLINK_SETTINGS_AND_SINGLE_OWNER_v2.0_DRAFT.md, COINBLINK_EDITORIAL_MEDIA_ENGINE_v2.0_DRAFT.md. Do not assume a deployed dashboard, Cloudflare preview or actual provider keys.
