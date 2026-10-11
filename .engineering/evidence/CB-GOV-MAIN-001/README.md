# CB-GOV-MAIN-001 · Evidence Bundle

Observed at: 2026-10-11 18:32 UTC
Canonical main: 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c
Branch: codex/cb-gov-main-001
Ruleset: coinblink-main-governance, ID 24888106, enforcement active

## GitHub access and feature availability
- Local GitHub CLI authentication identified KayzenRoot; repository permission readback was admin.
- Repository is public. GitHub documentation says rulesets are available in public repositories on GitHub Free. This confirms feature eligibility without asserting an account billing plan or purchasing an upgrade.
- The collaborator list returned only KayzenRoot with write/admin permission.

## Persisted enforcement
Before configuration: ruleset list empty, effective rules for main empty, branch response protected=false.
After configuration:
- Ruleset read-back confirms active, target branch, condition exactly refs/heads/main, bypass_actors empty.
- Effective branch rules endpoint returns pull_request, required_status_checks, deletion, and non_fast_forward; branch response reports protected=true.
- Pull requests are required. One approval by an eligible reviewer is required, stale approvals are dismissed, latest reviewable push approval is required, review threads must be resolved, and only squash is allowed.
- Strict current-head status checks are required: Ubuntu GEF/M00, Windows GEF/M00, Docker Compose smoke, SonarCloud, both Socket checks, and CodeRabbit.
- Six check-runs are bound to observed provider App IDs: GitHub Actions 15368, SonarCloud 12526, Socket Security 156372. CodeRabbit is a legacy commit-status context; its status response had no creator/app identity, so its required context is not app-bound. Inspect actual status/review authors on every candidate.

A direct push was not attempted. Enforcement was verified non-destructively through the active ruleset and GitHub effective-rules read-back endpoint.

## Exact-head module PR audit
- PR #58 M01: base main / 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c; HEAD d15ec69529c88e77f9522701e3a9c04ee2e6058f; six check-runs SUCCESS at that exact SHA; CodeRabbit status SUCCESS; 8/8 review threads resolved; GitHub reviewDecision is REVIEW_REQUIRED under the active main ruleset.
- PR #59 M05: same base; HEAD d3b4d2d5cd407269bef76b533295e5855bcd2de1; six check-runs SUCCESS at that exact SHA; CodeRabbit status SUCCESS; 5/5 review threads resolved; GitHub reviewDecision is REVIEW_REQUIRED under the active main ruleset.
- PR #58 has a technical audit, but /en route integration, Golden visual acceptance, and individual Owner GO/NO-GO remain pending.
- PR #59 is an isolated static P0 mock with security/actions disabled, not a secured CMS. Its parent Work Order remains HIGH_ASSURANCE. A qualified independent reviewer, route integration, and individual Owner GO/NO-GO remain pending.

## Governance and checkpoint
Issue #6 is closed after the global first-beta Scope/Architecture/DoD and parallel-methodology approval. Issue #45 / PR #46 is still open; CB-DEC-044 is reserved and no solo-maintainer exception has been adopted. The one-approval gate therefore remains. With only KayzenRoot currently listed as a write collaborator, merges are blocked until an eligible independent reviewer is authorized or the exception is adopted through its normal reviewed governance process. M05 still requires qualified independent assurance even if a limited solo policy is adopted.

Checkpoint at base remains M00 COMPLETE / 5%; M01 and M05 ADMITTED; M02–M17 NOT_ADMITTED; M18 FUTURE_NOT_ADMITTED. No checkpoint promotion or module completion is claimed. No M01/M05 code or shared-route integration was started by this Work Order.

## Validation performed
- Exact main SHA, visibility, admin permission, collaborators, ruleset payload/read-back, effective main rules, PR bases/heads, check-runs, commit status, review states, and thread counts were fetched from GitHub.
- Snapshots are stored in this directory. Source fingerprints are in source-fingerprints.json.
- The local full application suite was not run because the available Node 24.19.0/npm 11.17.0 runtime is outside the project pin of Node 22.19.0/npm 10.9.3. Deterministic fingerprint/payload/checkpoint validation and git diff checks passed. Exact-head GitHub CI will be verified after publication and linked from Issue #61.

## Limitation and next action
The ruleset now enforces review and checks. There is no eligible second write collaborator in the repository response, so merges are intentionally blocked. The Owner's next action is to authorize an eligible independent reviewer, or complete normal reviewed adoption of the bounded solo policy for eligible LOW/STANDARD work. M05 still needs qualified independent assurance. Then provide exact-SHA GO/NO-GO separately for PR #58 and #59. Do not merge the module PRs together or promote the checkpoint.
