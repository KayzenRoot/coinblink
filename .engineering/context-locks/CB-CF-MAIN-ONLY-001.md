# Context Lock · CB-CF-MAIN-ONLY-001

**Lock state:** Candidate implementation in a dedicated branch/PR. Initial base main was `5cbb808ebcc052780ba7e4f426080ddb0ef62f64`. A later fetch found protected main advanced to `824b3dc46825e3fa053c715b1765b70042c7981b` through merged PR #100, which adds three proposal-only M05 P1-C documents. Delta review found no checkpoint, production, deployment, or Cloudflare scope change. The candidate branch includes ordinary ancestry merge commit `b1630efe919208277d676d3067460fa0c4db3c50` of this current main; no history was rewritten. No checkpoint transition is proposed.

## Authorized work

Implement only the main-only production workflow, its no-secret eligibility/target/smoke verifiers, synthetic negative tests, and this Work Order/Context Lock/evidence bundle. Exact path allowlist:

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

No other file may change without a renewed scope decision.

## Baseline facts and fingerprints at the locked base

| Source | SHA-256 |
|---|---|
| `.github/workflows/gef-validation.yml` | `aeeebbc9996ed168953b6e4e9f1901fcfa6a4eaca43b5001582329c29e15411e` |
| `.github/workflows/cloudflare-worker-preview.yml` | `b6f8187d3e140797a53d5029d7926fc84716bdf9434f65873b026f95618ec96e` |
| `wrangler.jsonc` | `50b6138a917ed14c35faf692edfa4e7d852166eab4f376d12944df799297168e` |
| `astro.config.mjs` | `2b6cd0fea71a7db0b514677ab7b7b9ac94585ae52965f915ac80870efc109294` |
| `scripts/worker-preview-config-safety.mjs` | `514818cb58a0f27f807d427a0443033ff708fc78eefbd224d478c6c9036115d1` |
| `scripts/assert-no-session-binding.mjs` | `ad941cb7f0ade96a1bd3961e5160739940885894b652f617644c4ccb0c6de541` |
| `package.json` | `fe140aee959d2832866baee169c0c42c8933b5d66bd704af973201334f80dd4f` |
| `package-lock.json` | `0c63fbcb962789da52b225633f3309c76c328dadc8def638e57e758ddf947706` |
| `.engineering/CHECKPOINT.json` | `4abe8ea49e6c7edc68636be6cf5de5237a448e6ef8366be860332de0762aea1d` |
| `.engineering/SECURITY.md` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/SOURCE-HIERARCHY.md` | `85e24f21468b5811b65b177781e4cfd2ef72a486a015c76609fb964ebad48064` |
| `.engineering/DEFINITION-OF-DONE.md` | `dac96d9447e571cf4fa10bb6f0b01d18d99af4a7b54ea10509afafa8e337fe9b` |

## Initial read-only GitHub and Cloudflare snapshot at branch creation

- Main SHA: `5cbb808ebcc052780ba7e4f426080ddb0ef62f64`, tree `37ce406dfcdc0ad8a37a3e7d1c14e79811a166a6`.
- Main is the squash merge of PR #113. Its source PR head is `fd17a4ea1f07d000ef84d42fbc7f55842da782ea`, with the same tree SHA `37ce406dfcdc0ad8a37a3e7d1c14e79811a166a6`.
- Ruleset `24888106` is active only on `refs/heads/main`; strict status checks, PR+squash, thread resolution, deletion/non-fast-forward protection, no bypass actors. The seven configured contexts are preserved exactly in the Work Order and evidence report.
- On exact main SHA, five contexts are successful: Ubuntu GEF, Windows GEF, Docker Compose smoke, SonarCloud, Socket Project Report. PR #113 head has all seven configured contexts successful, including Socket Pull Request Alerts and CodeRabbit status. The distinction between commit SHAs is intentional and documented.
- Cloudflare dashboard account `91aeaffe2456eff6bb9ce76ce177bb3f` shows only `coinblink-m00-preview`; no production Worker, Git-connected Workers Builds pipeline, or custom domain is present. Existing GitHub `cloudflare-preview` environment is Owner-gated and must not be reused.
- Current product config is Astro Cloudflare adapter with `session:false`; Wrangler source config is `coinblink-m00-local` with only static assets and no production bindings. The existing preview workflow is manual and Owner-gated.
- A separate GitHub `production` environment was created for this PR candidate with `can_admins_bypass=false`, `protected_branches=true`, and `custom_branch_policies=false`; `CLOUDFLARE_ACCOUNT_ID` is set to the verified account as an environment variable. No Cloudflare API token/secret is configured, no Worker was created, and no deployment occurred.

## Critical invariants

- `authorizedToMerge=false`; do not merge, deploy, create a Cloudflare Worker, alter rulesets, checkpoint, Docker, dependencies, modules, existing Preview resources, or any unrelated PR.
- No GitHub `pull_request`, `pull_request_target`, branch, fork, schedule, manual dispatch, or Pages/Workers Builds trigger for production.
- Both `workflow_run` jobs now require `event=push`, `head_branch=main`, and matching base/head repository names in job-level conditions before their checkout steps; runtime GEF checks remain an independent second guard.
- Exact full main SHA must still be the current protected main at preflight and immediately before Wrangler. Any advancement or API ambiguity blocks deployment.
- The unique associated merged source PR must target this repository's `main`, have a same-repository head, be merged by `KayzenRoot`, and have an exact full tree SHA equal to the deployable main commit.
- Verify 5/5 checks on exact main plus 7/7 on the unique merged source PR SHA, and require full source tree SHA equality. Do not claim seven check runs exist on the main commit.
- Do not reuse Preview environment variables/secrets or log, request, or commit any Cloudflare token.
- Issue #72 is an independent commercial-rights gate. Closure alone does not clear rights: require its newest REST comment across all pages, ordered locally by `updated_at`, to be authored by `KayzenRoot` and contain one explicit authorization marker, `rightsReview=CLEARED`, `commercialPublicationAllowed=true`, and an HTTPS evidence URL. Read and fingerprint the full comment list twice; if it changes, fail closed. Recheck immediately before deployment. Current readback is pending, so automatic production deployment must remain blocked.
- The environment API token for deployment must be scoped to the verified account and Workers edit capability only, provisioned later by the Owner in GitHub environment `production`.
- Worker target fixed as `coinblink-production` / `https://coinblink-production.kayzendev.workers.dev`; no custom domain, routes or paid resource.
- Existing demo remains noindex and exposes only mock/unconnected data. The checkpoint stays `M00_COMPLETE`, `IMPLEMENTATION_IN_PROGRESS`, 5%.

