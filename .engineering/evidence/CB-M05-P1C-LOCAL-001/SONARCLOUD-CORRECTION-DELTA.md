# SonarCloud Correction Delta — CB-M05-P1C-LOCAL-001 / PR #91

**Status:** validation in progress; this is an append-only, sanitized evidence record.
**Scope authority:** the coordinating agent delegated only the Sonar correction delta on the existing PR #91, its existing branch, and this evidence appendix. This does not authorize new P1-C functionality or waive the separate exact-HEAD Owner GO required before that work.
**Base:** `cbcfa5c0d587dfce78406cfe79c4ea3b836a2f18`
**Pre-correction PR head:** `8ae04cc5affc97a32d9d510628ac8a13d5f89518`
**Checkpoint delta:** `{}`. No checkpoint, Work Order, Context Lock, global dependency, workflow, remote D1, real credential, production, merge, or deployment change is included.

## Finding-by-finding disposition

| Sonar issue key | Rule / severity | Original location | Disposition and evidence |
|---|---|---|---|
| `AaFGGy6dCyRWIUmkwJWE` | `javascript:S9382` / MINOR | `test/modules/CB-M05/p1c-local-preview.mjs:56` | Independent SQLite catalog table lookups now run with `Promise.all`; each result is checked against its matching required table. This removes an unnecessary sequential await without changing schema validation. |
| `AaFGCfF1TcHARY0GVQ1h` | `javascript:S9382` / MINOR | `test/modules/CB-M05/p1c-local-preview.mjs:65` | Dependent schema statements now execute through one ordered `D1.batch`. Local Miniflare/D1 tests verify schema and both immutable-revision triggers are present after initialization. SQLite rejects `CREATE OR REPLACE TRIGGER`; no schema syntax was changed. |
| `AaFGCfF1TcHARY0GVQ1i` | `javascript:S9382` / MINOR | `test/modules/CB-M05/p1c-local-preview.mjs:94` | Independent synthetic registration-response verification runs concurrently with `Promise.all`; D1 writes follow in an ordered batch. Registration remains local-only and uses disposable synthetic authenticators. |
| `AaFGCfF1TcHARY0GVQ1j` | `javascript:S9382` / MINOR | `test/modules/CB-M05/p1c-local-preview.mjs:103` | Independent credential-row inserts now use `D1.batch`, preserving atomic local setup. Targeted CMS tests exercise preview startup and the local D1 schema. |
| `AaFGCfF1TcHARY0GVQ1k` | `javascript:S9382` / MINOR | `test/modules/CB-M05/p1c-local-preview.mjs:161` | Intentionally retained sequentially: creation mutates one shared Playwright virtual authenticator and browser context. Parallel calls would race or change the state/order being tested. No suppression was added; classify as an actionable-by-design sequential await pending scanner treatment. |
| `AaFGCfF1TcHARY0GVQ1l` | `javascript:S7785` / MAJOR | `test/modules/CB-M05/p1c-local-preview.mjs:251` | Replaced the CLI entry-point `.catch()` promise chain with top-level `await` inside `try/catch`, retaining sanitized stderr and exit-code behavior. |
| `AaFFx82AuvmeKE72znLv` | `plsql:CreateOrReplaceCheck` / CRITICAL | `test/modules/CB-M05/p1c-fixtures/schema.sql:81` | False positive for the SQLite/D1 dialect. SQLite 3.49.1 rejected `CREATE OR REPLACE TRIGGER` as syntax, while the unchanged `cms_revision_no_delete` trigger remained installed and blocks deletion. Verified using the local D1 emulator regression test. |
| `AaFFx82AuvmeKE72znLw` | `plsql:CreateOrReplaceCheck` / CRITICAL | `test/modules/CB-M05/p1c-fixtures/schema.sql:85` | False positive for the SQLite/D1 dialect. SQLite 3.49.1 rejected `CREATE OR REPLACE TRIGGER`; the unchanged `cms_revision_no_update` trigger remained installed and blocks updates. Verified using the local D1 emulator regression test. |
| `AaFFxBbcEKymD8r66Pjr` | `javascript:S3776` / CRITICAL | `src/modules/CB-M05/p1c-local/local-cms.mjs:125` | Split the monolithic request handler into route-specific helpers for challenge, login, session, and draft operations. The route behavior, hard local-only gate, WebAuthn checks, CSRF/session checks, ordered atomic D1 writes, and sanitized errors are preserved. No rule suppression was added. |
| `AaFFxBbcEKymD8r66Pjs` | `javascript:S6582` / MINOR | `src/modules/CB-M05/p1c-local/local-cms.mjs:195` | Replaced the negated property-presence pattern with `!record?.public_key`, preserving the fail-closed absent-record/public-key behavior. |

