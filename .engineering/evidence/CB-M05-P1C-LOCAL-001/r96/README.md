# CB-M05-P1C-LOCAL-001 · R96 evidence bundle (append-only)

Status: **pending final battery and CI** (recorded below when complete). This bundle does not self-approve: it supports the Owner's HIGH_ASSURANCE review. `CHECKPOINT_DELTA={}`. No merge, deploy, remote D1, real credential or checkpoint action.

## Identity and provenance

| Item | Value |
| --- | --- |
| Repository / PR | `KayzenRoot/coinblink` / #128 (open, draft, unmerged) |
| Branch | `codex/cb-m05-p1c-local-ha-proof-r89` (normal pushes only) |
| Base protected `main` | `2ca1e91a053dddb39da47dc9d81c4ce59be50da7` |
| Head at R96 start | `65e2f9d9fbe752060dc2dcc2287d7475089fa7b4` |
| Work Order / lock / hierarchy | `8a00346e…942b` / `98781a14…3577` / `3ba4fb9b…20f2` (all matched) |
| Checkpoint | `72618bef…4649` = `M00_COMPLETE`, 5% (unchanged) |
| Owner LOCAL code GO | issue #12 comment `6248988847` (synthetic LOCAL only) |
| Worktree | isolated `git worktree` on the PR branch; `origin` in the host repo points to another repository, so all fetches/pushes use the explicit PR URL |
| Toolchain | Node `v22.19.0` (portable zip, SHA-256 `ea3fad0e…3f86` verified against the official `SHASUMS256.txt`), npm `10.9.3`, `npm ci` from the immutable lockfile, Miniflare/workerd LOCAL D1, Playwright Chromium with virtual authenticators |
| Data policy | synthetic only; logs redacted (no tickets, cookies, challenges, keys or payloads) |

## Checkpoints

| Checkpoint | Result |
| --- | --- |
| CP0 identity/preflight | Remote head matched; clean isolated worktree; canonical blobs verified; write surface confirmed |
| CP1 D1 quota inconsistency | Reproduced and classified the Node-hosted proxy fault (lost responses with committed writes; 8/20 rounds at N=200, rows 200/200). 66-trial quota differential clean in both harnesses. Authoritative quota proof moved to workerd; differential Node-hosted test preserved. `BOOT-RACE-BATCH` adds the batch-level 409 path at 100 |
| CP2 Part B | Implemented; B1–B4 pass; single active device per kind; single-use recovery authorization and emergency token; no second Owner |
| CP3 Part C | Implemented; C1–C4 pass with per-case zero-write assertions; privileged server-rendered HTML page denies anonymous |
| CP4 Part D | Implemented; D1–D5 pass: schema replay, CAS `{200:1,409:9}`, injected rollbacks, atomic restore, corrupted/incompatible restore fail-closed, restart persistence |
| CP5 Part E | Implemented; E1/E2 pass: real Chromium bootstrap→recovery journey, privileged page, axe clean, keyboard focus, 390px responsiveness, two-layer egress proof |
| CP6 final head | Pending final battery + 7/7 CI on the pushed head |

## Part A · bootstrap and 100-way contention

| Scenario | Harness | Result |
| --- | --- | --- |
| `BOOT-2` | Node-hosted | `{201:1, 409:1}` |
| `BOOT-10` | Node-hosted | `{201:1, 409:9}` |
| `BOOT-2-WORKER` / `BOOT-10-WORKER` | Workerd, dispatch | `{201:1, 403:1}` / `{201:1, 403:9}`, `d1Failures {}` |
| `BOOT-100-WORKER` | Workerd, dispatch | `{201:1, 403:99}` × 3 fresh D1, `d1Failures {}` |
| `BOOT-RACE-BATCH` | Workerd, all claims in one tick | `{201:1, 409:99}` × 3 fresh D1, `d1Failures {}` — the conditional batch itself denies the losers |
| `BOOT-SAME` | Node-hosted, shared ticket | `{201:1, 409:9}` |
| `QUOTA-WORKER-100` | Workerd | `{200:3, 429:97}`; persisted active rows = 3 (acknowledged == persisted) |
| `QUOTA-WORKER-RESTART` | Workerd, fixture clock | challenge survives restart, expires, is cleaned up; only the fresh one active |
| `CAS-10` | Workerd, 10 PATCH writers | `{200:1, 409:9}`, zero 500, exactly two revisions |

Node-hosted differential (R94 bundle, preserved): 100-way claim bursts returned 43–99 HTTP 500 per round, all `BATCH` `ECONNRESET`, while owner/credential invariants stayed at 1. Identity probe at N=200: 8/20 rounds lost responses while all 200 rows persisted. This is a Node↔workerd transport property, mitigated by hosting the authoritative races and quota proof inside workerd; the root cause upstream is not fixed here.

## Part B · devices, recovery and offline emergency

