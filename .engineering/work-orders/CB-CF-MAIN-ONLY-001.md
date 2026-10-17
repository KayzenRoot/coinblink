# CB-CF-MAIN-ONLY-001 · Production deployment from protected main

**Status:** Owner-directed implementation candidate in a dedicated draft PR. This Work Order becomes canonical only after the Owner's reviewed protected merge. It does not authorize merge, secret creation, Worker provisioning, deployment, DNS changes, Paid features, or checkpoint promotion.

## Objective

Prepare one automatic Cloudflare Workers production deployment path for `KayzenRoot/coinblink`. A deploy may proceed only after the trusted `GEF validation` workflow succeeds for a push to the current protected `main`, the source PR is merged, the strict required contexts are verified, the checked-out commit is still the current main SHA, and a separate GitHub `production` environment provides the fixed Cloudflare account and least-privilege token.

The selected target is the new Worker `coinblink-production` at `https://coinblink-production.kayzendev.workers.dev` in Cloudflare account `91aeaffe2456eff6bb9ce76ce177bb3f`. The existing `coinblink-m00-preview` remains separate. No custom domain, routes, DNS, paid products, live data, or Worker bindings are added.

## Explicit owner authority and limits

The Owner explicitly requested this dedicated pipeline PR and delegated the choice of the Worker name and `workers.dev` hostname. This authorizes implementation and non-secret GitHub environment scoping for this pipeline. It does not authorize publishing a deployment or merging this PR. The first production deployment can occur only after a reviewed squash merge to protected `main` and after the Owner separately configures `CLOUDFLARE_API_TOKEN` in the `production` environment.

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
- Production job uses the GitHub `production` environment restricted to protected branches. Cloudflare credentials are injected only in the single deploy step. The fixed Worker name and URL are checked against the verified account ID before Wrangler runs.
- Pinned Node `22.19.0`, npm lockfile, `npm ci --ignore-scripts`, audit, lint, typecheck, full unit/build/browser/accessibility/GEF tests, and a local Wrangler dry-run all precede the production command. The existing no-session-binding guard is reasserted.
- Wrangler deploy is explicit: `wrangler deploy --config ./dist/server/wrangler.json --name coinblink-production`. The root `wrangler.jsonc` and its `coinblink-m00-local` identity remain unchanged.
- Post-deploy smoke verifies the exact build SHA at `/health`, demo-only status, `/en`, one same-origin Astro asset, noindex/security headers, robots behavior, and a real 404. No live data or secrets are accepted.
- Rollback remains an Owner-operated Cloudflare version rollback to the previous known-good Worker deployment; no automatic rollback command with write access beyond the required deployment token is added.

GitHub documents the built-in `GITHUB_TOKEN` as limited to the permissions granted to the workflow; repository permissions are configured per job ([GitHub Actions token permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)). Cloudflare requires an API token and account ID for non-interactive Wrangler deployment and recommends restricting the token to the account that will receive the Worker ([Cloudflare GitHub Actions deployment guidance](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)). This candidate does not create or store that secret.

## Acceptance and state

- [x] Dedicated production-only workflow and synthetic negative tests exist in the PR candidate.
- [x] Live ruleset, main CI, Cloudflare dashboard, selected Worker name/hostname, and no-existing-production-pipeline state are documented from readbacks.
- [x] Local validation executed under Node `22.19.0` and npm `10.9.3`; all results and one existing local parallel-test timeout are recorded in the Evidence Bundle.
- [ ] Draft PR published on an exact current main base with hosted required checks on its exact head.
- [x] Production GitHub environment exists with a main-only deployment branch policy, administrator bypass disabled, and verified account ID variable.
- [ ] Owner adds the least-privilege `CLOUDFLARE_API_TOKEN` as a GitHub `production` environment secret. No token is requested or stored in this PR.
- [ ] After protected merge and Owner-authorized first main deployment, Cloudflare Worker and exact-SHA endpoint smoke are verified.

**Candidate stop state:** `DRAFT_PR_AWAITING_EXACT_HEAD_CI_AND_OWNER_REVIEW`. The local full-suite attempt has one recorded failure in an existing M01 visual fixture under parallel load; its isolated rerun passed. Hosted exact-head CI is the next validation gate. Until protected merge and Owner token provisioning, this pipeline is not active and no production deployment is claimed.
