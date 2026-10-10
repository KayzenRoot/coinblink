# Evidence Bundle — CB-GOV-SOLO-001

**Status:** ELEVATED GOVERNANCE PROPOSAL / AUDIT AND OWNER EXACT-SHA GO/NO-GO PENDING
**Repository:** `KayzenRoot/coinblink`
**Issue:** [#45](https://github.com/KayzenRoot/coinblink/issues/45)
**PR:** [#46](https://github.com/KayzenRoot/coinblink/pull/46)
**Source main SHA:** `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`
**Branch:** `codex/cb-gov-solo-001`
**Integration commit:** `19692990b3221875f6c0085321a7204e7f133224` (normal merge of the updated `main`)
**GEF:** Bootstrap `1.1.2`, pinned source `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`
**Exact candidate HEAD:** use the live head shown on PR #46 after this Evidence Bundle and fingerprint manifest are committed. Hosted checks and review must match that exact SHA; the PR URL is the non-self-referential source of the final SHA.

## Scope and governance state

This proposal changes only the eight paths listed in `CB-GOV-SOLO-001.md` and the Context Lock. The checkpoint, product Scope, Architecture, Security, DoD, tests, CI, application, M00 status, and module admissions are unchanged. The checkpoint delta is explicitly a no-op proposal. All 19 module IDs are preserved; M00 remains admitted with P1 `NOT_DEPLOYED` and progress `0%`; M01–M17 remain unadmitted; M18 remains future.

The policy remains ineffective until a qualified independent assurance review of the ELEVATED exact-head diff, all required exact-head checks, no open HIGH/CRITICAL finding, Owner go/no-go for the final SHA, normal authorized merge, and canonical read-back.

## Verified source and prior integration evidence

- PR #44 was merged by the normal squash process at `b4ddb9891cc66cd3688b8e11a86abc75db4b8544` after its exact reviewed HEAD `f1a3c4fec5216aafddd8fd3803db71c006a0d289` and Owner's narrow exception were verified. No GitHub APPROVE was simulated. The Owner-authored review remained `COMMENTED`.
- PR #44 exact-head CI: [run #38009605984](https://github.com/KayzenRoot/coinblink/actions/runs/38009605984) — Ubuntu, Windows, Docker Compose, SonarCloud, Socket Project Report, and Socket PR Alerts passed.
- Post-merge `main` CI: [run #38012041224](https://github.com/KayzenRoot/coinblink/actions/runs/38012041224) — completed successfully for `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`.
- PR #44 Owner exception: [comment #6091952619](https://github.com/KayzenRoot/coinblink/pull/44#issuecomment-6091952619), limited to PR #44 and its then-reviewed exact SHA.
- Candidate branch was synchronized by a normal merge of `origin/main`; no force-push or history rewrite was used.

## Validation for this candidate

| Check | Result | Evidence |
|---|---|---|
| `npm ci --ignore-scripts` with Node `22.19.0` / npm `10.9.3` | PASS; 437 packages installed, 0 vulnerabilities | Local run on the candidate worktree |
| `npm run lint` | PASS; zero warnings | Local run with `--max-warnings=0` |
| `npm run typecheck` | PASS; 37 files, 0 errors, 0 warnings, 0 hints | Astro check on the candidate worktree |
| `npm test` | PASS; 76/76 unit tests, build and no-binding assertion passed, 7/7 Playwright and accessibility tests | Desktop 1536×864, tablet 768×1024, mobile 390×844; health/status, 404, security headers, and robots/noindex behavior |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities | Local npm audit on the pinned dependency tree |
| Docker Compose smoke | PASS on isolated local port `3117`; `/health` reported `ok`, `/en` returned 200, unknown route returned 404 | Dedicated Compose project `coinblink-cb-gov-solo-001`; its own container/network were removed after the smoke. Existing listener on port 3000 was not touched. |
| GEF 1.1.2 `doctor` | REVIEW, not a clean pass: command succeeded and checkpoint was valid, but this managed worktree reported `repository.observable=FINDING`, `GIT_DIRECTORY_NOT_A_DIRECTORY`, and `WORKING_TREE_NOT_OBSERVED` | Rerun in a normal clone at the pushed exact candidate SHA before final gate decision |
| GEF 1.1.2 `status` | REVIEW, not a clean pass: checkpoint state was read as M00 admitted / in progress / 0%, but Git dirtiness was `UNKNOWN`; operator projection was stale and no drift baseline was present | Rerun in a normal clone at the pushed exact candidate SHA; do not infer cleanliness from `ok=true` |
| Exact changed-path set vs. eight-path write boundary | PASS in the staged candidate: seven declared content paths plus the fingerprint manifest; no other path present | Staged name-status and fingerprint manifest; repeat against the final pushed PR head |
| Typesafe Jev advisory review | ESCALATE due low confidence (`safe_to_apply` 0.06, composite 0.5965, limiting rubric `test_gap`); no concrete finding was returned | Not treated as approval; the requested independent audit is pending |
| Ubuntu / Windows / Docker Compose hosted CI | PENDING | PR #46 checks at exact final SHA |
| SonarCloud / Socket | PENDING | PR #46 checks at exact final SHA |
| CodeRabbit full review | PENDING | PR #46 review at exact final SHA |
| Qualified independent ELEVATED assurance | PENDING | Reviewer report tied to exact final SHA |
| Owner exact-SHA go/no-go and normal merge | PENDING | Required before adoption |

## Checkpoint Delta

See [proposed no-op Checkpoint Delta](./CB-GOV-SOLO-001-CHECKPOINT-DELTA.md). It does not alter the canonical checkpoint or grant M00 P1 deployment authority, M01+ admission, or any Cloudflare permission.

## Risks and limits

This changes an assurance policy and is therefore ELEVATED. The proposed LOW/STANDARD exception cannot override GEF, an enforced GitHub rule, provider approval, an unresolved finding, or the higher-risk review requirements. A same-account Owner `COMMENTED` event is not a different-human GitHub approval. No Cloudflare call, resource change, deployment, paid service, checkpoint promotion, or product implementation is included.
