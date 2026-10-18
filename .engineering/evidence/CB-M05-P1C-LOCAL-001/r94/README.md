# CB-M05-P1C-LOCAL-001 · R94 evidence bundle (append-only)

Status of this iteration: **in progress**. Parts B, C, D and E are appended to this file as they land. Verdict is declared in the final section only. `CHECKPOINT_DELTA={}`. No merge, deploy, remote D1, real credential or checkpoint action.

## Identity and provenance

| Item | Value |
| --- | --- |
| Work Order / PR | `CB-M05-P1C-LOCAL-001` / KayzenRoot/coinblink #128 (draft, kept open) |
| Branch | `codex/cb-m05-p1c-local-ha-proof-r89` (normal pushes, never force) |
| Head at R94 start | `65e2f9d9fbe752060dc2dcc2287d7475089fa7b4` |
| Protected `main` at R94 start | `2ca1e91a053dddb39da47dc9d81c4ce59be50da7` |
| Owner LOCAL code GO | issue #12 comment `6248988847` (`OWNER_LOCAL_P1C_CODE_GO=YES`), scoped to this Work Order |
| Worktree | `C:\Users\csn19\AppData\Local\Temp\opencode\coinblink-r92` (isolated `git worktree`) |
| Toolchain | Node `v22.19.0`, npm `10.9.3`, `npm ci` from lockfile; Windows 10/11 host; Miniflare/workerd LOCAL D1; Playwright Chromium with virtual authenticators |
| Data policy | Synthetic only. No real passkey, identity, provider call, remote D1 or secret. Logs are redacted: no tickets, cookies, challenges, keys or payloads. |

## CP1 · Challenge quota reliability and 100-way contention

### What the anomaly was

`M05 LOCAL CMS 06` once observed three HTTP 200 responses with only one persisted `cms_challenges` row on the Node-hosted harness. The R92 evidence bundle recorded it as open. R94 had to reproduce it under concurrency, compare the two harnesses and fix or classify it without masking.

### Investigation 1 · acknowledged writes vs persisted rows (Node-hosted proxy)

Probe `probes/identity-node-hosted.mjs.txt`. Every request inserts its own row with `RETURNING` and the round then counts persisted rows.

| Log | Configuration | Result |
| --- | --- | --- |
| `logs/identity-node-hosted-returning.log` | N=100, 8 rounds | All rounds clean: 100 acknowledged, 100 rows. The fault is intermittent, so a clean run is expected most of the time. |
| `logs/identity-node-hosted-faults.log` | N=200, 10 rounds x 2 invocations | 8 of 20 rounds lost responses: `acks=199, rows=200`, `errors={"ECONNRESET\|fetch failed":1}`. **Rows persisted 200/200 in every round, including the faulted ones.** No duplicate results, no wrong values. |
| R92 `../r92/node-hosted-100way-probe.log` (historical) | 100-way claim bursts | 43-99 of 100 HTTP 500 per round with the same `ECONNRESET` signature. |

Interpretation: on the Node-hosted path the proxy can **lose responses while the write commits**. The caller sees `fetch failed` (HTTP 500 at the handler boundary) for work that actually landed. Rows were never lost and results were never duplicated or mis-delivered in any captured round.

Consequence for the historical anomaly: `acknowledged == persisted` can diverge in *either* direction on that path, because response loss is not transactional with the write. The exact historical 3-ack/1-row instance was not reproduced in 66 targeted quota trials (below).

### Investigation 2 · quota flow differential (Node-hosted vs Worker-hosted)

Probe `probes/quota-differential.mjs.txt`, logs `logs/quota-differential-10x25.log` and `logs/quota-differential-100x8.log`.

| Harness | Trials | Concurrency | Result |
| --- | --- | --- | --- |
| Node-hosted | 25 | 10 | 25/25 acknowledged == persisted |
| Worker-hosted | 25 | 10 | 25/25 acknowledged == persisted, zero in-Worker D1 failures |
| Node-hosted | 8 | 100 | 8/8 match |
| Worker-hosted | 8 | 100 | 8/8 match |

