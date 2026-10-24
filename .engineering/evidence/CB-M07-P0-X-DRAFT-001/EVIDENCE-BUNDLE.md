# CB-M07-P0-X-DRAFT-001 | Evidence Bundle
**Repository:** KayzenRoot/coinblink
**Mode:** LOCAL_SYNTHETIC / DRAFT_ONLY / NOT_PUBLICATION
**Branch:** `feat/cb-m07-p0-x-draft-001`
**Locked base:** `cb40e737049fe9e5d26daa03280adff81cfcf06e`
**Work Order risk:** STANDARD
**Date:** 2026-10-24

## Preflight
- `main` equals exact pinned base, protected; recursive tree non-truncated.
- **14** open PRs inspected, including Draft PR #233 at `fe3bb5efc9edc7e35c76eddb51eda2fb7b073ebf`. No direct collisions on the three paths; Codex M03 ingestion is **unmodified**.
- **10/10** critical sources on pinned main match blob SHAs:
  - `AGENTS.md` `93a9380dd0645e0beea896bb4ad50278a8eaf846`
  - `docs/BUILD_FIRST.md` `da3991827f1baab321865853d75ee668ef50e115`
  - `docs/CHAT_WORKFLOW_AND_HANDOFF.md` `c9bba8326fb2a12e094ca8dde20d055126a5272e`
  - `src/modules/CB-M07/social-preview.mjs` `d1f57c7896bc156f827d95929e1fc23c7a602279`
  - `src/modules/CB-M07/local-editorial-variants.mjs` `070d487d2befa97755d6e47f4c960d5d449d104e`
  - `src/modules/CB-M07/local-editorial-approvals.mjs` `9ebdb9f2990a40d9c0e576152dc9055bba44e991`
  - `test/modules/CB-M07/social-preview.test.mjs` `dd41d05460594488fa4df8993dfea5d4f9bda94a`
  - `package.json` `eed320228166097da9ab8839149350e2706f05fa`
  - `.github/workflows/m07-local-social-studio.yml` `89350b6d76215583040d3f3f88177ed254c8c659`
  - `.github/workflows/ci-quality.yml` `683d0514afbc3ef4ef53b532d1d80ebdf4a40c50`

## Exact scope
1. `test/modules/CB-M07/x-post-draft.test.mjs` (created test-first)
2. `src/modules/CB-M07/x-post-draft.mjs` (implementation after RED)
3. `.engineering/evidence/CB-M07-P0-X-DRAFT-001/EVIDENCE-BUNDLE.md` (this file)

No existing product source, test, workflow, package, lockfile, M03/Codex path or other PR may change.

## Contract
Pure deterministic draft formatting from exact, bounded, visibly synthetic article records. Two fixed `.example.test` origins (fake CoinBlink article link and fake publisher source), strict canonical paths, title and summary sanitization, conservative **240 Unicode codepoint budget** (NOT official X count and NOT an X API validity guarantee), SHA-256 deterministic identity for future local deduplication, immutable reference. No OAuth, API, network, D1, publication, browser storage, Worker routing, or production rights/identity.
Always `status=DRAFT_ONLY`, `mode=LOCAL_SYNTHETIC`, `rights=NOT_CLEARED`, `approval=NOT_GRANTED`, `publishingStatus=DISABLED`, `canPublish=false`, `canPostToX=false`, `publiclyUsable=false`. Never accept candidate-provided approvals.

## RED → GREEN ledger (observed)

