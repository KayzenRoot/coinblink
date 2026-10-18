# CB-M05-P1C-LOCAL-001 · R92 · P0 concurrency evidence (append-only)

**Status: `CORRECTION_REQUIRED`.** P0 (100-way first-Owner race) is addressed with a Worker-hosted proof and strict assertions. Parts B, C, D and E are **not implemented** in this iteration. Not `APPROVED_LOCAL_PROOF`. Not `M05_DONE`. `CHECKPOINT_DELTA={}`. No merge, deploy, remote D1, real credential or checkpoint action.

## Identity and provenance

| Item | Value |
| --- | --- |
| Work Order / PR | `CB-M05-P1C-LOCAL-001` / KayzenRoot/coinblink #128 (draft) |
| Branch | `codex/cb-m05-p1c-local-ha-proof-r89` (normal push, no force) |
| PR head audited at start | `399670df8e8baa2e9ddb37d9d39c1e9aa73b011e` |
| Code commit of this iteration | `127ca67` (`test(m05): prove 100-way first-Owner race in workerd with zero HTTP 500`) |
| Base `main` | `2ca1e91a053dddb39da47dc9d81c4ce59be50da7` (verified by `git ls-remote`) |
| Owner LOCAL code GO | Recorded in issue #12 comment `6248988847` (`OWNER_LOCAL_P1C_CODE_GO=YES`, scoped to this WO, no merge/deploy/D1 remote/credentials/checkpoint) |
| Lock / WO fingerprints | `context-locks/CB-M05-P1C-LOCAL-001.md` `98781a14fdbd432e8e91a7de05a0a27a1b873577`, `work-orders/CB-M05-P1C-LOCAL-001.md` `8a00346e0e84265bf4c3a7de1b81f196b473942b`, `SOURCE-HIERARCHY.md` `3ba4fb9bb89d8aaf17b87ca0adba2d72081a20f2`, `CHECKPOINT.json` `72618bef100e6f82e4655b2c6ed482794e0c4649`, `package.json` `786a23f1d9dcb406f868785497a9b7d0dad63e46`, `package-lock.json` `5572b6948c0f71f8a3ba9747490bc4d5723cf0a2`, all matched on the branch. Module files on the branch differ from main by the Part A changes already present in PR #128 (expected). |
| Worktree | `<HOME>\AppData\Local\Temp\opencode\coinblink-r92` (isolated `git worktree`, branch above) |
| Note on remotes | Primary repo `origin` points to `KayzenRoot/coinblink-owner-solo-research`, not the PR repo. The PR branch was fetched explicitly from `https://github.com/KayzenRoot/coinblink.git`. `origin` was not modified. |
| Toolchain | Node `v22.19.0` (win-x64 zip from nodejs.org, SHA-256 `ea3fad0e67a991d8477d8c01344b56e69c676ccb733f065b22436994b1253f86`, verified against the official `SHASUMS256.txt`); npm `10.9.3`. The machine's default Node is v26.4.0, which the README already rejects. |
| Install | `npm ci --no-audit --no-fund`: `added 461 packages in 37s`; tracked files unchanged afterwards. |

## Verification commands on HEAD `127ca67`

Commands ran from the worktree root with Node 22.19.0 on the PATH. Exit codes come from the process, not a pipeline.

| Command | Exit | Result | Log |
| --- | --- | --- | --- |
| `node --test test/modules/CB-M05/p1c-local-cms.test.mjs` | 0 | 23/23 pass | `p1c-local-cms.node-test.127ca67.log` |
| `npm run lint` | 0 | eslint `--max-warnings=0`, no findings | `lint.127ca67.log` |
| `npm run typecheck` | 0 | astro check: 151 files, 0 errors, 0 warnings, 0 hints | `typecheck.127ca67.log` |
| `npm run build` | 0 | build complete; `assert-no-session-binding` passed; test identifiers absent from `dist/` | `build.127ca67.log` |
| `npm run test:unit` (run 1) | 1 | 441 tests, 440 pass, **1 fail**: `M05 LOCAL CMS 06` (see anomaly A) | `unit-node-test.127ca67.log` |
| `npm run test:unit` (run 2) | 0 | 441/441 pass | `unit-node-test.127ca67.run2.log` |
| `npm run test:e2e` | 0 | 48 passed | `e2e-playwright.127ca67.log` |