## Main freshness delta · 2026-10-17

- Current protected main readback: `824b3dc46825e3fa053c715b1765b70042c7981b` (`docs(m05): adopt P1-C single-owner security proposal (#100)`).
- Delta paths: `.engineering/context-locks/CB-M05-P1C-OWNER-ADMIN-001.md`, `.engineering/work-orders/CB-M05-P1C-OWNER-ADMIN-001.md`, and `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md` (all additive, proposal-only). These do not modify deployment configuration, shared workflow contracts, checkpoint, or this Work Order's authorized paths.
- The candidate has been synchronized to this main without rewriting history. Exact-head local checks are being rerun before publication.

## Current exact base and governance readback · 2026-10-17

- Current protected main: `824b3dc46825e3fa053c715b1765b70042c7981b`, tree `9a75e41f00410772f2d345ad4eb7e9eacda178b2`.
- Its unique merged source PR is #100, head `366bcee4627ae73c7134833d68200ea51e834eb3`, merged by `KayzenRoot` into `main`; source and main trees match exactly. PR #100 head had all seven configured contexts successful. Exact main has the five contexts GitHub records on the post-merge SHA successful: Ubuntu GEF, Windows GEF, Docker Compose smoke, SonarCloud, and Socket Security: Project Report. Socket Pull Request Alerts and CodeRabbit are verified on PR #100's exact source head, not claimed as statuses on the main SHA.
- Live readback of ruleset `24888106` still shows active `refs/heads/main`, PR/squash-only, strict seven contexts, resolved review threads, deletion/non-fast-forward protection, and no bypass actors. Sanitized exact readback is stored alongside this lock.
- Live GitHub `production` environment readback still shows protected-branch deployments, no administrator bypass, and the verified account ID variable. No Cloudflare token is configured or read, no Worker has been created, and no deployment has occurred.
- The only main delta since initial branch creation was the three additive M05 P1-C proposal documents; this deployment candidate does not change or implement those proposals.

## Commercial rights gate readback · 2026-10-17

- Issue #72 is `closed`, last updated `2026-10-16T22:20:11Z`. Its newest comment is ID `6225569671`, authored by `KayzenRoot` at `2026-10-16T22:03:52Z`.
- That comment records `COINBLINK_NAME_COMMERCIAL_CLEARANCE=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, and `M01_DONE=false`. Closing the tracking issue did not clear the rights obligation.
- Sanitized readback is stored in `.engineering/evidence/CB-CF-MAIN-ONLY-001/rights-gate-readback.json`. The workflow fails closed until the latest Owner decision explicitly clears rights and links to HTTPS evidence. This implementation does not change legal status.
- Rights-gate code and negative tests remain within this Work Order's path allowlist. `authorizedToMerge=false` remains unchanged.