- **RED initial test-only commit:** `9ccf408f7eeb5bc3aa94a0281ed1eb4a558cc232`, module absent. **Local Node v22.16.0:** exactly **1 FAIL ERR_MODULE_NOT_FOUND**, expected. This was a true test-first module-absence RED, **not** a hosted CI RED.
- **Test-fixture correction commit:** `cc0d9a6fd4cec4ec21e14448ba8fae64bac3f789` fixed (1) a no-letters UUID that was incorrectly asserted to change case, and (2) a test helper default that incorrectly treated explicit `undefined` as an omitted argument. The semantic negative cases were preserved. No production source existed at RED time.
- **GREEN implementation commit:** `4a6b0426ecd227de0663d38059de3381472d06b3`.
- **Exact blob attestation:** `src/modules/CB-M07/x-post-draft.mjs` Git blob `4c60e0aa1540b1ec0404bc8e7847f6a7727cab08`; `test/modules/CB-M07/x-post-draft.test.mjs` Git blob `5b9b32e85c324f682d4443f53314c163f3e2762e`. Both match local Git blob hashes for files used in testing.
- **Explicit GREEN LOCAL:** `node --test test/modules/CB-M07/x-post-draft.test.mjs` under Node v22.16.0 in isolated working path: **10/10 PASS**, 0 FAIL, zero dependencies beyond Node built-ins. `Node >=22.19.0` compatibility was **not** locally executed; hosted baseline used configured 22.19.0 but omitted this test.
- **IMPORTANT coverage gap:** neither `.github/workflows/ci-quality.yml` nor the existing M07/M07-C/M07-D hosted workflows includes `x-post-draft.test.mjs` in the actual Node command. Their SUCCESS does **NOT** prove hosted execution of this new file. **Hosted new-test RED and GREEN: NOT_RUN**. No workflow/package edits authorized; a later scoped CI improvement can add this contract to hosted checks.
- **Hosted implementation-HEAD GitHub checks:** **14/14 SUCCESS**, HEAD `4a6b0426ecd227de0663d38059de3381472d06b3`.
- **Hosted GitHub Actions workflows:** **7/7 SUCCESS**:
  - [Build #40119882051](https://github.com/KayzenRoot/coinblink/actions/runs/40119882051)
  - [PR Assurance #40119882082](https://github.com/KayzenRoot/coinblink/actions/runs/40119882082)
  - [CI Quality #40119882086](https://github.com/KayzenRoot/coinblink/actions/runs/40119882086): lint/typecheck PASS; Gitleaks PASS; baseline existing **87/87 Node PASS** (M02/M03 etc, excluding the new M07 file)
  - [Reviewdog #40119882057](https://github.com/KayzenRoot/coinblink/actions/runs/40119882057)
  - [M07 Social #40119882111](https://github.com/KayzenRoot/coinblink/actions/runs/40119882111): pre-existing test groups **20/20** and **14/14** PASS, no new x-post-draft test
  - [M07-C Calendar #40119882066](https://github.com/KayzenRoot/coinblink/actions/runs/40119882066)
  - [M07-D Week #40119882073](https://github.com/KayzenRoot/coinblink/actions/runs/40119882073).
- **SonarCloud:** Quality Gate SUCCESS, 0 new issues, 0 accepted issues, 0 Security Hotspots, 0.0% new-code duplication. Scanner reported **0.0% new-code coverage**; do not confuse with local 10/10 tests or the unrelated M03 Node LCOV. **Socket PR Alerts + Project Report:** SUCCESS. **Gitleaks, Build, PR Assurance, Reviewdog:** SUCCESS.
- **Diff at code HEAD:** exactly three ADDED paths: this Evidence Bundle, one pure implementation file, one pure test file. No deletion or modification to existing M07, M03, M05, X connectors, routes, package, lockfile, workflow, D1, branch protections or Codex work.
- **Review state at code HEAD:** 0 unresolved review threads; 0 submitted reviews. Automatic review jobs are diagnostics, not human approvals.

## Residuals & scope boundaries

1. The **240-Unicode-codepoint limit** is a conservative LOCAL product limit, *not* the actual X counting algorithm, URL-weighting or an API validation promise.
2. **SHA-256 identity** is stable per exact synthetic article/revision/body/source; it is **not** database uniqueness, outbox idempotency or protection from posting duplicates. There is no persistent store or network.
3. No live article, real account, verified right, actual editorial approval, remote fetch, OAuth, X API, D1 or publication was introduced or tested; all remain **NOT_RUN** and would require separate authorized integration.
4. Node `node:crypto` is used as a deterministic hashing function only; no outgoing I/O, tokens, settings or privileged effects. Future browser integration needs a compatibility review.
5. Update to this evidence file changes the PR HEAD again. The prior **14/14** result is for implementation-HEAD `4a6b0426ecd227de0663d38059de3381472d06b3`; **new HEAD needs exact revalidation before final APPROVED**.

## STOP / final verdict
If `main` or pinned blobs change, there is a colliding PR or scope expansion, or a new critical security finding cannot be fixed within the three paths, STOP. Keep PR Draft; no Ready, squash, other branches, M03, M05, provider network, LIVE, X posting, D1, deploy, cost or checkpoint.
**Verdict:** CODE_LOCAL_10_10_GREEN / HOSTED_EXISTING_14_14_GREEN / NEW_TEST_HOSTED_NOT_RUN / FINAL_HEAD_RECHECK_REQUIRED / PR_DRAFT / MERGE_NOT_AUTHORIZED.
