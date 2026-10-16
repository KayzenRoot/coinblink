# CB-GOV-FAST-001 — Risk-based fast lane (Phase 1 pilot authorized)

**Risk:** ELEVATED (governance process). **Owner request:** 2026-10-15, accelerate CoinBlink, reduce repeated no-change GEF discussion, and retain a deep final audit. **Post-merge authority:** PR [#78](https://github.com/KayzenRoot/coinblink/pull/78) merged on 2026-10-15 at `85ece8e63e56ac8006701eda121f462d901d2d2f`; live `main` was read back at that SHA. The merge authorizes the Phase 1 local pilot for already-admitted LOW/STANDARD Work Orders. The 30-task metrics remain proposed and incomplete. No GEF CLI/runtime, ruleset, required-check, scope/admission, safety-gate, or checkpoint change is made or implied.

## Problem, measurable hypothesis and success criteria

R34 ended with no new code after tests; R35 successfully moved into PR #77, while PR #58 and #59 accumulated repeated evidence rounds. The repeated GEF/DoD review of unchanged sources and passing tests wastes development time. Accelerate **authorized local implementation**, not commercial release, source licensing, or privileged operations.

**Proposed 30-task pilot metrics** (capture actual evidence; no fabricated expected gains): elapsed time from code start to first working preview; ratio of agent turns spent implementing/tests versus repeating reviews; CI minutes per accepted feature; duplicated unchanged-fingerprint GEF calls; defects caught before protected-main merge; escaped HIGH/CRITICAL defects; time spent on correction rounds. Baseline before and compare after; rollback to prior cadence if escaping defects increase, required checks regress, or time savings are not demonstrated.

## Candidate fast-lane rules

1. **Admission stays real.** Read the canonical source hierarchy/checkpoint/ADRs once per execution session, pin the current `main` SHA and Git blob hashes of material sources. A planned module is not automatically executable. Check source-delta fingerprints again only if a governing file or base commit changes. Stale authority is a STOP until refreshed, not an excuse to reset the whole implementation unrelated to the delta.
2. **One admitted WO, larger execution batches.** Inside an admitted WO, run 2–4 cohesive, dependency-ordered implementation milestones in a single local Codex worktree with stable ID and one PR. No micro-approval for each internal local commit. Keep shared files under Integration Steward, serial integration, and module boundaries unchanged.
3. **Targeted checks per milestone.** After each logical code change run typecheck/build or affected unit tests as relevant. Record command/exit code and touched paths in an append-only (or explicitly versioned) journal. At PR publication or materially changed final HEAD run full prescribed unit+lint+typecheck/build+relevant E2E/axe/security/GEF; all existing strict status checks remain mandatory for protected merge. Never defer known HIGH/CRITICAL vulnerability, auth bypass, data leak, migration corruption or contract break.
4. **Deduplicate read-only GEF observations.** Cache immutable `doctor/status` results keyed by executable GEF version, machine checkpoint blob SHA, Source Pack relevant blob SHAs, git base, config hashes and host environment. Reuse only where those inputs actually match, mark reused evidence with original timestamp and provenance, run again whenever key changes, before final required attestations, or if GEF policy requires a fresh run. This is **runner orchestration**, not alteration to pinned GEF 1.1.2.
5. **Review material deltas, not unchanged history.** A completed technical audit may be referenced for the same exact commit; if code changes, review changed diff + affected risk surfaces and rerun relevant tests. A new final HEAD still needs protected exact-head CI. Do not claim a `CodeRabbit=success` skipped/rate-limited run is substantive review. If the required external review context is obsolete, create a **separate ruleset/ADR proposal** (with replacement assurance) and do not mutate live ruleset from this proposal.
6. **No ritual checkpoint promotions.** Stage proposed checkpoint deltas only after actual DoD evidence. Promote canonical checkpoint once after an approved integration/release action, and only record completed modules. Progress remains 5% unless objectively demonstrated.
7. **Recovery instead of stopping work altogether.** On an external non-security blocker, record explicit `BLOCKED_EXTERNAL` with precise artifact and resume another **already admitted**, non-overlapping task within the same authorized batch. Do not invent new admissions, provider permissions or rights.
8. **Cost and operator efficiency.** Prefer Codex Desktop LOCAL, isolated branches, native deterministic tools, one bounded Docker/Playwright queue, artifact hashes not repeated screenshots where unchanged, incremental developer journal, then compact final Evidence Bundle. Avoid redundant Cloudflare Preview deployments when app/build inputs and prior validated preview remain byte-identical.
9. **Audit at sensible gates.** Small evidence-based review for LOW, STANDARD checks for public UI/state, comprehensive elevated review for shared platform/rights/migration; HIGH_ASSURANCE remains strict. At integration: independent technical/delta audit and admin GO/NO-GO based on current exact HEAD. At version final: broad security/regression/recovery/rights/deployment/DoD audit. Do not postpone mandatory risk mitigation to this final audit.

## Risk matrix

| Risk | Scope examples | During coding | Before integration |
| --- | --- | --- | --- |
| LOW | pure text, docs, safe styling, owned static fixture | fingerprint preflight; targeted test or deterministic content checks | current HEAD required CI; focused change audit |
| STANDARD | admitted public UI, client-side DEMO workflow, accessible navigation | targeted unit, typecheck/build, smoke at material milestone | complete required CI, module E2E/security contract checks, audit and Owner integration decision |
| ELEVATED | shared route/CI changes, rights-sensitive media, data storage or migration | explicit approved contract/ADR; no unsafe change without approval; tests at each material stage | broad relevant regressions, policy/security/rollback proof, independent analysis and Owner GO |
| HIGH_ASSURANCE | privileged authentication/vault, irreversible money/signing, security-critical production | separately approved security architecture/authority; threat model, negative testing and stop on gaps | strongest reviews, adversarial tests, recovery evidence; no auto-enable or fail-open |

## Applying to current PRs

- **#77 brand**: exact approved R32 bytes, manifest and tests; existing narrow demo-only technical audit for `e5e250985bade5ffdf975a735566969dcf874bb6` can be referenced while unchanged. Stacked logo dark-surface-only, Issue #72 unresolved, no global favicon/header, no merge.
- **#58 M01**: owner-approved DEMO visual, not rights-cleared. Avoid duplicate artwork/testing passes. Rebase/synchronize against current main via normal merge/fast-forward (no force-push); only if authorized by Integration Steward; run affected+final full checks. No commercial use or merge without separate decision.
- **#59 M05**: admitted P0 local mock editor only. Fix module-specific defects within existing scope; do not implement P1 auth, vault, D1, real admin, provider integration or publish until separate security/data ADR is approved.
- **Future M02/M03**: contracts/admission may be prepared as governance proposals, but no code until formal effective admission.

## Non-negotiable constraints / safety

Existing `main` ruleset #24888106 stays active: PR+strict HEAD checks, permitted squash, thread resolution, no bypass actors, deletion/non-fast-forward protected. The owner-solo approval count configuration remains as actually installed. `CodeRabbit` currently reports green with auto-reviews disabled, **not an independent audit**; changes to required contexts require a separate ruleset decision/proof. No self-issued `APPROVED` review, no fabricated external approvals, no force-push, no production deployment, no paid bindings, no secret exposure, no unapproved migrations, no legal clearance inference and no change of Golden master pixels.

## Adoption, pilot, audit and rollback

**Phase 0 (PR #78, completed):** documentation-only Work Order, Context Lock, and candidate policy were reviewed and merged. At that candidate stage no operational change was effective; the authorized merge and live readback now enable the bounded Phase 1 pilot described below. Existing independently admitted work could continue under its existing rules during Phase 0.

**Phase 1 (authorized by merged PR #78):** use local orchestrator prompts on already-admitted LOW/STANDARD WOs, one journal + one PR, with full end-of-PR CI. No GEF CLI/runtime, ruleset, or required-check change is required to avoid duplicate conversational round trips. If a tool insists on uncached freshness, honor it and log precisely why. No pilot-completion or productivity result is claimed until measured.

**Phase 2, separate future WO if evidence supports it:** automate stable fingerprints/cache and hosted status consolidation; if rule change is truly necessary, show exact original/proposed JSON and replacement assurance and obtain Owner authorization before any provider mutation.

**Stop/rollback:** revert fast-lane operator practice (not git history) if a governing blob changes unexpectedly, required CI fails, credential/payment/auth/security gate appears, candidate scope exceeds admitted ownership, HIGH/CRITICAL defect exists, or an Owner veto is issued. Continue work only in another already admitted safe scope; do not relabel failure as success.

**Status:** PHASE_1_PILOT_AUTHORIZED; 30-task evaluation remains INCOMPLETE. **Admin review language:** Brazilian Portuguese.

## R70 current-source readback · 2026-10-15

This is an append-only freshness correction; the original base, Phase 1 limits, and historical pilot status are preserved. The current product `main` is `58321c21508bd6089de1c1a77c21f93a4f0b856a`. PR #82's effective single-owner governance is included. PR #59 and PR #85 are already present on main; this does not change the pilot's authority or imply completion. PR #79 remains a separate DRAFT documentation candidate, its local branch has a normal merge of current main, and no main merge was performed. The 30-task evaluation remains incomplete, with no quantified productivity result claimed. The GEF CLI/runtime, ruleset, required contexts, module admissions, checkpoint, legal gates, and product merge authority remain unchanged.

## ChatGPT-first governance routing · 2026-10-16

At the Owner's request, prefer **direct ChatGPT-to-GitHub execution** over drafting Codex prompts for already-authorized governance-only work: source/status inspection, delta-focused audits, minimal documentation corrections, PR coordination and evidence readback. Reuse the existing `CB-GOV-FAST-001` Work Order and PR #79 rather than creating overlapping paperwork or a second fast-lane policy. Measure reduced handoffs and duplicate source reviews in the existing pilot; no efficiency result is asserted yet.

**Boundary:** this operational routing does not modify accepted GEF v1.1.2 ADR-0008 (which delegates code execution/tests to Codex), authorize application/security code via ChatGPT, introduce new module admissions, or bypass current review and CI. If the Owner wants ChatGPT to implement application code directly, first propose a separate, explicitly reviewed ADR/authority change and validate its effect. Do not interrupt or alter the M05 HIGH_ASSURANCE R75 execution; keep its unpublished local state distinct from observable GitHub evidence. No automatic product merge, deployment, paid provider access, rights clearance, checkpoint promotion or downgrade of security tests.