| Endpoint | Authorization | Behaviour |
| --- | --- | --- |
| `POST /local/enroll/challenge` | session + CSRF + same-origin | one-use enrollment challenge per kind (max 3 active, 90 s) |
| `POST /local/enroll/claim` | session + CSRF + same-origin | atomic: consume challenge, optionally consume a `rotate-primary` authorization, revoke the replaced device and its sessions, insert the new device, append audit |
| `POST /local/recovery/challenge` | session on a `recovery` device | issue a `recovery`-purpose assertion challenge |
| `POST /local/recovery/complete` | same + fresh UV assertion | consume the challenge, advance the counter, create one single-use authorization (300 s) |
| `GET /local/credentials` | session + same-site read | list active and revoked devices |
| `POST /local/credentials/revoke` | session + CSRF + same-origin | revoke another device and its sessions; refuses self-revocation |
| `POST /local/emergency/claim` | one-use offline token + fresh UV registration | consume the token, revoke every device and session, install the new primary |

Invariants proven by B1–B4: one Owner forever; one active device per kind; rotated devices cannot authenticate and their sessions die; replacing a lost primary without the additional recovery authorization is denied with **zero writes**; the authorization is consumed exactly once even under concurrent claims; emergency tokens are single-use and expiring; both-lost without a token is denied; audit sequence `device_revoked → recovery_authorized → device_enrolled → recovery_used` and `emergency_used → device_enrolled`.

## Part C · authorization and session matrix

- **C1**: 11 privileged routes × 7–10 hostile cases (anonymous, tampered/duplicate cookie, hostile origin, cross-site or missing fetch metadata, invented bearer, missing/wrong/malformed CSRF) with exact status and **zero table-count change** per case; denied responses set no cookie and leak no privileged fields.
- **C2**: `PUT/DELETE/OPTIONS/HEAD` on known paths → 405 + `Allow`; unknown shapes → 404; encoded traversal normalizes onto the protected route and still requires auth; wrong content type → 403; oversized body → 400; zero writes.
- **C3**: `__Host-` cookie with `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`; only digests stored; TTL expiry, logout and device revocation each kill access.
- **C4**: new privileged server-rendered `GET /local/workspace`: anonymous → 401 with no owner data; authenticated → 200 with escaped device/draft data and no session material; hostile origin → 403; after logout → 401. The fixture UI links to it.

Hardening: privileged reads require same-site fetch metadata and validate `Origin` only when present (browsers omit it on same-origin GET); HTML pages accept `Sec-Fetch-Site: none` for direct navigation but reject cross-site.

## Part D · D1 LOCAL, CAS, failure injection and restore

- **D1** schema replay fails explicitly (`already exists`) with unchanged counts; foreign keys and CHECK constraints enforced.
- **D2** 10 concurrent PATCH writers → exactly one winner, nine 409, two revisions, no orphan rows.
- **D3** injected trigger failures in the revision insert, enrollment batch and emergency batch → 500 with full rollback (draft revision, challenge consumption, token, revocations) and a safe retry with the same key/challenge/token; consumed token remains consumed after a handler restart.
- **D4** full 12-table dump restored into an isolated Miniflare D1: identical counts and SHA-256 content digests; live session works; revoked and expired sessions stay dead.
- **D5** restore is one transaction: corrupted (missing Owner) and schema-incompatible backups restore **nothing**; a valid restore plus restart keeps revocation and session semantics.

No `--remote`; every database is a throwaway LOCAL Miniflare D1.

## Part E · Chromium, a11y and egress

- **E1**: real Chromium virtual authenticator journey from an empty database: bootstrap → sign-in → recovery enrollment → privileged `/local/workspace` in a second tab → sign-out (anonymous 401) → sign-in with recovery → primary revocation → replacement refused without authorization → recovery authorization → primary replacement → re-login. Browser negatives: second-owner challenge 403, tampered CSRF 403, cross-origin fetch blocked by CSP. **axe: zero critical or serious violations**; ≥6 keyboard-reachable controls with visible focus indicators; no horizontal overflow at 390 px; no console/page errors during the accepted journey.
- **E2**: total-loss emergency recovery through the UI; foreign RP ID rejected server-side with zero writes and the token unconsumed; replayed token denied with no audit growth; sign-in with the new primary; axe clean.

Egress is proven in two layers: CSP blocks external `fetch` before the network, and the fixture route blocks the single deliberate external navigation. Every allowed request stayed on `https://owner.example.test`; no Worker/provider fallback exists.

## SonarCloud

One new issue was reported at the previous head: `javascript:S3358` (MAJOR, code smell), nested ternary, `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs:16`. It is inside the allowed write surface and was rewritten as an explicit statement with unchanged behaviour. No suppression was used. The quality gate being green is not a coverage claim: new-code coverage was reported as `0.0%`, so none is made here.

## Known harness issues (pre-existing, out of scope)

