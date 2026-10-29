# CB-M06-P1-SYSTEM-PULSE-001 · verifiable system pulse

Status: implemented. `/demo/pulse` aggregates signals the product can actually
observe. It deliberately contains no audience analytics, per-article views or
charts, because no analytics source exists in this deployment.

## Sections and sources

| Section | Data | Source |
| --- | --- | --- |
| Deployment | build SHA, environment, origin, reader flag | `import.meta.env.PUBLIC_*` baked at build time |
| Live collection | state, collection time, feeds responded, headline count, rights status, per-publisher rows | `readLiveNews` (same cached snapshot as the reader) |
| Private intake | registered sources, evaluated, admitted, denied | `buildLiveIntakeReview` over the same snapshot |
| Editorial CMS | local-only status | constant: this deployment has no database, identity or publishing binding |
| Public surfaces | publishers, site locales, saved-search location | static whitelist, `SITE_LOCALES`, saved-search contract |

Every number is either computed from the current snapshot or read from the
build. Nothing is stored, sampled over time or inferred.

## States

- **Reader off** (CI and any deployment without `PUBLIC_NEWS_LIVE`): collection
  says no request was made, the intake gate is marked "not measured" and no
  per-publisher rows exist.
- **Reader live**: collection time, feeds responded, headline count, rights
  status, per-publisher state and the intake counts (0 registered, 0 admitted,
  N denied today).
- **Build**: a local build shows `local`; a deployed build shows the first 12
  characters of `PUBLIC_BUILD_SHA`, which `/health` exposes in full.

## Why there are no view metrics

M06's eventual preview includes real per-article metrics. Producing them would
require an audience-analytics source and a privacy decision that this
deployment does not have. The pulse therefore states `LOCAL ONLY` for the
editorial CMS and reports no draft or view count. That is the honest subset,
not a placeholder chart.

## Verified (2026-10-29)

Local enabled build with an explicit test SHA, environment and origin:

- Build `0123456789ab`, environment `production`, origin shown, reader flag
  `enabled`.
- Collection: 5 of 5 feeds, 60 headlines, rights
  `HEADLINES_WITH_ATTRIBUTION_ONLY`.
- Intake: 0 of 5 registered, 60 evaluated, 0 admitted, 60 denied.
- Publishers 5, site locales 3, saved searches `browser-only`.
- Axe: zero violations.

With the reader off (CI): 200, reader `DISABLED`, build `local`, "No request
was made", intake `not-measured`, no per-publisher rows, no external requests,
Axe clean.

## Contracts

- `test/modules/CB-M06/pulse-surface.test.mjs` — the page calls only the live
  reader, the intake model and build metadata; no script, form, storage or
  `fetch`; the demo index links to it.
- `e2e/m03-live-news.spec.mjs` — disabled state, local build label,
  not-measured intake, no rows, no external requests, Axe.
- `e2e/site-surfaces.spec.mjs` — the route keeps the shared demo invariants.
- Deploy smoke checks `/demo/pulse`.
