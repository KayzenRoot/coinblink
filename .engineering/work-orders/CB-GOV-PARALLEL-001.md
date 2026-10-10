# Work Order CB-GOV-PARALLEL-001 · Controlled Module Parallelism Proposal

**Status:** `GOVERNANCE_PROPOSAL / PENDING_INDEPENDENT_REVIEW_AND_OWNER_AUDIT`
**Repository:** `KayzenRoot/coinblink`
**Base main SHA:** `27015adc87caacabbed0e318f892644ce0473f10`
**Executor:** Codex Desktop LOCAL; no Codex Cloud.
**GEF:** Bootstrap `1.1.2`, official source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.
**Risk:** Standard; documentation/test-only.
**Checkpoint:** no state change proposed.

## Objective

Propose a traceable, conflict-controlled operating model for the existing 19 product modules CB-M00–CB-M18. Record the Issue #6 wave schedule, reconcile dependency statements conservatively, define per-module path ownership, contract/mock discipline, Context Lock and Work Order prerequisites, independent worktree/branch/PR rules, serialized integration, tests, evidence, and the future agent execution procedure.

This Work Order does **not** admit a module, alter product functionality, change an accepted architecture/scope/security/DoD decision, update the canonical checkpoint, start application code, or authorize an external provider action. The proposal becomes effective only after independent review, exact-head checks, Owner audit, and an authorized merge plus any required global source/ADR promotion.

## Verified starting state