Earlier, on the pre-commit tree (`399670d` plus the same changes, comment wording aside), lint, typecheck, build, unit (441/441) and E2E (48/48) also exited 0. Those logs were not preserved in this bundle, so they are reported as prior runs only.

Test count note: the fixture `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs` sits under `test/` and is therefore a no-op test entry for Node's default glob. The existing `p1c-local-preview.mjs` already behaves this way. The unit count is 441 with the fixture included, and the P1-C file count is 23.

## P0: what was wrong, what changed, what is proven

### Test changes (commit `127ca67`)

- Removed the wave-based `BOOT-100`: it ran ten sequential waves of ten, so it did not measure a simultaneous 100-way race.
- Removed `BOOT-BURST-100`: it allowed `<= 1` winner and tolerated HTTP 500.
- Added `BOOT-100` (Worker-hosted): 100 claims launched in one tick against the **unchanged** handler bundled into `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs` and hosted in workerd. Three fresh D1 databases per run. Exclusivity and availability are asserted separately:
  - Exclusivity: exactly one `201`; 99 losers `403|409`; one `cms_owner` row; one primary credential matching the winner; zero sessions; one consumed and 99 unconsumed bootstrap tickets; one consumed and 99 unconsumed challenges.
  - Availability: zero `500`; zero `transport` or `other` D1 failures reported by the redacted in-Worker diagnostics. Diagnostics record only statement verb labels, method, error name and transport code. No bound values, messages, tickets, cookies or keys.
- `BOOT-2`, `BOOT-10` and `BOOT-SAME` stay Node-hosted. `raceClaims` now launches every claim in one tick, with no waves.
- `esbuild` is imported by the test to bundle the fixture. It is not declared in `package.json`, which this WO forbids editing. It is pinned at `0.28.2` in the lockfile through `wrangler` (a declared devDependency). **Residual risk:** an Owner-approved explicit devDependency should replace the transitive import.

### Node-hosted 100-way characterization (reproduced)

Logged in `node-hosted-100way-probe.log` (probe `probe-node-hosted-100way.mjs.txt`, `N=100`, 4 trials):

| Trial | Histogram | Notes |
| --- | --- | --- |
| 1 | `{201:1, 409:56, 500:43}` | owners=1, creds=1, consumed tickets=1 |
| 2 | `{201:1, 500:99}` | same invariants |
| 3 | `{201:1, 409:22, 500:77}` | same invariants |
| 4 | `{201:1, 409:9, 500:90}` | same invariants |

All 500s came from the `BATCH` stage: `TypeError: fetch failed`, cause `read ECONNRESET`, after roughly 7 to 13 seconds per run. Owner and credential counts stayed exactly 1. Eight earlier exploratory Node-hosted trials showed 43 to 99 HTTP 500s per run, with the same signature; those exploratory outputs were not preserved as logs and are not counted as evidence.

### Controlled differential (Node-hosted D1 proxy; logged in `d1-controlled-concurrency.log`)

| Workload | N=10 | N=25 | N=50 | N=100 |
| --- | --- | --- | --- | --- |
| `SELECT 1` (2 trials each) | 0 fail | 0 fail | 0 fail | 0 fail |
| `JOIN` (2 trials each) | 0 fail | 0 fail | 0 fail | 0 fail |
| batch of 4 `INSERT` (2 trials each) | 0 fail | 0 fail | 0 fail | 9 fail in trial 1 (`AssertionError: false == true`, thrown in Miniflare `Native` reviver: heap lookup assertion); 0 fail in trial 2 |

### Worker-hosted control (logged)

- `worker-hosted-100way-probe.log`: 5 trials, `N=100`, each `{201:1, 403:99}`, owners=1, creds=1.
- Suite logs: 18 `BOOT-100-WORKER` trials across six test processes (`p1c...127ca67`, `stress-parallel-p1c-1..3`, `unit...127ca67`, `unit...127ca67.run2`), all `{201:1, 403:99}` with `d1Failures {}`.

### Interpretation

