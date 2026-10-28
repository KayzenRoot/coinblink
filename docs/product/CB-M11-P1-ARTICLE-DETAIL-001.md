# CB-M11-P1-ARTICLE-DETAIL-001 | Single-article sandbox endpoint

## What it adds

`GET /v1/demo/articles/{slug}` returns one canonical invented article record, the same three the list exposes, individually addressable. It closes the obvious gap in a developer sandbox: a list without a detail is not a usable API surface.

## Contract

| Status | Payload status | When |
|---|---|---|
| 200 | `DEMO_DETAIL_NOT_PUBLISHED` | a canonical slug |
| 400 | `BAD_REQUEST` | malformed slug shape, or any query parameter |
| 404 | `NOT_FOUND` | a well-shaped slug that does not exist, including `constructor` and `tostring` |
| 405 | `METHOD_NOT_ALLOWED` | any method other than GET, with `Allow: GET` |
| 503 | `UNAVAILABLE` | the canonical record failed its own projection |

The envelope is `mode`, `status`, `live`, `redistributable`, `item`, with `mode=SYNTHETIC`, `live=false` and `redistributable=false` always. A success carries exactly one item with `category`, `id`, `published`, `rights`, `slug`, `summary`, `title`; `published` stays `false` and `rights` stays `SYNTHETIC_NOT_LICENSED_NEWS`. An error carries `item: null` and never an object.

## Two deliberate omissions

- **No body.** The sandbox is not licensed to redistribute full text, so the detail exposes the same metadata as the list. A regression test asserts `"body"` never appears in the payload.
- **No query extensions.** `?include=body`, `?fields=`, and everything else answer `400` rather than silently ignoring the parameter.

## Sharing one projection

`projectDemoArticle` was extracted from the list builder and is used by both endpoints, so the detail cannot widen a field the list would refuse. The list's tests still pass unchanged.

## Validation

- 3 detail contracts and the extended contract tests: canonical slug, unknown, malformed shapes including prototype keys, no body, no private fields, `constructor`/`tostring` as NOT_FOUND, error-with-item and success-without-item refused, and a widened item refused.
- Browser: the conformance sweep now iterates every declared endpoint through its example path, and asserts the detail's 404, 400 and 405 envelopes against the same contract.
