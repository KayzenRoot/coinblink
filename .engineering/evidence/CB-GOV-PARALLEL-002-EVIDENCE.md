# Evidence Bundle · CB-GOV-PARALLEL-002

**Status:** `CORRECTIVE_TEST_IMPLEMENTATION / OWNER_REAUDIT_PENDING`
**Repository:** `KayzenRoot/coinblink`
**Issue:** [#43](https://github.com/KayzenRoot/coinblink/issues/43)
**Base SHA:** `e98d581c7306ab255af9b96e7c046db6f49acf12`
**Branch:** `codex/cb-gov-parallel-002`
**PR:** [#44](https://github.com/KayzenRoot/coinblink/pull/44) (ready for review; its live head and review state are authoritative).
**Initial implementation commit:** `b9308798fc7ff40f25330a5dfd3aba0e0dfffa0a` (pre-review implementation based on the frozen `e98d581...` main).
**Reviewed code HEAD:** `a39d0dbad763085a900bce392afffda2070fdc7b` (post-CodeRabbit corrections; local CodeRabbit CLI full-diff review reported 0 issues).
**GEF:** Bootstrap `1.1.2`, source `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.

## Baseline and regression

- Live GitHub main matched the Issue #43 expected SHA before the branch was created.
- PR #41 remains open at `d9bc2e2073c4071ff3fcda9e341cf05872e830e3`; all seven current GitHub check statuses passed. Its review decision is empty. No merge or review was attempted.
- On the unchanged `e98d581...` tree, the original governance suite passed 16/16; that only showed the historic base still matched PR #42's own snapshot.
- Before the correction, a temporary clone with a committed unrelated future file and a schema-valid synthetic checkpoint advancement failed four old assertions: GEF's fixed M00 state, the governance test's exact current-checkpoint equality, the PR #42 path allowlist, and the PR #42 changed-path fingerprint set. The captured temporary pre-fix HEAD was `747dda34995ebf4f658f62dd369619aa1bab9df7`; the clone was removed automatically. It contained only synthetic data and did not modify `main`, PR #41, or this repository's checkpoint.
- After the correction, the same isolated regression runs both governance and GEF CLI tests against a temporary later commit; result recorded below after final validation.
- CodeRabbit reviewed the then-current head dd27ec3685159474f806560500b2b3881b53c82d and identified two actionable issues: inherited Git repository-location environment variables could redirect the frozen verifier, and the GEF test pinned sourceMainSha to an obsolete value. The verifier now strips Git location/object overrides; a hostile-environment regression passes. The GEF test accepts a 40-character hexadecimal source SHA, and the synthetic later checkpoint changes that field. The CodeRabbit CLI full-diff review completed on reviewed code HEAD a39d0dbad763085a900bce392afffda2070fdc7b with 0 issues across all nine changed files; final GitHub CodeRabbit publication is pending.

## Correction

- Evergreen tests now validate the 19-ID checkpoint registry, valid admission states, M00 admission provenance, M18's future-only state, bounded progress, and GEF's read-only projection against the current checkpoint. They do not require today's progress, phase, deployment state, or Git path set to remain frozen.
- Ownership negatives use only an explicit active-Work-Order fixture and still reject outside paths and unexplained deletions.
- PR #42's one-time 11-path and SHA-1/SHA-256 evidence is checked by `scripts/verify-cb-gov-parallel-001-history.mjs` only when explicitly gated to immutable snapshot `e98d581...`; it never inspects the invoking worktree's current changed paths.
- The regression fixture is created in and removed with a temporary clone. Its future checkpoint is marked synthetic in test code; no synthetic status is written to canonical files or presented as project evidence.
- SonarCloud rejected the first evidence-synchronized head `ebae3607cc45a723207f3ff2604a4b35319a86e2` (B security / D reliability) with four findings in the new historical verifier: PATH-based Git lookup (`S4036`) and sorting rules (`S2871`, `S4043`). The second analyzed head `dd27ec3685159474f806560500b2b3881b53c82d` cleared PATH lookup but exposed remaining default sorting and Windows-path escaping findings (`S2871`, `S4043`, `S7780`). The final correction uses fixed-directory Git executables, `String.raw` Windows paths, and `toSorted` with an explicit `en-US` comparator for both path and module-ID comparisons. SonarCloud passed on reviewed code HEAD a39d0dbad763085a900bce392afffda2070fdc7b.

## Changed files

The final change set is limited to this Work Order, its Context Lock, no-op Checkpoint Delta, Evidence Bundle and fingerprint manifest, the historical verification script, a synthetic regression test, and the two affected test suites. The fingerprint manifest covers the other eight paths and excludes itself. Canonical checkpoint, source Scope/Architecture/Security/DoD, product code, Workflows, package manifests and PR #41 are not modified.

## Validation record

| Check | Command | Result |
|---|---|---|
| Runtime/dependencies | Node `22.19.0`; npm `10.9.3`; `npm ci --ignore-scripts` | PASS; 437 packages installed; 448 audited, zero vulnerabilities |
| Focused evergreen suites | `node --test test/governance-parallel-plan.test.mjs test/gef-cli.test.mjs test/future-checkpoint-regression.test.mjs` | PASS, 21/21, Node 22.19.0 |
| Synthetic future checkpoint | Included in `test/future-checkpoint-regression.test.mjs`; unrelated path plus M00 completion/M01 admission in disposable clone | PASS; both affected suites passed on the synthetic later commit |
| Frozen PR #42 verifier | `COINBLINK_VERIFY_PARALLEL_001_SNAPSHOT=e98d581c7306ab255af9b96e7c046db6f49acf12 node scripts/verify-cb-gov-parallel-001-history.mjs` | PASS; 11 historical paths and 10 SHA-1/SHA-256 entries |
| Unit tests | `npm run test:unit` | PASS, 76/76 after adding the hostile Git-environment regression |
| Full `npm test` | Unit, build, no-session assertion, Playwright | PASS; 76/76 unit, build/no-session assertion, 7/7 Playwright including 1536×864, 768×1024, and 390×844 |
| Lint/typecheck/build/audit | `npm run lint`; `npm run typecheck`; `npm run build`; `npm audit --audit-level=high` | PASS; typecheck 37 files, zero errors/warnings/hints; build has no `SESSION`/data/service/production bindings; audit zero vulnerabilities |
| GEF in managed worktree | `npm run gef -- doctor --target . --json`; `npm run gef -- status --target . --json` | `REVIEW`; `ok=true` and checkpoint valid, but repository observation is `FINDING` / dirtiness `UNKNOWN` with `GIT_DIRECTORY_NOT_A_DIRECTORY` and `WORKING_TREE_NOT_OBSERVED` |
| Docker smoke | Isolated Compose project on free `127.0.0.1:3015`; app source unchanged from base SHA `e98d581...` | PASS; exact build SHA `e98d581...`; `/health` 200, `/preview-status` demo/NOT_DEPLOYED, `/en` 200 with `noindex`, missing route 404. Port 3000 owner and other containers were preserved; only this temporary project was removed. |
| GEF in normal clone | `npm run gef -- doctor --target . --json`; `npm run gef -- status --target . --json` on ordinary clone at implementation commit `b930879...` | PASS; both `ok=true`, repository observable `HEALTHY` / `CLEAN`, checkpoint valid, no observation limits. GEF security advisory fields remain `REVIEW` for dependency provenance and mutable GitHub ref; status conservatively reports no drift baseline and stale operator metadata. |
| Exact-head CI | Ubuntu, Windows, Docker, SonarCloud, Socket Project Report, Socket PR Alerts | PASS on reviewed code HEAD a39d0dbad763085a900bce392afffda2070fdc7b; https://github.com/KayzenRoot/coinblink/actions/runs/38007616536. A wording-only Context Lock clarification and matching Evidence Bundle/fingerprint synchronization follows; live PR #44 checks are authoritative for the resulting final HEAD. |
| Context Lock | Inline verifier against base `e98d581...` plus GitHub Issue API body bytes | PASS; all 24 SHA-1/SHA-256 rows and Issue #43 body SHA-256 matched |
| Fingerprints | `CB-GOV-PARALLEL-002-FINGERPRINTS.json` checked against staged diff and working tree | PASS; exact 9-path change set, 8 SHA-1/SHA-256 records, no omission or extra path |

## Security and checkpoint

No credentials, provider calls, Cloudflare resource changes, paid services, production deployment, package/workflow changes, new module code, M18 token activity, checkpoint edits, CI bypass, self-approval, merge, or force push. The proposed checkpoint delta is a no-op.

## Final review and stop condition

Publish the limited corrective PR with exact-head evidence and stop for independent Owner review. Do not merge this PR or PR #41, promote any checkpoint state, or start M01+.

CodeRabbit CLI review command: coderabbit review --agent --base-commit e98d581c7306ab255af9b96e7c046db6f49acf12 -c AGENTS.md. Result on reviewed code HEAD a39d0dbad763085a900bce392afffda2070fdc7b: findings=0; reviewed all nine changed files. A second full-diff review on 2acb7c61b994ffc55314f38bcf31e986053934d5 found one Minor wording ambiguity in this lock; all 24 SHA-1/SHA-256 rows were independently verified against the locked Git blobs, then the terminology was clarified without changing any fingerprint value. A final full-diff review and exact-head hosted checks are required for the resulting follow-up commit. The two earlier GitHub CodeRabbit threads were verified fixed and resolved.
