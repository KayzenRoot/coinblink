# Reliability measurement (CP1)

Goal: measure whether the intermittent `M05 LOCAL CMS 06` divergence recurs after the CP1 changes, and record honest counts. Commands run with Node 22.19.0 / npm 10.9.3 from the worktree root.

## Repeated full unit suites on `96ddff5` (CP1 tests included)

| Run | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `npm run test:unit` | 0 | 444/444 pass |
| 2 | `npm run test:unit` | 0 | 444/444 pass |
| 3 | `npm run test:unit` | 0 | 444/444 pass |

Raw logs: `unit-run-1.log`, `unit-run-2.log`, `unit-run-3.log` in this directory (copied from the R94 run directory). `npm run test:unit` rewrites 8 tracked `CB-M01-WO-001` evidence files as a known M01 harness side effect; they were restored with `git checkout -- .engineering/evidence/CB-M01-WO-001` after the runs, and the final worktree is clean on those paths.

## Historical baseline for comparison

- R92 (HEAD `127ca67`, before the Worker-hosted quota tests): 1 failure in 3 full unit runs. The single failure was `M05 LOCAL CMS 06` (three acknowledged HTTP 200, one persisted row), exit 1.
- R94 with the CP1 changes: 0 failures in 3 full unit runs (444 tests each).

The historical divergence was **not** reproduced in R94. It stays classified as transport-class (see the identity probe in `../README.md`), and the authoritative quota proof is now Worker-hosted. The Node-hosted test 06 remains in the suite as the differential.

## Target-suite repetitions

| Command | Runs | Result |
| --- | --- | --- |
| `node --test test/modules/CB-M05/p1c-local-cms.test.mjs` | 1 full pass recorded in `../../r94/logs/p1c-local-cms.node-test.log` | 26/26 pass, including `BOOT-RACE-BATCH` `{201:1,409:99}` x3, `QUOTA-WORKER` `{200:3,429:97}`, `QUOTA-WORKER-RESTART` |

Failure rate observed for test 06 across R92+R94 full-suite runs: 1 in 6 runs (all with the Node-hosted harness). No failure occurred in the three R94 runs.
