# Evidence Bundle · CB-GOV-PARALLEL-001

**Status:** `GOVERNANCE_PROPOSAL / OWNER_REAUDIT_PENDING`
**Repository:** `KayzenRoot/coinblink`
**Base SHA:** `27015adc87caacabbed0e318f892644ce0473f10`
**Branch:** `codex/cb-gov-parallel-001`
**PR:** `#42`; head SHA will be read from GitHub and reported in the PR, not inferred from this file.
**GEF:** Bootstrap 1.1.2, source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.

## What this evidence covers

- Exactly 19 existing modules and their existing issue mapping, proposed Issue #6 waves, conservative dependency reconciliation, and per-module candidate Work Order IDs.
- Proposal-only contract seam and consumer register for all modules; no runtime schema, shared package, application code, module admission, or migration is created.
- Exclusive module path templates, case-insensitive collision checks, steward-reserved paths, future branch/worktree allocation preflight, local slot scheduling, Context Lock, tests, Evidence Bundle, and serialized merge policy.
- Exact source fingerprints at the immutable base and Issue body SHA-256 snapshots. See [Context Lock](../context-locks/CB-GOV-PARALLEL-001.md).
- No-op checkpoint proposal. See [Checkpoint Delta](CB-GOV-PARALLEL-001-CHECKPOINT-DELTA.md).

## Verified external baseline

