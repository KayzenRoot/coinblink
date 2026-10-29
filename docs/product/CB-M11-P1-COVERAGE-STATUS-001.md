# CB-M11-P1-COVERAGE-STATUS-001 · coverage counts API

Status: implemented. `GET /v1/news/coverage` reports how many stories more than
one publisher carried and how many covered stories name each publisher.

## Why

The reader shows cross-publisher coverage, but API consumers could only learn
feed health and publisher metadata. A counts-only projection closes that gap
without redistributing anything: no headline, link, excerpt or article
timestamp is exposed.

## Contract

```json
{
  "status": "ok",
  "mode": "LIVE_THIRD_PARTY",
  "collectedAt": "2026-10-29T22:45:00.000Z",
  "stories": 4,
  "headlines": 60,
  "rights": "ATTRIBUTION_ONLY",
  "publishers": [
    { "id": "coindesk", "stories": 3 },
    { "id": "decrypt", "stories": 2 },
    { "id": "bitcoinmagazine", "stories": 0 }
  ],
  "disclaimer": "Counts only. This response contains no headline text, links or article timestamps."
}
```

- `stories` counts the clusters with at least two distinct publishers, using
  the same mechanical matching as the reader.
- `publishers` lists every reviewed publisher with the number of covered
  stories it belongs to, ordered by count and then id. Zero rows keep the
  shape stable; names are omitted, ids are already public in `/v1/sources`.
- `headlines` is the size of the collection.
- `collectedAt` is the collection time, not an article timestamp.

When live news is disabled or unavailable the payload keeps the shape:
`status` becomes `disabled` or `unavailable`, `reason` is included, `stories`
and `headlines` are `0`, `publishers` is empty and `rights` is `NO_CONTENT`.
A malformed snapshot throws and the shared handler answers 503.

## HTTP behaviour

`GET` → 200 `application/json; charset=utf-8`, `Cache-Control: public,
max-age=60`, CORS open, strong `ETag`; `If-None-Match` → 304; `OPTIONS` → 204;
`HEAD` → 200; other methods → 405 with `Allow: GET`; any query parameter → 400.

The route reuses `publicJsonEndpoint`, so the conditional and error behaviour is
identical to the other public endpoints. The document is described in
`/v1/openapi.json` as `CoverageStatus` and linked from `/developers`.

## Verification

- `test/modules/CB-M11/coverage-status.test.mjs` — counts, ordering, stable
  zero rows, frozen output, disabled/unavailable shapes, malformed input and a
  serialized check that no title, link, summary or article timestamp leaks.
- `test/modules/CB-M11/coverage-status-endpoint.test.mjs` — route methods,
  cache header, offline model and the developer link.
- OpenAPI unit and browser contracts require the third path and the
  `CoverageStatus` schema.
- Deploy smoke fetches the endpoint and rejects non-aggregate rows.