- Remote `main` at task start: `27015adc87caacabbed0e318f892644ce0473f10`.
- Current checkpoint: M00 admitted and in progress, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, Preview `NOT_DEPLOYED`, 0%, `nextLegalStage=SATISFY_M00_P1_PROVIDER_AUTHORIZATION_AND_PREVIEW_EVIDENCE_GATE`.
- M01–M17 remain not admitted; M18 remains future/not admitted. Issue #6 remains open.
- PR #41: base `27015adc87caacabbed0e318f892644ce0473f10`, head `d9bc2e2073c4071ff3fcda9e341cf05872e830e3`, open/non-draft; its six exact-head CI checks and CodeRabbit status are successful. Its `reviewDecision` is empty: the formal CodeRabbit review object covers an earlier SHA, and the Owner's exact-head review is `COMMENTED`, not independent approval. Do not merge it from this Work Order.
- The manual Preview run [#37968696916](https://github.com/KayzenRoot/coinblink/actions/runs/37968696916) used exact `main` SHA `27015adc87caacabbed0e318f892644ce0473f10`. Its local preflight passed, but `Create isolated Worker Preview` failed; URL verification and cleanup steps were skipped. This proves neither a successful Preview nor absence of a partial remote resource. P1 remains incomplete; this Work Order makes no Cloudflare call.
- Issue #6 is proposal-level and does not have a separate approval for parallel module admission. The existing roadmap's one-critical-path Work Order rule remains canonical until explicitly changed.
- GitHub currently reports no repository ruleset/branch-protection requirement on `main`; this is a governance risk, not authority to bypass required review or checks. The Owner must establish and verify required review/check protections before adopting parallel merges. Environment approval of a deployment is not independent code review.

## Sources inspected

`AGENTS.md`; `.engineering/SOURCE-HIERARCHY.md`; `.engineering/CHECKPOINT.json` and `.engineering/CHECKPOINT.md`; `.engineering/CB-M00-ADMISSION.md`; active M00 Work Order and Context Locks; `.engineering/SCOPE.md`; `.engineering/ARCHITECTURE.md`; `.engineering/SECURITY.md`; `.engineering/DEFINITION-OF-DONE.md`; `docs/DECISIONS_LEDGER.md`; `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md`; `docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md`; all 19 planned module Work Orders; Issues #5–#23, #26–#27 and #36; Issue #6; and PR #41 live state.

The checkpoint JSON and live GitHub state govern stale narrative passages that still describe PR #35 / CB-GOV-006 as a candidate. This Work Order preserves historical evidence and Context Locks; it does not rewrite those sources.

## Scope and proposed files

Documentation and governance testing only:

- `.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json`
- `.engineering/proposals/CB-GOV-PARALLEL-001-OPERATING-MODEL.md`
- `.engineering/proposals/CB-GOV-PARALLEL-001-CONTRACT-REGISTER.json`
- `.engineering/templates/CB-MODULE-CONTRACT.md`
- `docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md` (explicitly proposed)
- `test/governance-parallel-plan.test.mjs`
- `.engineering/context-locks/CB-GOV-PARALLEL-001.md`
- `.engineering/evidence/CB-GOV-PARALLEL-001-CHECKPOINT-DELTA.md`
- `.engineering/evidence/CB-GOV-PARALLEL-001-EVIDENCE.md`
- `.engineering/evidence/CB-GOV-PARALLEL-001-FINGERPRINTS.json`
- `.engineering/work-orders/CB-GOV-PARALLEL-001.md`

No existing canonical source, checkpoint value, active M00 Work Order/Context Lock, historical evidence, workflow, dependency, application file, package manifest, issue, secret, Cloudflare resource, or module count is to be changed.

## DAG / wave reconciliation

Use the seven Issue #6 schedule buckets while retaining each existing planned Work Order's direct dependencies where omitted transitively: M03 keeps M00+M05; M04 keeps M00+M01+M05; M11 keeps M02+M03+M04+M05. Proposed M15 module predecessors are explicitly M01/M02/M03/M04/M05/M06/M09/M10/M14; if ads are enabled at launch, add M13 policy evidence. M17 may prepare/implement an isolated core in Wave C only after M00/M03/M05 and the M08 evidence-contract seam are frozen; its final M07 Social Studio export integration/merge is gated to the reviewed M07 contract in Wave D. The DAG and merge-gate graph must be acyclic. These details remain proposed for Owner adjudication and do not update accepted module Work Orders.

The contract register names candidate producer seams and consumers for all 19 modules while explicitly recording that planned WOs do not contain approved runtime schemas. M05's editorial model is a high-fan-out contract that must be frozen before consumers code; M03 provenance, M04 market units/rights/freshness, M06 event identity/consent/dedupe/retention, and M17 versioned asset rights/invalidation are open. Reconcile the M05 multi-author language with the one-human-Owner rule and the conflicting M13 admin route names before freezing affected contracts. No shared runtime type, schema, or migration is created here.

## Ownership and independent execution proposal

Each future admitted module receives one dedicated local Codex agent, one new managed worktree, one branch, one active Work Order, one frozen Context Lock, one exclusive path manifest, tests, an Evidence Bundle, and one PR. Before creation or resume, preflight local/remote refs, `git worktree list`, and active Work Orders; collisions stop and must not be reset, deleted, or reused. Record the task/agent identity, original base, current integration base, head SHAs, branch/worktree, and clean/dirty state in evidence. The number of concurrent agents cannot exceed available local Codex slots; queue eligible work until a slot opens. An Integration Steward reserves shared routing/layout/contracts registries/schemas/package files/runtime and deployment configuration/CI/governance paths. Module agents write only to module-specific roots and own their module contract/fakes; producer-owned interfaces cannot be edited by consumers without review. Any path collision blocks or serializes the affected WOs.

Independent same-wave authoring may happen in parallel only after global scope approval and individual module admissions, with merged predecessors and frozen interfaces. `baseMainSha` preserves original admitted/source provenance; `integrationBaseSha` tracks the latest `main` incorporated into the branch and is the comparison base for the PR's exact owned-path set. After a regular merge from newer main (no rebase/force), update `integrationBaseSha` and the path manifest, then rerun exact-head CI/review. Until a verified merge queue tests `merge_group`, PR merges are serial. The current repo has no verified merge-queue gate; the proposal adds none.

The six requested governance roles ran as staged, read-only audits because this desktop session has four total agent slots including the orchestrator. Coverage: (1) base/M00/PR #41; (2) DAG/dependencies/issues/waves; (3) module contract seams; (4) worktree/branch/PR/CI concurrency; (5) security/test boundaries; and (6) ADR/Source Pack/Evidence Bundle. No subagent or second module agent wrote proposal files; the orchestrator is the sole writer. Future execution is bounded by available local slots and does not imply six concurrent module implementation agents.

## Tests and acceptance

- Confirm exactly 19 unique module IDs/issues and the approved mapping, including M17 Issue #27 and M18 Issue #26.
- Validate all module and integration-gate edges resolve and are acyclic; wave starts obey earlier-wave dependencies; M17's later integration gate is explicit.
- Validate module-exclusive file roots are pairwise disjoint case-insensitively and do not collide with reserved Integration Steward paths; generated branch/worktree names are unique and documented preflight refuses existing allocations.
- Validate 19 proposal-only producer/consumer contract seam records, local synthetic mock policy, zero network/provider calls in mock jobs, no test credentials, and a separate database migration ADR/Work Order gate.
- Validate M00 is the only admitted module, M01–M17 are not admitted, and M18 remains future/not admitted.
- Verify the changed Git paths exactly match the evidence fingerprint manifest against `integrationBaseSha`; detect omitted/extra/duplicate paths, renames as delete-plus-add, deletions, Work Order allowlist violations, staged-index drift, and unstaged mutations.
- Run the pinned GEF 1.1.2 doctor/status, `npm ci --ignore-scripts`, `npm audit --audit-level=high`, `npm run lint`, `npm run typecheck`, `npm test` (unit/build/Playwright), and applicable Docker smoke without disturbing unrelated containers.
- Push a PR and verify exact-head Ubuntu/Windows/Docker, SonarCloud, both Socket checks, and current CodeRabbit status/review. Obtain independent review and stop before merge/owner approval.

## Deliverables and checkpoint delta

Deliver a proposal ADR, module dependency/ownership matrix, 19-entry proposal-only contract seam register, contract/mock template, agent/worktree/branch/PR procedure, exact-source Evidence Bundle, candidate Context Lock, deterministic governance tests, and an explicitly proposed checkpoint delta. The delta is a no-op: keep M00 admitted/in progress, P1 not deployed, progress 0%, M01–M17 unadmitted, M18 future/not admitted, with no `stopState` change.

## Out of scope

No M01+ application code; no Cloudflare/browser/API operation; no secret or billing change; no external service/resource change; no M18 token issuance; no source Scope/Architecture/DoD or approved Decisions Ledger change; no checkpoint promotion; no self-approval, merge, force-push, history rewrite, or gate bypass.

## Stop condition

Stop when the governance proposal is committed, published as its own PR with exact-head validation and evidence, and ready for independent Owner review. If Issue #6/global approval or M00/P1 remains open, do not launch any module code. Do not merge this PR or represent the proposed concurrency policy as adopted.
