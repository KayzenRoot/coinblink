# Evidence Bundle · CB-GOV-005 M00 formal admission candidate

**Verdict:** `ADMISSION_CANDIDATE / NOT_YET_EFFECTIVE / APP_NOT_STARTED`.
**Repository:** `KayzenRoot/coinblink`; Issue #7.
**Governance base:** `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f` (current `origin/main` at task start; CB-GOV-004 / PR #31).
**Candidate branch:** `codex/cb-gov-005-m00-admission`.
**Exact PR HEAD and remote check/review run URLs:** recorded in PR and the CB-GOV-005 Issue #7 evidence comment after push. No exact candidate HEAD is asserted here before commit.

## Preserved local state and base audit

- Confirmed the local branch base exactly matched the fetched `origin/main` SHA above before candidate edits. The previous `codex/cb-gov-004-checkpoint-admission` branch was left intact.
- `.gef/adopt-state.json` remained local and untracked; its SHA-256 before edits was `825b582aaa2b0e1a265aea0e020f08e33731a06f7c2d1d4b03357fd688834b95`. It was not staged, copied or rewritten. No repository `gef init` or `gef adopt` was run.
- Audited all 26 fingerprint rows from the canonical main Context Lock against current Git blob IDs; all 26 matched. Twenty tracked checkout files differed from their canonical blobs only by Windows CRLF conversion. After verifying those exact files, normalized them to canonical LF bytes; raw-file SHA-256 then matched the locked values. No hard reset or content overwrite was used. `.gitattributes` remains the LF policy source.
- The project dependency tree was already present. No GEF package installation or local `npm ci` was run. The locked `npm ci` validation remains part of the GitHub workflow.

## Local toolchain and validation

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

## Candidate-only checkpoint facts

- Proposed formal Work Order: `CB-M00-WO-001`, effective only on a reviewed/Owner-audited merge.
- Application implementation: `NOT_STARTED`; completion: `0%`; preview: `NOT_DEPLOYED`; production weights omitted.
- Candidate admission covers M00 only. M01–M17 remain `NOT_ADMITTED`, M18 remains `FUTURE_NOT_ADMITTED`, and global Issue #6 stays open.
- No application source, dependency change, provider secret, Cloudflare resource or deployment was added by this governance candidate.

## Pending exact-head evidence

The candidate is not executable while its PR is open. After push, attach the exact base/HEAD, Ubuntu and Windows workflow results, final-head CodeRabbit review, secret-scan/lock verification and Owner audit state to the PR and Issue #7. Do not start app code before the Owner-authorized merge; the implementation branch must use that actual merge SHA.
