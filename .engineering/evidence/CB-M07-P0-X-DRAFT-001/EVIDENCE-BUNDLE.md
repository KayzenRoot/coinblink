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

## RED → GREEN ledger
- **RED commit:** `9ccf408f7eeb5bc3aa94a0281ed1eb4a558cc232`, tests-only, implementation absent.
- **RED local:** Node `v22.16.0` `node --test test/modules/CB-M07/x-post-draft.test.mjs` equivalent isolated checkout: **1 FAIL ERR_MODULE_NOT_FOUND** expected. This is NOT Node `22.19.0`, and not a hosted RED.
- **RED hosted:** NOT_RUN / NOT_COVERED. Existing M07 workflow lists three specific pre-existing tests and **does not include the new file**; existing CI Quality tests also omit M07. Do not treat a green hosted CI as new-test execution.
- **GREEN local/hosted:** NOT_RUN.
- **Lint/typecheck/build & all other CI:** NOT_RUN.
- **SonarCloud/Socket/PR Assurance/Gitleaks/Reviewdog:** NOT_RUN.
- **Reviews/threads/final SHA verification:** NOT_RUN.
- **No publication, deploy, merge, external APIs or expenditures:** NOT_RUN by design.

## STOP / final verdict
If `main` or pinned blobs change, there is a colliding PR or scope expansion, or a new critical security finding cannot be fixed within the three paths, STOP. Keep PR Draft; no Ready, squash, other branches, M03, M05, provider network, LIVE, X posting, D1, deploy, cost or checkpoint.
**Verdict:** TEST_FIRST_RED_LOCAL_PROVEN / IMPLEMENTATION_PENDING / DRAFT_ONLY.
