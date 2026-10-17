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
- No Cloudflare Worker was created or deployed. No DNS, domains, routes, billing, Worker Builds, existing Preview, or GitHub ruleset settings were changed.

## Local validation at the implementation candidate

Runtime used: Node `22.19.0`, npm `10.9.3`.

| Command | Result |
|---|---|
| `npm ci --ignore-scripts` | PASS; 461 packages installed; audit reported 0 vulnerabilities |
| `node --test test/cloudflare-production-policy.test.mjs test/cloudflare-production-eligibility.test.mjs test/cloudflare-production-main-current.test.mjs test/cloudflare-production-smoke.test.mjs test/cloudflare-production-workflow.test.mjs` | PASS; 24/24 |
| `npm run lint` | PASS; zero warnings |
| `npm run typecheck` | PASS; 141 files, zero errors/warnings/hints |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm test` | PARTIAL; 391/392 unit tests passed; one existing M01 visual fixture timed out waiting for readiness under concurrent full-suite load, so the script stopped before build and e2e stages |
| `node --test test/modules/CB-M01/visual-check.mjs` (isolated rerun) | PASS; 1/1; desktop/tablet/mobile screenshots, zero axe violations, no console/page errors or external requests |
| `npm run build` with production environment and exact main SHA | PASS; Astro Worker build completed; no SESSION, data, service or production bindings |
| `npm run test:e2e` with production environment and exact main SHA | PASS; 48/48 Playwright tests |
| `wrangler deploy --dry-run --config ./dist/server/wrangler.json --name coinblink-production` | PASS; Wrangler `4.149.0`; built 30 modules and read 32 static assets; output showed only `env.ASSETS`; dry-run exited without publishing |
| Parse `.github/workflows/cloudflare-production-main-only.yml` with installed YAML parser | PASS; only `workflow_run`, completed, branch `main` |

The deploy job also passes the exact main SHA as `EXPECTED_SHA` to the existing build/browser contract, in addition to `PUBLIC_BUILD_SHA`; the health endpoint test checks that exact SHA. This prevents a mismatched `local` expectation during production-mode browser verification.

The full suite did not pass cleanly on this Windows checkout: it reported 391 passing and one failure in existing `test/modules/CB-M01/visual-check.mjs`. The Astro fixture logged that it was ready after 4.5 seconds, while the readiness probe later exceeded its shared deadline during parallel full-suite load. The same fixture passed when rerun by itself. No M01 files were changed; test-generated edits to existing M01 evidence were restored to their clean pre-test bytes. The independent production build and all 48 browser tests then passed. The Wrangler dry-run used no Cloudflare API token, did not publish, and showed only the static `ASSETS` binding.

## Remaining exact-HEAD and activation gates

- [ ] Commit, push and create the dedicated draft PR; record exact branch HEAD and hosted seven required checks.
- [ ] Run hosted checks on the exact PR HEAD and reconcile any new review findings. In particular, verify the existing M01 visual fixture on hosted runners before calling validation complete.
- [ ] Owner reviews and explicitly authorizes squash merge of the exact PR HEAD.
- [ ] Owner adds the least-privilege Cloudflare API token to GitHub environment `production`.
- [ ] After protected merge, first automatic main run creates/deploys `coinblink-production`; verify exact SHA, `/health`, `/preview-status`, `/en`, same-origin asset, robots/noindex, security headers, and 404.

Candidate state: `CONFIG_PR_READY_AWAITING_OWNER_GO_OR_PROVIDER_AUTH`; `authorizedToMerge=false`; not deployed.
