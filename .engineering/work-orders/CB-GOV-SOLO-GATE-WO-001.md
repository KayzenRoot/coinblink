# CB-GOV-SOLO-GATE-WO-001 | Owner Solo Attestation Gate

**Status:** OWNER_AUTHORIZED_CANDIDATE / FORMAL GEF ADMISSION PENDING. **Risk:** ELEVATED governance. **Parent Issues:** [#63](https://github.com/KayzenRoot/coinblink/issues/63), [#64](https://github.com/KayzenRoot/coinblink/issues/64). **Source main:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` (must refresh on main movement). **Owner:** KayzenRoot. **Executor:** Codex Desktop LOCAL. **Delivery:** dedicated draft PR from branch `codex/cb-gov-solo-gate-wo-001`. **Output:** trustworthy, inert until separately admitted/reviewed; NO active ruleset mutation.

## Authority and precedence

Owner responded "Continue" immediately to the explicit question to approve #64. This authorizes a candidate implementation in a separate branch, **not canonical adoption of a new merge policy**, not a Github independent APPROVED review, and not activation of a trusted Actions integration. Read current canonical Source Hierarchy, Scope, Requirements, Architecture, Security, DoD, Decisions Ledger, AGENTS, checkpoint, ADR-CB-0002, proposal ADR-CB-0003 and GEF ADR-0008 before writes. If GEF's admission checks prohibit all candidate implementation before a merged admission, STOP at R0 and report the gate rather than bypass it. GEF and source authority win over this candidate WO.

## Fixed boundary

Current main is protected by `coinblink-main-governance` ruleset #24888106 with one **distinct eligible human GitHub APPROVE**, six required CI check-runs + CodeRabbit; no bypass. An owner-only `COMMENTED` audit and a passing machine attestation do **not** satisfy the current GitHub reviewer requirement. PR #46 Owner Solo policy is ELEVATED and **NOT EFFECTIVE**. No account substitution or spoofing.

**Effective admission state, not to be confused with completion:** The machine checkpoint on main `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c` records M00 COMPLETE / 5%, M01 ADMITTED in its bounded Golden Home scope and M05 ADMITTED for **P0 nonprivileged static MOCK only**. The `moduleAdmissionEvidence` text `EFFECTIVE_ONLY_AFTER_OWNER_APPROVED_REVIEWED_MERGE` refers to the admission PRs: [#56](https://github.com/KayzenRoot/coinblink/pull/56) merged at `c4ba069f1dfaddc8273001950805e8a18125db66`, and [#57](https://github.com/KayzenRoot/coinblink/pull/57) merged at `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. It does **not** refer to implementation PRs #58/#59, which remain OPEN/unmerged and not completed. The Source Hierarchy/Scope/Architecture narrative statements that M01–M17 were NOT_ADMITTED are historical M00-only snapshots, superseded on this narrow factual point by the merged admissions and current checkpoint; [draft #67](https://github.com/KayzenRoot/coinblink/pull/67) documents proposed source-history clarification without acquiring canonical force before merge. **M02–M04 and M06–M17 remain NOT_ADMITTED; M18 remains FUTURE_NOT_ADMITTED.** This separate ELEVATED governance candidate is *not* admitted by either module's admission; no R1–R4 runtime, workflow or ruleset authorization follows. Preserve all 19 IDs and the canonical checkpoint. M05 remains HIGH_ASSURANCE / MOCK-only here; no login/MFA/DB/vault/publishing is included.

## Exact path ownership

Allowed candidate writable files, **subject to actual Context Lock / GEF admission**:
- `scripts/governance/owner-solo/**` - pure risk classifier, evidence validator, Owner attestation parser, CLI for **offline test fixtures**.
- `test/governance/owner-solo/**` - deterministic `node:test` tests and fixtures (no real credentials).
- `.engineering/work-orders/CB-GOV-SOLO-GATE-WO-001.md` plus dedicated `.engineering/context-locks/CB-GOV-SOLO-GATE-WO-001.md`, `.engineering/evidence/CB-GOV-SOLO-GATE-WO-001/**` and own no-op checkpoint proposal.
- The admission PR itself may contain only these paths.

**Reserved / denied:** ALL `.github/workflows/**`, any other `.github/**`, `.engineering/CHECKPOINT.json`, existing source hierarchy/other WOs, `src/**`, layouts, build/package/dependencies, migrations, Docker/Cloudflare, provider secrets, network integration, deployments and rulesets. A workflow prototype requires distinct Integration Steward authorization and its own PR/WO, not this proposal.

## Rounds and checkpoints

**R0 PREFLIGHT:** validate main SHA and every source blob in Context Lock, risks, main ruleset readback, clean local worktree; generate threat model and empty/no-op delta. Worktree must not touch main checkout. Missing GEF authorization => `STOP_ADMISSION_REQUIRED`.

**R1 RISK ENGINE:** pure deterministic input/output, exact immutable GitHub file paths/actions, unknown=BLOCKED. Exclude workflows, governance policy changes, M05, all ELEVATED/HIGH_ASSURANCE, security, DB/migrations, auth/MFA, credentials, payments/trading, Web3/custody, production/paid provider changes. Never let PR labels or the PR author self-classify down.

**R2 PROVENANCE:** pure validator of server-provided, signed/trusted normalized metadata: repo, PR, base+head SHA, current main, changed path manifest, allowed WO paths, full check-run contexts and GitHub Apps, hosted CodeRabbit source review, zero unresolved threads, evidence and non-executor audit. Missing/ambiguous => BLOCKED.

**R3 ATTESTATION:** parse exact full SHA Owner decision bound to repo+PR+base and last push, verify owner actor numeric ID `114633702` using trusted API data; edit/deletion/staleness => invalidate. Return `PASS_TECHNICAL`, `WAIT_OWNER`, `STALE`, `BLOCKED_RISK`, `BLOCKED_EVIDENCE`, `BLOCKED_REVIEW`; never `GITHUB_APPROVED`.

**R4 ONLY AFTER SEPARATE STEWARD ADMISSION:** evaluate metadata-only trusted-main `pull_request_target` workflow in a distinct security WO. Never execute PR-controlled scripts with write privilege. No implementation or workflow write under this WO.

## Mandatory tests / proof

At least 20 negative cases from [Issue #64](https://github.com/KayzenRoot/coinblink/issues/64): fake owner, stale/edited/deleted comment, new HEAD/base, wrong repo/PR, label fraud, M05, governance changes, new/renamed/deleted/case/symlink path escape, CI App mismatch, missing/forged CodeRabbit, open thread, missing WO, race, fork/untrusted checkout, privileged/secret attempt, missing main protection, fake human review and HIGH/CRITICAL finding. Include one strictly valid LOW/STANDARD fixture that reaches `PASS_TECHNICAL` but remains NOT merge-authorized under current GitHub rules. Tests should prove fail-before/pass-after where applicable and never contact paid/live providers. Use Node 22/npm 10, no dependency edits; lint/typecheck/GEF and hosted CI on exact PR HEAD when available.

## DoD / Evidence Bundle

- Source SHA and exact path-ownership manifest; Context Lock fingerprints (git blob SHA-1, SHA256), Git diff/check transcript.
- Reproducible local test outputs and 20+ negative adversarial fixtures; report every known limitation.
- No privileged action by code, no cloud/network/provider side effects, no new required check/context bound until separate review.
- GitHub draft PR with exact HEAD, 6/6 CI and CodeRabbit, Sonar triage and separate technical audit, any findings corrected; no fabricated approvals.
- No-op canonical checkpoint delta; risk ELEVATED and stop state documented.
- Distinct future owner decision/gate for installing trusted workflow, amending branch ruleset and preserving HIGH_ASSURANCE independent assurance.

**STOP CONDITION:** no canonical admission claim before legitimate GEF review/merge; no workflow activation, no rule removal/change, no bypass, no merge, no Owner impersonation, no second controlled account used for approving, no production, provider, spending, auth/DB, or checkpoint percentage update. If blocked, produce `BLOCKED / PREPARED` with precise reason and evidence.
