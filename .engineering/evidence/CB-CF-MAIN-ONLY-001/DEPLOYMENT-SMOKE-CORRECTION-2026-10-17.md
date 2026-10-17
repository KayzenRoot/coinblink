# Initial main deployment and smoke correction · 2026-10-17

## Main deployment readback

- PR #117 was squash-merged at 2026-10-17T15:51:33Z as main commit `0e097ffc0aaba308ed32ab8468db8b8963e9fd85`.
- The trusted GEF push run [#39046894518](https://github.com/KayzenRoot/coinblink/actions/runs/39046894518) completed successfully for that exact main SHA.
- The main-only production workflow [#39047194589](https://github.com/KayzenRoot/coinblink/actions/runs/39047194589) ran for the same SHA. Preflight passed, Wrangler deployment succeeded, and the Worker was created at `https://coinblink-production.kayzendev.workers.dev`.
- The workflow ended in failure because the final smoke also required document security headers on a static CSS asset. No credential value was exposed in logs. The smoke script intentionally withheld its exception details; a local exact-SHA reproduction identified the assertion.

## Public endpoint observations

Read-only GET requests to the deployed Worker returned:

| Path | Result | Relevant response |
|---|---:|---|
| `/health` | 200 | `no-store`; service `coinblink`; exact build SHA `0e097ffc0aaba308ed32ab8468db8b8963e9fd85`; `production` |
| `/preview-status` | 200 | `no-store`; `demo` / `demonstration-only`; feeds and market data `not-connected`; exact build SHA |
| `/en` | 200 | HTML; CSP, restrictive Permissions-Policy, Referrer-Policy, `nosniff`, `DENY`, and `noindex` |
| `/_astro/BaseLayout.7NFdTbKN.css` | 200 | `text/css`, same-origin, `noindex`; no document-level CSP/Permissions-Policy/Referrer-Policy headers |
| `/robots.txt` | 200 | `User-agent: *` and `Allow: /` |
| `/missing-route` | 404 | noindex plus the security headers |

The page and API routes satisfy their security-header policy. Cloudflare serves the immutable CSS asset through the static asset binding without document-level security headers, so applying the same header assertion to that asset caused a false smoke failure. The static asset still must be same-origin, return `noindex`, return a successful non-HTML content type, and not redirect.

## Correction in the follow-up candidate

- `scripts/verify-worker-production.mjs` continues to require all configured security headers on `/health`, `/preview-status`, `/en`, and `/missing-route`; it skips only document-level security-header assertions for the static Astro asset and `robots.txt`.
- `test/cloudflare-production-smoke.test.mjs` models the real static asset response and rejects missing asset `noindex`, HTML content, failed status, wrong origin, and redirects.
- Before the code change, the new focused test reproduced the same missing-CSP failure. After the fix, all 34 focused Cloudflare production tests pass under Node `22.23.3`, and the corrected smoke was run against the live Worker and confirmed the exact deployed SHA.
- Lint, typecheck, audit, build, Wrangler dry-run, and the no-session-binding guard pass locally. Full GEF hosted checks on the follow-up PR and its subsequent main-triggered deployment remain pending.

No Cloudflare plan or paid feature, custom domain, DNS, ruleset, checkpoint, commercial-rights flag, or production credential was changed. The token value was not read. `commercialPublicationAllowed=false`, Issue #72 `PENDING_OWNER_OR_LEGAL`, and `M01_DONE=false` remain unchanged. This readback records operational DEMO deployment only and is not a commercial rights decision.
