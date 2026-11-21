# CoinBlink · Cloudflare deployment

## What deploys, and when

`.github/workflows/cloudflare-production.yml` deploys the exact commit that lands on `main`. A pull request never publishes anything: the workflow has no `pull_request` trigger, so the credential is only ever used on a commit already merged into `main`.

The job does, in order: install locked dependencies, **verify the credentials exist before building**, lint, typecheck, build with `PUBLIC_BUILD_SHA` set to the deployed commit, reassert that the Worker carries no session binding, validate the generated bundle with `wrangler deploy --dry-run`, deploy, then smoke test the result.

## What you must set once, in the repository

Settings → Secrets and variables → Actions:

| Name | Kind | Required | Purpose |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | yes | Token with the **Edit Cloudflare Workers** permission for the target account |
| `CLOUDFLARE_ACCOUNT_ID` | Secret or Variable | yes | Account that owns the Worker |
| `COINBLINK_CF_WORKER_NAME` | Variable | no | Target Worker name, defaults to `coinblink-production` |
| `COINBLINK_CF_WORKER_URL` | Variable | no | Public URL; when set, smoke tests health, app routes, crawler policy, sitemap, HTTP/meta robot parity and blocked admin |
| `PUBLIC_SITE_ORIGIN` | Variable | no | Origin of the deployed site. When set, the build emits canonical, hreflang alternates and `og:image`; empty keeps every absolute URL out of the build |
| `PUBLIC_MARKET_LIVE` | Variable | no | Enables the attributed third-party market preview at `/demo/markets/live`. Empty or anything other than `1`, `true`, `enabled` or `on` keeps it off |
| `PUBLIC_NEWS_LIVE` | Variable | no | Enables attributed headlines from public RSS at `/en/news/live`. Empty or anything other than `1`, `true`, `enabled` or `on` keeps it off |

Until the two required values exist, the deploy job fails early with an explicit message naming this document, instead of deploying something unintended. The smoke test is skipped with a note when `COINBLINK_CF_WORKER_URL` is absent, so a missing cosmetic variable never turns a good deploy red.

## SEO crawler activation (CB-M09-P1-SEO-001)

This increment adds crawler controls to the previously delivered [locale and metadata work](../product/CB-M09-P1-SEO-METADATA-001.md). Production activation is a separate Owner decision.

Indexing remains closed by default. Two **Cloudflare Worker runtime variables** must be explicitly configured for the deployed Worker, and the production build's `PUBLIC_SITE_ORIGIN` must exactly match the HTTPS origin of the incoming request.

| Runtime variable | Enable value | Otherwise |
|---|---|---|
| `COINBLINK_SEO_ENVIRONMENT` | `production` | Non-indexable |
| `COINBLINK_SEO_INDEXING_ENABLED` | `true` (lowercase literal) | Non-indexable |

These variables are read from `cloudflare:workers` at request time. They are **not** the GitHub Actions `PUBLIC_*` build values. The build must also have `PUBLIC_BUILD_ENV=production` and an HTTPS `PUBLIC_SITE_ORIGIN` with no trailing slash. A custom domain must match that value exactly. Preview hosts and mismatching request origins remain closed, even when the Worker carries both variables.

`scripts/add-production-ai-binding.mjs` sets `keep_vars: true` **only** on `dist/server/wrangler.deploy.json`. Wrangler otherwise deletes dashboard-managed runtime variables on subsequent deploys. This setting preserves **all** existing dashboard-managed Worker variables, including the two SEO opt-ins. Review the Worker dashboard variable inventory before using it and set or remove the SEO runtime values there. The local and generated preview configs retain their empty `vars` block. A deploy never activates SEO on its own and does not supply the opt-in values. This is a future production-deploy configuration change that must be reviewed before merging to `main`.

When enabled, only `/en/editorial`, `/pt-br/editorial`, `/es/editorial` and **published** `/[locale]/article/[slug]` routes with HTTP 200 and an explicit index request return `index, follow` in both meta robots and `X-Robots-Tag`. Other pages, drafts, 404/410 errors, `/admin`, `/demo` and APIs retain `noindex, nofollow, noarchive`. `robots.txt` allows crawling and links to the canonical sitemap. The sitemap enumerates published D1 articles in pages and returns HTTP 503 if the database is unavailable or inconsistent, preventing silent truncation. When indexing is disabled, `robots.txt` disallows crawling and the sitemap is empty.

The production smoke test verifies HTTP/meta agreement on `/en` and `/en/editorial`, plus crawler policy and the sitemap. It fails if enabled indexing points to a different origin or the database cannot provide a complete sitemap. Never activate the variables based solely on a successful build. Confirm live editorial rights, published content and domain readiness first.

**Rollback** is to remove or set either runtime variable to a value other than its enable literal. Check `robots.txt`, `/sitemap.xml`, the HTTP `X-Robots-Tag` and meta robots again, accounting for one-hour public cache on `robots.txt` and active sitemaps. Robots disallow can prevent crawlers from observing a new `noindex` until crawling is permitted again.

## Deploying from your machine

Copy `docs/automation/env.example` to `.env` at the repository root and fill in the values. `.env` is git-ignored on purpose. Then, from the repository root:

```powershell
# PowerShell
Get-Content .env | ForEach-Object { if ($_ -match '^([A-Z_]+)=(.*)$') { Set-Item "env:$($matches[1])" $matches[2] } }
npm ci
npm run build
./node_modules/.bin/wrangler deploy --config ./dist/server/wrangler.json --name $env:COINBLINK_CF_WORKER_NAME
```

The Worker name is always passed explicitly, so a deploy can never create or target a different Worker by accident.

## Safety boundaries

- The workflow keeps `contents: read`. No write-scoped GitHub token is requested, which is also what keeps it acceptable to the repository's own scope guard.
- Only `main` deploys. `workflow_dispatch` exists for a manual re-run of the same commit.
- `WRANGLER_SEND_METRICS=false` everywhere.
- The production crawler policy is fail-closed and requires the explicit Worker opt-in above. `/admin` remains unreachable in production. Readiness and rights remain separately reviewable.
- `PUBLIC_SITE_ORIGIN` is what turns on canonical, hreflang and `og:image`. It is now set to the deployed Worker origin, so production carries absolute metadata while any local build without it still carries none. Change the variable if the origin ever moves.
- The two live readers are opt-in and independently switched. The smoke test asserts that `/en/news/live` reflects `PUBLIC_NEWS_LIVE` — `disabled` when off, `live` or `unavailable` when on — so a forgotten variable shows up as a failed deploy step, not as a silently dead page. A publisher being down never fails the deploy: the page reports the partial collection instead.
- Cloudflare can keep serving the previous version for a short window right after `wrangler deploy`. The smoke test therefore polls `/health` for up to 90 seconds until it reports `GITHUB_SHA` before checking routes, rather than failing a healthy deployment on propagation delay.

## Rollback

Cloudflare keeps the previous deployment. Either re-run the workflow on an earlier `main` commit through `workflow_dispatch` after reverting, or use `wrangler rollback` from your machine with the same credentials.
