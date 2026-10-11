# Context Lock · CB-GOV-MAIN-001

State: LOCKED / GOVERNANCE-ONLY
Repository: KayzenRoot/coinblink
Base main SHA: 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c
Worktree identity: cb-gov-main-001 (logical name; host path omitted)
Branch: codex/cb-gov-main-001
Issue: #61, immutable runbook comment #6111675020, body SHA-256 9e15d5db830e4af2bc58aaf5f3770380bc63ff8c41bee4e407f5c5056d1733ae
GEF: 1.1.2, source commit af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82

## Live baseline
- GitHub main was read as 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c before branch creation and remained unchanged while the ruleset was applied.
- Before mutation, repository rulesets were empty, effective rules for main were empty, and the branch response reported protected=false.
- PR #58 base main SHA 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c; HEAD d15ec69529c88e77f9522701e3a9c04ee2e6058f.
- PR #59 base main SHA 07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c; HEAD d3b4d2d5cd407269bef76b533295e5855bcd2de1.
- The collaborator API returned only KayzenRoot with write/admin permissions. The ruleset therefore requires one distinct approving reviewer; no collaborator was added and the review requirement was not relaxed.
- Issue #45 and PR #46 remain open. The solo-maintainer exception is not adopted on canonical main. M05 remains HIGH_ASSURANCE.
- The Source Hierarchy and checkpoint at the base record M00 complete at 5%, M01/M05 admitted, M02–M17 not admitted, and M18 future/not admitted. This Work Order makes no checkpoint edit.

## Canonical source fingerprints
Git blob SHA-1 and SHA-256 of the exact canonical blob bytes at the locked base are in .engineering/evidence/CB-GOV-MAIN-001/source-fingerprints.json. Inputs include AGENTS, Source Hierarchy, checkpoint JSON/Markdown, Scope, Requirements, Architecture, Security, DoD, Decisions Ledger, parallel-delivery ADR, M01/M05 contracts, Work Orders, Context Locks, and admission evidence. Any change to those inputs requires a new source review; hashes do not grant authority.

## External policy snapshot
The exact create payload and separate GitHub GET read-backs are versioned under .engineering/evidence/CB-GOV-MAIN-001/. Ruleset ID 24888106 is active and targets only refs/heads/main; the effective-rules endpoint returns its PR, status-check, deletion, and non-fast-forward rules. The legacy branch-protection endpoint is not the source of truth for this ruleset.

The CodeRabbit commit-status context was observed as SUCCESS, but its status response exposed no creator/app identity. It is required without an integration binding and must be verified against actual GitHub review activity/status on every candidate; do not describe the context alone as an independent approval.

## Write boundary
Only this Work Order, its Context Lock, files under .engineering/evidence/CB-GOV-MAIN-001/, and the no-op proposed Checkpoint Delta may change. Canonical project decisions, checkpoint, application files, module branches/worktrees, PR #58/#59, provider resources, account permissions, and collaborator membership are read-only.

## Validation and stop
The live branch rule configuration is applied, but repository-documentation PR checks/review remain pending. PR #58/#59 are separately blocked by absent Owner GO/NO-GO and distinct approval; M05 additionally lacks a qualified independent reviewer and shared-route integration. Stop before merge or integration.
