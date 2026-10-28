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
| `COINBLINK_CF_WORKER_URL` | Variable | no | Public URL; when set, the workflow smoke tests `/health`, `/en`, `/demo`, the demo `robots` policy and that `/admin` stays unreachable |

Until the two required values exist, the deploy job fails early with an explicit message naming this document, instead of deploying something unintended. The smoke test is skipped with a note when `COINBLINK_CF_WORKER_URL` is absent, so a missing cosmetic variable never turns a good deploy red.

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
- The site stays a labelled DEMO: `/admin` is unreachable in production, every page carries `noindex, nofollow, noarchive`, and no rights, publication or real-account claim is made by a deploy.
- `PUBLIC_SITE_ORIGIN` is what turns on canonical and hreflang metadata. Leaving it empty keeps absolute URLs out of the build, so set it only once the real origin exists.

## Rollback

Cloudflare keeps the previous deployment. Either re-run the workflow on an earlier `main` commit through `workflow_dispatch` after reverting, or use `wrangler rollback` from your machine with the same credentials.
