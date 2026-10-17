# CB-CF-MAIN-ONLY-001 · Production deployment from protected main

**Status:** PR #117 was protected-squash-merged on 2026-10-17 and automatically deployed main SHA `0e097ffc0aaba308ed32ab8468db8b8963e9fd85` to the production Worker. The first post-deploy smoke found an over-strict assertion on a static CSS asset; a follow-up correction is being prepared under this same Work Order. The Owner's authorization remains DEMO-only. Commercial publication and checkpoint promotion remain unauthorized.

## Objective

Automatically deploy each change integrated into the protected `main` branch to the Cloudflare Worker for the public DEMO of `KayzenRoot/coinblink`. A deployment may proceed only after the trusted `GEF validation` workflow succeeds for a push to the current protected `main`, the source PR is merged, strict required contexts are verified, the checked-out commit is still the current main SHA, GitHub repository variable `COINBLINK_PUBLIC_DEMO_DEPLOYMENT=AUTHORIZED_DEMO_ONLY` records the Owner's demo-only authorization, and the `production` environment provides the fixed Cloudflare account and deployment token. The workflow hard-codes `commercialPublicationAllowed=false`; it cannot grant or infer commercial rights clearance.

The selected target is the new Worker `coinblink-production` at `https://coinblink-production.kayzendev.workers.dev` in Cloudflare account `91aeaffe2456eff6bb9ce76ce177bb3f`. The existing `coinblink-m00-preview` remains separate. No custom domain, routes, DNS, paid products, live data, or Worker bindings are added.

## Explicit owner authority and limits

The Owner delegated the Worker name and hostname, authorized the Cloudflare deployment credential configuration, and directly instructed Codex on 2026-10-17 to change the blocker and make the site work. The Owner then explicitly authorized automatic Cloudflare production deployment for every change integrated into GitHub `main`. This authorizes completing this dedicated PR and its protected squash merge after all required exact-SHA checks pass. It does not establish trademark clearance, asset licensing, legal approval, or commercial publication permission. Issue #72 remains `PENDING_OWNER_OR_LEGAL`; `commercialPublicationAllowed=false` and `M01_DONE=false` remain unchanged. The existing Cloudflare token is stored only as `CLOUDFLARE_API_TOKEN` in the GitHub `production` environment; its value is never read or logged. The token has account-wide Workers Scripts Write scope, so compromise could modify scripts across this Cloudflare account.

## Scope

Allowed paths for this Work Order:

- `.github/workflows/cloudflare-production-main-only.yml`
- `scripts/cloudflare-production-policy.mjs`
- `scripts/assert-production-deploy-eligibility.mjs`
- `scripts/assert-production-main-current.mjs`
- `scripts/assert-production-deployment-config.mjs`
- `scripts/verify-worker-production.mjs`
- `test/cloudflare-production-*.test.mjs`
- `.engineering/work-orders/CB-CF-MAIN-ONLY-001.md`
- `.engineering/context-locks/CB-CF-MAIN-ONLY-001.md`
- `.engineering/evidence/CB-CF-MAIN-ONLY-001/**`

The CI may build the existing application as a consequence of running its existing tests; no application source, Docker, Wrangler source config, package manifest/lock, security guard, checkpoint, ruleset, existing preview workflow, secrets, or other PR/Work Order is in scope.

## Safety and deployment design

