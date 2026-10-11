# Work Order CB-GOV-SOLO-001 — Controlled Owner-Solo Review Policy

**Status:** PROPOSED / ELEVATED / NOT EFFECTIVE
**Repository:** `KayzenRoot/coinblink` · **Issue:** #45 · **PR:** #46
**Current source main:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`
**R1 normal-merge synchronization commit:** `d9d6e54b1697387088cf33712037a70b3e8f2db2`
**Candidate branch:** `codex/cb-gov-solo-001` · **GEF:** 1.1.2
**Risk:** ELEVATED. The proposal changes repository-wide assurance policy. It does not authorize application code, a ruleset change, or a merge.

## Objective
Prepare a truthful, bounded Owner-Solo governance proposal for future LOW/STANDARD work. Do not simulate independent GitHub approval, disable or bypass an effective rule, or apply the proposal before its own assurance and adoption gates are met.

## Current verified context
- Live `main` is `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. The canonical checkpoint is M00 COMPLETE / 5%; M01 and M05 are ADMITTED but incomplete; M02–M04 and M06–M17 are NOT_ADMITTED; M18 is FUTURE_NOT_ADMITTED; no active Work Order or `stopState` is present.
- `ADR-CB-0002` is adopted on current `main`. That does not waive individual module gates or authorize additional implementation here.
- Ruleset `coinblink-main-governance` ID `24888106` is active only for `refs/heads/main`, has no bypass actors, requires one eligible distinct approving review and seven status contexts (six app-bound check-runs plus CodeRabbit), plus thread resolution and squash-only merge. The effective-rules API confirms these requirements; the classic branch-protection endpoint returns 404 and is not used as proof.
- PR #46's previous HEAD `342ae16be15d69250eb0ed004b77f9cc02140ede` used base `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`; its old checks, lock, and audit are historical. R1 merged current `origin/main` normally, preserving the eight-path candidate scope. The Source Hierarchy and Decisions Ledger conflicts were resolved from current main plus additive proposal text.
- The Owner's direction is recorded in Issue #45 comment `6112608146` and PR #46 correction comment `6112611949`. These authorize preparation, not a different-person GitHub APPROVE or adoption of the policy.

## Scope and exact write boundary
Update only these eight paths in this PR:
1. `.engineering/SOURCE-HIERARCHY.md` (additive status/policy reconciliation only)
2. `docs/DECISIONS_LEDGER.md` (append-only CB-DEC-044 proposal record)
3. `docs/architecture/ADR-CB-0003-SOLO-MAINTAINER-REVIEW.md`
4. `.engineering/work-orders/CB-GOV-SOLO-001.md`
5. `.engineering/context-locks/CB-GOV-SOLO-001.md`
6. `.engineering/evidence/CB-GOV-SOLO-001-CHECKPOINT-DELTA.md` (no-op only)
7. `.engineering/evidence/CB-GOV-SOLO-001-EVIDENCE.md`
8. `.engineering/evidence/CB-GOV-SOLO-001-FINGERPRINTS.json` (self-excluded from file entries)

No workflow/verifier/tests, checkpoint, global Scope/Architecture/Security/DoD, application, secrets, Cloudflare resources, or other Work Orders are editable here. A trusted Owner Solo Gate or any CI/ruleset change requires a separate steward-owned Work Order and PR with explicit admission; this candidate does not implement one.

## Policy requirements
- The proposal is prospective and LOW/STANDARD only. Require a current admitted Work Order/Context Lock/path manifest, objective non-author technical audit, exact required checks, security/regression results, closed findings, provenance Evidence Bundle, and Owner GO/NO-GO tied to the full final SHA.
- Always describe an author `COMMENTED` review as `NOT_INDEPENDENT_GITHUB_APPROVE`. Technical separation by a non-authoring tool/agent does not become a different-human approval.
- The live ruleset still requires one distinct eligible GitHub approval. Do not lower it, add bypass, grant write to another Owner-controlled identity, fake a bot status, or merge against GitHub's decision.
- This ADR and its adoption are ELEVATED. M05 remains HIGH_ASSURANCE. Unknown risk is escalated. Keep security, auth/MFA/recovery, secret vault, money, billing/Paid, production/provider mutation, destructive migration, custody/signing and irreversible actions outside Solo.
- Any trusted verifier must run from protected-main-controlled code, use least permissions and read only PR metadata/diffs/reviews, never execute untrusted PR code with secrets/write access, and fail closed. Adversarial tests and a separately governed transition are prerequisites before any live rule change.
- Preserve exactly 19 modules and the canonical checkpoint. M00 remains COMPLETE/5%; M01/M05 remain admitted but incomplete; M02–M04 and M06–M17 unadmitted; M18 future. Do not claim module completion or move the checkpoint.

## Acceptance and validation
- The PR diff is exactly the eight listed paths; no conflict markers, no unexpected paths, no secrets, and `git diff --check` passes.
- The Context Lock fingerprints current canonical sources at `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; the manifest validates base, index, worktree, and candidate blob hashes.
- GEF Bootstrap 1.1.2 `doctor` and `status` are executed and reported without fabricating a baseline or suppressing warnings.
- Exact final PR HEAD receives all six required provider-bound check-runs and a fresh hosted CodeRabbit review. The active ruleset's distinct review and an explicit final-SHA Owner GO/NO-GO remain separate gates.
- Local application suites may only be claimed when run with the repository-pinned Node 22/npm 10 toolchain. The current workstation exposes Node 24.19.0/npm 11.17.0; do not use it to claim pinned conformance.

## Stop conditions
Do not change the active ruleset, implement CI gate code in this PR, merge, self-approve, alter the checkpoint, start module code, or touch Cloudflare. Stop at the first missing qualified ELEVATED assurance, required distinct reviewer, exact-head result, or Owner SHA-bound GO/NO-GO. Report the precise external gate and leave the proposal ineffective.
