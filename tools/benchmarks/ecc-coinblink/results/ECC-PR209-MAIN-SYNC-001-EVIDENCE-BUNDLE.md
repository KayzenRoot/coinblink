# ECC-PR209-MAIN-SYNC-001 Evidence Bundle

**Recorded:** 2026-10-25 (UTC)
**Scope:** synchronize only PR #209's experimental ECC branch with the pinned `main`; no product code was edited.
**Status at source merge commit:** PASS; technical synchronization only. This is not approval to mark the PR ready, merge, install ECC, or run a pilot.

## Context lock and remote references

| Reference | Verified value |
|---|---|
| Repository | `KayzenRoot/coinblink` |
| Original PR #209 head | `26bf8e8bbafa26ceffdeb59e3c017d64a7e4c0e9` |
| Main before sync | `524a93a970af9cf8cfb411f8ba7aa9f57ca79603` |
| Merge base | `ad00d6a671f8af71c6e729d15347b261997ec75b` |
| Backup before/after sync | `51ee2e6f74561127b914cf6e9fee6903c008f2f8` |
| Source sync merge commit | `2bf9d8086d650754d00eee5104e2fcbc9c517014` |
| Merge parents (in order) | `26bf8e8bbafa26ceffdeb59e3c017d64a7e4c0e9`, `524a93a970af9cf8cfb411f8ba7aa9f57ca79603` |

The PR remains OPEN/DRAFT. The merge was a normal non-fast-forward, two-parent merge on the experimental branch. No force push, rebase, squash, main update, or backup update occurred.

## Tree, scope, and collision audit

- The source merge tree differs from pinned main by exactly 55 additions: the 55 paths already in the ECC PR. No main path was modified or deleted.
- The 55 ECC paths in the resulting merge tree are byte/mode-identical to original PR head `26bf8e8`; no ECC source was changed during synchronization.
- PR files are confined to the authorized ECC package and its opt-in skill/workflow paths. No symlinks were found in the merged tree.
- GitHub listed 22 open PRs with complete file lists (no pagination gaps). Case-insensitive path and file/directory-prefix comparison found zero collisions with PR #209. The new Evidence Bundle path also had zero collisions and was absent from main and the original PR head.
- PR #233 remained OPEN/DRAFT at head `aefcc610b623b00c5fcf005d91295467c05cf82e`; its base remained `e6620609ab95fdf75e20c3bf3132a829bf43af9c`.
- `git diff --check main@524a93a..original-PR-head@26bf8e8` reports four pre-existing, non-functional Markdown whitespace diagnostics: extra EOF blank lines in T1/T2/T3 and one trailing space in `matrix/measurement_contract.md`. They are present in the original PR delta and were left unchanged to preserve the 55 ECC paths byte/mode-identically. The Evidence Bundle diff itself passes `git diff --check`.
- The added file is this Evidence Bundle only; it does not modify existing product modules or alter the ECC package's execution behavior.

## Local validation on the source merge tree

| Check | Result | Evidence |
|---|---|---|
| `python -m unittest discover -s tools/benchmarks/ecc-coinblink/validation -p 'test_*.py' -v` on Windows, Python 3.12.10 | PASS, 60/60 | Local transcript SHA-256: `372850C2625EC9A055CF176794F130CEDF6C2130212961868AEBC02AA0BB2F26` |
| `tools/benchmarks/ecc-coinblink/validation/Invoke-OfflineSelfTest.ps1` | PASS, `ECC_SYNTHETIC_WINDOWS_OPERATOR_PASS` | Local transcript SHA-256: `CCE22DD58828C3A014CC793913FE1EC254B58DFF15360AD7E168DA3B2569C4A8` |
| Local Node build/lint/typecheck | NOT RUN | The isolated checkout had no `node_modules`; no dependency installation was performed. Hosted checks below cover these commands. |

The transcript files were kept outside the repository. The PowerShell test created only its disposable synthetic fixture and cleaned it up.

## Hosted checks on source merge commit `2bf9d8086d650754d00eee5104e2fcbc9c517014`

All 15 check runs below reported SUCCESS for that exact SHA. Full logs are available through the linked GitHub run.

| Check group | Result | Run |
|---|---|---|
| Build (Ubuntu) | PASS | [run 40205839265](https://github.com/KayzenRoot/coinblink/actions/runs/40205839265) |
| Quality baseline: Gitleaks, focused Node tests/LCOV, lint and typecheck | PASS | [run 40205839268](https://github.com/KayzenRoot/coinblink/actions/runs/40205839268) |
| ECC offline validation: Python on Ubuntu and Windows, PowerShell isolation smoke | PASS; 60/60 on each OS, smoke marker present | [run 40205839271](https://github.com/KayzenRoot/coinblink/actions/runs/40205839271) |
| PR Assurance: quality, review, scope (read-only) | PASS | [run 40205839272](https://github.com/KayzenRoot/coinblink/actions/runs/40205839272) |
| ECC CodeQL: JavaScript/TypeScript and Python | PASS; zero findings within ECC paths | [run 40205839273](https://github.com/KayzenRoot/coinblink/actions/runs/40205839273) |
| Reviewdog (read-only ESLint annotations) | PASS | [run 40205839274](https://github.com/KayzenRoot/coinblink/actions/runs/40205839274) |
| SonarCloud Code Analysis | PASS | [PR #209 SonarCloud](https://sonarcloud.io/dashboard?id=KayzenRoot_coinblink&pullRequest=209) |
| Socket Security: Project Report | PASS | [report](https://socket.dev/dashboard/org/nexlabs/sbom/d668359e-3448-4d09-a29e-2927df2f7873) |
| Socket Security: Pull Request Alerts | PASS | [check](https://socket.dev) |

The CodeQL logs contained two records outside the ECC path allowlist; the workflow's ECC-scoped SARIF result was empty for both languages. They are outside this Work Order's scope and were not modified. CodeQL SARIF upload is disabled (`upload: never`); workflow permissions are read-only.

The repository's effective `main` branch protection readback required `Build (Ubuntu)`, `SonarCloud Code Analysis`, and `Socket Security: Pull Request Alerts`; required approvals were zero, conversation resolution and linear history were enabled, force pushes/deletion were blocked, and administrators were enforced. No additional repository rulesets were returned by the API.

## Reviews, pilot boundary, and residual status

- At source merge commit `2bf9d8086d650754d00eee5104e2fcbc9c517014`, the PR had two historical review threads, both resolved; zero open threads. No review was approved or dismissed by this task.
- Pilot execution remains blocked/unverified: 4/4 skill runs NOT_RUN and the A/B matrix 18/18 NOT_RUN. No Codex task execution, plugin installation, hook/MCP enablement, `npx`, benchmark, credentials, real input, external service, D1, deployment, or paid resource was used.
- No product-code correction was needed. The merge was clean and the ECC-specific unit, workflow, CodeQL, SonarCloud, Socket, Gitleaks, build, lint, typecheck, and PR Assurance checks passed on the source merge commit.
- This bundle-bearing commit causes the hosted checks to run again. Their exact current status is attached to the PR and must be read from [PR #209 checks](https://github.com/KayzenRoot/coinblink/pull/209/checks) at the current PR head. The task completion report records the verified final SHA and status.

## Verdict

**PASS — technically synchronized for continued Draft review only.** This does not represent independent human approval, Owner authorization to merge, permission to mark Ready, authorization to run the ECC pilot, or a main/checkpoint promotion.