- `main` was `27015adc87caacabbed0e318f892644ce0473f10`; exact-base run [#37968442143](https://github.com/KayzenRoot/coinblink/actions/runs/37968442143) passed Ubuntu, Windows and Docker Compose jobs.
- PR [#41](https://github.com/KayzenRoot/coinblink/pull/41) was open/non-draft, base `27015adc87caacabbed0e318f892644ce0473f10`, head `d9bc2e2073c4071ff3fcda9e341cf05872e830e3`, with six successful CI checks and CodeRabbit status SUCCESS. `reviewDecision` is empty; the formal CodeRabbit review covers an earlier commit, while the Owner exact-head review is COMMENTED. No merge was performed.
- Preview workflow run [#37968696916](https://github.com/KayzenRoot/coinblink/actions/runs/37968696916) on the exact main SHA passed local preflight and failed at `Create isolated Worker Preview`. URL verification and cleanup were skipped; absence of a partial resource is not proven. No Cloudflare API call was made for this Work Order.
- GitHub API reported no rulesets and no branch protection on `main` at capture. Required protected reviews/checks remain a prerequisite to adoption.
- Issue #6 and all 19 module issue bodies are open; their body hashes and update timestamps are frozen in the Context Lock. Wave/DAG text is proposal input, not an approved source change.

## Local validation results

Commands below were run with Node 22.19.0 and npm 10.9.3 through the pinned local package tool. A failed, partial or skipped command remains explicit. The GitHub PR check rollup will be the authority for final exact-head CI.

| Check | Command | Result | Evidence |
|---|---|---|---|
| Runtime | `node --version`; `npm --version` | PASS | Node `22.19.0`; npm `10.9.3` |
| Dependency install | `npm ci --ignore-scripts` | PASS | 437 packages installed; npm reported zero vulnerabilities |
| GEF doctor | `npm run gef -- doctor` | REVIEW | Managed worktree first reported `GIT_DIRECTORY_NOT_A_DIRECTORY`/`WORKING_TREE_NOT_OBSERVED`; a normal clone at candidate HEAD `7661cd72a2321efe61231f8fe0c6285be7a858ef` reported repository observable and toolchain healthy. GEF security remains `REVIEW` for unverified dependency provenance and non-immutable GitHub ref. |
| GEF status | `npm run gef -- status` | REVIEW | Normal clone reported a clean, observed worktree and valid checkpoint (`M00_ADMITTED`, 0%); operator narrative is stale and drift baseline absent. Canonical files were not changed to clear these findings. |
| Dependency audit | `npm audit --audit-level=high` | PASS | zero vulnerabilities |
| Lint | `npm run lint` | PASS | exit 0, zero warnings |
| Typecheck | `npm run typecheck` | PASS | 35 files, zero errors/warnings/hints |
| Build | `npm run build` | PASS | Astro server build and no-session/no-binding assertion succeeded |
| Unit + build + Playwright | `npm test` | PASS | 71 unit tests; Astro server build and binding assertion passed; 7 Playwright tests passed at desktop `1536x864`, tablet `768x1024`, and mobile `390x844`, plus route/security/noindex checks |
| Docker smoke | Docker Compose isolated project on `127.0.0.1:3015`; verify `/health`, `/preview-status`, `/en`, 404 and security/noindex headers | PASS | Exact candidate SHA `7661cd72a2321efe61231f8fe0c6285be7a858ef` returned matching build SHA. Docker Desktop resumed pre-existing containers; none were stopped or modified. Another project owns port `3000`, so the smoke used `3015`; only the isolated CoinBlink test project was then removed. |
| Fingerprint manifest | `node --test test/governance-parallel-plan.test.mjs` | PASS | 13/13 tests, including exact path set, Work Order allowlist, deletion/rename representation, HEAD/index/worktree hashes and source-lock fingerprints |

## Security and scope

No secrets, credentials, provider API calls, Cloudflare resource actions, billing changes, production deployment, GitHub protection changes, M18 token activity, branch deletion, force push, bypass, checkpoint promotion, self-review, or merge occurred. The P1 run's failure does not establish remote resource absence. The only proposed next stage after this PR is independent review and Owner audit; M00 P1 and global Issue #6 approval remain open.

## Exact-head GitHub results at initial PR publication

PR [#42](https://github.com/KayzenRoot/coinblink/pull/42) initially ran at HEAD `15da88eff36d601b41ad0b5d555e84e9a002018c` against base `27015adc87caacabbed0e318f892644ce0473f10`:

- Ubuntu GEF validation [passed](https://github.com/KayzenRoot/coinblink/actions/runs/37992382530/job/114030674688).
- Windows GEF validation [passed](https://github.com/KayzenRoot/coinblink/actions/runs/37992382530/job/114030624213).
- Docker Compose smoke [failed](https://github.com/KayzenRoot/coinblink/actions/runs/37992382530/job/114029600513); a retry on the same SHA [failed again](https://github.com/KayzenRoot/coinblink/actions/runs/37992382530/job/114030622161) because Docker Hub returned HTTP 429 while resolving the public `node:22.19.0-bookworm-slim` manifest. Exact-SHA local Docker smoke passed; no CI gate was bypassed.
- [SonarCloud](https://sonarcloud.io/dashboard?id=KayzenRoot_coinblink&pullRequest=42), [Socket Project Report](https://socket.dev/dashboard/org/nexlabs/sbom/8580ec7b-8f74-4793-8974-1951a96c1c18), and [Socket PR Alerts](https://socket.dev) passed.
- CodeRabbit was still `PENDING` and no independent Owner review had been recorded at capture.

## Follow-up exact-head GitHub results

At candidate HEAD `a79e8ff74b3d831da048da0d5856f16c7077c7e5`, [run #37993107707](https://github.com/KayzenRoot/coinblink/actions/runs/37993107707) confirmed:

- Ubuntu GEF [passed](https://github.com/KayzenRoot/coinblink/actions/runs/37993107707/job/114032100579) and Windows GEF [passed](https://github.com/KayzenRoot/coinblink/actions/runs/37993107707/job/114032100260).
- Docker Compose smoke [failed](https://github.com/KayzenRoot/coinblink/actions/runs/37993107707/job/114032100598); its same-SHA retry [failed again](https://github.com/KayzenRoot/coinblink/actions/runs/37993107707/job/114032754062) when `auth.docker.io` returned HTTP 504 obtaining a Docker Hub token. This is a remote registry availability/rate-limit blocker; local exact-SHA Docker smoke passed.
- SonarCloud and both Socket checks passed on that head.
- CodeRabbit still had only an in-progress comment reviewing the initial head; no completed CodeRabbit or Owner review was recorded.

The current evidence/fingerprint-only commit requires a fresh exact-head CI rollup. Keep the proposal `NOT_ADOPTED`; do not merge until the Docker pull constraint is resolved, all exact-head checks pass, and normal Owner audit/adoption occurs.

## Correction delta for Owner review

The Owner and CodeRabbit reviewed PR #42 at `a893cb24ced93567eeea5e546c770b26924b793f` ([CodeRabbit review](https://github.com/KayzenRoot/coinblink/pull/42#pullrequestreview-5475572142), [Owner audit](https://github.com/KayzenRoot/coinblink/pull/42#pullrequestreview-5475642010)). The review identified five actionable documentation/test findings: remove the published machine-specific worktree path from the Context Lock, correct the PR identity above, align sequence-based branch/worktree patterns on `{woSuffix}`, make global migration-history ownership explicit, and normalize complete local/remote Git refs before allocation collision checks. The older path is removed from the current Context Lock; immutable Git history was not rewritten. The CodeRabbit docstring-coverage advisory is not backed by a configured ESLint, package, or CI gate; this delta adds concise JSDoc to the new branch-ref helpers where it explains their behavior.

At the reviewed HEAD, the exact-head Docker job [failed](https://github.com/KayzenRoot/coinblink/actions/runs/37993642014/job/114034761054) before building the image because Docker Hub token acquisition returned HTTP 504 for the existing pinned `node:22.19.0-bookworm-slim` image. Ubuntu and Windows passed on the same SHA. Docker image source, version, and verification policy remain unchanged; bounded retries are required after this correction is pushed. No check is disabled or weakened.

Local validation was completed on correction HEAD `fa3b6074bf938f5c604d453cbc6cbe09607e34eb`, using Node `22.23.3` (within the declared `>=22.19.0 <23` engine range) and npm `10.9.3`:

| Check | Result | Evidence |
|---|---|---|
| `npm ci --ignore-scripts` | PASS | 437 packages installed; zero vulnerabilities |
| `npm audit --audit-level=high` | PASS | Zero reported vulnerabilities |
| `npm run lint` | PASS | ESLint exited 0 with no warnings |
| `npm run typecheck` | PASS | 35 files; zero errors, warnings, or hints |
| `npm run build` | PASS | Astro server build and no-session/no-binding assertion passed |
| `npm run test:e2e` | PASS | 7/7 Playwright tests, including desktop, tablet, mobile, routes and security headers |
| Focused correction regressions | PASS | 4/4 tests for sanitized Context Lock/PR identity, WO-002 patterns, local/remote collisions, case handling, multiple remotes, and remote HEAD symrefs |
| Full `npm test` and fingerprint manifest | PASS | 73/73 unit tests, Astro build and no-binding assertion passed, 7/7 Playwright tests; fingerprint HEAD/index/worktree assertions passed. |
| GEF doctor/status | REVIEW | In a normal clone at this SHA, both commands returned `ok=true`, repository observation was `HEALTHY` / `CLEAN` / `OBSERVED`, and the checkpoint was valid. GEF security remains `REVIEW` for dependency provenance and non-immutable GitHub ref; status retains the stale operator narrative and absent drift baseline findings. |
| Docker local smoke | PASS | Isolated Compose project on `127.0.0.1:3015`; exact build SHA matched; `/health`, `/preview-status`, `/en`, 404, `noindex` and `nosniff` passed. Docker pulled the unchanged pinned `node:22.19.0-bookworm-slim` digest `sha256:4a4884e8a44826194dff92ba316264f392056cbe243dcc9fd3551e71cea02b90`. Only this isolated project was removed; unrelated containers were left running. |
| Exact-head GitHub checks for the final pushed HEAD | Live gate | Read the current PR #42 check rollup and CodeRabbit review from GitHub; this Evidence Bundle does not infer an unpublished or untested SHA. |

## Follow-up CodeRabbit determinism correction

The CodeRabbit final-head review of `3b2c7898dbb0fa2a00ee96a0594bc204335dfed3` identified one major issue: a generic future-Work-Order test read live local/remote refs from whichever checkout ran the suite, so later module branches could make it fail nondeterministically. The correction removes that live-checkout assertion. A focused regression now creates a disposable local Git repository with a local branch, `origin` and `upstream` tracking refs, and a symbolic `origin/HEAD`; it verifies exact enumeration, case-insensitive collision refusal, and acceptance of a distinct allocation without network access. The test cleans up its temporary repository.

Final local validation and exact-head GitHub results for this correction are recorded after the refreshed fingerprint manifest is committed. The canonical Context Lock sources and checkpoint remain unchanged; the checkpoint delta is still only proposed.
