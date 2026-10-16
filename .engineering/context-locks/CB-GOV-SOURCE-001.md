# Context Lock | CB-GOV-SOURCE-001 | R70 refresh

**Status:** PROPOSED / DRAFT / NOT CANONICAL / FORMAL GEF ADMISSION PENDING. **Risk:** ELEVATED. **Target:** `codex/cb-gov-source-001` / PR #67. **Readback date:** 2026-10-15 (America/Sao_Paulo). **Current protected `main`:** `58321c21508bd6089de1c1a77c21f93a4f0b856a`.

## Current main and governance readback

- Checkpoint SHA: `.engineering/CHECKPOINT.json` blob `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be`; raw SHA-256 `c2b9ef9f0c30f946f9287534305ad4f5f072875b9cfa5fe3e20b7442b45fa6f8`. The checkpoint remains M00 COMPLETE / 5%, 19 modules, `activeWorkOrder=NONE`; no checkpoint edit is permitted.
- PR #56 merged at `c4ba069f1dfaddc8273001950805e8a18125db66`; PR #57 merged at `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`; PR #59 merged into current main at `58321c21508bd6089de1c1a77c21f93a4f0b856a`; PR #82 single-administrator governance is already effective. PR #58 remains open and M01 incomplete.
- M01/M05 remain admitted only within their bounded Work Orders. M05 code in #59 is static P0 `MOCK / SECURITY DISABLED`; P1 privileged auth/data/storage is not admitted. Issue #72 rights are pending; `commercialPublicationAllowed=false`; `authorizedToMerge=false`.
- Ruleset #24888106 read back from the GitHub REST API: active, target branch, applies only to `refs/heads/main`; pull requests + squash; required approving reviews `0`; last-push approval `false`; thread resolution required; strict checks enabled with the seven existing contexts; deletion and non-fast-forward protections active; `bypass_actors=[]`.

## Exact source anchors on current main

Git blob SHA-1 and raw byte SHA-256 were read from `origin/main` at the exact pinned commit `58321c21508bd6089de1c1a77c21f93a4f0b856a` using `git rev-parse` and `git cat-file blob`:

| Canonical path | Blob SHA-1 | Raw SHA-256 |
|---|---|---|
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` | `4424180619660921939c73236ac1aa7ea2973787263e1314437b8be052ef713d` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` | `c2b9ef9f0c30f946f9287534305ad4f5f072875b9cfa5fe3e20b7442b45fa6f8` |
| `.engineering/SOURCE-HIERARCHY.md` | `46b2f93c9cc65a468e33b16036e8c5627a442d4d` | `70d2aba54bb16ab041a54467462964ab7dea770aa64dc08cb6bd65decd80b154` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` | `c2c728d30d915dec287b56e9294aa59332fd6e56aaeb1f8f0554a890268d4ac9` |
| `.engineering/REQUIREMENTS.md` | `5d3d8c2c18ae0356f4d28a535265314c22600a41` | `36b83012d76927a5e3dac2a86f9a29113c663f0e0865beac6842f45f8e74c1e4` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` | `19782491ab5f5dba185e4756f3b478760e31aa4f566aeae17e95d39fbcc15fe0` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` | `c61119f0f7c4df1ad4f051626a413b022cc5f8b934a56d2981b6afdc488323ed` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` | `ae505b48f383ab929b827c0b54a57d243d00156e6173f09d0168ded881b42117` |
| `docs/architecture/contracts/CB-M01.md` | `e94fa7a56ee04c5e1f5d6ce2801a484db5d508ce` | `8b2375c4255acac60de0dd56c0b652cbac684952903e4c5b0c752505d29d1e14` |
| `docs/architecture/contracts/CB-M05.md` | `2b35f56903bb00f9c4025eafb6b40d7265c26405` | `59f7ec0f3b7dd3429630b0718d96710aa208948a414e5c244f4ebda9240376a2` |
| `.engineering/work-orders/CB-M01-WO-001.md` | `1a29abc4e8ca7ec134b14c68cc4fed7a5e1163c5` | `96ad226bd8c593621d2146ec9d02f8b07746c9a32a4f660814acd3c164940927` |
| `.engineering/work-orders/CB-M05-WO-001.md` | `4f1f472f1abb2fb2dbdfbe3fc2d64d1126bba660` | `5faa1563ce1882d44b9b6203561c3a069b73c51eb7f44880832c91fb58ce16ba` |
| `.engineering/context-locks/CB-M01-WO-001.md` | `75e155ae8d4bd6886dc565cf8841f1d64938f6d4` | `e9ecf11e22a9690c1b6c0e6d8b206871a9ab61ef68c007d2fcf4db8a3e5274ad` |
| `.engineering/context-locks/CB-M05-WO-001.md` | `3b5edf8b37126d463f10091da4109dcf5c8ab16b` | `050c06a9e4a65efbd35ed01fbd3a44a8e5ff5cbd293ae1c40fc7029dd42a4ab6` |

These hashes bind to the frozen base tree, not the candidate diff. The exact current local merge/candidate HEAD must be recorded after the final commit and compared with live PR #67 before push.

## Exclusive candidate paths

Seven source paths: `.engineering/SOURCE-HIERARCHY.md`, `.engineering/SCOPE.md`, `.engineering/REQUIREMENTS.md`, `.engineering/ARCHITECTURE.md`, `.engineering/DEFINITION-OF-DONE.md`, `AGENTS.md`, `docs/DECISIONS_LEDGER.md`. Own candidate records: this lock, `.engineering/work-orders/CB-GOV-SOURCE-001.md`, `.engineering/evidence/CB-GOV-SOURCE-001/README.md`, and `.engineering/evidence/CB-GOV-SOURCE-001/CHECKPOINT-DELTA.md`. No other candidate path is authorized.

## Review and stop conditions

The current sole-Owner process does not require a second GitHub account or independent external review. It still requires an Owner-led risk/technical/security review of the exact final SHA, required automated checks, open findings handled accurately, and a separate exact-SHA Owner decision before a protected merge. CodeRabbit `SUCCESS` is not a substantive review if automation skipped. Formal GEF admission of this ELEVATED source correction remains pending; a draft PR cannot make itself canonical. No merge, deployment, rule/checkpoint/rights edits, false approval, force push or `authorizedToMerge=true`.

## Historical baseline provenance

The initial 2026-10-11 preflight was based on main `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. Its original eight-source fingerprint table and one-approver language are retained in the Git history of this file; the base and review rule were superseded before this R70 refresh.
