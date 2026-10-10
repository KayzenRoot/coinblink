# CB-ASSETS-001 · Golden Originals Import Evidence Bundle

**Status:** candidate import verified on an isolated branch; not canonical until normal PR merge. This asset import does not admit M01 or change module progress.

## Source and base

- Repository: `KayzenRoot/coinblink`
- Base `main` SHA: `842fc5a0e54bdaed37066abd830fd1b346368b2b`
- Branch: `codex/cb-assets-001-golden-originals`
- Source archive: `CoinBlink_Golden_Originals_VERIFIED.zip`, 651,732 bytes, SHA-256 `733b2199241e3d226b4b7db1f0d544bb04f403cbc663fdc2c5690db0578a4c62`
- Importer: `import-coinblink-golden.ps1`, SHA-256 `e262687020320245d16af7fe400c1192bc50323825deb5b4dc46fd0a4f4e97ec`; inspected before execution. It validates repo/branch, exact paths, source hashes and sizes, existing-file conflicts, and manifest shape; it copies only missing exact matches and does not stage or commit.
- Archive contained exactly two JPEG masters, the importer, its instructions, and SHA256SUMS. All member paths were relative and contained no traversal segments.

## Immutable asset verification

| Manifest path | Role | Format | Dimensions | Bytes | SHA-256 |
|---|---|---|---:|---:|---|
| `assets/reference/coinblink-home-master-dark-1536x864.jpg` | `golden-home` | JPEG | 1536×864 | 532,365 | `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8` |
| `assets/reference/coinblink-logo-approved-original-1179x1040.jpg` | `golden-logo` | JPEG | 1179×1040 | 121,728 | `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0` |

The source JPEG headers, decoded dimensions, byte counts, and SHA-256 values match the approved manifest and Issue #5. The import copied the original byte streams without image processing. `reference-manifest.json` records both `sizeBytes` values and `presentInGit: true` for this candidate tree; it does not claim an unmerged branch is canonical `main`.

## Validation

- Local runtime: Node.js 22.23.3; npm 10.9.3 (project requires Node `>=22.19.0 <23`).
- `npm ci`: passed; 437 packages added; 0 vulnerabilities reported.
- `node --check test/golden-assets-integrity.test.mjs`: passed.
- `node --test test/golden-assets-integrity.test.mjs`: passed, 1/1.
- `npm run lint`: passed with `--max-warnings=0`.
- `npm run typecheck`: passed, 0 errors/warnings/hints.
- `npm test`: passed, 105 unit tests, build plus session-binding guard, and 7 Playwright tests including desktop, tablet, mobile, route and security-header coverage.
- Fresh validation after the CodeRabbit docstring warning, using supported Node.js 22.23.3 / npm 10.9.3: `node --check` passed; focused Golden integrity test passed (1/1); lint passed; typecheck passed across 45 files (0 errors, warnings, or hints); `npm test` passed (105 unit tests, build/session-binding guard, and all 7 Playwright tests).
- A diagnostic `npm test` under system Node.js 24.19.0 correctly failed the repository's Node 22 version assertion; it was rerun with the supported Node 22.23.3 runtime and passed. No production code or dependency change was needed.
- `git diff --check`: passed after editing.
- `npm ci` dependency audit summary: 0 vulnerabilities.
- Exact-head hosted checks on import commit `db41742595c214eaf5edfc2957953956a4e7fecc`: Ubuntu GEF/M00 passed ([job](https://github.com/KayzenRoot/coinblink/actions/runs/38087894544/job/114318139272)); Windows GEF/M00 passed ([job](https://github.com/KayzenRoot/coinblink/actions/runs/38087894544/job/114318139809)); Docker Compose smoke passed ([job](https://github.com/KayzenRoot/coinblink/actions/runs/38087894544/job/114318139235)); SonarCloud passed with 0 new issues and 0 security hotspots; both Socket Security checks passed.
- CodeRabbit GitHub review on `db41742595c214eaf5edfc2957953956a4e7fecc` completed with no actionable comments (run `e80261b5-e38d-4bcc-bd27-d7a752075dec`). Its path filter excluded both JPEG files; the deterministic integrity test verifies their names, dimensions, sizes, and hashes. CodeRabbit reported 0% docstring coverage for the new JPEG-dimension helper; the helper now has JSDoc and the final-head review is pending.
- Local GEF 1.1.2 `doctor` and `status`: command envelope `ok: true`, checkpoint valid and read-only; however, the Codex managed linked worktree observer reports `repository.observable=FINDING`, `dirtiness=UNKNOWN` with `GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`. This local result is REVIEW/UNKNOWN, not a clean GEF pass; exact-head Ubuntu/Windows CI will provide normal-checkout verification.
- The hosted results above validate the imported asset commit. The JSDoc/evidence correction is being revalidated on its updated exact HEAD; no result from `db417...` is represented as validation of that later HEAD.

## Scope and checkpoint

- Only the reference manifest/README, source-hierarchy wording, deterministic asset-integrity test, this evidence file, and the two original JPEGs belong to CB-ASSETS-001.
- No application implementation, image recompression, Docker/Cloudflare operation, production resource, dependency change, or unrelated module work was performed.
- Canonical checkpoint is unchanged: M00 COMPLETE/5%; M01 remains NOT_ADMITTED; the 19-module inventory and M18 FUTURE status remain unchanged. This PR does not promote a checkpoint or close Issue #5 before merge and clean-tree verification.
- M01 still requires the global governance gates, individual admission, and its own Context Lock/Work Order. Importing originals alone does not authorize M01 code.

## Remaining gates

Updated exact-head GitHub checks and CodeRabbit review, Owner audit, and authorized normal merge remain required. After merge, verify both file hashes and manifest values in a clean clone before closing Issue #5. No merge or checkpoint promotion is claimed by this bundle.
