# CB-M11-P1-SOURCE-CATALOG-001 · publisher metadata API

Status: implemented. `GET /v1/sources` lists the five publishers CoinBlink is
allowed to read, with no editorial content.

## Why

Consumers should not need to scrape the HTML directory to learn which
publishers exist, where their official pages are, or which localized reader
page belongs to each. The catalog is public provenance metadata: names, home
pages, feed URLs and reader pages.

## Contract

```json
{
  "status": "ok",
  "mode": "PUBLIC_METADATA",
  "count": 5,
  "rights": "ATTRIBUTION_ONLY",
  "sources": [
    {
      "id": "coindesk",
      "name": "CoinDesk",
      "home": "https://www.coindesk.com",
      "feed": "https://www.coindesk.com/arc/outboundfeeds/rss",
      "pages": {
        "en": "/en/news/source/coindesk",
        "pt-br": "/pt-br/news/source/coindesk",
        "es": "/es/news/source/coindesk"
      },
      "rights": "ATTRIBUTION_ONLY"
    }
  ],
  "disclaimer": "Publisher metadata only; no article content is included."
}
```

Every field is derived from the reviewed whitelist. The projection never reads
a collected item, so no headline, excerpt, link or timestamp can leak into the
response.

## HTTP behaviour

- `GET` → 200, `application/json; charset=utf-8`, `Cache-Control: public,
  max-age=3600, s-maxage=60` (browsers cache for an hour, shared edges for
  one minute so a deploy cannot serve stale metadata), `Access-Control-Allow-Origin: *`.
- A matching `If-None-Match` returns 304 with no body.
- `OPTIONS` → 204; `HEAD` → 200; other methods → 405 with `Allow: GET`.
- Any query parameter → 400 `UNSUPPORTED_QUERY`.
- `x-robots-tag` keeps the endpoint out of search results.

The catalog is static for a given build, so the one-hour cache is safe.

## Documentation

`/developers` gained a "Publisher catalog (real, metadata only)" section with
the request shape, the response example and a live link, alongside the status
endpoint.

## Verification

- Local and production-shaped GET returns `count: 5`, five records with exactly
  `feed`, `home`, `id`, `name`, `pages`, `rights`; no `title` or `summary` keys.
- Feed and home URLs are https on the publisher's own host.
- `?x=1` → 400; `POST` → 405 with `Allow: GET`.
- Axe: zero violations on `/developers`; the 320px reflow contract still
  passes.

## Contracts

- `test/modules/CB-M03/source-catalog.test.mjs` — exact fields, three localized
  pages per source, host validation, frozen output, proof that no editorial
  field is serialized.
- `test/modules/CB-M11/source-catalog-endpoint.test.mjs` — methods, headers,
  query rejection, no storage or item access, documentation link.
- `e2e/m11-developer-demo.spec.mjs` — live GET, 400, 405 and the page link.
- Deploy smoke requires five metadata-only sources and no `title`/`summary`.
