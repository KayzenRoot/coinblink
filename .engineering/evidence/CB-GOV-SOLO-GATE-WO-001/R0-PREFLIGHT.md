# R0 Preflight Evidence | CB-GOV-SOLO-GATE-WO-001

**Observation:** 2026-10-11, Codex Desktop local, read-only repository/GitHub preflight except dependency installation and the evidence-only update in this candidate bundle.

**Canonical `main`:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`.

**Candidate snapshot before this evidence-only update:** PR #65, `f319134d481cf66d34e62a3aa599e6c0821dc417`, branch `codex/cb-gov-solo-gate-wo-001`, base `main`.
**Disposition:** `BLOCKED / PREPARED — STOP_ADMISSION_REQUIRED`; R1-R3 code was not started.

## Authority and admission

- GitHub CLI authenticated as `KayzenRoot`; repository is `KayzenRoot/coinblink`, default branch `main`.
- Issue [#64](https://github.com/KayzenRoot/coinblink/issues/64) is **PROPOSED / NOT ADMITTED / ELEVATED GOVERNANCE**. Its Work Order states `FORMAL GEF ADMISSION PENDING` and makes candidate code subject to the actual GEF admission check.
- Owner comment [6114177701](https://github.com/KayzenRoot/coinblink/issues/64#issuecomment-6114177701) authorizes an isolated candidate and explicitly says to stop if GEF requires admission before candidate source code. It is not canonical admission or a GitHub reviewer approval.
- Issue [#63](https://github.com/KayzenRoot/coinblink/issues/63) identifies itself as preparation, not admitted to modify `main`, and says it is not code admission or merge GO.
- Accepted `.engineering/SOURCE-HIERARCHY.md` section “Canonical authority order” item 5 requires an **admitted active Work Order** and current verified Context Lock, never a candidate draft. The canonical `.engineering/CHECKPOINT.json` has `activeWorkOrder: NONE`.
- GEF Bootstrap v1.1.2 ADR-0008-D2 says Codex creates or updates the actual code PR only after relevant Work Order admission, Context Lock, and legal execution-base binding. The proposed WO #64 does not meet that condition. The explicit stop in #64 therefore applies.

## Canonical source fingerprints

The eight source Git blob SHA-1 values below match the branch Context Lock exactly. SHA-256 values are computed from the canonical `main` blob bytes.

| Source | Git blob SHA-1 | SHA-256 |
|---|---|---|
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` | `4424180619660921939c73236ac1aa7ea2973787263e1314437b8be052ef713d` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` | `c2b9ef9f0c30f946f9287534305ad4f5f072875b9cfa5fe3e20b7442b45fa6f8` |
| `.engineering/SOURCE-HIERARCHY.md` | `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` | `4c5376e66b872ba1ab1c0b1e131d9a02c086dac3d76e4850fd2b7d800cc46921` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` | `19782491ab5f5dba185e4756f3b478760e31aa4f566aeae17e95d39fbcc15fe0` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` | `4b588c089b7d1da2fce4eaf49942f045c4a1644c113396df4b39cbdc81859e2f` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` | `c61119f0f7c4df1ad4f051626a413b022cc5f8b934a56d2981b6afdc488323ed` |
| `docs/DECISIONS_LEDGER.md` | `d33b083a9fd31f9d7509e5a39f76f183cb961a3f` | `ae505b48f383ab929b827c0b54a57d243d00156e6173f09d0168ded881b42117` |
| `docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md` | `57d6f502ae65fae1f4d6f027b2a92eeec33f4ee6` | `cfa4937121772eae4697bc3a8dd01f7e412dde48df9ba949b617f5e3ba813df6` |

No source fingerprint is stale. The candidate Context Lock anchors are bound to the verified current `main` SHA above.

## GitHub and branch protections

- `main` is protected by active ruleset `coinblink-main-governance` ID `24888106`, targeted only at `refs/heads/main`; no bypass actors are configured.
- The ruleset requires one distinct approving review, last-push approval, resolved review threads, squash-only merge, and seven status contexts: Ubuntu GEF, Windows GEF, Docker smoke, SonarCloud, two Socket checks, and CodeRabbit.
- PR [#65](https://github.com/KayzenRoot/coinblink/pull/65) is OPEN and DRAFT at the candidate snapshot above, with base exactly current `main`; review decision is `REVIEW_REQUIRED` and merge state is `BLOCKED`.
- At that snapshot the six check-runs (Ubuntu GEF, Windows GEF, Docker smoke, SonarCloud, Socket PR Alerts, Socket Project Report) were SUCCESS. Required CodeRabbit status was PENDING. This is not a complete exact-head gate set and is not an approval.
- The live `main` SHA was unchanged after fetch/readback. Existing primary checkout changes (`.gef/`, `tmp/`) were left untouched; the candidate uses its dedicated clean worktree.

## Toolchain and GEF observation

- Runtime: Node `v22.23.3`; npm `10.9.9`.
- `npm ci`: succeeded; 437 packages added, 448 audited, 0 vulnerabilities. `node_modules` is ignored and no tracked dependency file changed.
- `npm run gef -- doctor --target . --json`: command succeeded, `effect=NONE`; checkpoint is present/readable/valid. Toolchain Node/platform/Git are healthy. Repository observability is a finding because this is a linked worktree (`GIT_DIRECTORY_NOT_A_DIRECTORY`, `WORKING_TREE_NOT_OBSERVED`); dependency provenance is `REVIEW`/unverified.
- `npm run gef -- status --target . --json`: command succeeded, `effect=NONE`; canonical state is M00 COMPLETE / 5%; no development projection. The operator snapshot is conservatively stale because the optional drift baseline is absent. This does not admit a Work Order.
- GitHub PR snapshot file set was exactly four documentation/evidence files: the candidate Context Lock, candidate no-op checkpoint delta, candidate Evidence README and candidate Work Order. No source, workflow, package, checkpoint, provider, secret or ruleset file was changed.

## Risk / side effects / next legal action

No code, workflow, secret, Cloudflare, paid service, production resource, ruleset or checkpoint was changed. No tests for R1-R3 were run because those source rounds are not admitted; no positive or negative matrix count is claimed. No merge was attempted.

**Required next step:** obtain formal GEF admission of `CB-GOV-SOLO-GATE-WO-001` and a legal execution-base binding through the normal governance process. Then refresh main and all fingerprints before any source-code round. The active distinct-reviewer rule and the ELEVATED assurance requirement remain independent future gates.
