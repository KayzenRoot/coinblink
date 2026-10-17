# CB-CF-RELEASE-GATE-001 · Fail-closed DEMO release admission

**Status:** OWNER_REQUESTED / PR_DRAFT_PENDING_CI_AND_AUDIT. **Risk:** HIGH_ASSURANCE (deployment). **Owner:** KayzenRoot. **Main at preflight:** `960f9a12686841b8fdc05e44de2ca5d0a6a1a93e`. **Source:** global Source Hierarchy, Security, Scope, DoD, #117/#118 Cloudflare main-only DEMO workflow, Issue #60, P1-C LOCAL-only authorization.

## OBJECTIVE
Prevent **documentation-only, security-fixture/local-only, and test-only** merges from triggering `wrangler deploy` from `main`. Require both actual public deployable application changes and a *separate, exact-source Owner GO* per merged PR before Cloudflare is contacted.

## CONTEXT / SOURCE HIERARCHY
Read `.engineering/CHECKPOINT.json`, `.engineering/SOURCE-HIERARCHY.md`, `.engineering/SCOPE.md`, `.engineering/SECURITY.md`, `.engineering/DEFINITION-OF-DONE.md`, the approved Cloudflare workflow/guards and tests. Existing Worker is `coinblink-production` DEMO_ONLY, never commercial; the existing GitHub secret remains protected.

## SCOPE
- `scripts/cloudflare-production-policy.mjs`: pure fail-closed release gate; require complete PR file evidence, at least one public/deployable path, and an exact literal `COINBLINK_DEMO_DEPLOY_GO PR=<number> HEAD=<40-char-sha>` issue comment from the sole repository Owner for this source PR.
- `scripts/assert-production-deploy-eligibility.mjs`: check the source PR changed-file list and Owner-authored comments via read-only GitHub API before existing main/PR checks and return failure on missing, incomplete or forged evidence.
- `test/cloudflare-production-eligibility.test.mjs`: deterministic negative tests for docs-only, P1-C local files, tests-only, spoofed Owner, stale SHA, changed-file list >100, truncated list and comment overflow. Preserve passing authorized positive fixture.
- Source Pack Work Order and staged Context Lock only. No other paths.

## OUT OF SCOPE
No Worker deploy/preview, Cloudflare settings, secrets, D1 local or remote, `src/**`, docs/ADR #119, real credentials, vault, commercial rights, M01/M05 product code, bypasses, cost changes or checkpoint promotion. No silent changes to mandatory 7 statuses, branch rules or existing DEMO disabled-commercial policy.

## REQUIREMENTS & THREAT MODEL
- Deployment cannot be authorized by a global DEMO variable alone: previous repo-wide consent cannot become a blanket per-PR release token.
- Documentation, CI/tests, or `src/modules/CB-M05/p1c-local/**` and other P1 fixture-only changes must not deploy on their own.
- Source changed_files count must be equal to complete API readback and <=100; issue comment inventory incomplete (>=100) fails closed, without attempting speculative later pages.
- Require `user.login=KayzenRoot`, GitHub `author_association=OWNER`, exact pre-merge source `head.sha`, PR number and one-line literal token; do not parse comments containing extra prose.
- Preserve existing main/PR tree exactness, required context verification, branch/current SHA and target checks; fail closed on all API errors.

## ACCEPTANCE CRITERIA / TESTS
1. Targeted Node 22 unit regression and negative tests pass; lint/typecheck/build, full tests and Docker/GEF Ubuntu+Windows CI exact HEAD all pass.
2. SonarCloud/Socket evidence, 7 required contexts, source diff, audit, and any actionable security findings corrected in this same PR.
3. No Cloudflare token available to this PR, no provider operations executed. Demonstrate unauthorized docs/local fixture inputs yield a preflight rejection *before* the deploy job.
4. Record that the protected merge of this gate itself will be rejected as a docs/scripts/test-only source by the **new** trusted-main preflight; still require Owner exact-HEAD GO before merge and verify no deploy run occurred afterwards.
5. Do not declare module completion or checkpoint change.

## DELIVERY / REVIEW / STOP
PR on new non-force branch with stable WO; exact main/tree/critical blob fingerprints and Evidence Bundle. PT-BR review `APPROVED`, `CORRECTION REQUIRED`, or `BLOCKED`. Only protected squash following Owner exact-HEAD go and 7/7. No deploy release GO is granted by merging this guard. `CHECKPOINT_DELTA={}`. **STOP:** `FAIL_CLOSED_DEPLOY_GATE_AUDITED_WITH_ZERO_PROVIDER_ACTIONS`.
