# CB-CF-MAIN-ONLY-001 · Implementation Evidence

**Evidence state:** local implementation candidate; no production deployment. Update this file only with evidence for the exact PR HEAD before requesting Owner review.

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
- GitHub `production` environment created on 2026-10-17 with `can_admins_bypass=false`, `protected_branches=true`, `custom_branch_policies=false`, and no wait timer. Its [`environment settings/API record`](https://api.github.com/repos/KayzenRoot/coinblink/environments/production) verifies this policy.
- `CLOUDFLARE_ACCOUNT_ID` is configured as a production environment variable and read back as `91aeaffe2456eff6bb9ce76ce177bb3f`. It is an account identifier, not a Cloudflare credential.
- Sanitized production environment API readback: [`production-environment-readback.json`](./production-environment-readback.json), SHA-256 `8bfdf34d9ff4736e3d0be413442427439be63f2405dd3b4467b6d59118f0c2cb`.
- GitHub main/source PR status, merge identity and tree readback: [`main-readback.json`](./main-readback.json), SHA-256 `19844ba3f7d056d68f6e16d7151ccdff15c92ed53a26fe8932e25c56ca895d9b`.
- [`production-credential-status.json`](./production-credential-status.json), SHA-256 `f479579d4af9eb05d6ec6c898bbc0205c56f2e4dd9f1d164c81c59ec5292adae`, records the environment account variable and confirms by secret-name metadata only that `CLOUDFLARE_API_TOKEN` is not configured. No secret value was requested, read, or added. The workflow cannot publish until the Owner later adds a least-privilege token as a secret in the `production` environment.
- Issue #72 is closed but its newest Owner comment (`6225569671`, `2026-10-16T22:03:52Z`) says `COINBLINK_NAME_COMMERCIAL_CLEARANCE=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`, and `M01_DONE=false`. Sanitized readback: [`rights-gate-readback.json`](./rights-gate-readback.json), SHA-256 `b93734167aca2bf9969f745d2887e332c433315ea2d0d403335e378462b1133b`. Issue closure is not rights clearance.
- Both preflight and the final main guard now paginate Issue #72 comments twice, compare full comment fingerprints to reject a changing read, choose the newest by `updated_at` (ID breaks equal-time ties), and require the latest comment to be authored by `KayzenRoot` with exactly one explicit authorization marker, `rightsReview=CLEARED`, `commercialPublicationAllowed=true`, and one HTTPS `rightsEvidence=` URL. Missing/malformed pages, changing comments, pending rights, duplicate markers, another author, or API errors fail closed. This process check does not determine legal rights.
- The first hosted SonarCloud analysis on interim HEAD `67ebb1577b884e801bed57f1069ab1fd90e1c118` failed the new-code C Security Rating. Its annotations identified the two `workflow_run` checkout jobs as not guarded against fork-originated source contexts, plus cognitive complexity and log-injection warnings in the new rights gate. The follow-up delta adds job-level push/main/same-repository guards before either checkout, splits the decision validator into small helpers, and bounds/sanitizes logged error text. The new SonarCloud analysis on the updated HEAD is required before this mitigation can be called verified. A pagination `await` warning remains intentional because page `n+1` depends on the previous page count.
- No Cloudflare Worker was created or deployed. No DNS, domains, routes, billing, Worker Builds, existing Preview, or GitHub ruleset settings were changed.

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

- [ ] Commit, push and create the dedicated draft PR; record exact branch HEAD and hosted seven required checks.
- [ ] Run hosted checks on the exact PR HEAD and reconcile any new review findings. In particular, verify the existing M01 visual fixture on hosted runners before calling validation complete.
- [ ] Owner reviews and explicitly authorizes squash merge of the exact PR HEAD.
- [ ] Owner adds the least-privilege Cloudflare API token to GitHub environment `production`.
- [ ] After protected merge, first automatic main run creates/deploys `coinblink-production`; verify exact SHA, `/health`, `/preview-status`, `/en`, same-origin asset, robots/noindex, security headers, and 404.

Candidate state: `DRAFT_PR_AWAITING_EXACT_HEAD_CI_AND_OWNER_REVIEW`; `authorizedToMerge=false`; not deployed. The current rights readback is pending and blocks production eligibility until an Owner/legal clearance is recorded in Issue #72.

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

The exact-head hosted checks for this correction are pending until the updated draft PR head is published. The existing full-suite limitation and prior 48/48 Playwright result above are historical evidence; the required hosted workflow must validate its full suite on the final exact HEAD. Issue #72 still blocks production eligibility; no Worker or deployment was created.
