# CB-GOV-TRANSITION-001 | One-time Owner Solo governance migration

**State: OWNER OPTION B APPROVED FOR PREPARATION / LIVE RULESET CHANGE NOT AUTHORIZED.**
**Risk: ELEVATED GOVERNANCE.** [Issue #68](https://github.com/KayzenRoot/coinblink/issues/68#issuecomment-6114752495) records the user's explicit "autorizo siga" to prepare Option B *conditional on proving the replacement trusted gate works*. This Work Order is a **proposed GEF candidate**, not canonically admitted or authorized to modify active rules, push main, merge a PR or enable external providers.

**Operator:** only the admin account `KayzenRoot`. Do not impersonate a second reviewer using other Owner-controlled accounts.

## Baseline and objective

Protected `main` at `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; ruleset `coinblink-main-governance` ID `24888106` ACTIVE, no bypass, one distinct GitHub APPROVE, strict seven required status contexts, PR-only and squash-only, thread resolution and stale/last-push protection. A read-only copy is `.engineering/evidence/CB-GOV-TRANSITION-001/RULESET-BASELINE.json`. The current human-review requirement is **not** satisfied by `CodeRabbit=success`, same-account `COMMENTED` audits or an Owner chat comment.

**Prospective future design:** for LOW/STANDARD only, use a trusted, **App-bound Owner Solo Gate** as an additional required status, together with the original seven checks, and only then propose changing universally required GitHub approvals from 1 to 0. For UNKNOWN/ELEVATED/HIGH_ASSURANCE (including all governance/CI/workflows, M05, real auth/data, paid providers, production, financial/custody and secrets), the trusted gate MUST return failure, unless separate qualified assurance is proven under separately adopted policy. Do not assert that zero universal reviewers itself provides HIGH_ASSURANCE protection.

## Rounds and hard gates

**T0 Baseline snapshot (READ ONLY):** Use `gh auth status`, `gh api repos/KayzenRoot/coinblink/branches/main`, `gh api repos/KayzenRoot/coinblink/rulesets/24888106`, `gh api repos/KayzenRoot/coinblink/rules/branches/main`; preserve actual full ruleset JSON privately, redact credentials if found and SHA-256 hash backups. Verify the snapshot matches this proposal, Source Hierarchy, GEF, issue #68, latest main and effective rule. On mismatch STOP.

**T1 Trusted offline engine (NO rule writes):** Under the separately admitted #64 Work Order, implement R1 risk classification, R2 SHA/base/CI+GitHub-App and CodeRabbit evidence verification, R3 exact-SHA Owner attestation, with at least 20 adversarial negative tests; run Node22/npm10 on a separate worktree. The current #65 R0-only PR remains draft and is STOP_ADMISSION_REQUIRED until legal GEF entry; no implementation is bootstrapped by this plan.

**T2 Trusted check installation (separate Steward-owned CI security WO):** Source executes from already trusted protected main only, no untrusted `pull_request_target` PR checkout, minimal token permissions, no secrets, no status spoofing or self-certification. Prove a real nonzero GitHub App integration_id, reliable event triggers, exact-head freshness, fail-closed error path, trusted provenance, and a *negative* HIGH_ASSURANCE block. No remote check claimed operational merely by designing one.

**T3 Trial and independent audit (NO rule writes):** Validate stale base/head, forged/edited/deleted owner comments, path label downgrade, wrong/absent CI App IDs, fake CodeRabbit green without hosted review, unresolved threads, M05 mock inheritance and unknown risk all fail. Test on a disposable nonproduction branch without weakening main. Record GEF/CI/CodeRabbit and an actual qualified ELEVATED assurance plan; if impossible record BLOCKED, not a pass.

**T4 Final second Owner go/no-go, diff and rollback (NOT GRANTED YET):** Prepare `gh api -X PUT repos/KayzenRoot/coinblink/rulesets/24888106 --input <owner-reviewed-payload.json>` solely as an unexecuted runbook command. Produce exact old/new payloads with just the approval-count delta `1 -> 0` and **simultaneous** addition of the proven required trusted App-bound gate. Preserve all original rules, required statuses, PR-only/squash-only, strict mode, no bypass and deletion/force-push restrictions. Require the Owner's **second explicit authorization bound to final exact rule diff, trusted App ID, tests and SHA** before executing any ruleset API write. Back up/read back before/after and independently prove forced/non-PR push rejection, invalid LOW block, HIGH_ASSURANCE block, and legitimate LOW acceptance; rollback on ANY failure. No no-protection gap is permitted.

**T5 Go/no-go for previous PRs:** ELEVATED PR #46/#62/#65/#67 are NOT automatically cleared even after any future review policy change. M05 #59 stays HIGH_ASSURANCE P0 MOCK; M01 #58 may only be assessed as STANDARD with genuine source/DoD/Owner gate proof. Do not promote 5% without full module completion.

## Non-negotiable STOP CONDITION

No live ruleset PUT/PATCH, no removal of review count, no merge or direct main push, no bypass/force push, no fake approving person, no untrusted privileged job, no paid provider, auth/DB/M05 P1, Cloudflare production, secrets or canonical checkpoint mutation during this preparation. If the trusted gate cannot be made operational under the current GEF and rules, return `STOP_TRUSTED_GATE_UNAVAILABLE` and request a separate explicit Owner risk decision, not a quiet override. Keep M00 COMPLETE/5%, M01/M05 ADMITTED but incomplete, M18 FUTURE.
