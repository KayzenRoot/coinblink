# CB-M03-P1-LIVE-RSS-001 · keyless live headlines

Status: implemented, off by default, enabled per deployment with `PUBLIC_NEWS_LIVE`.
Owner decision requested: none to keep it off; enabling it is one repository variable.

## Why RSS

P1 asked for real news without paid keys. Every commercial crypto news API
(CryptoPanic, NewsAPI, CoinDesk Data, Messari) needs a key and a monthly quota.
Public RSS needs neither: the publisher already exposes it for readers, it
carries the headline, a short description, the publication time and a link, and
there is no vendor-side monthly limit to respect.

What we still owe the publishers is attribution and restraint, which is what
this surface implements: headline, short excerpt, publisher name, timestamp and
an outbound link. No full article, no feed republication, no storage, no
indexing (`noindex, nofollow, noarchive`).

## Sources

All five were fetched successfully while building this slice.

| Source | Feed | Home |
| --- | --- | --- |
| Cointelegraph | `https://cointelegraph.com/rss` | `https://cointelegraph.com` |
| Decrypt | `https://decrypt.co/feed` | `https://decrypt.co` |
| CoinDesk | `https://www.coindesk.com/arc/outboundfeeds/rss` | `https://www.coindesk.com` |
| CryptoSlate | `https://cryptoslate.com/feed/` | `https://cryptoslate.com` |
| Bitcoin Magazine | `https://bitcoinmagazine.com/feed` | `https://bitcoinmagazine.com` |

Google News RSS was evaluated and rejected: it is an aggregator, so the
publisher of record is hidden behind a redirect and attribution becomes
ambiguous.

The whitelist lives in `src/modules/CB-M03/rss-sources.mjs`. Adding a source is
a code change with review, never runtime input. Every item link must be `https`
and must be on that publisher's own host, so a compromised feed cannot redirect
readers to an arbitrary domain.

## Architecture

| File | Responsibility |
| --- | --- |
| `rss-sources.mjs` | whitelist, window, caps, timeout — pure data |
| `rss-parse.mjs` | pure RSS/Atom projection: strip markup, decode entities, bound title (200) and excerpt (280), https + host validation, dedupe by link, sort desc |
| `live-news.mjs` | gate, per-process cache, parallel fetch with per-source abort, fail-closed aggregation |
| `LiveNewsPanel.astro` | markup only: escaped text, `rel="noreferrer noopener external"` links, explicit rights banner |
| `src/pages/demo/news/live.astro` | SSR entry, reads `PUBLIC_NEWS_LIVE` |

Contract of `readLiveNews` (never throws):

- `DISABLED` / `NOT_ENABLED` — the variable is absent or not affirmative; no request is made.
- `LIVE_HEADLINES` — at least one feed produced usable items. Each feed's own status is reported.
- `UNAVAILABLE` / `NO_FETCH` — the runtime has no `fetch`.
- `UNAVAILABLE` / `ALL_SOURCES_FAILED` — every feed failed (timeout, HTTP status, empty document).

Per-source reasons are `TIMEOUT`, `NETWORK`, `HTTP_<code>` or `NO_USABLE_ITEMS`.
A source that fails does not hide the others: 4 of 5 healthy feeds still render.

## Resource bounds

RSS has no quota, so the guard is time, not a counter:

- one collection per source per 15-minute window, memoised per process;
- a wholly failed collection is cached for 60 seconds so a dead publisher
  cannot become a request storm;
- each request aborts after 5 seconds;
- the page caps at 20 headlines total.

Worst case per process is 96 collections per source per day (2,880 per month),
and a Worker isolate normally lives far less than a day. This is a fraction of
what a browser refreshing the publishers' own pages would generate.

## Toggle

`PUBLIC_NEWS_LIVE` accepts exactly `1`, `true`, `enabled` or `on`
(case-insensitive). Anything else, including an empty value, keeps the reader
off. The value is baked at build time, so the deploy workflow reads it from the
repository variable `PUBLIC_NEWS_LIVE` and the post-deploy smoke test asserts
that `/demo/news/live` reflects the configured state: `live` or `unavailable`
when enabled, `disabled` when not. The smoke test never requires a specific
publisher to be up.

Local verification of the enabled path:

```bash
PUBLIC_NEWS_LIVE=enabled npm run build
npm run preview            # wrangler dev on the built Worker
# open http://127.0.0.1:8787/demo/news/live
```

Verified on 2026-10-26: 20 headlines rendered from all five publishers, each
linked to its own domain, with the collection time and per-feed counts.

## Rights stance

The publishers' feeds grant reading, not republication. This surface therefore:

- shows no article body and stores no copy of any feed;
- never presents a headline as CoinBlink reporting;
- links out to the original article and names the publisher next to every item;
- marks the page `noindex`, like every demo surface;
- states `commercialUseAllowed: false` and `fullTextStored: false` in the
  snapshot, so downstream code cannot mistake this for cleared content.

A real newsroom surface still needs the private intake path in
`src/modules/CB-M03/ingestion/source-eligibility.mjs`, a rights reference per
source, storage and an editorial decision. This slice deliberately does not
touch that path.

## Tests

- `test/modules/CB-M03/live-news.test.mjs` — parser and reader contracts:
  markup stripping, entity decoding, length caps, https/host rejection, dedupe,
  Atom support, ordering, frozen output, no full text, gate values, disabled
  makes zero requests, partial failure, cache window, failure retry, timeout,
  missing `fetch`, network error.
- `test/modules/CB-M03/live-news-surface.test.mjs` — source contract: SSR gate,
  no `set:html`, external `rel`, no storage or network outside the reader.
- `e2e/m03-live-news.spec.mjs` — disabled page is accessible, explains itself,
  makes no third-party request, and the demo index does not claim it is on.
- `e2e/site-surfaces.spec.mjs` — shared invariants, including this route.
