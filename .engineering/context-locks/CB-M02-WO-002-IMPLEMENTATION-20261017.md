# CB-M02-WO-002 · Implementation dispatch Context Lock · 2026-10-17

**Owner authority:** explicit 2026-10-17 GO for protected merge of #111 **plus individual** code dispatch of CB-M02, CB-M03 and CB-M04 exclusively within P0_OFFLINE_MOCK_ONLY, with independent PRs and **no additional automatic merge**.
**Audited integrated main:** `fd98d18dbf4ac91601efa7e8f053e728da7a72b9` (protected #111 squash). 
**Module:** CB-M02; **Issue:** #9; **Existing effective admission:** P0_OFFLINE_MOCK_ONLY only.
**Execution branch:** `codex/cb-m02-wo-002-p0-offline-news-20261017`; this lock is branch-specific and is NOT a request to alter main/checkpoint.
**Repository checkpoint:** `M00_COMPLETE` / `5%`, frozen Git blob `72618bef100e6f82e4655b2c6ed482794e0c4649`.

## Post-#111 canonical SHA and source fingerprints
- `AGENTS.md` → `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7`
- `.engineering/CHECKPOINT.json` → `72618bef100e6f82e4655b2c6ed482794e0c4649`
- `.engineering/SOURCE-HIERARCHY.md` → `3ba4fb9bb89d8aaf17b87ca0adba2d72081a20f2`
- `.engineering/DEFINITION-OF-DONE.md` → `00702a0dfe54fcc22ad9e146255be1665fa4624c`
- `docs/architecture/contracts/CB-M02.md` → `b9a6c2bd5177066c966a45524a18ae0d080d8252`
- `.engineering/work-orders/CB-M02-WO-002.md` → `cc629d3c7c52e8af07bc056efb1c214443897ff1`
- `.engineering/context-locks/CB-M02-WO-002-DISPATCH-20261017.md` → `f5a5f1c0fb330e7eb35ce6a50f590d9143a5a364`

## Exact module-only application allowlist and expected state
- `src/modules/CB-M02/**` and **new** `test/modules/CB-M02/**` paths, plus this module's execution Context Lock and append-only WO-002 dispatch line owned by Integration Steward. Historical `test/modules/CB-M02/fixture-contract.test.mjs` and `test/modules/CB-M02/fixtures/p0-contract.json` remain immutable.
- **Strict offline synthetic**: no real URLs, RSS ingestion, market ticks, LIVE data, claim of provider permission, article publication, private CMS drafts, queue consumers, D1 remote or persisted database. UI may provide actual browser-local filter/detail behavior over invented fixtures.
- `M01` remains unchanged as a separate consumer and requires a future approved versioned rights-checked integration steward PR. No shared routes, styles, packages, Worker/middleware bindings, production plans or commercial activation.
- **Forbidden** even on test branch: Docker, R78, `src/pages/**`, other module owned files, secrets/credentials, CI config, `.engineering/CHECKPOINT.*`, migrations, remote deploy, live/paid API, auto-merge.
- CI accepted only on final candidate HEAD after deterministic Node tests, real Astro build/typecheck, Linux+Windows GEF, Docker smoke, Socket, Sonar audit and independent Owner diff/review. No fictitious screenshot/a11y acceptance absent logs.

## Scope and outcome
This record is the fresh implementation dispatch authorized in the Owner's exact #111 GO **after successful merge and live-main audit**. Existing WO-002's prior STAGED text is preserved as provenance. A successful local CI and green PR do NOT mean whole module P1/P2 complete or authorize integration to Home. Each candidate remains DRAFT pending its own exact-HEAD Owner GO.

**STOP_CONDITION:** `CB-M02_P0_OFFLINE_CANDIDATE_EXACT_HEAD_CI_OWNER_REVIEW_NO_MERGE`.
**CHECKPOINT_DELTA:** `{}`.
