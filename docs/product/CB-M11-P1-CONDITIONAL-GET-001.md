# CB-M11-P1-CONDITIONAL-GET-001 · conditional GET for the public API

Status: implemented. Both real endpoints now return a strong `ETag` and answer
`304 Not Modified` when the client already has the current representation.

## Why

The status endpoint is polled and the catalog is static for a build. Without a
validator, every poll transfers the whole JSON. A conditional GET lets a client
ask "has this changed?" and receive an empty 304 when it has not.

## Algorithm

`strongEtag(body)` is an FNV-1a 32-bit hash over the serialized body plus its
length, rendered as `"hhhhhhhh-llll"`. It is:

- **deterministic** across runtimes (no crypto, no locale, no clock);
- **synchronous**, so it can run inside the Worker without awaiting;
- **body-bound**: any change to the JSON changes the tag.

`matchesIfNoneMatch(header, etag)` accepts an exact tag, a comma-separated
list, a weak validator (`W/"…"`, allowed for `If-None-Match`) and `*`. A
missing or empty header never matches.

## Behaviour

- A normal `GET` returns 200 with `ETag`, the existing `Cache-Control` and CORS
  headers.
- A `GET` whose `If-None-Match` matches returns **304** with `ETag`,
  `Cache-Control`, CORS and no body.
- `OPTIONS` (204), `HEAD` (200), other methods (405 with `Allow: GET`) and
  query rejection (400) are unchanged.
- The status endpoint's one-minute cache and the catalog's one-hour cache are
  unchanged; the validator is independent of them.

## Endpoints

| Endpoint | Body | Cache |
| --- | --- | --- |
| `GET /v1/news/status` | collection state, feed counts, stale flag | `max-age=60` |
| `GET /v1/sources` | five publishers, metadata only | `max-age=3600, s-maxage=60` |

`/developers` documents the ETag behaviour for both.

## Verification

- `/v1/sources`: first GET returns an ETag; a second GET with that ETag returns
  304 with an empty body; a wrong validator returns 200.
- `/v1/news/status`: the disabled payload is stable, so the conditional
  request returns 304; the ETag format is asserted.
- Deploy smoke requires `/v1/sources` to return an ETag and 304 for a matching
  validator.
- Axe and the 320px reflow contract on `/developers` remain green.

## Contracts

- `test/modules/CB-M11/conditional-get.test.mjs` — determinism, format, body
  sensitivity, exact/list/weak/wildcard matching and invalid inputs.
- The two endpoint contracts require `strongEtag`, `If-None-Match` and 304.
- `e2e/m11-developer-demo.spec.mjs` exercises 304 for both endpoints and 200
  for a mismatched validator.
