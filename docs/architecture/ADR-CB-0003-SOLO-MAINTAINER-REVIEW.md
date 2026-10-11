# ADR-CB-0003 — Bounded Owner-Solo Review Policy

**Status:** PROPOSED / ELEVATED / NOT EFFECTIVE
**Work Order:** CB-GOV-SOLO-001 · **Issue:** #45 · **PR:** #46
**Owner direction:** Preparation of a bounded Owner-Solo process is authorized; that direction is not a distinct-human GitHub approval or policy adoption.
**Source main:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` · **GEF:** pinned ADR-0008 at `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.

## Context and current enforcement
CoinBlink has one write/admin identity, `KayzenRoot`. A second account controlled by the same Owner is not an independent reviewer. The live `coinblink-main-governance` ruleset (ID `24888106`) is active on `main`, has no bypass actors, and requires one eligible distinct approving review, exact checks, resolved review threads, and squash-only merges. This ADR cannot override that live rule.

The current checkpoint records M00 COMPLETE / 5%; M01 and M05 ADMITTED but incomplete; M02–M04 and M06–M17 NOT_ADMITTED; M18 FUTURE_NOT_ADMITTED. ADR-CB-0002 is already adopted on main. This ADR changes none of those states and does not authorize M01/M05 implementation or alter Cloudflare.

## Proposed decision — future LOW/STANDARD work only
After formal adoption through a separately assured ELEVATED transition, an Owner may record a truthful, reviewable acceptance tied to the full final PR SHA only when all conditions are satisfied:

1. One admitted Work Order and current Context Lock define scope, dependencies, immutable inputs, exclusive path ownership, tests, evidence, and stop conditions.
2. A technical auditor who did not author or execute the change inspects the actual final diff, relevant sources, interfaces, error paths, security and regressions, then records findings, severity, rationale, and limitations. Automated checks alone are not the audit.
3. The change is classified from actual changed paths and behavior; disputed or unknown risk is elevated. PR labels and self-declared categories are not trusted inputs.
4. Exact-head required CI/security tests pass; all findings are resolved; a provenance Evidence Bundle and applicable rollback evidence are complete.
5. The Owner records a GO/NO-GO for that exact full SHA. A same-account `COMMENTED` review is reported as `NOT_INDEPENDENT_GITHUB_APPROVE` and never represented as a distinct-human approval.
6. The normal GitHub merge process must still accept the change. Under the current ruleset, the distinct approving reviewer remains required. No bypass, fake identity/status, or merge against GitHub enforcement is permitted.
7. Post-merge main SHA, CI, and checkpoint effects are read back. Merges remain serial unless a validated merge queue is separately adopted.

## Separate trusted enforcement prerequisite
The current repository-wide one-review rule cannot itself select approvers by risk. If a future governance transition changes that rule, it must be a separate ELEVATED Work Order/PR. Its trusted Owner Solo Gate must be sourced from already-protected main and app-bound; it must verify Owner identity, exact SHA/base, actual changed files and risk, reviewer and hosted CodeRabbit findings, exact required checks, and prohibited operations using GitHub metadata APIs. It must fail closed on missing, stale, forged, ambiguous, or unavailable evidence. It must not check out or execute untrusted PR code with secrets or write permissions. A workflow implementation and negative tests are explicitly outside this ADR's eight-path write scope and require separate admission and audit. `pull_request_target` is not acceptable for untrusted checkout or execution.

## Exclusions
Owner Solo does not apply to this ELEVATED policy change, any ruleset/workflow/verifier/grant change, M05 or other HIGH_ASSURANCE work, authentication/MFA/recovery, secrets/vault, money/trading, billing/Paid, production or Cloudflare resource mutation, destructive migrations, Web3/signing/custody, irreversible operations, or unresolved HIGH/CRITICAL defects. These require qualified independent assurance and all separate Owner/provider permissions. No risk downgrade by editing labels or prose.

## Adoption, correction, and rollback
This ADR is prospective only. Adoption requires a qualified independent assurance review of the final ELEVATED diff, required exact-head CI and CodeRabbit, closure of HIGH/CRITICAL issues, an actual eligible distinct GitHub approval under the current ruleset (unless a separately governed transition has legitimately changed enforcement), explicit Owner GO/NO-GO for the final SHA, normal merge, and canonical read-back. If any gate is unavailable, the policy remains ineffective. Corrections require new exact-head checks and review; no force-push or retroactive blessing. Suspected misuse suspends the exception and must be handled by a new governed change.

## Parallel delivery and Cloudflare
ADR-CB-0002 is adopted on main; this proposal neither changes that delivery method nor closes global planning, grants additional module admission, or authorizes module implementation. Current module admissions remain as stated in the canonical checkpoint. Existing Cloudflare Preview isolation and account controls remain separate; no resource, secret, billing, production, or deployment action is included.

## Rejected alternatives
- Treating an Owner `COMMENTED` review as a GitHub `APPROVE`.
- Granting write to an Owner-controlled second account solely to rubber-stamp.
- Lowering approval counts, enabling bypass, or weakening checks in this Work Order.
- Applying the LOW/STANDARD exception to ELEVATED/HIGH_ASSURANCE changes.
- Executing PR-controlled workflow code with privileged secrets or permissions.
