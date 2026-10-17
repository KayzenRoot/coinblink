# CB-CF-MAIN-ONLY-001 · Implementation Evidence

**Evidence state:** updated Owner-authorized DEMO-only implementation candidate; production deployment has not yet occurred. Append current exact-HEAD evidence before reporting the site as live.

## Repository and base

- Repository: `KayzenRoot/coinblink`
- Remote: `https://github.com/KayzenRoot/coinblink.git`
- Branch: `codex/cb-cf-main-only-production`
- Initial branch base main SHA: `5cbb808ebcc052780ba7e4f426080ddb0ef62f64` (historical; PR #113 source head).
- Current verified base main SHA: `824b3dc46825e3fa053c715b1765b70042c7981b`; tree SHA `9a75e41f00410772f2d345ad4eb7e9eacda178b2`.
- Freshness delta: main advanced through merged PR #100, which added three M05 P1-C proposal-only documents. Candidate synchronized by regular merge commit `b1630efe919208277d676d3067460fa0c4db3c50`; no out-of-scope source files were edited.
- Initial worktree: clean. No files in the original research checkout were used or changed.

## Main, ruleset, and exact check evidence

- Active ruleset: [`coinblink-main-governance`](https://github.com/KayzenRoot/coinblink/rules/24888106), ID `24888106`, scoped only to `refs/heads/main`, with no bypass actors.
- Sanitized full ruleset JSON live readback: [`ruleset-readback.json`](./ruleset-readback.json), SHA-256 `fd96f0c5f99710028d09c0c09df3eca9ed5f34544c56db314d15b8c50fa09fa4`.
- Preserved protections: PR required; squash-only; strict required checks; review threads resolved; branch deletion and non-fast-forward prohibited; zero independent approvers under the Owner's single-admin model.
- Exact required context names preserved:
  1. `M00 and GEF (ubuntu-24.04)`
  2. `M00 and GEF (windows-2022)`
  3. `Docker Compose smoke (Ubuntu)`
  4. `SonarCloud Code Analysis`
  5. `Socket Security: Pull Request Alerts`
  6. `Socket Security: Project Report`
  7. `CodeRabbit`
- Current main `824b3dc46825e3fa053c715b1765b70042c7981b` has five successful check contexts: Ubuntu GEF, Windows GEF, Docker Compose smoke, SonarCloud, and Socket Project Report. The [Ubuntu GEF](https://github.com/KayzenRoot/coinblink/actions/runs/39028821243/job/117385021777) and [Windows GEF](https://github.com/KayzenRoot/coinblink/actions/runs/39028821243/job/117385021857) jobs are on this exact SHA; SonarCloud is at [the main dashboard](https://sonarcloud.io/dashboard?id=KayzenRoot_coinblink&branch=main), and Socket Project Report is at [the verified report](https://socket.dev/dashboard/org/nexlabs/sbom/93e52689-3aa3-4713-845c-7cabc42dc8b2).
- Main is the squash merge of [PR #100](https://github.com/KayzenRoot/coinblink/pull/100), whose head SHA is `366bcee4627ae73c7134833d68200ea51e834eb3`. That source head has all seven required contexts successful, including Socket PR Alerts and the CodeRabbit status, visible in [PR #100 checks](https://github.com/KayzenRoot/coinblink/pull/100/checks). Both the PR head and main commit have tree SHA `9a75e41f00410772f2d345ad4eb7e9eacda178b2`.
- Therefore runtime eligibility checks 5/5 on the exact main commit and 7/7 on the unique merged source PR head, then requires exact tree SHA equality. It does **not** assert that seven check-run records exist on one main commit SHA. CodeRabbit is treated as its required status context only, not substantive security review.

## Cloudflare and GitHub environment readbacks

- Authenticated dashboard account: `91aeaffe2456eff6bb9ce76ce177bb3f`, account subdomain `kayzendev.workers.dev`.
- Read-only Workers inventory showed the existing `coinblink-m00-preview` Worker and no production Worker or Git-connected Workers Builds pipeline. The preview lane and its GitHub environment were left unchanged.
- Selected future production target: Worker `coinblink-production`; URL `https://coinblink-production.kayzendev.workers.dev`; no custom domain or route.
- GitHub `production` environment created on 2026-10-17. Latest readback at 2026-10-17T15:09Z shows `can_admins_bypass=false`, `protected_branches=false`, `custom_branch_policies=true`, with the sole custom deployment branch policy `main`. Its [`environment settings/API record`](https://api.github.com/repos/KayzenRoot/coinblink/environments/production) verifies this policy.
- `CLOUDFLARE_ACCOUNT_ID` is configured as a production environment variable and read back as `91aeaffe2456eff6bb9ce76ce177bb3f`. It is an account identifier, not a Cloudflare credential.
- Sanitized production environment API readback: [`production-environment-readback.json`](./production-environment-readback.json), SHA-256 `afb6e28177b6b986078418926b5bd97a60c6c5534194f197b0488914f33cbb5a`.
- GitHub main/source PR status, merge identity and tree readback: [`main-readback.json`](./main-readback.json), SHA-256 `19844ba3f7d056d68f6e16d7151ccdff15c92ed53a26fe8932e25c56ca895d9b`.
- [`production-credential-status.json`](./production-credential-status.json), SHA-256 `2ec74807010f355cfc152ac805a90940df8d2fbc6ad66fca8cfa66b4d3f3c406`, records by metadata only that `CLOUDFLARE_API_TOKEN` is present in the `production` environment. Its value was not read or written to evidence. Its confirmed scope is account-wide Workers Scripts Write; compromise could alter scripts across Workers in that Cloudflare account.
- Issue #72 is closed but its newest Owner comment (`6225569671`, `2026-10-16T22:03:52Z`) says `COINBLINK_NAME_COMMERCIAL_CLEARANCE=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, and `M01_DONE=false`. Sanitized readback: [`rights-gate-readback.json`](./rights-gate-readback.json), SHA-256 `b93734167aca2bf9969f745d2887e332c433315ea2d0d403335e378462b1133b`. Issue closure is not rights clearance.
- Historical candidate code required an Owner-authored commercial-rights clearance in Issue #72. The Owner directly changed that operating instruction on 2026-10-17: the protected-main deployment is authorized for DEMO_ONLY, while `commercialPublicationAllowed=false`, rights pending, and `M01_DONE=false` remain untouched. The current workflow uses the exact repository variable `COINBLINK_PUBLIC_DEMO_DEPLOYMENT=AUTHORIZED_DEMO_ONLY` at preflight and immediately before deployment; it hard-codes the commercial flag to false and no longer reads Issue #72 as a deployment prerequisite.
- The first hosted SonarCloud analysis on interim HEAD `67ebb1577b884e801bed57f1069ab1fd90e1c118` failed the new-code C Security Rating. Its annotations identified the two `workflow_run` checkout jobs as not guarded against fork-originated source contexts, plus cognitive complexity and log-injection warnings in the new rights gate. The follow-up delta adds job-level push/main/same-repository guards before either checkout, splits the decision validator into small helpers, and bounds/sanitizes logged error text. The new SonarCloud analysis on the updated HEAD is required before this mitigation can be called verified. A pagination `await` warning remains intentional because page `n+1` depends on the previous page count.
- As of the latest read-only Cloudflare inventory before the updated PR is merged, no production Worker had been created or deployed. No DNS, custom domains/routes, billing, Worker Builds, existing Preview, or GitHub ruleset settings were changed.

## Local validation at the implementation candidate

The initial candidate validation used Node `22.19.0`, npm `10.9.3`. The final correction revalidation used the installed Node `22.23.3`, npm `10.9.9` (the workflow remains pinned to Node `22.19.0`). The shell's default `node` is `26.4.0`; final tests were explicitly launched through the Node 22.23.3 installation.

| Command | Result |
|---|---|
| `npm ci --ignore-scripts` | PASS; 461 packages installed; audit reported 0 vulnerabilities |
| `node --test test/cloudflare-production-policy.test.mjs test/cloudflare-production-eligibility.test.mjs test/cloudflare-production-main-current.test.mjs test/cloudflare-production-smoke.test.mjs test/cloudflare-production-workflow.test.mjs` | PASS; 24/24 |
| Focused production tests after the rights-gate delta (Node 22.23.3) | PASS; 32/32, including stable latest-comment pagination, pending/missing/non-Owner clearance, changing comments, log-injection rejection, duplicate markers, HTTP evidence rejection, and the final rights recheck |
| Live Issue #72 gate read through the existing GitHub CLI session | BLOCKED as expected; the actual latest Owner comment lacks the three required authorization markers and HTTPS evidence URL; no token or comment body was printed by the check |
| `npm run lint` (Node 22.23.3) | PASS; zero warnings |
| `npm run typecheck` (Node 22.23.3) | PASS; 141 files, zero errors/warnings/hints |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm test` (Node 22.23.3; before final stable-comment-read hardening) | PARTIAL; 396/397 passed; the existing M01 visual readiness test timed out under concurrent full-suite load; GEF tests passed; npm stopped before its build/e2e phases |
| `node --test test/modules/CB-M01/visual-check.mjs` (isolated rerun) | PASS; 1/1; desktop/tablet/mobile screenshots, zero axe violations, no console/page errors or external requests |
| `npm run build` with production environment and exact main SHA (Node 22.23.3) | PASS; Astro Worker build completed; no SESSION, data, service or production bindings |
| `npm run test:e2e` with production environment and exact main SHA (Node 22.23.3) | PASS; 48/48 Playwright tests |
| `wrangler deploy --dry-run --config ./dist/server/wrangler.json --name coinblink-production` (Node 22.23.3) | PASS; Wrangler `4.149.0`; built 30 modules and read 32 static assets; output showed only `env.ASSETS`; dry-run exited without publishing |
| Parse `.github/workflows/cloudflare-production-main-only.yml` with installed YAML parser | PASS; only `workflow_run`, completed, branch `main` |

The deploy job also passes the exact main SHA as `EXPECTED_SHA` to the existing build/browser contract, in addition to `PUBLIC_BUILD_SHA`; the health endpoint test checks that exact SHA. This prevents a mismatched `local` expectation during production-mode browser verification.

The full-suite run on Node 22.23.3, before the final stable-comment-read hardening, reported 396/397 passing; one existing `test/modules/CB-M01/visual-check.mjs` run timed out waiting for its local Astro fixture under concurrent full-suite load. The fixture logged readiness, then the bounded probe exceeded its shared deadline. The previous isolated visual rerun passed. A first full-suite attempt through the machine's default Node 26.4.0 failed the GEF runtime-major assertion; rerunning with Node 22.23.3 made the GEF tests pass. The final hardening is limited to the GitHub rights-gate scripts and is covered by the 30/30 focused production test run plus lint/typecheck. The exact workflow runtime remains pinned to 22.19.0 on hosted runners. No M01 source was changed; generated edits to M01 evidence were restored. Separate production build, all 48 browser tests, and Wrangler dry-run passed under Node 22.23.3. The dry-run used no Cloudflare API token, did not publish, and showed only the static `ASSETS` binding.

## Remaining exact-HEAD and activation gates

- [x] Owner demo authorization variable is read back as `AUTHORIZED_DEMO_ONLY`; `commercialPublicationAllowed=false` remains hard-coded.
- [x] Cloudflare token secret is present by name in the production environment; its secret value was not read. Its account-wide Workers Scripts Write scope remains a recorded risk.
- [ ] Publish the validated correction to the existing PR #117 branch and record its final exact HEAD.
- [ ] Verify all seven required hosted PR contexts on that exact HEAD; do not merge while any required context is pending or failed.
- [ ] Complete the protected squash merge after the exact-head checks pass, then verify the automatic main-only deployment and endpoint smoke for that exact main SHA.

Candidate state: `LOCAL_CORRECTION_VALIDATED_AWAITING_PR_PUBLICATION`; no production deployment has occurred. The Owner authorized the main-only DEMO deployment path, but the PR remains subject to the existing strict checks and protected squash-only ruleset. Issue #72 remains pending for commercial rights and does not grant commercial clearance.

## SonarCloud correction delta · 2026-10-17

The preceding SonarCloud run on PR head `9843457dcb40827601a0fef28307fde2c9239299` failed its Quality Gate with a B Security Rating. Its relevant findings were a super-linear regular expression in the production HTML asset scan and log injection through exception text. The other annotations concerned sequential pagination/retry awaits and a re-export style suggestion; those are not security findings and the pagination/retry order is intentional.

Corrections in this delta:

- Replaced the `robots.txt` allow/disallow expressions with a forward-only line parser, retaining the root `Allow: /` requirement and rejecting root `Disallow: /` without backtracking.
- Preflight and smoke errors now emit fixed messages without exception text. The successful preflight log is also constant, so API-provided fields are not interpolated into logs. Tests inject CR/LF workflow data and malformed Worker URLs and prove those values are absent from logs.
- Added a 64 KB robots directive regression case while preserving the existing same-origin Astro asset checks.

Local validation on Node `22.23.3` after the correction:

| Command | Result |
|---|---|
| `node --test test/cloudflare-production-policy.test.mjs test/cloudflare-production-eligibility.test.mjs test/cloudflare-production-main-current.test.mjs test/cloudflare-production-smoke.test.mjs test/cloudflare-production-workflow.test.mjs` | PASS; 34/34 |
| `npm run lint` | PASS; zero warnings |
| `npm run typecheck` | PASS; 141 files, zero errors/warnings/hints |
| `npm run build` | PASS; Astro Worker build completed and no SESSION, data, service, or production bindings were present |
| `git diff --check` | PASS |

The exact-head hosted checks for this correction are pending until the updated PR head is published. The existing full-suite limitation above is historical and is superseded by the successful full-suite result in the current validation delta below. Issue #72 remains pending for commercial rights but does not block the Owner-authorized DEMO deployment path. No Worker or deployment had been created at the time of this readback.

## Owner main-deploy authorization and current validation · 2026-10-17

The Owner explicitly authorized automatic Cloudflare production deployment for every change integrated into GitHub `main`. The exact Portuguese authorization is preserved in [`owner-demo-deployment-authorization.json`](./owner-demo-deployment-authorization.json). This authorizes the bounded public demo deploy path after its checks and protected merge; it does not change the commercial-rights decision.

Current authorization boundary:

- Deployment scope is `DEMO_ONLY`, from a successful GEF `push` run on same-repository protected `main` only.
- The latest final guard checks the exact current main SHA immediately before Wrangler. PR, fork, non-main, stale, failed, and ambiguous source events are rejected.
- `commercialPublicationAllowed=false`, Issue #72 `PENDING_OWNER_OR_LEGAL`, and `M01_DONE=false` are unchanged. No rights clearance is inferred.
- No paid plan or feature was activated. The sanitized authenticated dashboard readback is [`cloudflare-usage-readback.json`](./cloudflare-usage-readback.json); the displayed Workers plan name could not be confirmed because its details page remained loading.

Latest local validation:

| Command / check | Result |
|---|---|
| Negative regression tests against the former commercial-rights-only gate | Expected RED: 5 failures, demonstrating that the old implementation blocked the Owner-authorized demo flow |
| Focused Cloudflare deployment tests on Node `22.23.3` | PASS; 33/33 |
| Full `npm test` on Node `22.23.3` | PASS; 401 unit tests, build, and 48/48 Playwright tests; process exited 0 |
| `npm run lint` on Node `22.23.3` | PASS; zero warnings |
| `npm run typecheck` on Node `22.23.3` | PASS; 141 files, zero errors/warnings/hints |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run build` on Node `22.23.3` | PASS; Astro Cloudflare Worker built and the no-session-binding guard passed |
| `wrangler deploy --dry-run --config ./dist/server/wrangler.json --name coinblink-production` | PASS; Wrangler `4.149.0`, 30 modules, 32 static assets, only `env.ASSETS`; dry-run exited without publishing and used no token |
| Current-tree focused tests, lint, typecheck, audit, build and Wrangler dry-run | PASS; focused 33/33, lint clean, typecheck 141 files clean, audit 0 vulnerabilities, build and dry-run successful |

The dashboard showed 50 requests of the displayed 100,000 daily quota, 0 Workers build minutes, `$0.00` billable usage, and no billable usage yet in the current period. This is a point-in-time observation, not a cost guarantee if plan, resources, or usage change. No production Worker existed at that readback. The existing Preview Worker was left untouched.

The correction started from PR #117 HEAD `2f5917e0e6fc444fe76d12af58dd97a109575a74`, based on current main `824b3dc46825e3fa053c715b1765b70042c7981b`. The final correction HEAD and its hosted check links are recorded in the same PR after publication.

Sanitized evidence hashes for the authorization and Cloudflare readbacks:

| Evidence file | SHA-256 |
|---|---|
| [`owner-demo-deployment-authorization.json`](./owner-demo-deployment-authorization.json) | `09f9de6bdbed31bc213734aaefb15551eaf156e0632e9855056ffa333013d723` |
| [`cloudflare-usage-readback.json`](./cloudflare-usage-readback.json) | `88832938d884f36d9f5afc39603e329309ac769523559cdb4c7c5978aa3b1c4a` |
| [`production-environment-readback.json`](./production-environment-readback.json) | `afb6e28177b6b986078418926b5bd97a60c6c5534194f197b0488914f33cbb5a` |
| [`production-credential-status.json`](./production-credential-status.json) | `2ec74807010f355cfc152ac805a90940df8d2fbc6ad66fca8cfa66b4d3f3c406` |
