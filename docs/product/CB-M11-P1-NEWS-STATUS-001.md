# CB-M11-P1-NEWS-STATUS-001 · content-free collection status API

Status: implemented. `GET /v1/news/status` reports collection health without a
single headline, excerpt, article body or publisher name.

## Why

The reader already knows which feeds answered and how much each returned. An
API consumer monitoring the pipeline needs that state; it does not need the
reporting, and handing it over would turn the endpoint into a redistribution
channel. The endpoint therefore exposes counts and status codes only.

## Contract

| Field | Meaning |
| --- | --- |
| `status` | `ok`, `disabled` or `unavailable` |
| `mode` | always `LIVE_THIRD_PARTY` |
| `collectedAt` | ISO timestamp of the current snapshot (`ok` only) |
| `stale` | `true` when the reader served its last good collection after a total outage |
| `refreshFailedAt` | ISO timestamp of the failed refresh (`stale` only) |
| `windowSeconds` | collection window (900) |
| `feedsTotal` | configured publishers (5) |
| `feedsRead` | publishers that answered (`ok`) |
| `items` | headlines in the collection (`ok`) |
| `rights` | `HEADLINES_WITH_ATTRIBUTION_ONLY` or `NO_CONTENT` |
| `attribution` | `{ required: true, path: "/en/news/sources" }` (`ok` only) |
| `feeds[]` | `{ id, status, itemCount, reason }` — **no name, title or text** |
| `disclaimer` | "This response contains no headline text or article content." |

A stale response keeps `status: "ok"` because the data is real and was
successfully collected; consumers must check `stale` before treating
`collectedAt` as current. When the reader is disabled or unavailable, `feeds` is empty, `items` and
`feedsRead` are `0`, `rights` is `NO_CONTENT`, and `reason` explains why.

## HTTP behaviour

- `GET` → 200 with `application/json; charset=utf-8`, `Cache-Control:
  public, max-age=60`, `Access-Control-Allow-Origin: *`.
- A matching `If-None-Match` returns 304 with the same cache/CORS headers and no body.
- `OPTIONS` → 204 with the same CORS headers.
- `HEAD` → 200 without a body.
- Any other method → 405 with `Allow: GET`.
- Any query parameter → 400 `{ "status": "bad_request", "reason":
  "UNSUPPORTED_QUERY" }`.
- An internal failure → 503 `{ "status": "unavailable", "reason": "INTERNAL" }`.
- `x-robots-tag` keeps the endpoint out of search results.

The endpoint reads through the same 15-minute cache as the reader; polling it
within that window does not add a collection.

## Verified with the real collection (2026-10-29)

- `GET` → 200, `status: ok`, `feedsRead: 5`, `feedsTotal: 5`, `items: 60`.
- Feed rows: Cointelegraph 20, Decrypt 20, CoinDesk 20, CryptoSlate 10, Bitcoin
  Magazine 10 — each with only `id`, `status`, `itemCount`, `reason`.
- `?x=1` → 400; `POST` → 405 with `Allow: GET`.
- With the reader off: `status: disabled`, `feeds: []`, `feedsTotal: 5`.

## Documentation

`/developers` gained a "Live collection status (content-free)" section with the
request shape, the headers and the link to the live JSON. The page's example
wraps inside the CSP-safe stylesheet so the 320px reflow contract still passes.

## Contracts

- `test/modules/CB-M03/news-status.test.mjs` — live/disabled/unavailable
  projections, frozen output, exact feed keys, and proof that neither a
  headline nor a publisher name can appear.
- `test/modules/CB-M11/news-status-endpoint.test.mjs` — GET/OPTIONS/ALL,
  headers, query rejection, 405, and no storage or content access.
- `e2e/m11-developer-demo.spec.mjs` — real GET/400/405 assertions and the
  documentation link.
- Deploy smoke parses `/v1/news/status` and rejects any feed row containing a
  `title`.
