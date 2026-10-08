# CoinBlink · X / Instagram / TikTok Social Studio v0.1

**User direction:** a comprehensive admin workspace to create, adapt, review, publish and measure posts on X, Instagram and TikTok. Technical integration details require actual app accounts and external platform review; no social accounts have been connected.

## Operator journey

1. Select a CoinBlink-approved source article/story, or create a new social-only campaign.
2. Compose a base message and select intended destination(s).
3. Generate/edit **separate platform variants**: X short post/thread, Instagram carousel/image/reel story, TikTok short vertical hook/storyboard/photo-post.
4. Add creative art assets from approved/rights-cleared CoinBlink templates and video pipeline, subtitles and alt text; preview 1:1 / 4:5 / 9:16 safe areas and wording.
5. Assign labels (news alert, sponsored content, opinion, AI-assisted, corrections), language en/pt-BR/es, UTM, hashtag constraints and editorial/brand safety check.
6. Save draft -> Request Review -> Approved -> Scheduled -> Publishing -> Published or Failed, with Retry/Pause/Cancel only for authorized roles. Approval is human, per channel and final version.
7. Measure platform-reported outcome per account/asset (where permitted) and site visits from attributed UTM separately.
8. If direct publishing not permitted, use **export-to-platform** manual handoff with proper acknowledgment rather than pretend success.

## Channel contract and caveats

| Platform | Official integration direction | Prerequisites / policy constraints |
|---|---|---|
| X | Create user-authorized posts using X API v2 `POST /2/tweets` and applicable media upload | Developer account, OAuth/scopes and changing API cost/limits; do not promise free unlimited automation or private metric access |
| Instagram | Instagram API for Professional Creator/Business accounts; media container, publish status and permissions | Approved Meta app/login flow, eligible professional account and correct scopes, rate limits, publishing format restrictions |
| TikTok | Content Posting API, creator info query, video/photo Direct Post or upload-to-inbox flow | Developer registered app, OAuth `video.publish` scope, explicit creator consent and app audit. Public Direct Post may be blocked or restricted to private for unaudited apps |

**Research links:**
- X API posting: https://docs.x.com/x-api/posts/manage-tweets/introduction
- Meta Instagram Professional publishing: https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login
- Instagram Login scopes: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- TikTok Direct Post: https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post
- TikTok publishing review: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- TikTok publishing and watermark terms: https://developers.tiktok.com/docs/en/content-sharing-guidelines

## Proposed social database / job schema

`social_accounts` (platform, provider account id, token secret ref, scopes, expiry, audit status), `social_campaigns` (story id, source locale, CTA, budget, UTM), `social_variants` (channel, language, text, media, captions, version hash, approval), `social_posts` (schedule, status, platform id/url, job id, retries, idempotency key, failure reason), `social_metrics` (source, fetched-at, reach/impressions where provided, likes, shares, clicks, UTM visits), `social_audit`.

**Security:** never store plain OAuth tokens or account credentials in public repo or unprotected clients; TLS, encrypted secrets, least privilege, token rotation, revoke/disconnect flow and owner-only irreversible post delete.

## Creative workflows

- Templates: Breaking, Market Movers, Regulation, Hack Explainer, Morning Brief, Radar 24h, Fact Check, Weekly Digest and Sponsored (explicitly labeled).
- Media variants: 1:1, 4:5, 9:16, subtitle safe area, transparent logo and coherent lime/dark palette; editorial title and logo export inherit Golden visual Bible.
- LLM-generated hooks are **drafts** requiring factual grounding and editorial approval. No auto-generated crypto return promises, third-party copy reuse, or unauthorized music/video rights.
- TikTok watermark/promotional overlay restrictions may limit some designs; respect provider guidelines and allow channel-specific creative without marketing watermarks.

## Analytics boundaries

Clearly distinguish `source_platform_reported_reach`, `source_platform_reported_impressions`, `source_platform_reported_clicks`, `coinblink_attributed_sessions` and `coinblink_converted_subscribers`. If platform metric access is unavailable, show "not available" with reconnect/scopes guidance, not an invented value.

## First release cut

**M07 P0:** gorgeous editor, platform previews, calendar, campaign drafts, separate platform variants, approval + audit, social analytics schema with fake-demo indicator.
**M07 P1:** first official API connection that passes platform review and contract tests, scheduled send and reconciliation; adapters for other channels sandboxed pending approval.
**M07 P2:** third-party account connections as permissions permit, full reporting, failure/consent/accessibility tests, no misleading one-click universal posting.

No LIVE external post without the user permitting the account, content and publishing conditions.
