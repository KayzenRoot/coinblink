# CB-M11-P1-API-CONTRACT-001 | Machine-readable contract for the sandbox API

## Scope and frozen base
- First slice of the **M11 P1** work, the one the roadmap describes as the public developer API. It needs no provider, no credential and no deployment: it makes the existing offline sandbox endpoints **self-describing and drift-proof**.
- Main base `44e99bf`. Isolated branch `feat/cb-m11-p1-api-contract-001`.
- Owned files: the M11 contract module, its Node contracts, the existing M11 browser spec, this document. No endpoint behaviour changes.

## Why a contract first
A public API needs a published shape before it can be exposed. Today the two sandbox endpoints are strict but their guarantees live only in prose and in the endpoint source: an added envelope field, a changed payload status or a licence that flips would be caught only if a test happened to cover it. The contract makes those promises explicit and machine-checked.

## What the contract states
`src/modules/CB-M11/api-contract.mjs` is the single source of truth, versioned as `2026-10-demo.1`:

- Both endpoints are `GET` only, accept **no query parameters**, answer `200` on success and declare `400`, `405` and `503`, with `Allow: GET` on the rejected method.
- The envelope always carries exactly `mode`, `status`, `live`, `redistributable`, `items`, with `mode=SYNTHETIC`, `live=false` and `redistributable=false` in every response.
- `/v1/demo/articles`: success payload status `DEMO_ONLY`, three items carrying exactly `category`, `id`, `published`, `rights`, `slug`, `summary`, `title`, with `published=false` and `rights=SYNTHETIC_NOT_LICENSED_NEWS`.
- `/v1/demo/market-readiness`: success payload status `BLOCKED_DEMO`, three items carrying exactly `asset`, `blockers`, `freshness`, `numericQuote`, `pair`, `publiclyUsable`, `rights`, with `rights=NOT_CLEARED`, `numericQuote=null` and `publiclyUsable=false`.
- An error response carries the empty envelope and **never** items.

`conformsToContract(path, status, payload)` returns `{ ok, problems }` and never throws, so it can judge a live response, a tampered fixture or a malformed value.

## What enforces it
- `test/modules/CB-M11/api-contract.test.mjs`: the contract's own shape, conformance of the real builders, and rejection of a smuggled envelope field, a flipped `live` or `redistributable`, an undeclared status, a wrong item count, a widened item and an error response carrying items.
- `e2e/m11-developer-demo.spec.mjs`: a new case that calls both live endpoints over HTTP and validates the responses against the same contract, including the `400` and `405` error envelopes. This is what detects drift between the document and reality.
- Both are already executed by `.github/workflows/m11-developer-demo.yml`, which globs `test/modules/CB-M11/*.test.mjs` and names the M11 browser spec, so no workflow change was needed.

## Explicitly unchanged
- No endpoint behaviour, no new query parameter, no pagination, no CORS, no exposure and no deployment. `mode` stays `SYNTHETIC`, `live` stays `false`, `redistributable` stays `false`.
- The sandbox is still not a public API: it is reachable only inside the demo build and stays `noindex`.

## STOP
PR remains Draft. Never Ready, merge, deploy, publish, or turn this into a live API without the owner decisions that a real provider, licensing and hosting require.
