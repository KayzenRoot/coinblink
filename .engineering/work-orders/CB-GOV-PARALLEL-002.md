# Work Order CB-GOV-PARALLEL-002 · Make PR #42 Governance Tests Evergreen

**Status:** `CORRECTIVE_TEST_IMPLEMENTATION / OWNER_REAUDIT_PENDING`
**Repository:** `KayzenRoot/coinblink`
**Issue:** [#43](https://github.com/KayzenRoot/coinblink/issues/43)
**Base main SHA:** `e98d581c7306ab255af9b96e7c046db6f49acf12`
**Branch:** `codex/cb-gov-parallel-002`
**Executor:** Codex Desktop LOCAL; no Codex Cloud.
**GEF:** Bootstrap `1.1.2`, official source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.
**Risk:** Standard; tests and governance evidence only.
**Checkpoint:** no field change proposed.

## Objective

Correct the historical assertions added by PR #42 so normal tests validate evergreen governance behavior on future Work Orders and legitimate checkpoint advancement. Preserve PR #42's one-time source/path/fingerprint evidence behind an explicit check of its immutable merged snapshot. Keep the proposal archive, all 19 module IDs, the M18 future restriction, and every unrelated CI gate intact.

This is an engineering correction, not a product module. It creates no implementation authority for M01–M18, changes no application code, and does not merge or approve PR #41.

## Verified starting state

- `main` was fetched from GitHub at `e98d581c7306ab255af9b96e7c046db6f49acf12` and matched the Issue #43 baseline.
- PR #42 is merged into that main; the immutable PR #42 proposal snapshot is commit `e98d581c7306ab255af9b96e7c046db6f49acf12`, with integration parent `27015adc87caacabbed0e318f892644ce0473f10`.
- PR #41 remains OPEN and non-draft at head `d9bc2e2073c4071ff3fcda9e341cf05872e830e3`, based on `27015adc87caacabbed0e318f892644ce0473f10`. All seven check statuses currently shown by GitHub pass; `reviewDecision` is empty. This Work Order will not merge it.
- The live checkpoint at the base records M00 admitted and in progress, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, Preview `NOT_DEPLOYED`, 0% progress, M01–M17 not admitted, and M18 future/not admitted. The checkpoint itself is outside this Work Order's write boundary.
- On the unchanged base, `node --test test/governance-parallel-plan.test.mjs` passes 16/16 because the historical comparison happens to match. A disposable synthetic later commit (`747dda34995ebf4f658f62dd369619aa1bab9df7`) deterministically reproduced four stale assertions: checkpoint equality, GEF's exact M00 snapshot, PR #42 path allowlist, and PR #42 fingerprint-set coverage.

## Scope and proposed files

Only these paths may change:

- `.engineering/work-orders/CB-GOV-PARALLEL-002.md`
- `.engineering/context-locks/CB-GOV-PARALLEL-002.md`
- `.engineering/evidence/CB-GOV-PARALLEL-002-CHECKPOINT-DELTA.md`
- `.engineering/evidence/CB-GOV-PARALLEL-002-EVIDENCE.md`
- `.engineering/evidence/CB-GOV-PARALLEL-002-FINGERPRINTS.json`
- `scripts/verify-cb-gov-parallel-001-history.mjs`
- `test/future-checkpoint-regression.test.mjs`
- `test/governance-parallel-plan.test.mjs`
- `test/gef-cli.test.mjs`

The two existing test files retain their behavior and immutable M00 admission provenance checks, while comparisons to present-day checkpoint and Git paths become schema/invariant based. Generic path ownership, deletion, path-set, and fingerprint consistency tests remain active against an explicitly supplied active Work Order fixture. A deterministic temporary-clone regression commits an unrelated future file and a schema-valid synthetic checkpoint advancement, then runs both affected evergreen suites. The synthetic state is disposable test data, never canonical evidence.

The new historical verifier requires `COINBLINK_VERIFY_PARALLEL_001_SNAPSHOT` to equal the full immutable SHA. It reads the PR #42 tree and its recorded parent only; it never compares that historical fingerprint bundle with the caller's current `HEAD`, index, worktree, or active PR paths. Ordinary `npm test` does not execute this one-time verifier.

## Acceptance criteria

1. Preserve the 19-module registry, issue mapping, proposal-only status, DAG, ownership separation, local-mock/security rules, and all 16 governance-test behaviors.
2. The evergreen suite accepts a later valid checkpoint with M00 closed, a future module admitted, nonzero progress, and unrelated paths while keeping an exact 19-entry admission registry and M18 `FUTURE_NOT_ADMITTED`.
3. GEF tests continue to prove read-only observer behavior and immutable M00 admission provenance, while validating current status/progress by comparing the GEF output with the current checkpoint.
4. Path ownership rejects a path outside the supplied active Work Order allowlist and a deletion without an explicit reason; no test applies CB-GOV-PARALLEL-001's 11-path allowlist to future changes.
5. The gated historical verifier checks the frozen PR #42 parent, 11 changed paths, archived checkpoint projection, and original manifest's Git SHA-1 and raw SHA-256 values.
6. All local validation and exact-head GitHub checks are recorded for the exact PR head. No canonical checkpoint, source hierarchy, Scope, Architecture, Security, DoD, decisions, workflows, package manifest, application source, or other module Work Order is changed.

## Validation

Run on Node `22.19.0` / npm `10.9.3`:

- `npm ci --ignore-scripts`
- `node --test test/governance-parallel-plan.test.mjs test/gef-cli.test.mjs test/future-checkpoint-regression.test.mjs`
- `COINBLINK_VERIFY_PARALLEL_001_SNAPSHOT=e98d581c7306ab255af9b96e7c046db6f49acf12 node scripts/verify-cb-gov-parallel-001-history.mjs`
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm audit --audit-level=high`
- GEF 1.1.2 `doctor` and `status`
- Isolated Docker smoke on a free port; do not stop/remove existing containers.
- Exact-head GitHub Ubuntu, Windows, Docker, SonarCloud, Socket, and CodeRabbit results.

Capture command results, immutable source fingerprints, exact base/head SHAs, the before/after synthetic regression, security boundaries, remaining risks, and the live PR check rollup in the Evidence Bundle.

## Out of scope

No checkpoint promotion, M01+ implementation, Cloudflare or provider call, credentials, paid service, code deployment, source-scope change, workflow change, merge queue, PR #41 merge, self-approval, force push, history rewrite, or CI bypass.

## Deliverables and stop condition

Deliver the minimal test correction, gated PR #42 historical verifier, synthetic future-checkpoint regression, Context Lock, Evidence Bundle, fingerprint manifest, and no-op Checkpoint Delta in one reviewed PR titled with `CB-GOV-PARALLEL-002`.

Stop with the correction pushed and exact-head checks complete, ready for independent Owner review. Do not merge this PR, PR #41, or any module PR; do not start M01+.
