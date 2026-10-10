# CB-M05 scoped-P0 admission · proposed checkpoint delta

**Canonical main before proposal:** `e40d36b2a589596869eb296696e917f724d5be65`; M00 COMPLETE/5%, global Scope/Architecture/DoD and ADR-CB-0002 adopted, Issue #6 closed, 19 modules unchanged. Producer contract preparatory PR #55 head `772f2d11f26f798e0917067319991079974eb849` must be merged independently before this candidate's own reviewed admission.

**Proposed candidate only:** M05 NOT_ADMITTED→ADMITTED solely for safe non-privileged P0 CMS UI, no real auth/vault/database permission. Work Order `CB-M05-WO-001` and Context Lock are candidates. Checkpoint retains M00_COMPLETE/5% and M01..M04/M06..M17 NOT_ADMITTED, M18 FUTURE. No local agent launched or app code changed. A separate M01 admission candidate may merge first and require normal PR synchronization without rewriting this module scope.

**P1 external gate still OPEN:** actual persistent Owner claim, one-use bootstrap/password/recovery/MFA, secure sessions/cookies/CSRF, protected secret envelope storage, database/migrations and resource permissions require a qualified Owner-approved dedicated ADR. UI MOCK status is not evidence of authorization. Free Workers and informational US$10 alert remain, no Paid upgrade.

**Evidence not yet observed:** exact final HEAD CI, CodeRabbit, authorized merge, actual execution SHA, Docker build/screenshot and app security tests cannot be claimed by a mere candidate. This admission proposal itself must pass required checks; no direct Cloudflare provider action in a governance PR.

## Local exact-head regression correction

Ubuntu and Windows CI on preceding candidate SHA `80a65053714271e8e3bb06b597c751f42662b2bc` reported 110 unit tests passed and exactly one outdated planner test failing: `test/parallel-batch-planner.test.mjs` expected CB-M05 to remain `NOT_ADMITTED` even in a separately reviewed admission candidate. This scope-limited regression correction verifies the *actual* admission from checkpoint, then asserts the read-only planner is still ineligible without real global/module evidence; if status is NOT_ADMITTED, the explicit admission blocker remains required. No planner bypass, runtime code or new provider permission. Recheck exact new commit in hosted CI.

## Progress invariant regression follow-up

The admission-only checkpoint must remain 5% while `completedThroughModule=CB-M00`; admissions may not advance completion. The regression test now asserts exact 5% conditionally on the canonical last completed module, while allowing a later explicitly completed module's separately reviewed checkpoint to increase percent without falsely failing the historic global test. No completion percent or application code changed by this fix.
