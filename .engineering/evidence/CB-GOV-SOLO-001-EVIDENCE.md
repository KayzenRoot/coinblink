# Evidence Bundle — CB-GOV-SOLO-001

**Status:** ELEVATED GOVERNANCE PROPOSAL / FINAL AUDIT AND OWNER EXACT-SHA GO/NO-GO PENDING
**Repository:** `KayzenRoot/coinblink`
**Issue:** [#45](https://github.com/KayzenRoot/coinblink/issues/45)
**PR:** [#46](https://github.com/KayzenRoot/coinblink/pull/46)
**Source main SHA:** `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`
**Branch:** `codex/cb-gov-solo-001`
**Integration commit:** `19692990b3221875f6c0085321a7204e7f133224` (normal merge of updated main)
**GEF:** Bootstrap `1.1.2`, pinned source `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`

This evidence refresh follows a read-only independent audit of candidate `b7ea8b68384a5d6c0b5d241b159e38a6a4606479`. The final candidate SHA is the enclosing PR head after this Evidence Bundle and its fingerprint manifest are committed; exact-head CI and reviews must match that live SHA.

## Scope and governance state

The proposal changes only the eight paths listed in `CB-GOV-SOLO-001.md` and the Context Lock. The checkpoint, product Scope, Architecture, Security, DoD, tests, CI, application, M00 status and module admissions are unchanged. The checkpoint delta is a no-op proposal. All 19 module IDs are preserved; M00 remains admitted with P1 `NOT_DEPLOYED` and progress `0%`; M01–M17 remain unadmitted; M18 remains future.

The policy remains ineffective until a qualified independent assurance review of the final ELEVATED exact-head diff, all required exact-head checks, no open HIGH/CRITICAL finding, Owner go/no-go for the final SHA, normal authorized merge and canonical read-back.

## Verified source and PR #44 integration evidence

- PR #44 was merged by normal squash at `b4ddb9891cc66cd3688b8e11a86abc75db4b8544` after its exact reviewed HEAD `f1a3c4fec5216aafddd8fd3803db71c006a0d289` and narrow Owner exception were verified. No GitHub APPROVE was simulated; the Owner review event remained `COMMENTED`.
- PR #44 exact-head CI: [run #38009605984](https://github.com/KayzenRoot/coinblink/actions/runs/38009605984) — Ubuntu, Windows, Docker Compose, SonarCloud, Socket Project Report and Socket PR Alerts passed.
- Post-merge `main` CI: [run #38012041224](https://github.com/KayzenRoot/coinblink/actions/runs/38012041224) — success at `b4ddb9891cc66cd3688b8e11a86abc75db4b8544`.
- The Owner's exception is [comment #6091952619](https://github.com/KayzenRoot/coinblink/pull/44#issuecomment-6091952619), limited to PR #44 and its reviewed SHA; it does not approve this proposal.
- PR #46 was synchronized by a normal merge of `origin/main`; no rebase, force-push or history rewrite was used. Its base is `main`.

## Validation evidence

| Check | Result | Evidence |
|---|---|---|
| `npm ci --ignore-scripts` with Node `22.19.0` / npm `10.9.3` | PASS; 437 packages installed, zero vulnerabilities | Local validation on implementation commit `5d8ca1e75026d2cc447d39107f0556fbc2cd5181`; later commits changed governance evidence only. |
| `npm run lint` | PASS; zero warnings | Local validation on `5d8ca1e75026d2cc447d39107f0556fbc2cd5181`; exact-head hosted job also passed. |
| `npm run typecheck` | PASS; 37 files, zero errors/warnings/hints | Local validation on `5d8ca1e75026d2cc447d39107f0556fbc2cd5181`; exact-head hosted job also passed. |
| `npm test` | PASS; 76/76 unit tests, build/no-session-binding assertion and 7/7 Playwright/accessibility tests | Desktop 1536×864, tablet 768×1024 and mobile 390×844; routes, security headers and noindex behavior. Local run on `5d8ca1e75026d2cc447d39107f0556fbc2cd5181`; hosted suite passed on `b7ea8b6` below. |
| `npm audit --audit-level=high` | PASS; zero vulnerabilities | Local audit on the pinned dependency tree at `5d8ca1e75026d2cc447d39107f0556fbc2cd5181`. |
| Docker Compose local smoke | PASS on isolated port `3117`; `/health` returned `ok`, `/en` returned 200, unknown route returned 404 | Dedicated Compose project `coinblink-cb-gov-solo-001`; only its own container/network were removed. Existing listener on port `3000` was not touched. |
| GEF 1.1.2 `doctor --target . --json` | Exit 0 in a clean normal clone at `b7ea8b68384a5d6c0b5d241b159e38a6a4606479`; toolchain/repository findings HEALTHY, checkpoint valid, no observation limits | Security remains `REVIEW` for unverified dependency provenance and a non-immutable GitHub reference; no suppression or policy change. |
| GEF 1.1.2 `status --target . --json` | Exit 0 on the same exact clone; repository `CLEAN` / `OBSERVED`, checkpoint valid, M00 state correct at 0% | `operator.stale=true` remains because drift baseline is `ABSENT` (`operator.stale.unknown_conservative`). No baseline was fabricated; checkpoint and `.gef` state are outside the write boundary. |
| Changed-path set and fingerprints | PASS at `b7ea8b6`: exactly eight changed Git paths including the manifest; seven content paths in the manifest, which excludes itself; staged/worktree hashes matched | The Evidence Bundle correction changes content in one declared path only; path-set and hashes are being refreshed for the final head. |
| Hosted exact-head CI at `b7ea8b6` | PASS — [run #38013326570](https://github.com/KayzenRoot/coinblink/actions/runs/38013326570): Ubuntu/GEF, Windows/GEF, Docker Compose, SonarCloud, Socket Project Report and Socket PR Alerts | New evidence-only candidate requires a new exact-head run before adoption. |
| CodeRabbit full review at `b7ea8b6` | PASS; no actionable comments — [review #6091986135](https://github.com/KayzenRoot/coinblink/pull/46#issuecomment-6091986135) | The review covered all eight changed paths. A final-head review is required after this evidence correction. |
| Independent read-only audit at `b7ea8b6` | No HIGH/CRITICAL finding; identified stale evidence statuses, corrected in this refresh | This is a separate internal reviewer agent, not a GitHub `APPROVE` or Owner go/no-go. Re-audit the final evidence head. |
| Typesafe Jev advisory review | `ESCALATE` due low confidence (`safe_to_apply` 0.06, composite 0.5965, limiting rubric `test_gap`); no concrete finding returned | Advisory only; not treated as approval or a gate result. |
| Independent final ELEVATED assurance, final-head CodeRabbit and exact-head hosted CI | PENDING | Must match the final live PR head after this Evidence Bundle refresh. |
| Owner exact-SHA go/no-go and authorized normal merge | PENDING | Required before policy adoption. |

## Fingerprint interpretation

candidateRawSha256 is SHA-256 over the candidate Git blob bytes. workingTreeSha256 is SHA-256 over raw checkout bytes; on Windows with core.autocrlf=true, these values may differ due to line endings. The index and working-tree Git blob IDs are checked separately after Git normalization.

## Independent audit correction record

The read-only reviewer inspected the exact `b7ea8b6` diff and found no HIGH/CRITICAL defect. It identified that this bundle still marked completed CI/CodeRabbit checks as pending and attributed GEF `doctor` to an earlier commit. This refresh records the actual b7 results and exact-head GEF output above. Because this refresh creates a new commit, it does not reuse the prior review or checks as final-head evidence.

## Checkpoint Delta

See the [proposed no-op Checkpoint Delta](./CB-GOV-SOLO-001-CHECKPOINT-DELTA.md). It does not change the canonical checkpoint or grant M00 P1 deployment authority, M01+ admission or Cloudflare permission.

## Risks and limits

This changes assurance policy and is therefore ELEVATED. The proposed LOW/STANDARD exception cannot override GEF, an enforced GitHub rule, provider approval, unresolved findings or higher-risk review requirements. A same-account Owner `COMMENTED` event is not a different-human GitHub approval. GEF retains the absent-baseline/stale operator signal and security `REVIEW` findings described above. No Cloudflare call, resource change, deployment, paid service, checkpoint promotion or product implementation is included.
