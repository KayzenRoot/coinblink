# CB-M05-P1C-LOCAL-001 · R98 evidence append (append-only)

This is a small append for the R98 execution order. The detailed A–E evidence lives in `../r96/` (unchanged) and `../r92/`, `../r94/` (historical, unchanged). `CHECKPOINT_DELTA={}`. No merge, deploy, remote D1, real credential or checkpoint action.

## Identity

| Item | Value |
| --- | --- |
| PR / branch | #128, `codex/cb-m05-p1c-local-ha-proof-r89` (draft, unmerged) |
| Base `main` | `2ca1e91a053dddb39da47dc9d81c4ce59be50da7` |
| Head at R98 dispatch | `65e2f9d9fbe752060dc2dcc2287d7475089fa7b4` |
| Head after A–E implementation (pushed) | `ea44f42ad810864de2155f541f88ad7226c57d4b` |
| Toolchain | Node `22.19.0` (SHA-256 verified), npm `10.9.3`, `npm ci`, Miniflare/workerd LOCAL D1, Playwright Chromium virtual authenticators |

## What is implemented (all merged into this branch before R98)

Detailed evidence, commands and histograms: `../r96/README.md`. Summary:

- **A / P0**: `BOOT-100-WORKER` `{201:1,403:99}` ×3 fresh D1, `d1Failures {}`; `BOOT-RACE-BATCH` `{201:1,409:99}` ×3 (batch-level denials); `BOOT-2/10` also Worker-hosted; `QUOTA-WORKER-100` `{200:3,429:97}` with acknowledged == persisted; Node-hosted proxy fault reproduced and classified (not fixed; mitigated by Worker-hosted authoritative proofs, differential test preserved).
- **B**: independent primary/recovery enrollment, rotation with session revocation, single-use `rotate-primary` recovery authorization requiring a fresh UV assertion, guarded revocation, offline one-use emergency authorization with digest at rest and TTL; concurrent single-use races; no second Owner.
- **C**: deny-by-default matrix over 12 privileged routes with per-case zero-write assertions, 405+`Allow` for unexpected verbs, cookie/CSRF/origin/fetch-metadata enforcement, digest-only storage, TTL/logout/device-revocation effects, plus a server-rendered privileged `GET /local/workspace` that denies anonymous and cross-site navigation.
- **D**: schema replay explicit, FK/CHECK enforcement, CAS `{200:1,409:9}` under 10 concurrent writers, injected mid-transaction failures with full rollback and safe retry, full 12-table LOCAL dump/restore with identical SHA-256 content digests, corrupted/incompatible backups restore nothing (single transaction), revocation persists across restart.
- **E**: real Chromium journey from an empty D1 (bootstrap → recovery enrollment → privileged page → revocation → recovery authorization → replacement → re-login), emergency total-loss flow, browser negatives, axe with zero critical/serious violations, keyboard focus indicators, 390 px responsiveness, two-layer egress proof (CSP + fixture route), no console/page errors on accepted journeys.

## SonarCloud

At `ea44f42` the gate was **ERROR** on `new_reliability_rating = 4` (threshold 1), with five open issues (`logs/sonar-gate-ea44f42.json`, `logs/sonar-issues-ea44f42.json`):

| Rule | Type | Severity | Location | Disposition |
| --- | --- | --- | --- | --- |
| `javascript:S2871` | BUG | CRITICAL | `src/modules/CB-M05/p1c-local/local-cms.mjs:854` (`[…allowed].sort()` without comparator) | **Fixed** in this iteration with an explicit `localeCompare` comparator; behaviour unchanged |
| `plsql:S1192` ×2 | CODE_SMELL | CRITICAL | `test/modules/CB-M05/p1c-fixtures/schema.sql:15` | False positive class: the SQLite fixture has no constant mechanism; the repeated `CHECK (owner_id = 1)` is intentional DDL. Not suppressed, not "fixed" by obfuscation |
| `plsql:CreateOrReplaceCheck` ×2 | CODE_SMELL | CRITICAL | `test/modules/CB-M05/p1c-fixtures/schema.sql:150,154` | False positive class: SQLite has no `CREATE OR REPLACE TRIGGER` (the suite explicitly asserts that `CREATE OR REPLACE TRIGGER` is rejected). Not suppressed |

The four PL/SQL findings are analyzer misclassification of a SQLite test fixture; they are advisory for maintainability and do not drive the failing reliability condition. A scoped exclusion or a `sonar-project.properties`/workflow change is **outside this Work Order's write surface**, so it is requested as a separate Steward decision rather than applied silently.

## Verification on `ea44f42` (final battery, Node 22.19.0)

| Command | Exit | Result | Log |
| --- | --- | --- | --- |
| `node --test test/modules/CB-M05/p1c-local-cms.test.mjs` | 0 | 42/42 | `../r96/logs/p1c-local-cms.r96.log` |
| `npm run lint` | 0 | clean | `../r96/logs/lint.r96.log` |
| `npm run typecheck` | 0 | 0 errors | `../r96/logs/typecheck.r96.log` |
| `npm run build` | 0 | complete | `../r96/logs/build.r96.log` |
| `npm run test:unit` | 1 | 460 tests, 459 pass; only the pre-existing M01 `visual-check.mjs` Astro-readiness timeout | `../r96/logs/unit-default.r96.log` |
| `npm run test:unit -- --test-concurrency=4` | 0 | 460/460 pass | `../r96/logs/unit-c4.r96.log` |
| `npm run test:e2e` | 0 | 48/48 | `../r96/logs/e2e.r96.log` |

## CI

`ea44f42` → GitHub Actions run [39148735180](https://github.com/KayzenRoot/coinblink/actions/runs/39148735180): GEF Ubuntu PASS, GEF Windows PASS, Docker PASS, Socket PR PASS, Socket Project PASS, CodeRabbit PASS (auto-review skipped, not a technical review), **SonarCloud FAIL** (the gate above). The S2871 fix and this append are evaluated on the next head; the current check suite on the exact head is visible in PR #128's checks tab.

## Risks and limitations

- The Node-hosted proxy fault is mitigated, not fixed; `esbuild` remains a transitive test-time dependency; both are unchanged from R96.
- The M01 harness issues (Golden rewrite; readiness timeout at default file parallelism; `npm`-only provenance test) are pre-existing and out of scope.
- Four Sonar PL/SQL false positives remain open pending a scope decision (above).
- No `APPROVED_LOCAL_PROOF` is claimed here; the Owner decides after independent review.
