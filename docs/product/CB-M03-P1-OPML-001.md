# CB-M03-P1-OPML-001 · publisher feeds as OPML

Status: implemented. `GET /sources.opml` exports the five reviewed publishers
as an OPML 2.0 subscription list.

## Why

The directory lists the feeds on screen, but a reader who wants the publishers
in their own feed reader had to copy five URLs. OPML is the standard exchange
format for that, and it carries public metadata only: name, feed URL and home
page.

## Contract

- `src/modules/CB-M03/sources-opml.mjs` builds the document from
  `LIVE_NEWS_SOURCES`; every attribute is XML-escaped and malformed entries are
  skipped.
- `GET /sources.opml` → 200 `text/x-opml; charset=utf-8`,
  `Cache-Control: public, max-age=3600`, `Content-Disposition: attachment`,
  CORS open, strong `ETag`.
- A matching `If-None-Match` → 304; `OPTIONS` → 204; `HEAD` → 200; other
  methods → 405 with `Allow: GET`; any query parameter → 400.
- No headline, excerpt, article link or article timestamp is present; only the
  `<outline>` elements with `text`, `title`, `xmlUrl` and `htmlUrl`.
- The source directory links to the export as "Subscribe to all feeds (OPML)",
  localized in en, pt-br and es.

## Verification

- `test/modules/CB-M03/opml.test.mjs` — five outlines, exact metadata,
  escaping, malformed input, route methods/headers and the directory link.
- M03 e2e — 200, content type, cache, five outlines, ETag/304, 400 and 405,
  plus the directory link.
- Deploy smoke requires `/sources.opml` to answer 200 and contain five
  `<outline>` elements with `xmlUrl`.
