# CB-NEWS-P0-SOURCE-GATE-001 | Evidence Bundle

**Work Order:** CB-NEWS-P0-SOURCE-GATE-001  
**Risk:** STANDARD | **Stage:** TEST_FIRST_RED_PENDING | **Authority:** LOCAL, pure deterministic source eligibility only  
**Repository:** KayzenRoot/coinblink  
**Locked main/base:** `e6620609ab95fdf75e20c3bf3132a829bf43af9c`  
**Proposed branch:** `feat/cb-news-p0-source-gate-001`  
**Date:** 2026-10-24  
**Status:** DRAFT_ONLY / NO_MERGE / NO_DEPLOY / NO_LIVE / NO_PUBLICATION

## Preflight and Context Lock

Before writing, repository main was independently queried at the exact locked SHA. Non-truncated recursive tree checked; all three target paths were absent. All **14 open PRs** and each PR's complete changed-path list were consulted. Direct collision count **0**. PR #114 has adjacent, different M03 paths; PR #233 remains separate and Draft (head `fe3bb5efc9edc7e35c76eddb51eda2fb7b073ebf`). No authority to update the main, any other PR or checkpoints.

| Critical source on locked main | Git blob SHA |
| --- | --- |
| `AGENTS.md` | `93a9380dd0645e0beea896bb4ad50278a8eaf846` |
| `docs/CHAT_WORKFLOW_AND_HANDOFF.md` | `c9bba8326fb2a12e094ca8dde20d055126a5272e` |
| `docs/architecture/contracts/CB-M03.md` | `d2e5b92ba0eace6f109a252e9e4e264758066b7e` |
| `src/modules/CB-M03/source-lab.mjs` | `21ae2862b1f2c6f0b8bc58f58fd25cc87573c311` |
| `src/modules/CB-M03/source-transfer.mjs` | `3dea7b687252c1eabb491a7c85bfd4ebe6bd0224` |
| `src/modules/CB-M02/news-workbench.mjs` | `ec48cc768916c1d98097251234cdac46010cac6a` |
| `src/modules/CB-M07/social-preview.mjs` | `d1f57c7896bc156f827d95929e1fc23c7a602279` |
| `src/pages/admin/[...route].js` | `91a90f33c591616952d5b767cf7bed6c6cf57c91` |
| `wrangler.jsonc` | `980a4af6a5c3cd40a37797ad53d27530a54bbbe2` |

## Scope and source authority

Only:
1. `test/modules/CB-M03/source-eligibility.test.mjs` (first)
2. `src/modules/CB-M03/ingestion/source-eligibility.mjs` (after observed RED)
3. `.engineering/evidence/CB-NEWS-P0-SOURCE-GATE-001/EVIDENCE-BUNDLE.md` (this file)

Source precedence: active build-first `AGENTS.md` / `docs/BUILD_FIRST.md` / `docs/CHAT_WORKFLOW_AND_HANDOFF.md`; existing M03 producer and M02/M05 contracts are advisory technical constraints, not permission to activate historical GEF. No pre-existing source, route, tests, workflow, configs or lockfiles to change.

Expected result: pure and deterministic candidate review admission, from server-trusted source allowlist, with explicit rights reference. Never assume candidate-supplied licensing/owner approval; `PRIVATE_REVIEW_ONLY` output has `publiclyUsable=false`, `canPublish=false`, `canPostToX=false`. No actual feeds, licenses, identities, API tokens or cloud resources are introduced. Exactly bounded validation and idempotency identity.

## RED → GREEN ledger

- **RED commit:** `0dfb32b4b40f1ea6fbe730a57ce2d5f71fa80293` | tests-only, implementation module absent.
- **RED hosted CI:** PENDING; a failing lint or installation is NOT counted as test-first RED.
- **GREEN implementation:** NOT_RUN.
- **Relevant tests:** NOT_RUN.
- **Lint / typecheck / build:** NOT_RUN.
- **CI (required & applicable checks on exact head):** NOT_RUN.
- **SonarCloud, Socket PR Alerts / Project Report, Gitleaks:** NOT_RUN.
- **Diff + exact-head read-back:** NOT_RUN.
- **Review threads / required ruleset:** NOT_VERIFIED.
- **Coverage measurement:** NOT_MEASURED; no invented percentages.

## Mandatory review, errors and STOP

No secret, remote call, RSS/API invocation, D1, X provider, cloud or production. Do not change PR #233, any other PR, main, ruleset or checkpoint. If base SHA or critical blobs change, or a new target collides, mark STALE and stop. RED must show expected missing-module failure on hosted Node suite before adding module; GREEN must demonstrate this exact test path included in `ci-quality.yml` glob `test/modules/CB-M03/*.test.mjs`. If required gates fail: CORRECTION REQUIRED or BLOCKED. No claims of production readiness.

**Final verdict:** PENDING.
