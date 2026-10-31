# CB-M13-P1-ADS-001 · sponsors, placements and measured delivery

Status: the owner registers a sponsor, sells a placement with a window and a
rate, and the site renders it only while it is active. Impressions are counted
server-side and clicks through `/ad/click`, so no client script is involved.

## Slots

`home`, `article` and `newsletter`. The home slot renders on the locale news
index, the article slot below a published article; the newsletter slot is
modelled for a later edition template.

## Placement rules

- Sponsor and CTA URLs must be `https`; a `javascript:` or `http:` URL is
  refused.
- Label 2–60 characters, body up to 240, CTA label up to 40.
- `end_at` must be after `start_at`.
- Only one placement per slot is served: the newest active one inside its
  window. Pausing removes it immediately.

## Measurement

- **Impression**: incremented when the slot renders, one per page render.
- **Click**: `/ad/click?id=...` counts the click and answers `303` to the
  sponsor; a paused or expired placement answers `404` instead of redirecting.
- Counters live in `cms_ad_stats` per placement per UTC day.
- Every link carries `rel="sponsored noopener"`.

## Money

`rate_cents` is the contracted value of a placement. The admin screen sums the
**live** placements only; it is contracted value, not billed revenue, and no
payment is collected here.

## Data

`migrations/0012_ads.sql` creates `cms_sponsors`, `cms_ad_placements` and
`cms_ad_stats`.

## Verification

`test/modules/CB-M13/ads.test.mjs` covers URL and window validation, the active
window, per-day counters, the click target refusals, a database without the
migration, the owner screen and the site wiring.
