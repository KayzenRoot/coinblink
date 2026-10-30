# CB-M06-P1-PAGEVIEWS-001 · cookieless aggregate pageviews

Status: implemented. Public pages send a same-origin beacon with the path only;
the Worker increments one D1 row per UTC day, path and locale.

## Privacy contract

- No cookie, IP, user agent, referrer, account or user identifier is read or
  stored. The only dimensions are day, path and locale.
- Admin, API, versioned API, health and preview paths are rejected by the
  server and skipped by the client.
- Paths are bounded to 200 characters, must be absolute, cannot contain a query
  or double slash.

## Data

`migrations/0002_pageviews.sql` creates `cms_pageviews(day, path, locale, views)`
with a composite primary key and a day index. The endpoint upserts with
`views = views + 1`.

`POST /api/analytics/pageview` requires `Origin` and `Sec-Fetch-Site:
same-origin`, JSON content type, a body under 2 KB and a valid path; it answers
204. `public/analytics.js` uses `navigator.sendBeacon` with a fetch fallback and
is loaded by `BaseLayout` only when `PUBLIC_ANALYTICS_LIVE=true`. Production
deploys set it explicitly; PR and local builds leave it off, so tests and
previews make no analytics request.

## Dashboard

`/admin/analytics` (owner session required) shows views today, views in the last
seven UTC days, the top ten paths and the daily series. It reuses the owner
admin shell and CSRF sign-out form.

## Verification

`test/modules/CB-M06/pageview.test.mjs` covers path validation, locale
derivation, the upsert, fail-closed behavior, the dashboard render and the
same-origin identifier-free contracts. `/admin/analytics` is in the anonymous
404 guard.
