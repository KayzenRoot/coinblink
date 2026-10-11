# Work Order CB-GOV-MAIN-001 · Enforce and verify main governance

Status: CONFIGURATION_APPLIED / EXACT_HEAD_OWNER_AUDIT_PENDING
Repository: KayzenRoot/coinblink
Issue: #61
Base main SHA: 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c
Branch: codex/cb-gov-main-001
Executor: Codex Desktop LOCAL
GEF: Bootstrap 1.1.2
Risk: Elevated — repository merge policy
Checkpoint: no change

## Objective
Apply the Owner-authorized repository ruleset for the exact main branch, verify its persisted and effective GitHub state, and revalidate the current exact heads of M01 PR #58 and M05 PR #59. Record remaining merge gates without merging, altering module branches, promoting a checkpoint, or authorizing product integration.

## Scope
- Create/update only the repository ruleset coinblink-main-governance, targeting refs/heads/main.
- Require pull requests, one approving review, approval after the last reviewable push, dismissal of stale approvals, resolved review threads, squash-only merging, strict current-head required checks, no bypass actors, no deletion, and no non-fast-forward updates.
- Bind six observed check-run contexts to their verified GitHub App IDs. Require the observed CodeRabbit status context without an integration binding because the commit-status API returned no source identity; verify its actual review/status source on each PR.
- Record immutable source fingerprints and live read-back evidence.
- Revalidate PR #58 and #59 metadata, exact-head checks, review states, and open review-thread counts.

## Out of scope
No application changes, shared-route integration, module work, Cloudflare calls, secrets, billing, checkpoint promotion, collaborator changes, merge, self-approval, bypass, force-push, or history rewrite.

## Acceptance
1. Main remains at the verified base SHA and the ruleset is active for only refs/heads/main.
2. The persisted ruleset has an empty bypass actor set, PR/review requirements, strict required checks, deletion protection, and force-push protection.
3. Effective branch rules read back from GitHub match the payload.
4. PR #58 and #59 are read back at their exact recorded HEADs and their observed check-runs/statuses are recorded with SHA attribution.
5. The canonical checkpoint remains M00 COMPLETE at 5%, with only M01/M05 additionally admitted as already recorded and M18 future; no checkpoint field is changed here.
6. Remaining Owner/reviewer/integration gates are explicit. The 1-review rule remains because CB-GOV-SOLO-001 / Issue #45 is still open and not adopted in canonical main.

## Validation
The Evidence Bundle records local GitHub CLI authentication, repository visibility/admin permission, initial and final main SHA, ruleset GET and effective rules GET, six exact check-run contexts and provider IDs, CodeRabbit commit status, PR base/head, review state and thread counts. Local full application tests were not run because the available runtime is Node 24.19.0/npm 11.17.0 while the project pins Node 22.19.0/npm 10.9.3. Deterministic source-fingerprint, policy-snapshot, checkpoint-invariance, and git diff checks passed. Exact-head GitHub CI is required and will be recorded in the Issue #61 update after publication.

## Stop condition
Leave PR #58 and #59 open. Stop before any merge or shared-route integration until each PR has its separate exact-SHA Owner GO/NO-GO and applicable review requirements. M05 retains HIGH_ASSURANCE and needs a qualified independent reviewer. No module completion or checkpoint promotion is claimed.
