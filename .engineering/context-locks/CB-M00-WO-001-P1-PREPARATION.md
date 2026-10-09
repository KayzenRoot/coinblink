# CB-M00-WO-001 · P1 Preview Preparation Context Lock

**Lock state:** `BASE_FROZEN`; source base is the verified post-merge `main` SHA `954b4db2d6dff3798e76fd4d75d6bccaf24b0876` (CB-GOV-006 / PR #35).
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001`; P1 preparation only.
**Execution branch:** `codex/cb-m00-p1-preparation`.
**Executor:** Codex Desktop LOCAL; no Codex Cloud execution.
**GEF:** Bootstrap CLI `1.1.2`; official source commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`.
**Scope:** prepare, test, and document an isolated Cloudflare Worker Preview and a manually gated deployment workflow. This lock grants no authorization to contact Cloudflare, create a resource, deploy, change billing, provision or disclose credentials, merge, or start M01+.

## Locked authority and boundaries

- `.engineering/CHECKPOINT.json` at this base is canonical: `M00_ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, `NOT_DEPLOYED`, `overallCompletionPercent: 0`; no `stopState` is present.
- M00 remains the only admitted module. M01–M17 remain `NOT_ADMITTED`; M18 remains `FUTURE_NOT_ADMITTED`.
- The admitted `.engineering/work-orders/CB-M00-WO-001.md` authorizes P1 only after Owner account, plan/cost, IAM, credentials, and isolation gates. This task only prepares those gates; it does not satisfy their external facts.
- The original `.engineering/context-locks/CB-M00-WO-001-EXECUTION.md` and all of its fingerprints remain immutable. This separate lock binds the exact P1 preparation base.
- Do not modify the checkpoint, Work Order decisions, Scope, Architecture, Security, DoD, ADR, or historical evidence. Add only the P1 preparation Context Lock, P1 Evidence Bundle/fingerprint manifest, preview configuration and safety behavior/tests, local smoke tooling, operational rollback instructions, and a closed-by-default manual GitHub Actions workflow.
- Do not run `wrangler preview`, `wrangler deploy`, `wrangler preview delete`, `wrangler whoami`, Cloudflare API calls, or other provider commands. `wrangler ... --help` is local CLI inspection only.
- No Cloudflare account, Worker resource, billing, plan, cost ceiling, IAM, or credential value is known or asserted. Required authorization inputs must remain unset; workflow execution must fail closed until the Owner configures and verifies them.
- No forks or pull-request events may access credentials. The deployment workflow is manual-dispatch-only, canonical-main-only, exact-SHA checked, Owner-actor checked, and protected by the dedicated GitHub environment.
- Preserve the M00-only boundary, GEF state, local P0 behavior, noindex, exact build SHA, zero external data bindings, and honest `not-deployed` local response.

## Frozen base fingerprints

Blob SHA-1 is the Git object ID at the base commit. Raw-blob SHA-256 was computed from `git cat-file blob <base>:<path>` bytes, not checkout bytes. These rows are immutable and intentionally include the canonical authority and relevant implementation/test/workflow inputs.

| Path | Git blob SHA-1 at base | Raw blob SHA-256 at base |
|---|---|---|
| `AGENTS.md` | `0cdce3e0cb86da828aef4f7a6a9e9947d2fe3ec8` | `8460bccdf60d56f29b484b90072c23c4946806f4469c384bea516d529b5be3a1` |
| `.engineering/SOURCE-HIERARCHY.md` | `503257fb6af2c7d95b59f92b4b68fe62a9b8b08f` | `4e9cd445ecd5f8448e88c3faec1e3a0fbf1674aa9bb9ee15b531d5f10d8decb2` |
| `.engineering/CHECKPOINT.json` | `595c1743006c07e5b9f7c4520b45ded647a5ea07` | `06d795102b453d3a446b0eaa4d26cf6be83f6471dc844d6bc7ef8f4823713d85` |
| `.engineering/CHECKPOINT.md` | `1f455d2c6392317a425587d3ae9ddf79bbf18470` | `5f572b1b2c75e08d6881494bffd61892f9121280e31ca6fbfa08e5c48b27587e` |
| `.engineering/work-orders/CB-M00-WO-001.md` | `a4ee309193e5c825283d95e828ce0839379e2694` | `cf28ad350d34c0906474b27b53bd0cb560387fd4cc13052ac7f5c69e946b6fa1` |
| `.engineering/context-locks/CB-M00-WO-001-EXECUTION.md` | `406136fded6c7dd90a415996cf387257d98eef8c` | `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e` |
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/ARCHITECTURE.md` | `a1f13a450246217ee6d1cca70354f9ca8b3ac4e4` | `2fb75be7f99d061ff8c0e7c77c6d3138775249a18c317dfa652091a11b4dd179` |
| `.engineering/SCOPE.md` | `f6b78727ec8aea1890aba2c36a42235cda8913cb` | `934239b1aeecc56a1f2ff59eb8d7f0583acc34592b8c899e6809f89389f07b60` |
| `docs/architecture/ADR-CB-0001-M00-PREVIEWS-STACK.md` | `1bc1f0627097c30d95faa2b1faaa6f74ba79acae` | `82255f331af4c383dea4ef1c2f567aaf4b8f261cb14f5ef4dfd26c65457bf4cd` |
| `package.json` | `77391db66af630f8dc8463f1c90f903356533322` | `0c16820bff7fb5d8cc99b6e18f451b6fe458e835d4a7b2412c1aafd1f3d07438` |
| `package-lock.json` | `bf984890253d1fc09c8cda60adf98c10e9ec4e15` | `79255c007f327d69714b76ba401e87261ae557f725af89a117b5afd609be3bd8` |
| `astro.config.mjs` | `0aac3db4256ec4c1a3a29149b90c570e54352420` | `2b6cd0fea71a7db0b514677ab7b7b9ac94585ae52965f915ac80870efc109294` |
| `wrangler.jsonc` | `996909c97aae3d0e346a5c7a348054518e8e40a7` | `2d08cfad8478af5b6ee3909fdd5f05f0145291e66ed22307de972de04e7817ab` |
| `src/lib/build-info.ts` | `f6f77d7c16645f8b8f12dbf899ffa179b6f70fae` | `912029c2ac378693360e1f53a4427e6e7fd7c8428741693343bd95d2975d5668` |
| `src/pages/health.ts` | `e491abb12e466d642ce361315e1f85076d36dbb2` | `e650ed903bb95c6b6108143b20bc92b126b29c2dd35fdcd3d107ab659443134e` |
| `src/pages/preview-status.ts` | `0b9317d3963c36cd96e2b07beb6ce2f345ad5670` | `62a0d4a2bab253f603af7aeb1586b989bf685d74b89e61724a0909af2bf939d2` |
| `src/middleware.ts` | `ef7d6aaa342535ac583493a9e54b77a89537fb19` | `800841f0d52c754df0a32c1adc7e081e68ab1469accb3f0dfbb5d465e8b0bcd7` |
| `src/layouts/BaseLayout.astro` | `68e20b54a51b55d5d443ab08a443a13c108a6d18` | `fda7387827c0cbefde6952f8d1c8761adf3b064c6990d08085946e3d6b116b36` |
| `scripts/assert-no-session-binding.mjs` | `0830fbf0a095c1e6ff2a6d7c20b9e20fecafc00d` | `dc2317b554c80df3baa7cbe892a97c6da13a4c799934480182d62c231d42b251` |
| `e2e/m00-shell.spec.mjs` | `45e009967b27a04c3acdd59be39fffb089be9b0a` | `74dd83add6f9d82c02993d96c50b8891b9b5464e31900c76c233e8f7ed39c7de` |
| `.github/workflows/gef-validation.yml` | `3d9c6e3823be195074cafd8004f27de4ef59b2d8` | `1c84923eeda3d182f7ebb9c5e4b5ed4a425e802665187c072f24166c052129a4` |
| `test/session-binding-guard.test.mjs` | `73f5affd50d2f0429abfa44f51339aa774a8c351` | `57d5d9cab2d0e5fc418ee760810dbe85b34b46669fdf945d392e90a3abd5665e` |
| `test/m00-context-lock.test.mjs` | `4b24d58de8e7f7de5a5dffef83e1dfb263324d7f` | `fc9ff9bbccbe1774098574cdf1875b362743fde4d1d4e7986761d0d403661a40` |

## Write boundary

Existing files may change only for preview isolation/metadata, noindex/security headers, safe preview response semantics, generated Worker binding assertions, and tests. New files may be added only for the exact-head manual deployment/delete workflow, its pure local gate/smoke helpers and tests, `public/_headers`, `public/robots.txt`, this P1 preparation Context Lock, and its Evidence Bundle/fingerprint manifest. No dependency versions, lockfile, application features, checkpoint values, P0 visual behavior, or M01+ files may change.

## Fingerprint and validation procedure

Recompute every frozen Git blob SHA-1 and raw-blob SHA-256 against `954b4db2d6dff3798e76fd4d75d6bccaf24b0876` before accepting this lock. Candidate source fingerprints belong in `.engineering/evidence/CB-M00-WO-001-P1-PREPARATION-FINGERPRINTS.json`; do not rewrite this base table or the original execution lock. Run the pinned Node `22.19.0` / npm `10.9.3` toolchain, GEF `doctor` and `status`, full local tests/lint/typecheck/build/security checks, Docker smoke on a verified free alternate port, and exact-head GitHub CI/review. The workflow's Cloudflare path remains unexecuted.