- The defect sits in the Node-to-Miniflare D1 proxy under concurrency. The same handler code, hosted inside workerd, produced zero 500s and zero D1 failures across all runs above.
- It is not established what exactly triggers the proxy's `read ECONNRESET`. Miniflare internals were not patched, and `node_modules` was not changed.
- **Coverage limit:** at 100 scale, every loser was denied at the pre-check (403) before reaching the batch, so the batch-level denial (409) was not exercised at 100. The batch-level single-winner path is exercised by `BOOT-10` (`{201:1, 409:9}`) and `BOOT-SAME` (`{201:1, 409:9}`).

## Anomalies (open)

### A. `M05 LOCAL CMS 06` failed once in the unit suite run 1 on HEAD

- Assertion at test line 308 (persisted challenge rows): expected 3, actual 1. The two earlier assertions passed (3 HTTP 200 and 7 HTTP 429).
- Test 06 and the handler are unchanged by this PR. Analysis: the handler's `DELETE` only removes rows with `expires_at <= now` and `expires_at = now + 90`, so the row count cannot drop within the test. The symptom (3 acknowledged successes, 1 persisted row) therefore points to a transport-level fault in the Node-hosted D1 proxy (result mis-association or lost write). This is a hypothesis, not a proven root cause.
- Reproduction attempts: 25 isolated probe trials matched 25/25 (`challenge-quota-node-hosted-probe.log`); three parallel P1-C file runs passed (`stress-parallel-p1c-*.log`); unit run 2 passed. The failure rate observed is 1 in 3 full unit runs on this code.
- **Status: OPEN.** Treat this as a harness-integrity risk. It may recur in CI, because `npm test` runs the same unit suite. Recommended next step: move the concurrent challenge quota into the Worker-hosted harness, or add the same redacted diagnostics to find which layer loses the write.

### B. Golden M01 evidence rewritten by the unit suite (pre-existing harness side effect)

- During `npm run test:unit`, `test/modules/CB-M01/visual-check.mjs` and `integrated-visual-check.mjs` rewrote 8 tracked files under `.engineering/evidence/CB-M01-WO-001/`: 6 PNG screenshots, `visual-check.json` and `r26-integrated-visual-check.json` (`62 insertions(+), 62 deletions(-)`).
- Restored with `git checkout -- .engineering/evidence/CB-M01-WO-001` after each affected run. The final tree is clean on those paths. This is not part of this PR and needs a separate M01/CI ticket.
- The final E2E run on HEAD did not modify these files.

## Parts status (acceptance per WO section 2 to 5)

| Part | Status | Evidence / gap |
| --- | --- | --- |
| A (bootstrap 0 to 1, 2/10/100 races) | P0 addressed for 100 in workerd; A-anomaly open | `BOOT-2`, `BOOT-10`, `BOOT-SAME` Node-hosted pass; `BOOT-100` Worker-hosted pass (18 + 3 + 9 trials); anomaly A open |
| B (two passkeys, recovery, emergency offline procedure) | **NOT IMPLEMENTED** | No recovery enrollment, lost-primary login, or one-use emergency authorization in handler or tests |
| C (negative access and session matrix) | **NOT IMPLEMENTED** in this iteration | Existing tests cover some denials; no full matrix over privileged routes, verbs, cookies, Origin/Fetch-Metadata/CSRF |
| D (D1 CAS, failure injection, backup/restore) | **NOT IMPLEMENTED** in this iteration | Only existing single-path tests; no concurrent CAS proof, no restore into a separate LOCAL D1 |
| E (Chromium virtual authenticator for new bootstrap flow, a11y, zero egress) | **NOT IMPLEMENTED** | UI has no bootstrap screen; no new browser flow, axe run, or egress capture for the bootstrap path |

## Remaining risks

1. Anomaly A (open, possibly CI-visible).
2. Miniflare Node-to-D1 proxy fault under 100-way concurrency; mitigated only for the bootstrap race by hosting the handler in workerd. The root cause is upstream and not established.
3. `esbuild` used transitively by the test harness (see above).
4. The batch-level 409 path is not exercised at 100 scale.
5. Golden M01 side effect (see B above).
6. Parts B, C, D, E remain open. Until they pass with evidence, the PR is not `APPROVED_LOCAL_PROOF`.

## Verdict

`CORRECTION_REQUIRED`. Not `APPROVED_LOCAL_PROOF`. `M05_DONE=false`. `CHECKPOINT_DELTA={}`. No merge, no deploy, no remote D1, no real credential, no vault, no checkpoint promotion.