1. `npm run test:unit` at **default file parallelism on this host** intermittently fails `test/modules/CB-M01/visual-check.mjs` with `Astro fixture did not become ready: readiness request exceeded the remaining deadline` (observed in both R94 final runs). The same script passes standalone (exit 0, no console/page/external requests), and the suite passes with bounded file concurrency. It is load-related in the M01 harness, unrelated to M05, and needs a separate M01/CI ticket.
2. `npm run test:unit` rewrites 8 tracked `CB-M01-WO-001` Golden files. They are restored with `git checkout` after every run and are not committed. Separate ticket.
3. Running `node --test` directly (instead of through `npm`) fails `test/gef-provenance.test.mjs` (`npm must expose its CLI path`). The suite must be executed through npm, as the canonical script does.
4. `esbuild` is used transitively (through `wrangler`) for test-time bundling; declaring it in `package.json` is outside this Work Order.

## Toolchain incident (disclosure)

The portable Node 22.19.0 distribution was deleted from the Windows temp area mid-iteration by the environment. Some intermediate runs therefore executed on the system Node `v26.4.0` (observable through ML-DSA experimental warnings). The pinned toolchain was reinstalled with SHA-256 verification, and the final battery and reliability repetitions were re-executed on Node 22.19.0. The earlier R94 logs could not be re-verified retrospectively and are labelled as such.

## Changed files and fingerprints (final code tree)

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `src/modules/CB-M05/p1c-local/local-cms.mjs` | `614b7608cb9c6ee13e3c515b6dc50d11d4713c24` | `10308f1cc5d69b20e911c83443fda11e8ce20c78c1f9adb49c2f9a17fada9be6` |
| `src/modules/CB-M05/p1c-local/local-cms-ui.mjs` | `1eef65a5b379a6820e19e32202976548b9bfb0b2` | `a0097132e7406bda3eed8789f84b8422fd3269632080fccbc4f49a6a3c94517c` |
| `test/modules/CB-M05/p1c-local-cms.test.mjs` | `7018afc5933613d518ea95361d5eaab4d62c87ee` | `cd1b090e427232fd45c98997ee46b9e9b35120869c16e151ca9e48d91b7ff3b5` |
| `test/modules/CB-M05/p1c-local-preview.mjs` | `4be179f73739a0186b6ab99590e3e55e9db2ee5e` | `ad8beac7102e89f11bcabfda61e788ee50a1f51d5539a0bf38b4f61a8eecad99` |
| `test/modules/CB-M05/p1c-fixtures/schema.sql` | `aa53185cecb739d7992430adde939116c1620f42` | `4d66c75676169265e2d8c7eda3500c991b0758da8b0e61f5e7db37f5b4e6a3d6` |
| `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs` | `bcadae12ea1c04ac6a1eca40445a4f14d18a0b69` | `3d56adc404ad9a07f7909a04ba9b05d0f736b19e445796805716fdf74bc136cc` |

All changes stay inside the Work Order surface. No `src/pages/**`, middleware, `astro.config.*`, `package.json`, lockfile, workflows, root Wrangler, Golden M01 or checkpoint change is part of the branch.

## KNOWN LIMITATIONS

- The Node-hosted proxy fault is mitigated, not fixed; authoritative concurrency proofs are Worker-hosted and a differential Node-hosted test remains.
- The historical 3-acked/1-persisted observation was not reproduced; it is classified as transport-class.
- `esbuild` remains a transitive dependency of the test harness.
- Concurrent replacement of a lost primary by the *same* authenticated Owner is serializable: the second claim becomes a rotation of the newly active primary. The single-use authorization is still consumed exactly once and one active primary remains. This is documented rather than asserted as a single-success race.
- The M01 harness issues above are pre-existing and out of scope.

## Final status

Recorded in the closing report: final HEAD, 7/7 CI, status. This bundle never asserts `APPROVED_LOCAL_PROOF` on its own.

## Commands and exit codes (final tree)

| Command | Exit | Result | Log |
| --- | --- | --- | --- |
| `node --test test/modules/CB-M05/p1c-local-cms.test.mjs` | 0 | 42/42 | `logs/p1c-local-cms.r96.log` |
| `npm run lint` | 0 | clean | `logs/lint.r96.log` |
| `npm run typecheck` | 0 | 0 errors | `logs/typecheck.r96.log` |
| `npm run build` | 0 | complete | `logs/build.r96.log` |
| `npm run test:unit` | 1 | 460 tests, 459 pass. Only `test/modules/CB-M01/visual-check.mjs` failed: `Astro fixture did not become ready: readiness request exceeded the remaining deadline` (pre-existing M01 harness timeout under default file parallelism; the script passes standalone) | `logs/unit-default.r96.log` |
| `npm run test:unit -- --test-concurrency=4` | 0 | 460/460 pass | `logs/unit-c4.r96.log` |
| `npm run test:e2e` | 0 | 48 passed | `logs/e2e.r96.log` |
