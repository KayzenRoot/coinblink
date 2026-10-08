# Evidence Bundle · CB-GOV-004 initial checkpoint and M00 admission candidate

**Verdict:** `CHECKPOINT_CANDIDATE_VALID / M00_NOT_ADMITTED / APP_CODE_NOT_STARTED`.
**Repository:** `KayzenRoot/coinblink`; governance base main `97ac1d0d08685cb5012eca6a6b08734d7f2e57e0`.
**Branch:** `codex/cb-gov-004-checkpoint-admission`.
**Issue:** https://github.com/KayzenRoot/coinblink/issues/7
**Owner source authority:** M00-only Scope/Requirements/Architecture/Security/DoD approved in PR #30 comment `6067708856`, for source HEAD `84f6c02a119259806d230470efc115162d733855`.

## Tool and source identity

- Direct checkout, remote `origin=https://github.com/KayzenRoot/coinblink.git`; candidate starts from current `main`/`origin/main` `97ac1d0d08685cb5012eca6a6b08734d7f2e57e0`.
- Node.js `v22.23.3`, npm `10.9.2`, Git `2.55.0.windows.5`, GEF CLI `1.1.2`, pinned official GEF source `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.
- The previously recorded local adoption file `.gef/adopt-state.json` is preserved with SHA-256 `825b582aaa2b0e1a265aea0e020f08e33731a06f7c2d1d4b03357fd688834b95`. It is adoption/drift-baseline evidence only, untracked and excluded from this PR; no receipt or private recovery journal is included.
- `gef adopt --apply` was performed once under the prior diagnosis, returned `effect=CONFIRMED` / transaction `APPLIED`, and created the adoption state only. It was not repeated. `init`/`adopt` previews remain read-only.
- Candidate `gef init --json`: exit `0`, effect `NONE`, install `READY`; drift preview `UNEXPECTED`. No apply flag was used.
- Candidate `gef adopt --json`: exit `0`, effect `NONE`, canonical selection `.engineering/CHECKPOINT.json` / `READY`, recovery `READY`, backup verified `true`; repository observed `DIRTY` from the governance edits. No apply flag was used.
- `.gef/adopt-state.json` SHA-256 before and after both previews was unchanged: `825b582aaa2b0e1a265aea0e020f08e33731a06f7c2d1d4b03357fd688834b95`.

## Baseline before CB-GOV-004 candidate

On exact main `97ac1d0d08685cb5012eca6a6b08734d7f2e57e0`, before adding the proposed JSON:

- `gef doctor --json`: exit `0`; toolchain/repository observable findings healthy; governance `.engineering/CHECKPOINT.json` `present=false`, `readable=false`, `valid=false`, `GOVERNANCE_SOURCE_ABSENT`; dependency provenance `unverified` / `REVIEW`; digest `2393e8e0d4b147276669e17300112faa42709bf91afea0ccb4d0a6f85ae337b8`.
- `gef status --json`: exit `0`; repository clean/observed; release checkpoint absent/invalid; progress `null`; adoption drift baseline recorded at `.gef/adopt-state.json`; digest `a19babf707e1bd0b4c1e6825284a226023a40990409bd0be2b1484842131dee6`.
- No `doctor`, `status`, `init` or `adopt` command created `.engineering/CHECKPOINT.json`.

## Official GEF checkpoint interpretation

At the exact upstream pin, CLI v1.1.2's project observer accepts `schemaVersion: 2`; it validates object shape, supported version, types for projected production fields, percentage range `0..100`, and `v11` as object or null. Fields not established by a supported project source are omitted, including production weight denominator and earned weight. The M17 `CanonicalContinuationCapsule` schema v1 is a separate continuity model and is not used here. `doctor` and `status` are read-only; neither creates or promotes a project checkpoint.

Sources: [GEF v1.1.2 CLI README](https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/packages/cli/README.md), [checkpoint observer implementation](https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/packages/cli/src/registry.ts), [separate M17 continuation type](https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/packages/checkpoint-engine/src/types.ts).

## Candidate checkpoint and precommit validation

`.engineering/CHECKPOINT.json` records source main `97ac1d0...`, PR #30's bounded M00-only Owner approval, no started application implementation, no deployed Preview, no admitted/done modules, and `overallCompletionPercent: 0` for application implementation. It omits weighted fields because no CoinBlink production-weight denominator has been approved. It does not claim M00 admission.

Precommit candidate checks on 2026-10-08:

- `npm test`: exit `0`, 8/8 passed, including conservative checkpoint facts, GEF doctor/status validation, official package integrity/SLSA provenance check, and existing workflow/tooling tests.
- GEF `doctor --json`: exit `0`; checkpoint `present=true`, `readable=true`, `valid=true`; no governance observation limits; repository observable `HEALTHY`; dependency provenance remains `unverified`.
- GEF `status --json`: exit `0`; checkpoint `present=true`, `readable=true`, `valid=true`; progress `0`; operator `stale=false`. The worktree was `DIRTY` because the governance candidate was being edited; this is not represented as a clean-tree result.
- `npm audit --audit-level=high`: exit `0`, zero vulnerabilities.
- `npm audit signatures`: exit `1`, registry `E404` for bundled internal package `@gef-bootstrap/preflight@0.0.0`. No check was disabled. The repository's existing official GEF tarball/SLSA provenance test passes, while GEF's aggregate dependency provenance remains `REVIEW`; do not claim signature-audit PASS.

These precommit command results prove the candidate parser projection, not a canonical main checkpoint. Exact final-head results and GitHub checks must be recorded against the pushed candidate SHA. After an authorized governance merge, rerun the GEF observer on the resulting exact `main` SHA and refresh the Context Lock before formal admission.

## Remaining gates

- The governance PR is not merged; its checkpoint is a candidate, not yet canonical on `main`.
- A post-merge Context Lock must be refreshed with the actual merge SHA. The current lock is candidate-only and expressly not executable.
- Exact-head GitHub checks, independent review and separate formal admission remain pending.
- No app source, dependencies, Cloudflare resources or production secrets are added by this remediation. M00 local implementation remains stopped until the formal admission gate passes.
