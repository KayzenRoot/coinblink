# Evidence Bundle · CB-GOV-005 M00 admission correction

**Verdict:** `CORRECTION_CANDIDATE / NOT_YET_EFFECTIVE / APP_NOT_STARTED`.
**Repository:** `KayzenRoot/coinblink`; Issue #7.
**Governance base:** `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f` (current `origin/main` at task start; CB-GOV-004 / PR #31).
**Candidate branch:** `codex/cb-gov-005-m00-admission`.
**Exact PR HEAD and remote check/review run URLs:** see PR #32 and the current CB-GOV-005 Issue #7 correction evidence comment. This file is part of the candidate commit, so its own commit SHA is recorded externally rather than self-referenced here.

## Preserved local state and base audit

- Confirmed the local branch base exactly matched the fetched `origin/main` SHA above before candidate edits. The previous `codex/cb-gov-004-checkpoint-admission` branch was left intact.
- `.gef/adopt-state.json` remained local and untracked; its SHA-256 before edits was `825b582aaa2b0e1a265aea0e020f08e33731a06f7c2d1d4b03357fd688834b95`. It was not staged, copied or rewritten. No repository `gef init` or `gef adopt` was run.
- Audited all 26 fingerprint rows from the canonical main Context Lock against current Git blob IDs; all 26 matched. Twenty tracked checkout files differed from their canonical blobs only by Windows CRLF conversion. After verifying those exact files, normalized them to canonical LF bytes; raw-file SHA-256 then matched the locked values. No hard reset or content overwrite was used. `.gitattributes` remains the LF policy source.
- The project dependency tree was already present. No GEF package installation or local `npm ci` was run. The locked `npm ci` validation remains part of the GitHub workflow.

## Original candidate validation · HEAD `4efb6022e841ce0babeea1e43ba8c983cd30a679`

The following results are historical and apply to the pre-correction candidate HEAD only. They do not validate the correction below.

## Prior local toolchain and validation

| Check | Result | Evidence |
|---|---|---|
| Node | PASS | `v22.23.3`, Windows x64 |
| npm | PASS | `10.9.2` (`npx --yes npm@10.9.2 --version`) |
| GEF CLI | PASS | `1.1.2`, reported runtime `v22.23.3` |
| GEF `doctor --json` | PASS with REVIEW findings | Read-only; governance present/valid; repository observable `HEALTHY`; dependency provenance `unverified` / `REVIEW`; no bypass |
| GEF `status --json` | PASS | Read-only; candidate checkpoint valid; progress `0`; state `M00_ADMISSION_CANDIDATE`; local tree reported `DIRTY` while governance edits were in progress; `stale: false` |
| `npx --yes npm@10.9.2 test` | PASS | 8 tests passed, 0 failed, including the new M00-only admission/refusal assertions and the disposable-target init safety test |
| `npx --yes npm@10.9.2 audit --audit-level=high` | PASS | `found 0 vulnerabilities` |
| `npx --yes npm@10.9.2 audit signatures` | REVIEW | Exit 1 / E404 for `@gef-bootstrap/contracts@0.0.0`; retain for Owner review; signature checks were not disabled |

The local `doctor`/`status` runs were read-only and were performed while the candidate source files were modified. Their output does not claim exact-head GitHub CI or independent review.

## Prior candidate checkpoint facts

- Proposed formal Work Order: `CB-M00-WO-001`, effective only on a reviewed/Owner-audited merge.
- Application implementation: `NOT_STARTED`; completion: `0%`; preview: `NOT_DEPLOYED`; production weights omitted.
- Candidate admission covers M00 only. M01–M17 remain `NOT_ADMITTED`, M18 remains `FUTURE_NOT_ADMITTED`, and global Issue #6 stays open.
- No application source, dependency change, provider secret, Cloudflare resource or deployment was added by this governance candidate.

## Correction delta · CB-GOV-005-CD-001

- **Correction base:** `4efb6022e841ce0babeea1e43ba8c983cd30a679`; PR #32, branch `codex/cb-gov-005-m00-admission`.
- **Review addressed:** GitHub review `#5463530567`, finding CR-01; checkpoint status/phase/stop state contradicted the proposed admitted state because GEF does not promote fields during merge.
- **Checkpoint target:** `status=M00_ADMITTED`, `phase=IMPLEMENTATION_NOT_STARTED`, `overallCompletionPercent=0`, no `stopState`; only M00 is admitted. `applicationImplementation=NOT_STARTED`; preview remains `NOT_DEPLOYED`; production weights remain omitted.
- **Candidate authority boundary:** `candidateBranchCodeAuthority=NOT_AUTHORIZED_BEFORE_MERGE`; exact-head checks, independent review, Owner audit and merge are required. While the PR is open, canonical `main` remains M00-not-admitted and application code remains prohibited.
- **Implementation base:** no future merge SHA is fabricated. After admission, the implementation must use a fresh branch from the actual resulting `main` SHA and record it in that execution's Context Lock and evidence.
- **Files:** checkpoint JSON/narrative; Source Hierarchy; Work Order; Context Lock; admission and DoD; root agent contract; admission test; this Evidence Bundle.

## Correction validation · reviewed candidate HEAD `55fe48a24ba494eb0628a3fc1a9faf9beb4e40d6`

| Check | Result | Evidence |
|---|---|---|
| GEF 1.1.2 `doctor --json` | PASS / REVIEW | Exit 0; checkpoint present/valid, repository observable healthy; dependency provenance remains `unverified` / `REVIEW`. No finding was suppressed. |
| GEF 1.1.2 `status --json` | PASS | Exit 0; checkpoint valid, `M00_ADMITTED`, `IMPLEMENTATION_NOT_STARTED`, 0%, `stale=false`; repository verdict `CLEAN`. |
| GEF `init` preflight | PASS plan / REVIEW drift | Read-only `effect=NONE`, install plan `READY`; drift is `UNEXPECTED` after candidate edits. No repository `init --apply`, `adopt`, or installation was run. |
| Context Lock fingerprints | PASS | 27/27 locked Git blob SHA-1 values and raw-file SHA-256 values match. The payload tree was recomputed from the staged index with only the Context Lock excluded and matched the value stored in that lock. Its digest is not duplicated here: this Evidence Bundle is itself included in that tree, and repeating the digest here would change the tree. The exact recalculated value is recorded in the current Issue #7 correction comment. |
| `npm test` | PASS | Node `v22.17.0`, npm `10.9.2`; 8 passed, 0 failed. The official Node.js archive was SHA-256 checked against its release manifest (`721ab118a3aac8584348b132767eadf51379e0616f0db802cc1e66d7f0d98f85`) and used from a temporary path. |
| Security | PASS / REVIEW | `npm audit --audit-level=high`: 0 vulnerabilities. `npm audit signatures`: E404 for `@gef-bootstrap/kernel@0.0.0`; GEF dependency provenance remains `REVIEW`. No bypass or signature-check disablement. |
| Diff / secret scan | PASS | `git diff --cached --check`; credential/token signature scan of the staged diff returned 0 matches; 10 changed files, with no application/runtime/deployment paths. |
| GitHub Ubuntu / Windows CI | PASS on `55fe48a24ba494eb0628a3fc1a9faf9beb4e40d6` | [GEF Ubuntu](https://github.com/KayzenRoot/coinblink/actions/runs/37856416889/job/113581560292), [GEF Windows](https://github.com/KayzenRoot/coinblink/actions/runs/37856416889/job/113581560531), [Socket Project Report](https://github.com/KayzenRoot/coinblink/runs/113581552535), [Socket PR Alerts](https://github.com/KayzenRoot/coinblink/runs/113581568322), [SonarCloud](https://github.com/KayzenRoot/coinblink/runs/113581673532). |
| CodeRabbit independent review | PASS with no actionable comments on `55fe48a24ba494eb0628a3fc1a9faf9beb4e40d6` | [Final review summary](https://github.com/KayzenRoot/coinblink/pull/32#issuecomment-6069762899) identifies the reviewed commit and reports no actionable comments. |

No application code, runtime dependency, provider secret, Cloudflare resource or deployment is included. The candidate is not executable while PR #32 is open; do not start M00 implementation from this branch.

The CodeRabbit CLI review on pre-fix candidate HEAD `564f8daf27332047bd63c5b236b9cc594310d995` identified one major evidence mismatch: this bundle repeated an earlier payload-tree digest instead of the then-current value. This correction removes that stale duplicate and keeps the digest in the Context Lock and external exact-head evidence, avoiding a self-referential payload-tree value.

The evidence synchronization that records the final review result changes this bundle and its Context Lock fingerprint, producing a new candidate HEAD. Remote checks and CodeRabbit must therefore be revalidated on that exact HEAD; their final URLs and results, together with the new payload-tree digest, are recorded in the Issue #7 correction evidence comment and PR #32. Owner audit remains outstanding. The candidate is not executable while PR #32 is open; do not merge or start M00 implementation before the Owner's exact-head audit and authorized merge. The implementation branch must use the actual resulting `main` SHA.
