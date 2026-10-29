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
| `live-news-copy.mjs` | localized chrome for en, pt-br and es — headlines stay in the publisher's language |
| `live-news-filter.mjs` | pure narrowing of one collected snapshot by text and publisher; no request, no storage |
| `live-news-topics.mjs` | document-frequency word list over the visible headlines, with function words removed and plurals folded only when both forms exist |
| `LiveNewsPanel.astro` | markup only: escaped text, `rel="noreferrer noopener external"` links, explicit rights banner |
| `LiveHeadlineStrip.astro` | three newest headlines on the news index, rendered only while the reader is live |
| `src/pages/{en,pt-br,es}/news/live.astro` | the three SSR entries, each reading `PUBLIC_NEWS_LIVE` |

Contract of `readLiveNews` (never throws):

- `DISABLED` / `NOT_ENABLED` — the variable is absent or not affirmative; no request is made.
- `LIVE_HEADLINES` — at least one feed produced usable items. Each feed's own status is reported.
- `UNAVAILABLE` / `NO_FETCH` — the runtime has no `fetch`.
- `UNAVAILABLE` / `ALL_SOURCES_FAILED` — every feed failed (timeout, HTTP status, empty document) and no recent good collection exists.
- `LIVE_HEADLINES` with `stale: true` — every feed failed, but the last good collection is at most one hour old. The original `collectedAt` is preserved, `refreshFailedAt` records the failed attempt, and the page shows a warning. A stale snapshot never extends the last-good timestamp, is retried every 60 seconds, and after one hour the reader fails closed again.

Per-source reasons are `TIMEOUT`, `NETWORK`, `HTTP_<code>` or `NO_USABLE_ITEMS`.
A source that fails does not hide the others: 4 of 5 healthy feeds still render.

## Resource bounds

RSS has no quota, so the guard is time, not a counter:

- one collection per source per 15-minute window, memoised per process;
- a wholly failed collection is cached for 60 seconds so a dead publisher
  cannot become a request storm;
- a stale fallback serves the last good collection for at most one hour, with
  an explicit warning and a 60-second retry;
- each request aborts after 5 seconds;
- each feed contributes at most 20 items and the page caps at 60 headlines total.

Worst case per process is 96 collections per source per day (2,880 per month),
and a Worker isolate normally lives far less than a day. This is a fraction of
what a browser refreshing the publishers' own pages would generate.

## Discovery

The reader is also the discovery surface for real headlines. A plain GET form
narrows the current collection by free text and publisher, and the address is
shareable. Free text covers the title and excerpt only; the publisher is a
separate select, so a topic chip and a text query describe the same field:

```
/en/news/live?q=etf&source=coindesk
```

`live-news-filter.mjs` is pure: it folds accents and case the same way the
synthetic news catalog does, clamps the query to 80 characters, accepts only a
publisher from the reviewed whitelist (anything else means "all"), and selects
from the snapshot already in memory. It never asks a publisher for a search
result, cannot reach the network and stores nothing, so a query cannot multiply
egress or turn the page into a proxy. The collection itself remains bounded at
20 items per feed and 60 in total; when the filter excludes everything, the page
says so and offers a reset instead of an empty list.

The list can also be narrowed by freshness. `?since=3`, `?since=12` or
`?since=24` keeps only headlines published inside that window, computed from
the cached snapshot at render time. Any other value means "any time". The
presets are plain links that preserve the current query and publisher, so a
window is shareable and works without JavaScript. Inside a window, headlines
without a publication time are hidden: freshness cannot be proven without a
date.

Every headline card shows a localized relative age ("7 minutes ago", "há 7
minutos", "hace 1 hora") computed at render time from the cached snapshot. The
exact instant stays in the `<time datetime>` attribute and in its tooltip as
`YYYY-MM-DD HH:MM UTC`, so the friendly label never replaces the verifiable
one. The same formatter is used on the news-index strip and on the publisher
pages; missing or unparseable dates keep the explicit "time not supplied"
label, and a future timestamp is treated as "just now" rather than a negative
age.

Above the list, a second navigation shows the words that appear in at least
two of the visible headlines, with their counts. It is explicitly a frequency
list, not an editorial topic model: no inference, no stemming beyond folding a
plural into its singular when the collection contains both forms, and no
network. Selecting a chip runs the same local filter and keeps the active
publisher, so narrowing by source and then by word never widens the list again.

The same collection reaches the news index: `/en/news`, `/pt-br/news` and
`/es/news` render the three newest headlines above the synthetic catalog, with
the publisher and time on each item and a link to the full page. The strip reads
through the same cache, so opening the index does not multiply collections, and
it renders nothing at all while the reader is off.

## Conditional fetching

Each publisher's validators are remembered per process: the `ETag` and
`Last-Modified` returned with a successful collection. On the next window the
reader sends `If-None-Match` (or `If-Modified-Since` when there is no ETag).
A `304 Not Modified` reuses the items from that feed, counts it as `OK` and
marks it `notModified: true` in the snapshot. The number of requests does not
change — still one per source per 15-minute window — only the transferred bytes
drop when a publisher honours the validator.

A `304` with no previous representation is impossible in normal operation and
fails that source as `UNEXPECTED_304` instead of inventing items.

## Toggle

`PUBLIC_NEWS_LIVE` accepts exactly `1`, `true`, `enabled` or `on`
(case-insensitive). Anything else, including an empty value, keeps the reader
off. The value is baked at build time, so the deploy workflow reads it from the
repository variable `PUBLIC_NEWS_LIVE` and the post-deploy smoke test asserts
that `/en/news/live` reflects the configured state: `live` or `unavailable`
when enabled, `disabled` when not. The smoke test never requires a specific
publisher to be up.

Local verification of the enabled path:

```bash
PUBLIC_NEWS_LIVE=enabled npm run build
npm run preview            # wrangler dev on the built Worker
# open http://127.0.0.1:8787/en/news/live
```

Verified on 2026-10-26: headlines rendered from all five publishers, each
linked to its own domain, with the collection time and per-feed counts. The
same collection renders at `/pt-br/news/live` and `/es/news/live` with
translated chrome; each localized page declares its own `lang` and, with
`PUBLIC_SITE_ORIGIN` set, emits hreflang alternates for the other two.

## Locales

The reader is part of the news section, not the demo lab index. The English,
Portuguese and Spanish pages share one panel and one copy module, and the news
index in each locale links to its own live page. Only the page furniture is
translated: the headline and excerpt stay exactly as the publisher wrote them,
because rewriting them would change someone else's reporting.

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
