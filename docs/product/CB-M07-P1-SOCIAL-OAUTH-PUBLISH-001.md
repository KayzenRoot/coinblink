# CB-M07-P1-SOCIAL-OAUTH-PUBLISH-001 · Instagram and TikTok connection and send

Status: implemented. The two developer apps do not exist yet, so both flows
fail closed with `503` until `META_APP_ID`/`META_APP_SECRET` and
`TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET` are configured. Issue #467.

## Routes

All four are owner-only: without a valid owner session the start answers `404`
like any other admin route.

- `GET /api/oauth/instagram/start` — reads `META_APP_ID`, writes a one-use state
  digest to `cms_social_oauth_states`, sets an `HttpOnly`, `Secure`,
  `SameSite=Lax` state cookie scoped to `/api/oauth/instagram` and redirects to
  `https://www.facebook.com/v21.0/dialog/oauth` with
  `instagram_basic,instagram_content_publish,pages_show_list`.
- `GET /api/oauth/instagram/callback` — validates the state, exchanges the code
  for a short-lived token, upgrades it with `grant_type=fb_exchange_token`,
  resolves the Instagram professional account through
  `/me/accounts?fields=name,access_token,instagram_business_account{id,username}`
  and stores the **Page token** (publishing needs it, not the user token) in the
  AES-GCM vault as provider `instagram`.
- `GET /api/oauth/tiktok/start` — same state machinery, redirects to
  `https://www.tiktok.com/v2/auth/authorize/` with
  `video.publish,video.upload,user.info.basic`.
- `GET /api/oauth/tiktok/callback` — exchanges the code at
  `https://open.tiktokapis.com/v2/oauth/token/`, reads
  `/v2/user/info/?fields=open_id,username,display_name` and stores the access and
  refresh tokens under the TikTok `open_id`.

The redirect URI is derived from the request origin plus the callback path:

- `https://coinblink-production.kayzendev.workers.dev/api/oauth/instagram/callback`
- `https://coinblink-production.kayzendev.workers.dev/api/oauth/tiktok/callback`

## Sending the plan

`POST /admin/social/send` ("Send today plan") runs `sendDay`
(`src/modules/CB-M07/social-publish.mjs`) over the rows that are `planned` for
today, capped by the daily quota and by the `sent` count already recorded.

- Instagram: `POST /{ig-user-id}/media` with `image_url`, `caption` and the Page
  token, then `POST /{ig-user-id}/media_publish`. The default image is the
  reviewed brand card `/brand/og-image.jpg` (1200×630 JPEG, accepted by the feed);
  `M07_IG_MEDIA_URL` overrides it.
- TikTok: `POST /v2/post/publish/video/init/` with `PULL_FROM_URL`, then
  `/v2/post/publish/status/fetch/`. Without `M07_TIKTOK_VIDEO_URL` there is
  nothing to upload, so the network answers `no_media` and makes no external
  call. An unaudited app publishes with `privacy_level=SELF_ONLY`. The access
  token lives 24 hours, so an expiring token is refreshed with
  `grant_type=refresh_token`, resealed with the same vault and used for the
  publish; without refresh credentials the network answers `expired` and calls
  nothing.
- Each network is isolated: a failure in one never stops the other.
- A row moves to `sent` only on a real success. Failures keep the row `planned`
  and write the reason in `detail`; a terminal detail is not retried the same
  day. An in-flight TikTok publish (`tiktok:publish:<id>`) is resumed by
  polling the status instead of starting a second upload.
- Without a stored account the network answers `not_configured` and no external
  call is made, so the queue stays a dry-run.

## Credentials

`META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY` and
`TIKTOK_CLIENT_SECRET` are read with `getSetting`, so a value pasted in
`/admin/settings` (group Social) wins and the Worker environment is the
fallback. Values are never rendered back; the panel shows whether each one is
configured.

## Security

- No token is logged, rendered or returned by a queue row. Only the status code
  of an external failure reaches `detail`, truncated to 240 characters.
- State is a 32-byte random value stored as a SHA-256 digest and consumed once.
- The callbacks are `no-store`, `noindex` and make no external asset request.
- A manually pasted token (`account_id` prefixed with `manual:`) is never used by
  the publisher: it has no graph id and would only produce a broken call.

## Verification

- `test/modules/CB-M07/instagram-oauth.test.mjs` — consent URL, callback
  normalization, short→long exchange, Page/account discovery, route guards.
- `test/modules/CB-M07/tiktok-oauth.test.mjs` — consent URL, confidential-client
  form exchange, profile fallback, route guards.
- `test/modules/CB-M07/social-publish.test.mjs` — media defaults, both publishes,
  `not_configured`/`no_media` without an account or media, quota, failure
  isolation and bounded details.
- `e2e/m07-social-oauth.spec.mjs` — all four routes exist and answer `503` while
  the apps are absent.