The quota path itself did not reproduce the divergence in 66 trials. The defect class is the transport, not the quota statement.

### Investigation 3 · is `dispatchFetch` actually concurrent?

Probe `probes/inflight-concurrency.mjs.txt`, log `logs/inflight-concurrency.log`.

A worker that counts its own in-flight requests reported `maxInFlightInWorker = 50` for 50 concurrent `dispatchFetch` calls and `84` (once `100`) for 100. The transport delivers genuine overlap, so Worker-hosted races are simultaneous, not serialized.

### Investigation 4 · where does the batch guard actually get exercised?

Probe `probes/same-ticket-contention.mjs.txt`, log `logs/same-ticket-contention.log`. One shared ticket, K contenders, all dispatched concurrently inside workerd.

| K | Result |
| --- | --- |
| 10 (x6), 30 (x2), 50 (x2) | `{201:1, 403:K-1}` every time, `conflicts409=0` |

In the Worker runtime the winner commits before the other contenders reach their pre-check, so the dispatch-based race denies losers with 403 and never reaches the conditional batch. That is why `BOOT-RACE-BATCH` starts all claims in one tick inside the runtime (see below): it is the configuration where the batch guard itself is measurably exercised.

### Correction applied

1. **`BOOT-RACE-BATCH` (new, Worker-hosted).** The fixture entry exposes a test-only race route that starts every claim **in one tick inside the runtime**, which is the strongest simultaneity available and removes the transport from the measured path. 100 contenders, three fresh D1 databases per run: `{201:1, 409:99}` in all three trials, `d1Failures {}`. This exercises the **conditional single-winner batch** itself (99 batch-level denials), which the dispatch-based 100-way test could not reach — there, the winner commits first and losers are stopped by the 403 pre-check.
2. **`QUOTA-WORKER` (new).** 100 concurrent challenges against the real handler inside workerd: `{200:3, 429:97}`; acknowledged == persisted == 3. Consumed rows are shown to free quota (a consumed row does not count against the cap).
3. **`QUOTA-WORKER-RESTART` (new).** The same LOCAL D1 is reopened after a restart (fixture clock at T0), then reopened at T0+91 s: the challenge row survives the restart, the stale challenge is cleaned up on the next issuance, and only the fresh challenge is active.
4. **`BOOT-100-WORKER` preserved** unchanged as the dispatch-level 100-way test: `{201:1, 403:99}` in every trial.
5. **`M05 LOCAL CMS 06` preserved** as the Node-hosted differential test, unmodified, so the transport-level behaviour stays visible.

Reliability measurement: three consecutive full unit suites on the CP1 commit each passed **444/444, exit 0**, with no recurrence of the historical divergence; details in `logs/unit-repetition-summary.md`.

## SonarCloud new-issue triage (PR #128)

`api/issues/search` for the pull request returned exactly one open issue:

| Field | Value |
| --- | --- |
| Rule | `javascript:S3358` |
| Severity / type | MAJOR / CODE_SMELL |
| File | `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs` |
| Line | 16 (nested ternary in the redacted diagnostics classifier) |
| Action | In scope (test fixture owned by this Work Order). Rewritten as an explicit statement; behaviour unchanged. |

The Quality Gate being green is not a claim of coverage: `0.0% coverage on new code` remains, so no independent coverage claim is made from it.

## KNOWN LIMITATIONS

- The historical 3-acknowledged/1-persisted observation was **not** reproduced; it is classified as transport-class, not proven to a specific proxy defect line.
- The Node-hosted proxy fault (lost responses with committed writes) is a Miniflare/workerd transport property that cannot be fixed from this Work Order; it is mitigated by making the authoritative proofs Worker-hosted and keeping a differential Node-hosted test.
- `esbuild` is still consumed as a transitive dependency of `wrangler` for test-time bundling. Declaring it in `package.json` is out of scope and remains a residual risk.
- Parts B, C, D and E are appended below as they complete; until then this iteration is not a complete HIGH_ASSURANCE proof.
