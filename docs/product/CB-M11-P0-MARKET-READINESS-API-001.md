# CB-M11-P0-MARKET-READINESS-API-001 | Synthetic blocked markets API

## Context lock and admission boundary

- Owner-authorized original `main=0d8a11b0d7c2f17b9797eb9b3545ec15954974c2`; PR #231 stays **DRAFT**. This is M11/M04 P0 demo contract integration, **not** a LIVE API or full M11/M04 completion.
- Scope limited to eight paths only: `src/modules/CB-M11/demo-market-readiness.mjs`, `src/pages/v1/demo/market-readiness.ts`, `src/pages/developers.astro`, `test/modules/CB-M11/demo-market-readiness.test.mjs`, `e2e/m11-developer-market-demo.spec.mjs`, `.github/workflows/m11-developer-demo.yml`, this document and `.engineering/evidence/CB-M11-P0-MARKET-READINESS-API-001/EVIDENCE-BUNDLE.md`.
- M04 `market-lab.mjs` and `market-readiness.mjs` are immutable upstream source contracts in this WO; no rewriting original market UI, checks or fixtures.

## User-visible acceptance

- `GET /developers`: keep article API and existing accessibility/skip-link, add a clear link to `/v1/demo/market-readiness` and explicit blocked/fictional market warning. No global CSS or CSP change; check 320px, 390px, 768px and 1366px document reflow and axe WCAG tags.
- `GET /v1/demo/market-readiness`: immutable JSON with `mode=SYNTHETIC`, `status=BLOCKED_DEMO`, `live=false`, `redistributable=false`. Precisely BTC, ETH, SOL ordered, and each record contains exactly `asset`, `pair`, `freshness`, `rights=NOT_CLEARED`, `numericQuote=null`, `publiclyUsable=false` and `blockers` (four canonical M04 rights, capture, freshness and no-feed blockers).
- Deliberately no `numericValue`, timestamp, as-of, provider, quote history, transaction/trading permission, subscription entitlement or source URL in JSON. M04 includes an illustrative timestamp internally; it must never escape into this API.
- Top-level and per-item source schema is strictly checked against M04's three canonical specimens. Expected freshness STALED BTC and UNAVAILABLE ETH/SOL, no numeric values, no observed capture and no rights clearances. Forged/altered inputs, changed mock flags or unexpected extra fields fail closed to `UNAVAILABLE` with zero data. This is NOT a future paid `/v1/markets/quotes` endpoint.
- HTTP: GET without any query params is the only permitted operation. All query params are rejected 400; POST, PUT, PATCH, DELETE and OPTIONS return 405 with `Allow: GET`. Errors contain no market data. `Content-Type: application/json`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow, noarchive`; do not relax CORS or CSP.

## RED→GREEN and security criteria

- Commit only Node tests, Playwright tests and CI before code, prove **actual hosted RED** missing module/route. Chromium RED can be NOT_RUN if failed Node gate correctly halts.
- GREEN: M04 + M02 + all M11 Node regression; M04 + M02 + old M11 + new M11 Chromium browser suite; axe on docs, small and wide viewport, no external egress or browser write methods, fail-closed rights/numeric/mode/field poisoning, blocked methods and params.
- Dedicated M11 workflow triggers when M04 canonical `market-lab.mjs` or `market-readiness.mjs` change, when M11 module/docs/route/tests change, and when this WO/Evidence Bundle changes. No new GitHub permissions, paid integrations or dependencies.
- Required SHA-locked Build, lint/typecheck, Gitleaks, PR Assurance, Reviewdog, SonarCloud zero new issues/hotspots and both Socket checks. Test PASS is not measured coverage; SonarCloud **0.0% coverage** remains explicit caveat.
- Do not write live-provider adapters, remote API calls, database, subscription signup, analytics, credentials, marketing claims or any real quote.

## Hosted baseline RED

- Branch test-only HEAD `a2487a4d8fc20c93df8312a99a0c76389cbd7d66`; GitHub M11 run `40089063046` with Node 23 total, **20 existing PASS / 3 new FAIL** from missing `src/modules/CB-M11/demo-market-readiness.mjs` and import module. Product changes did not exist at this HEAD. Chromium NOT_RUN because Node correctly failed first.
- Later GREEN and final SHA-bound gate evidence must be recorded in the separate Evidence Bundle; past HEAD results cannot be re-labeled as final HEAD validation.

## STOP condition

No Ready, merge, deploy, real data/quotes, external provider network, commercial API rights, pricing, signing keys, spending, modifications of base main, ECC #209, other PRs, rulesets or checkpoints. Any requirement or check failure means DRAFT BLOCKED until corrected in the same eight-path scope and revalidated on the newest HEAD.
