# Evidence Bundle · CB-GOV-PARALLEL-001

**Status:** `GOVERNANCE_PROPOSAL / PENDING_EXACT_HEAD_CI_AND_INDEPENDENT_OWNER_REVIEW`
**Repository:** `KayzenRoot/coinblink`
**Base SHA:** `27015adc87caacabbed0e318f892644ce0473f10`
**Branch:** `codex/cb-gov-parallel-001`
**PR:** pending creation; head SHA will be read from GitHub and reported in the PR, not inferred from this file.
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
| GEF doctor | `npm run gef -- doctor` | REVIEW | CLI returned `ok=true`, checkpoint readable/valid, but repository observer returned `FINDING`, `GIT_DIRECTORY_NOT_A_DIRECTORY`, and `WORKING_TREE_NOT_OBSERVED` in this managed worktree; not counted as a clean repository PASS |
| GEF status | `npm run gef -- status` | REVIEW | checkpoint projection is valid and confirms M00/0%, but repository dirtiness is `UNKNOWN` and operator narrative is stale; not counted as a clean repository PASS |
| Dependency audit | `npm audit --audit-level=high` | PASS | zero vulnerabilities |
| Lint | `npm run lint` | PASS | exit 0, zero warnings |
| Typecheck | `npm run typecheck` | PASS | 35 files, zero errors/warnings/hints |
| Build | `npm run build` | PASS | Astro server build and no-session/no-binding assertion succeeded |
| Unit + build + Playwright | `npm test` | PASS | 71 unit tests; Astro server build and binding assertion passed; 7 Playwright tests passed at desktop `1536x864`, tablet `768x1024`, and mobile `390x844`, plus route/security/noindex checks |
| Docker smoke | `docker compose -p coinblink-cb-gov-parallel-001 up --build --detach --wait --wait-timeout 120`; smoke `/health`, `/preview-status`, `/en`, 404 and security/noindex headers on port `3015` | PASS | Docker Desktop was started locally. The daemon resumed pre-existing containers; none were stopped or modified. An unrelated project occupies port `3000`, so this isolated Compose project used `3015` and was then removed by its own project name. Health and preview JSON reported the candidate build SHA `7fd4e9a428cc97946e152bd7a24e9fdc87f40969`. |
| Fingerprint manifest | `node --test test/governance-parallel-plan.test.mjs` | PASS | 13/13 tests, including exact path set, Work Order allowlist, deletion/rename representation, HEAD/index/worktree hashes and source-lock fingerprints |

## Security and scope

No secrets, credentials, provider API calls, Cloudflare resource actions, billing changes, production deployment, GitHub protection changes, M18 token activity, branch deletion, force push, bypass, checkpoint promotion, self-review, or merge occurred. The P1 run's failure does not establish remote resource absence. The only proposed next stage after this PR is independent review and Owner audit; M00 P1 and global Issue #6 approval remain open.

## Exact-head GitHub results

Pending PR publication. Record the exact final PR HEAD, Ubuntu/Windows/Docker, SonarCloud, Socket, CodeRabbit, and independent review links here only after they are observed on that SHA. This proposal must stop before merge and must remain `NOT_ADOPTED` until normal Owner audit and GEF promotion.
