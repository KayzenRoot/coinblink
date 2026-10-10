# CB-M00 Cloudflare Worker Preview operations

This is an operational contract for the optional P1 lane of the already-admitted M00 Work Order.

## Current verified operation · 2026-10-10

Owner authorization and the protected GitHub Environment gate were satisfied for the manual run [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879), which succeeded on exact canonical main `e8886e21c6f152ca374b1e42852c6b6638543f40`. The stable and immutable URLs and public route/browser checks are recorded in `.engineering/evidence/CB-M00-WO-001-P1-CLOSEOUT.md`. The authenticated dashboard showed Workers Free and USD 0.00 observed in the current billing cycle; the account's USD 10 alert is informational and is not a hard cost ceiling. The protected workflow's authorization gate is evidence of the per-run gates, not a guarantee against future Cloudflare charges. No production deploy, R2 binding, DNS/billing change, or other-project change occurred. The dashboard did not expose the live Worker binding inventory; that read-only check remains pending. The machine checkpoint is not promoted and M00 is not DONE.

The “Required Owner setup” and “Historical gate status before the first authorized Preview” sections below retain first-deployment prerequisites and their historical pre-deployment state; they are no longer instructions to repeat the already completed Preview deployment.

## Prepared boundary

- Use the pinned `wrangler@4.149.0` from `package-lock.json`; the installed Astro Cloudflare adapter `14.3.4` declares peers `astro ^7.2.0` and `wrangler ^4.125.0`, satisfied by Astro `7.3.8` and Wrangler `4.149.0`.
- The source Worker remains named `coinblink-m00-local`. The deployment command explicitly targets the separate Worker `coinblink-m00-preview`; the Owner must verify that exact Worker name is dedicated and will not overwrite another service.
- `wrangler.jsonc` declares an empty `previews` block. The workflow passes `--ignore-base-config`, rejects any data/service binding, and uses only the static `ASSETS` binding. There are no production IDs, secrets, databases, queues, services, or storage resources in either configuration.
- `PUBLIC_BUILD_SHA` is set to the exact dispatch commit. `PUBLIC_BUILD_ENV=preview` is compiled only in the gated deployment job; local/CI builds continue to report `cloudflarePreview: not-deployed`.
- Dynamic Worker responses set `X-Robots-Tag`; static assets use `public/_headers`; HTML includes `noindex`; `public/robots.txt` allows crawlers to fetch the public demo and read those noindex signals. Noindex does not provide access control: the preview contains public demo content only.

## Required Owner setup before any dispatch

1. Verify the Owner's actual Cloudflare account and `workers.dev` availability. Confirm Workers Free plan and a monthly cost ceiling of exactly USD 0. If that ceiling cannot be enforced for the account, do not set the gate variables.
2. Confirm the dedicated Worker `coinblink-m00-preview` does not exist for another service and will not overwrite or route production traffic. Confirm Worker Previews are explicitly authorized and public demo visibility is acceptable.
3. Verify the API token's minimal required Cloudflare Workers edit scope is restricted to the selected account and that no unrelated zone or product permission is included. Store only `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as GitHub **environment secrets**; never commit, print, or paste them into chat.
4. Create GitHub Environment `cloudflare-preview`, restrict deployments to `main`, and configure the Owner as a required reviewer with no routine bypass. The workflow independently requires the dispatch actor to match `COINBLINK_PREVIEW_OWNER_GITHUB_LOGIN`.
5. Only after those checks, set the environment variables below to the exact values shown. They are Owner attestations, not facts this local preparation can verify.

| Environment variable | Required value |
|---|---|
| `COINBLINK_PREVIEW_OWNER_GITHUB_LOGIN` | Owner's exact GitHub login |
| `COINBLINK_CF_OWNER_AUTHORIZED` | `true` |
| `COINBLINK_CF_GITHUB_ENVIRONMENT_PROTECTED` | `true` |
| `COINBLINK_CF_PLAN` | `workers-free` |
| `COINBLINK_CF_FREE_PLAN_CONFIRMED` | `true` |
| `COINBLINK_CF_MONTHLY_COST_CEILING_USD` | `0` |
| `COINBLINK_CF_COST_CEILING_CONFIRMED` | `true` |
| `COINBLINK_CF_IAM_SCOPE_CONFIRMED` | `true` |
| `COINBLINK_CF_DEDICATED_WORKER_CONFIRMED` | `true` |
| `COINBLINK_CF_ISOLATION_CONFIRMED` | `true` |
| `COINBLINK_CF_WORKER_NAME` | `coinblink-m00-preview` |

The authorization script reports only whether required settings are missing; it never prints any secret value. An absent, malformed, contradictory, or non-zero-cost setting stops before a Wrangler command. This workflow does not run on `pull_request`, `pull_request_target`, `push`, comments, or forks; only manual dispatch on the current exact `main` SHA can reach the protected environment.

## Deployment and exact-SHA smoke

After the Owner setup is complete and this workflow has been merged, the Owner dispatches **Cloudflare Worker Preview (Owner gated)** from `main`, chooses `deploy`, and changes the confirmation input to `authorize-preview`. The workflow rechecks that its SHA is still the `origin/main` tip, runs pinned Node/npm, GEF, audit, lint, typecheck, build and browser/accessibility tests, then passes the protected environment gate. The read-only preflight job receives no Cloudflare credentials. In the protected job, credentials are passed to the authorization step and to the conditional Wrangler Preview create/delete steps. Creation uses `wrangler preview --ignore-base-config`, never `wrangler deploy` or a version upload.

Wrangler must return one actual stable Preview URL and one distinct immutable Deployment URL for worker `coinblink-m00-preview`. The workflow writes these returned values and the exact SHA to the GitHub run summary, then checks both URLs for `/health`, `/preview-status`, `/robots.txt`, noindex/security headers and a true 404. No URL or successful remote state is asserted before this command and smoke actually succeed.

## Bounded rollback

Each deploy name is generated as `coinblink-m00-run-<run-id>-<attempt>`. To remove one, the Owner dispatches the same workflow from current `main`, chooses `delete`, enters that exact managed name from the deployment run summary, and completes both GitHub environment review and the authorization confirmation. The script rejects all names outside that pattern. `wrangler preview delete` uses the supported `--config`, `--name`, `--worker-name`, and `--skip-confirmation` options, scoped to worker `coinblink-m00-preview` and that one Preview name; the documented effect is removal of that Preview and its deployments. It does not delete the Worker, other Preview names, or production resources. No automatic cleanup targets provider resources.

## Historical gate status before the first authorized Preview

No Owner account, Free plan, cost ceiling, IAM scope, GitHub environment protection, or credential presence has been confirmed by this preparation. The workflow must remain closed. This preparation does not create a Preview, change the checkpoint, satisfy P1 remote evidence, or mark M00 complete.
