# CB-GOV-FAST-001 — Process acceleration design Work Order

**Status:** `PHASE_1_PILOT_AUTHORIZED_BY_MERGED_PR`; documentation-only governance Work Order. **Risk:** ELEVATED. **Owner request:** 2026-10-15: reduce repetitive no-change GEF discussion, accelerate already-admitted implementation, and perform deep final audit without postponing critical security checks. **Original PR #78 base SHA:** `5a4e8c6872a48f3ce4095ecb7c111fcec92d3ac8`. **Post-merge readback:** PR #78 merged and current `main` verified at `85ece8e63e56ac8006701eda121f462d901d2d2f` on 2026-10-15.

The merge authorizes only the Phase 1 local pilot inside existing admitted LOW/STANDARD Work Orders. It does not admit code, change any scope, GEF CLI/runtime, ruleset, required checks, legal/security gate, or checkpoint. The proposed 30-task evaluation has not completed.

## OBJECTIVE
Propose a documented risk-based CoinBlink-specific fast lane that eliminates duplicate no-change audit loops, allows multi-milestone implementation **inside existing admitted WOs**, and preserves final exact-head CI, Owner go/no-go, source protections, and P1/HIGH_ASSURANCE gates.

## CONTEXT
M00_COMPLETE/5%. M01 and M05 admitted within individually restricted scopes. CB-VIS-WO-002 Phase A demo brand library admitted, implementation draft PR #77 technical review scoped to byte-approved assets. Live PR #58 M01 and #59 M05 remain open; Issue #72 rights remain pending. P1 secure CMS, M02/M03 implementation, public commercial release and token features are not authorized.

## SCOPE
Documentation-only proposed orchestration policy plus Work Order and Context Lock. Define LOW / STANDARD / ELEVATED / HIGH_ASSURANCE execution cadence; stage-level targeted checks, exact-head full final checks, reusable SHA-keyed observations, bounded correction batching, distinct module worktrees, owner solo integration gate and rollback criteria. Demonstrate Source Pack compatibility without modifying accepted contracts. Preparing a candidate docs PR is authorized by this request; **making it canonical still requires reviewed merge and the existing admin gates**.

## OUT OF SCOPE
No changing `main`, GEF pinned CLI, GitHub ruleset #24888106, workflow required checks, CodeRabbit context, branches for #58/#59/#77, application code, checkpoint, module admission, Cloudflare secrets/bindings, production, branding/commercial rights, R2/D1, real owner login, privileged secrets, token issuance, external cost, or release.

## FILES / SOURCES TO READ
`AGENTS.md`; `.engineering/SOURCE-HIERARCHY.md`; `.engineering/CHECKPOINT.json` and `.engineering/CHECKPOINT.md`; `.engineering/SCOPE.md`; `.engineering/REQUIREMENTS.md`; `.engineering/ARCHITECTURE.md`; `.engineering/SECURITY.md`; `.engineering/DEFINITION-OF-DONE.md`; `docs/DECISIONS_LEDGER.md`; GEF 1.1.2 accepted ADR-0008; current PRs #77/#58/#59, Issues #60/#72/#74, effective ruleset; this proposal; Context Lock.

## REQUIREMENTS
1. Respect accepted hierarchy: an owner preference to speed up does not convert a proposal to admitted implementation or authorize unsafe shortcuts.
2. Avoid duplicate reviews of identical SHAs; use source/tool/checkpoint fingerprints and record freshness. Any input delta requires targeted new evidence, not rote regeneration.
3. No known HIGH/CRITICAL defects carried forward. Never counterfeit CodeRabbit substantive review or completion status.
4. On each product PR final HEAD, perform strict GitHub-required CI, relevant integration and safety tests and technical audit; deep, full release audit at version closure.
5. Classify module requests NECESSARY/IMPORTANT/FUTURE/OUT OF SCOPE. No unadmitted module code.
6. Maintain separate Work Orders and PRs per module; only internal milestones within **same admitted scope** may batch.
7. Preserve exact Golden vector fingerprints, visual DEMO-only scope and Issue #72 rights gate. M05 P1 security ADR remains separate.
8. Provide an objective pilot metric plan and safe rollback trigger.

## ARCHITECTURE RULES
One GitHub admin account, module-local worktrees, one Integration Steward for shared paths, serialized merges. Astro/Node 22 Cloudflare-Free-only baseline. Keep evidence append-only or provenance-versioned; no secret data. GEF `doctor/status` are observers and do not authorize or self-promote status.

## CONSTRAINTS
No destructive edits, no force-push, no breaking required checks, no external provider mutations, no hidden deployment. Documents are in English; operational review and outcome in Brazilian Portuguese.

## ACCEPTANCE CRITERIA
A) At the original PR #78 head, all three paths were documentation-only and correctly marked PROPOSED/non-effective. That merge gate is now satisfied for the bounded Phase 1 pilot; this does not authorize GEF/runtime, ruleset, required-check, scope, or checkpoint changes.
B) Source and ruleset/current checkpoint values verified against base SHA and included in Context Lock.
C) Policy specifies exactly which intermediate validation may be cached and final validations that may not.
D) New pilot can be stopped without rollback of application code; no scope relaxation of P1 security/legal.
E) CI and independent technical review pass for exact PR HEAD.
F) Owner/admin issues explicit exact-HEAD GO for proposed process merge before any canon promotion.

## TESTS
Read-only branch compare; parse link/path references and source fingerprints; `git diff --check` for authored docs; existing GitHub Actions strict required checks at HEAD. No new GEF runtime behavior is claimed. Read required checks and verify no rule change.

## DELIVERABLES
Proposal `.engineering/proposals/CB-GOV-FAST-001-RISK-BASED-FAST-LANE.md`; this Work Order; Context Lock; separate DRAFT PR against `main`, with precise summary, risks and STOP. No checkpoint delta beyond `NO_CHANGE_PROPOSED`.

## REVIEW FORMAT
Brazilian Portuguese: VERDICT (`APPROVED`, `CORRECTION REQUIRED`, or `BLOCKED`), source SHA, changed paths, checks and proof, residual risks, next exact action. Technical approval is not GitHub review approval or merge authority.

## STOP CONDITION
Operate only the Phase 1 local pilot inside pre-existing admitted LOW/STANDARD WOs. Stop on stale source authority, required-check failure, credential/payment/auth/security gate, scope/ownership conflict, HIGH/CRITICAL defect, or Owner veto. Do **not** change GEF CLI/runtime, ruleset, workflows/required checks, checkpoint, product-merge authority, or rights status. The 30-task metrics remain incomplete; this Work Order does not claim a completed pilot or productivity result.
