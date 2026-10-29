# CB-M11-P1-OPENAPI-001 · machine-readable API contract

Status: implemented. `/v1/openapi.json` describes the two real, content-free
endpoints in OpenAPI 3.1.

## Why

The developer page explained the endpoints in prose. Consumers benefit from a
machine-readable contract that lists paths, responses and schemas, and that can
feed code generators or validators without scraping documentation.

## Document

- `openapi: "3.1.0"`, title "CoinBlink public metadata API", version `1.0.0`,
  relative server `"/"` so it works on any deployment origin.
- Paths: `/v1/news/status` and `/v1/sources`, both `GET`.
- Every operation documents `200`, `304`, `400`, `405` and `503`, with no
  security scheme and no parameters.
- Schemas: `FeedStatus`, `NewsStatus`, `Source`, `SourceCatalog`, `Error`.

`FeedStatus` is exactly `id`, `status`, `itemCount`, `reason`;
`Source` is exactly `id`, `name`, `home`, `feed`, `pages`, `rights`. The
document contains no `title`, `summary`, `link`, `publishedAt` or `body`
property, so a generated client cannot expect editorial content.

## HTTP behaviour

- `GET` → 200 JSON, `Cache-Control: public, max-age=3600, s-maxage=60`,
  CORS open, `ETag`.
- A matching `If-None-Match` → 304 with no body (same shared helper as the other
  endpoints).
- `OPTIONS` → 204; `HEAD` → 200; other methods → 405 with `Allow: GET`.
- Any query parameter → 400 `UNSUPPORTED_QUERY`.
- `x-robots-tag` keeps the JSON out of search results.

`/developers` links to the document.

## Verification

- Model tests: both paths and all five responses, every `$ref` resolves, the
  feed and source schemas have exact keys and no editorial field, the document
  is deeply frozen.
- Endpoint contract: methods, headers, conditional response, no storage or item
  access.
- Browser: live GET, ETag/304, 400, 405 and the documentation link.
- Deploy smoke requires `/v1/openapi.json` to answer 200 and declare
  `openapi: "3.1.0"` with the real paths.