## Verification

- Runtime: Node.js `v22.23.3` from the isolated local npm cache.
- `npm ci`: passed; the lockfile was not changed.
- `node --test test/modules/CB-M05/p1c-local-cms.test.mjs`: passed, 14/14 tests after the final top-level-await edit; includes synthetic WebAuthn, D1 persistence/restart, browser virtual-passkey and schema checks.
- `node --test --test-name-pattern='M05 LOCAL CMS 13' test/modules/CB-M05/p1c-local-cms.test.mjs`: passed, 1/1 test for local D1 trigger preservation and unsupported `CREATE OR REPLACE` syntax.
- `npm run lint`: passed (`eslint . --max-warnings=0`).
- `npm run typecheck`: passed (`astro check`, 145 files, 0 errors/warnings/hints).
- `npm run build`: passed (`astro build` plus `assert-no-session-binding.mjs`).
- `git diff --check` and `node --check` for the three changed `.mjs` files: pending final diff preflight.
- `npm test`: failed in the full repository unit stage with 420 passing and one unrelated M01 fixture failure: `test/modules/CB-M01/visual-check.mjs` reported Astro fixture readiness `ECONNREFUSED 127.0.0.1:57778`. The run did not reach build or Playwright stages. Five tracked M01 evidence outputs were regenerated by this test and then restored byte-for-byte from this branch's HEAD; they are not part of this correction diff. This failure was not reproduced after the independent PR #112 test run and no M01 source/evidence change is proposed.
- Exact-HEAD hosted checks and SonarCloud reanalysis: pending.

The listed Sonar issue keys are from the live pre-correction scan at the stated PR head. No claim is made that the remote scanner has analyzed or closed the new head. The sequential virtual-authenticator finding remains visibly disclosed; scanner results must be checked on the pushed exact head before stating any resolution.

## Validation addendum — isolated full run

After the initial full-unit run encountered the unrelated M01 fixture connection error, the coordinator requested one retry without another local suite running concurrently. On Node.js `v22.23.3`, the full `npm test` command completed successfully: **421/421 unit tests passed, Astro build and no-session-binding assertion passed, and all 48/48 Playwright tests passed** (exit code 0). The run regenerated eight tracked M01 historical evidence artifacts (`r26-integrated-visual-check.json`, `visual-check.json`, and six Golden/integrated screenshots); each of those exact paths was restored from this branch's HEAD. No M01 code was changed. The working tree after restoration contains only the three assigned M05 source/test paths and this correction appendix.

`npm run lint`, `npm run typecheck` (145 files, 0 errors/warnings/hints), `npm run build`, the 14-test M05 targeted suite, syntax checks for the three changed modules, and `git diff --check` also passed on the same local correction state. Hosted checks and SonarCloud reanalysis still require a pushed correction HEAD; no push or PR mutation has occurred.

## Official SQL false-positive triage readback

The coordinating agent reports an authenticated SonarCloud readback under account `Clayton nunes`: both SQL analyzer findings below were individually changed to **False positive**, with a technical comment saved and the option to share the comment for training disabled. This records the official issue disposition separately from the local SQLite/D1 reproduction above. The direct official issue views are:

- [`AaFFx82AuvmeKE72znLv`](https://sonarcloud.io/project/issues?id=KayzenRoot_coinblink&issues=AaFFx82AuvmeKE72znLv) — `plsql:CreateOrReplaceCheck`, original `schema.sql:81` trigger.
- [`AaFFx82AuvmeKE72znLw`](https://sonarcloud.io/project/issues?id=KayzenRoot_coinblink&issues=AaFFx82AuvmeKE72znLw) — `plsql:CreateOrReplaceCheck`, original `schema.sql:85` trigger.

This is a coordinator-reported authenticated UI readback, not an independent read by this worker. An unauthenticated API lookup for these issue keys returned no current issue objects after triage; the direct SonarCloud links above retain the issue references. The JavaScript findings still require exact-head reanalysis to confirm any automatic resolution; the shared virtual-authenticator `S9382` remains intentionally sequential. `CHECKPOINT_DELTA={}`.
