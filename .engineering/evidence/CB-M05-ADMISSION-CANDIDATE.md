# CB-M05 scoped-P0 admission · proposed checkpoint delta

## M01 predecessor merge readback and M05 branch synchronization

PR #56 was merged normally at the Owner-authorized exact head `c398044ad9e07220c6641623de9f8aff144891f7`; resulting canonical main merge SHA is `c4ba069f1dfaddc8273001950805e8a18125db66`. Post-merge workflow [#38097469568](https://github.com/KayzenRoot/coinblink/actions/runs/38097469568) completed successfully on that merge SHA: Ubuntu/GEF, Windows/GEF, Docker Compose smoke, SonarCloud, and Socket Project Report all SUCCESS. The PR-only Socket Alerts context was not emitted on the main push and is not claimed as a post-merge check.

Canonical checkpoint readback on `c4ba069f1dfaddc8273001950805e8a18125db66`: M00 COMPLETE, `completedThroughModule=CB-M00`, 5%; CB-M01 ADMITTED; CB-M05 and M02-M17 NOT_ADMITTED; CB-M18 FUTURE_NOT_ADMITTED; 19 module IDs. Original Golden files remain unchanged and verified from the main Git tree: home JPEG 1536×864, 532365 bytes, SHA-256 `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8`; logo JPEG 1179×1040, 121728 bytes, SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`.

The existing PR #57 branch `codex/cb-m05-p0-admission-001` at pre-sync SHA `68fa072ba70c5deb479cc1bbd403686278baa92f` was synchronized with the actual new main by a normal merge. This candidate checkpoint retains the M01 proof from canonical main and separately records M05 as effective only after its own reviewed, Owner-authorized merge. No module code or local module agent was started.

**Current canonical main after M01 admission:** `c4ba069f1dfaddc8273001950805e8a18125db66`; M00 COMPLETE/5%, M01 ADMITTED, M05 not yet canonically admitted, global Scope/Architecture/DoD and ADR-CB-0002 adopted, Issue #6 closed, 19 modules unchanged. This proposal was first prepared from main `e40d36b2a589596869eb296696e917f724d5be65`; the normal merge sync preserves that historical base and the effective M01 evidence. Producer contract PR #55 head `772f2d11f26f798e0917067319991079974eb849` merged at `e40d36b2a589596869eb296696e917f724d5be65`.

**Proposed candidate only:** M05 NOT_ADMITTED→ADMITTED solely for safe non-privileged P0 CMS UI, no real auth/vault/database permission. Work Order `CB-M05-WO-001` and Context Lock are candidates. The branch checkpoint preserves M01's canonical admission and M05's separate pending evidence; M02–M04 and M06–M17 remain NOT_ADMITTED, M18 FUTURE, completed-through M00, and 5%. No local agent launched or app code changed. The branch was normally synchronized from the M01 merge SHA above; M05 remains non-authorizing until this PR's own reviewed merge and canonical readback.

**P1 external gate still OPEN:** actual persistent Owner claim, one-use bootstrap/password/recovery/MFA, secure sessions/cookies/CSRF, protected secret envelope storage, database/migrations and resource permissions require a qualified Owner-approved dedicated ADR. UI MOCK status is not evidence of authorization. Free Workers and informational US$10 alert remain, no Paid upgrade.

## Local validation after M01-first synchronization

Validated source commit: `d1e6c08160d631e5644040f809f19544b0b47b70`, following normal sync merge `d1fd02ccad489f2936a058f57f7f899384a91213` (first parent `68fa072ba70c5deb479cc1bbd403686278baa92f`, synchronized `main` second parent `c4ba069f1dfaddc8273001950805e8a18125db66`). Runtime: Node `22.19.0`, npm `10.9.3`, Linux container; the Windows-linked Git worktree was copied into a temporary isolated test directory with its Git objects mounted read-only. `npm ci` and `npm audit --audit-level=high` passed; audit reported 0 vulnerabilities. `npm run lint` passed. `npm run typecheck` passed (47 files; 0 errors, warnings, or hints). `npm test` passed: 111 unit tests, build with no SESSION/data/service/production bindings, and 7/7 Playwright tests including desktop 1536×864, tablet 768×1024, mobile 390×844, health, preview-status, 404, security headers, and robots/noindex.

Docker Compose smoke used a dedicated local project `coinblink-m05-admission-smoke` on `127.0.0.1:3188`; the container became healthy and exact-SHA `/health` and `/preview-status`, `/en` HTTP 200, and unknown-route HTTP 404 passed for `d1e6c08160d631e5644040f809f19544b0b47b70`. Only that temporary project is stopped after validation; the existing `coinblink-local` service and other projects are untouched.

GEF Bootstrap `1.1.2` `doctor --json` and `status --json` both exited successfully and confirmed the checkpoint JSON is present/readable/valid with M00 COMPLETE/5%. GEF reports `operator.stale=true` with `operator.stale.unknown_conservative`; it also reports `toolchain.git=FINDING`, `repository.observable=FINDING`, and dirtiness `UNKNOWN` because it cannot verify the physical Git executable/worktree through this Windows-linked-worktree/container setup (`GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED` in the direct mount; `GIT_TOOL_UNAVAILABLE` in the normal Linux clone). These are recorded as REVIEW/UNKNOWN, not a healthy local repository observation. Exact-head Ubuntu/Windows GEF CI and final review remain required before any merge.

**Evidence still pending:** exact final-HEAD GitHub CI, CodeRabbit review, independent audit, conditional Owner go/no-go, authorized merge, and post-merge canonical readback. The local Docker build/smoke and app test results above are real but do not substitute for those gates. No direct Cloudflare provider action is part of this governance PR.

## Local exact-head regression correction

Ubuntu and Windows CI on preceding candidate SHA `80a65053714271e8e3bb06b597c751f42662b2bc` reported 110 unit tests passed and exactly one outdated planner test failing: `test/parallel-batch-planner.test.mjs` expected CB-M05 to remain `NOT_ADMITTED` even in a separately reviewed admission candidate. This scope-limited regression correction verifies the *actual* admission from checkpoint, then asserts the read-only planner is still ineligible without real global/module evidence; if status is NOT_ADMITTED, the explicit admission blocker remains required. No planner bypass, runtime code or new provider permission. Recheck exact new commit in hosted CI.

## Progress invariant regression follow-up

The admission-only checkpoint must remain 5% while `completedThroughModule=CB-M00`; admissions may not advance completion. The regression test now asserts exact 5% conditionally on the canonical last completed module, while allowing a later explicitly completed module's separately reviewed checkpoint to increase percent without falsely failing the historic global test. No completion percent or application code changed by this fix.

## CodeRabbit subsequent exact-head review correction

The CodeRabbit final review reported (1) stale M05 contract text implying `NOT_ADMITTED` forever even after the independently reviewed P0 admission merge, and (2) an overgeneralized preflight test that required the same M05-specific contract status wording from all admitted modules, which could break M01's separate legitimate promotion. Updated both in this same scoped PR. The contract now makes pre-merge no-authority and post-merge P0-only authority explicit, with P1 identity/vault/database fully gated. Preflight now checks each admitted module's own Work Order evidence and module-specific contract semantics. CI, security reviews and exact-head approval must be re-evaluated on the new SHA.

## Restrict exact module-admission allow-list (CodeRabbit audit correction)

The baseline regression now requires precisely CB-M05 ADMITTED and every other M01–M17 NOT_ADMITTED **in this PR**. It positively verifies this module's Work Order, contract, Context Lock and Owner-reviewed-merge marker. This is a strict admission delta test on the candidate only; when later individually authorized module admissions merge, their own guarded PRs must update the expected allow-list in the same reviewed change. No generic 17-module blanket admission. This does not make the candidate executable before Owner-approved merge.
