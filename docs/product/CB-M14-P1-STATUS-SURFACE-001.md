# CB-M14-P1-STATUS-SURFACE-001 · public operational status

Status: implemented. `/status` reports the deployed commit, the live collection
state, feed health and coverage counts, with no editorial content.

## Why

The deployment had machine contracts (`/health`, `/v1/news/status`) and
human pages for readers, but no single public page an operator or reviewer could
open to answer "what is deployed and what is the collector doing". The incident
drill remains offline and fictional; this surface reports measured state only.

## Contract

`src/pages/status.astro` is server-rendered and English-only, like
`/developers`:

- **Build** — `buildInfo.sha` and `buildInfo.environment`, plus a link to
  `/health`.
- **Live collection** — `readLiveNews` with the same `PUBLIC_NEWS_LIVE` gate as
  every reader surface. Disabled makes no feed request; unavailable shows the
  reason; live shows collection time, headline count, feeds read, covered
  stories and whether the stale fallback is active.
- **Feed health** — one row per publisher id with state, item count and reason.
  Publisher ids only; no headline, excerpt, article link or article timestamp.
- **Public contracts** — links to the status, coverage, sources and OpenAPI
  JSON documents and to the human directory and coverage pages.

Coverage counts come from `buildCoverageStatus`, the same content-free
projection served by `/v1/news/coverage`. The page sets
`Cache-Control: no-store` and carries the usual noindex robots tag.

## Boundaries

- Public and read-only: it does not create, refresh or clear a collection and
  has no incident actions or authentication.
- It does not admit the full CB-M14 admin operations module; it is a status
  surface only.
- English-only by design, consistent with the developer surface.

## Verification

- `test/modules/CB-M14/status-surface.test.mjs` — gate, no-store, content-free
  markers, projection reuse, build info and contract links; no item fields,
  scripts or storage.
- `e2e/m14-status.spec.mjs` — 200, no-store, language, heading, disabled state,
  robots, links, no feed rows while off, axe and no external requests.
- `site-surfaces` includes `/status` in its invariant and mobile sweeps;
  `link-integrity` crawls it.
- Deploy smoke requires `/status` to answer 200, report the deployed commit and
  contain no headline items.
