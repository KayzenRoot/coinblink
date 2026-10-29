# CB-M03-P1-SOURCE-PAGES-001 · one page per publisher

Status: implemented. Every whitelisted publisher has an addressable page in
each site language, linked from the live reader's feed table.

## Why

The reader could already filter by publisher (`?source=`), but a filtered URL
is not a page: it cannot be linked as a source, described, or read without the
filter UI. A news product needs a stable address per publisher that states who
they are, what CoinBlink takes from them, and what the current collection
contains.

## Route

```
/en/news/source/coindesk
/pt-br/news/source/decrypt
/es/news/source/bitcoinmagazine
```

`src/pages/[locale]/news/source/[source].astro` validates both parameters:

- the locale must be one of `en`, `pt-br`, `es`;
- the source must be one of the five entries in `LIVE_NEWS_SOURCES`.

Anything else answers **404** and renders a localized "Publisher not found"
panel. An unknown address performs **no collection**: `readLiveNews` is only
called after both checks pass, so probing random paths cannot generate egress.

## Page content

- Publisher name as the only `h1`, and a localized intro stating exactly what
  CoinBlink displays: headline, short excerpt, publication time and a link to
  the original article.
- Collection state: live with the collection time and how many headlines from
  this publisher are in the snapshot; disabled; unavailable with a reason; or
  "no headline in the current collection".
- The publisher's headlines, each linking out with
  `rel="noreferrer noopener external"`.
- An aside with the publisher's official site, the rights note, and a link to
  the full live page.

The reader's feed table now links the publisher name to this page and keeps a
separate `↗` link to the official site, so attribution and provenance are both
one click away.

## Localization

`source-page-copy.mjs` is key-major: one row per string, one column per locale,
with `{name}`, `{count}`, `{time}` and `{reason}` placeholders verified equal
across languages. Headlines stay in the publisher's language. Unknown locales
fall back to English and prototype keys are rejected.

## Caching

The page calls the same `readLiveNews` cache as the live page. Within the
15-minute window, browsing a publisher page and the full list causes one
collection, not two.

## Verified with the real collection (2026-10-29)

- `/en/news/source/coindesk`: 20 items, live state, "Last collection at …".
- `/pt-br/news/source/decrypt`: 13 items, Portuguese state text.
- `/es/news/source/bitcoinmagazine`: 4 items, Spanish state text (the 60-item
  snapshot cap can leave a publisher with fewer items; the page reports what is
  actually present).
- The live feed table links all five publisher pages.
- Axe: zero violations on all three enabled pages.
- Unknown source and unknown locale: 404, no request.

## Contracts

- `source-page-copy.test.mjs` — key parity, translations, placeholders,
  fallback and prototype safety.
- `source-page-surface.test.mjs` — route validation, live gate, no
  `set:html`/script/form, external links, feed-table wiring.
- `e2e/m03-live-news.spec.mjs` — three locales, disabled state, no items, 404s,
  no external requests, Axe.
- `e2e/site-surfaces.spec.mjs` — two representative routes keep the shared
  invariants.
- Deploy smoke checks `/en/news/source/coindesk`.