- One new GitHub Actions production path: `workflow_run` for the completed `GEF validation` workflow, filtered to `main`; runtime checks also reject a non-`push`, non-`main`, fork, PR-associated run, failed/cancelled run, invalid SHA, or stale main SHA.
- No `push`, `pull_request`, `pull_request_target`, `workflow_dispatch`, schedule, repository-dispatch, or fork trigger is configured on the production workflow. The existing Owner-gated Preview workflow stays unchanged and is not a production deployer.
- Checkout the event's exact main SHA with persisted Git credentials disabled; check it out again as the deploy job's input; compare against the live `main` tip immediately before Wrangler.
- Verify the active ruleset readback, protected main scope, squash-only PR policy, thread resolution, deletion/non-fast-forward protections, empty bypass list, strict status checks, and all seven required context names during this implementation. The built-in Actions token does not expose a documented repository `administration:read` permission, so runtime policy relies on the protected merge by `KayzenRoot` and independently requires all seven context results; it does not claim a live ruleset API readback from the deploy job.
- GitHub currently publishes five required contexts on the post-merge main commit. The two PR-only contexts (`Socket Security: Pull Request Alerts` and `CodeRabbit`) are verified on the unique merged source PR head. Eligibility requires that the exact merged PR head's full Git tree SHA equal the exact deployable main commit's tree SHA, and requires all five main contexts on the main commit plus all seven contexts on the source PR head. This proves source-tree identity but does not represent seven check-run records on one commit SHA. The final report must keep this limitation explicit.
- `CodeRabbit` is verified only as a required status context; it is not claimed to be substantive human or security review.
- Production environment has a custom branch policy allowing only `main`, with administrator bypass disabled. The fixed Worker name and URL are checked against the verified account ID before Wrangler runs. Cloudflare credentials are injected only in the single deploy step.
- Eligibility requires the exact repository variable `COINBLINK_PUBLIC_DEMO_DEPLOYMENT=AUTHORIZED_DEMO_ONLY` in both preflight and the final guard immediately before Wrangler. The workflow independently requires `COINBLINK_COMMERCIAL_PUBLICATION_ALLOWED=false` and labels all output DEMO_ONLY. No Issue #72 comment is converted into rights clearance, and the workflow does not read or alter Issue #72. Invalid/missing demo authorization or any attempt to enable commercial publication fails closed.
- Pinned Node `22.19.0`, npm lockfile, `npm ci --ignore-scripts`, audit, lint, typecheck, full unit/build/browser/accessibility/GEF tests, and a local Wrangler dry-run all precede the production command. The existing no-session-binding guard is reasserted.
- Wrangler deploy is explicit: `wrangler deploy --config ./dist/server/wrangler.json --name coinblink-production`. The root `wrangler.jsonc` and its `coinblink-m00-local` identity remain unchanged.
- Post-deploy smoke verifies the exact build SHA at `/health`, demo-only status, `/en`, one same-origin Astro asset, noindex/security headers, robots behavior, and a real 404. No live data or secrets are accepted.
- Rollback remains an Owner-operated Cloudflare version rollback to the previous known-good Worker deployment; no automatic rollback command with write access beyond the required deployment token is added.

GitHub documents the built-in `GITHUB_TOKEN` as limited to the permissions granted to the workflow; repository permissions are configured per job ([GitHub Actions token permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)). Cloudflare requires an API token and account ID for non-interactive Wrangler deployment and recommends restricting the token to the account that will receive the Worker ([Cloudflare GitHub Actions deployment guidance](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)). The Owner authorized and configured the account-wide `Workers Scripts Write` credential in the protected `production` environment; only its name/presence is read back, never its value.

## Acceptance and state

- [x] Dedicated production-only workflow and synthetic negative tests exist in the PR candidate.
- [x] Live ruleset, main CI, Cloudflare dashboard, selected Worker name/hostname, and no-existing-production-pipeline state are documented from readbacks.
- [x] Final local validation executed under Node `22.23.3` (workflow remains pinned to `22.19.0`): the complete unit/build/Playwright suite, lint, typecheck, audit, and Wrangler dry-run passed; results are recorded in the Evidence Bundle.
- [x] Initial PR #117 was published on an exact current main base; all seven required hosted contexts passed on its exact head `6dfaa4f072be3dc32c5a10774981d974e613453d`.
- [x] Production GitHub environment exists with an exact `main` deployment branch policy, administrator bypass disabled, and verified account ID variable.
- [x] Owner demo authorization variable is set to `AUTHORIZED_DEMO_ONLY`; commercial publication stays hard-coded false.
- [x] The Cloudflare API token secret is present by name in the `production` environment; its value was not read. The account-wide scope risk is recorded.
- [x] PR #117 was marked ready after all seven required exact-head contexts passed and was squash-merged under the protected ruleset.
- [x] The automatic main-only workflow deployed Worker `coinblink-production` from main SHA `0e097ffc0aaba308ed32ab8468db8b8963e9fd85`.
- [ ] Follow-up smoke correction has all required hosted checks on its exact PR head and is protected-squash-merged.
- [ ] The correction's automatic main-only deployment completes the exact-SHA health, demo-only routes, asset, security-header, robots/noindex, and 404 smoke successfully.

**Current stop state:** `PRODUCTION_WORKER_DEPLOYED_AT_0E097FFC_SMOKE_CORRECTION_AWAITING_EXACT_HEAD_HOSTED_CHECKS`. The first post-deploy smoke failed only because document security headers were required on the CSS asset; read-only GETs confirmed the Worker health and demo-only contract at the exact deployed SHA. Issue #72 remains `PENDING_OWNER_OR_LEGAL` and is not commercial clearance. Local focused tests, lint, typecheck, audit, build, and Wrangler dry-run for the correction passed. The follow-up PR's exact-head checks and subsequent automatic deployment smoke remain required before reporting the workflow as fully green.
