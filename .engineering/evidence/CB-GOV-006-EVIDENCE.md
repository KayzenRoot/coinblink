# Evidence Bundle · CB-GOV-006

**Evidence capture state:** `CANDIDATE / LOCAL_VALIDATION_PASS / EXACT_HEAD_CI_PENDING / OWNER_AUDIT_PENDING / M00_NOT_DONE` at initial candidate SHA `3796d419d692de535d49b0c6e9b86f56e7f819cd`.
**Repository:** `KayzenRoot/coinblink`.
**Change:** post-merge GEF checkpoint promotion after local M00 P0.
**Issue:** #34.
**Admitted Work Order:** `CB-M00-WO-001`.
**Verified base:** `main` at `b40a6467b1b143cc28a6e9969fddaefd0ebc438b` (PR #33 merge).
**Prior admitted base:** `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` (CB-GOV-005 / PR #32).
**Branch:** `codex/cb-gov-006-checkpoint-promotion`.

## Verified source state

- `origin/main` was fetched and matched the Issue #34 expected SHA `b40a6467b1b143cc28a6e9969fddaefd0ebc438b` before the branch was created.
- PR #33 is merged at that exact merge commit. Post-merge workflow run [37876911985](https://github.com/KayzenRoot/coinblink/actions/runs/37876911985) is completed/successful on that SHA. Its M00/GEF Ubuntu and Windows jobs, isolated Docker smoke, SonarCloud and Socket checks succeeded. This is base provenance, not evidence for this candidate HEAD.
- The P0 execution Context Lock remains unchanged at SHA-256 `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e`. All 29 locked source Git blob SHA-1 and raw-blob SHA-256 pairs were recomputed at the lock's historical base `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` and matched. No Context Lock or original M00 evidence/history was rewritten.
- `.engineering/CHECKPOINT.json` now proposes the verified local P0 fact. It retains status `M00_ADMITTED`, `completedThroughModule: NONE`, 0%, the original `sourceMainSha`/scope approval/CB-GOV-005 formal admission fields, unchanged module map, `NOT_DEPLOYED`, and no `stopState`. `progressBasis` is byte-value-equivalent; no denominator or earned weight was introduced.
- The pre-existing `.engineering/evidence/CB-M00-WO-001-CHECKPOINT-DELTA.md` stays historical and proposed; it is not rewritten to imply it was canonical after PR #33.

## Changed-source fingerprints

SHA-1 values are Git blob IDs. SHA-256 values hash the exact raw UTF-8/LF bytes. The original Context Lock is intentionally not updated. This bundle excludes itself from the table to avoid self-reference.

| Path | Git blob SHA-1 | Raw blob SHA-256 |
|---|---|---|
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `a4ee309193e5c825283d95e828ce0839379e2694` | `cf28ad350d34c0906474b27b53bd0cb560387fd4cc13052ac7f5c69e946b6fa1` |
| `AGENTS.md` | `0cdce3e0cb86da828aef4f7a6a9e9947d2fe3ec8` | `8460bccdf60d56f29b484b90072c23c4946806f4469c384bea516d529b5be3a1` |
| `test/gef-cli.test.mjs` | `54269dba0a596ce283eca96c911b541a284ab529` | `df9e009b215a88cf151db34927d1f814d24f200d0e28513cc51d797835c42f21` |
| `.engineering/evidence/CB-GOV-006-CHECKPOINT-PROMOTION.md` | `d42495f3de0b77169204ca8aa62ee1b63ba34208` | `027eb6774850bb2b2565793356b2f1f9f88c2c894fe758f6a3baa339e4dac856` |

## Local validation

Toolchain was pinned locally to Node `v22.19.0` and npm `10.9.3`. `npm ci --ignore-scripts` used the committed lockfile and installed 437 packages.

| Check | Result | Evidence |
|---|---|---|
| Focused `node --test test/gef-cli.test.mjs` | PASS | 3/3 tests. The updated test first failed on the old phase before checkpoint promotion, then passed with the new truthful state. |
| `npm run lint` | PASS | ESLint `--max-warnings=0`. |
| `npm run typecheck` | PASS | 21 files; 0 errors, warnings, or hints. |
| `npm test` | PASS | 12/12 unit tests; build and SESSION/external-binding guard; 6/6 Playwright and axe checks across desktop/tablet/mobile plus health, preview-status, 404, and security headers. |
| `npm run build` | PASS | Astro Cloudflare Worker build; generated config has no SESSION or external data/service bindings. |
| `npm audit --audit-level=high` | PASS | 0 vulnerabilities. |
| `npm audit signatures` | REVIEW / E404 | npm returned E404 for unpublished transitive `@gef-bootstrap/kernel@0.0.0`; the check was not disabled. GEF dependency provenance remains `unverified` / `REVIEW`. |
| GEF Bootstrap `1.1.2` doctor/status | PASS / REVIEW | Exit 0, read-only effects, checkpoint present/readable/valid, new phase/next legal stage projected, completion 0. The linked managed worktree reports `GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`; status also reports absent drift baseline and conservative `operator.stale=true`. These observation limits remain visible; no baseline was fabricated. |

At initial evidence capture, exact-head GitHub checks were pending. The first pushed candidate `3796d419d692de535d49b0c6e9b86f56e7f819cd` was validated by [Actions run 37878742004](https://github.com/KayzenRoot/coinblink/actions/runs/37878742004): Ubuntu, Windows, Docker, SonarCloud, and Socket passed; CodeRabbit skipped review because the PR was draft. This is historical evidence for that exact SHA, not for a subsequent commit. The live [PR #35 Checks page](https://github.com/KayzenRoot/coinblink/pull/35/checks) is authoritative for the current head and its exact-head results.

The second candidate SHA `92f44359b2e8d0a278b17dd302f43d9abb373d07` was checked by [Actions run 37879053567](https://github.com/KayzenRoot/coinblink/actions/runs/37879053567), which completed successfully on that exact SHA: [Ubuntu](https://github.com/KayzenRoot/coinblink/actions/runs/37879053567/job/113654249591), [Windows](https://github.com/KayzenRoot/coinblink/actions/runs/37879053567/job/113654249521), and [Docker Compose](https://github.com/KayzenRoot/coinblink/actions/runs/37879053567/job/113654249322). [SonarCloud](https://github.com/KayzenRoot/coinblink/runs/113654337831) and both [Socket checks](https://github.com/KayzenRoot/coinblink/runs/113654247938) / [PR alerts](https://github.com/KayzenRoot/coinblink/runs/113654260213) passed. The run uploaded [desktop/tablet/mobile browser evidence](https://github.com/KayzenRoot/coinblink/actions/runs/37879053567/artifacts/11594235077). CodeRabbit did not review because PR #35 was still draft; its skipped status is not a review approval. SonarCloud reported the Quality Gate passed with 0 new issues and 0 security hotspots. This entry records that exact SHA only; this evidence-document follow-up has its own new candidate HEAD, and the live [PR #35 Checks page](https://github.com/KayzenRoot/coinblink/pull/35/checks) remains authoritative for the current SHA.

## Scope and gates

This is governance/test/documentation-only. No application behavior or dependencies changed. No Cloudflare setup or deployment, secrets, production resource, new module, visual asset, or cost commitment was created. M00 is not `DONE`; P1 remains `PROVIDER_SETUP_REQUIRED`; M01-M18 remain unadmitted. The checkpoint promotion remains proposed until this PR passes exact-head checks, independent review, Owner audit, and an explicitly authorized merge.
