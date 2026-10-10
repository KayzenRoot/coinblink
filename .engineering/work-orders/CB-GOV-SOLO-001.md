# Work Order CB-GOV-SOLO-001 — Controlled Solo-Maintainer Review Decision

**Status:** OWNER_DIRECTION_APPROVED / GOVERNANCE_CANDIDATE_NOT_EFFECTIVE
**Issue:** #45
**Repository:** KayzenRoot/coinblink
**Source base:** `e98d581c7306ab255af9b96e7c046db6f49acf12`; **stacked implementation base:** PR #44 head `f1a3c4fec5216aafddd8fd3803db71c006a0d289`.
**Risk:** ELEVATED for this governance decision (changes assurance rules). **Implementer:** ChatGPT governance documentation only; Codex remains exclusive code/test/CI implementer. **No module implementation admission.**

## OBJECTIVE
Promote the Owner's explicitly authorized solo-maintainer LOW/STANDARD review exception through documented governance, without faking an independent human GitHub APPROVE or bypassing actual GitHub controls.

## CONTEXT / FILES AND SOURCES TO READ
Current main SHA, PRs #44 and #41, Issue #45 and Owner exception comment on #44, GEF pinned ADR-0008, `.engineering/CHECKPOINT.json`, Source Hierarchy, Decisions Ledger, Scope, Architecture, Security, Definition of Done, `AGENTS.md`, ADR-CB-0002 and actual CI/reviewer results. Pinned review evidence is snapshot-specific; revalidate before adoption.

## SCOPE
Create proposed ADR-CB-0003, an additive Source Hierarchy clarification, a new Decisions Ledger entry, and proposed no-op checkpoint delta. Distinguish independent technical review from independently authenticated GitHub APPROVE. Exact-SHA evidence, Owner go/no-go, correction loop, risk classification and conflict-of-interest disclosures remain mandatory. This policy shall operate only after its own authorized merge and record in canonical main.

## OUT OF SCOPE
No product/module files, tests or CI authored by ChatGPT, retroactive approval claims, branch protection alterations, Cloudflare setup/deploy, security control reduction, high-assurance waiver, M01+ implementation, issue #6 global approval, M18 token, force push/history rewrite, auto-merge or checkpoint promotion.

## REQUIREMENTS / ARCHITECTURE RULES / CONSTRAINTS
- LOW/STANDARD only: permit Owner's explicit SHA-specific go/no-go after objectively independent technical audit by a reviewer other than the implementation executor; if recorded on the same GitHub identity mark **NOT_INDEPENDENT_GITHUB_APPROVE** truthfully.
- ELEVATED/HIGH_ASSURANCE, money, Web3/signing, privileged auth, critical security, destructive migrations, production/billing, irreversible actions: never use this exception; qualified independent approval and heightened checks required. If classification is disputed, use stricter class.
- GitHub-enforced protections and provider gates are never bypassed. No incomplete CI, stale HEAD, known HIGH/CRITICAL defect, missing Evidence Bundle or missing rollback plan.
- A technical review is independent *from the code executor* only if the auditor inspected actual diff and evidence and did not author the patch; identify role and limitations. It never impersonates another GitHub identity.
- Merge serially, update dependent PRs by normal merge (no rewrite), rerun CI/review at combined SHA; checkpoint only from objective approved release gates.
- GitHub policy change is a proposal until merged, and source hierarchy may not be used to override higher GEF policy.

## ACCEPTANCE CRITERIA / TESTS
1. Current repository source conflicts and higher-policy prerequisites are documented; no approved product DoD altered.
2. ADR is explicitly restricted to LOW/STANDARD, correctly handles rejection/rollback and separate external approvals.
3. Owner instruction, exact review evidence, CI and limitations are linked; no false APPROVE.
4. Diff includes only the explicitly authorized governance documents; lint/typecheck/build/unit/E2E/GEF/exact-head CI and independent technical review are verified on the eventual candidate.
5. All 19 modules and admissions unchanged, M18 FUTURE.
6. Policy adoption occurs only upon distinct authorized merge and canonical read-back, while PR #44 and #41 remain separately governed.

## DELIVERABLES / REVIEW FORMAT
ADR, additive source-reference and ledger status, this WO, Context Lock and no-op Checkpoint Delta, evidence links, proposed PR. Final auditor report in Brazilian Portuguese with base/head SHA, exact checks, risk, remaining external constraints and APPROVED / CORRECTION REQUIRED / BLOCKED.

## STOP CONDITION
Stop on stale source, failing CI, material ELEVATED/HIGH_ASSURANCE impact without independent reviewer, tool-imposed write/merge prohibition or missing authorization. Never claim this PR merges itself or grants M01+ admission.
