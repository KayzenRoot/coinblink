# CB-M05-P1C-LOCAL-001 — Evidence bundle (partial, append-only)

Status: **CORRECTION_REQUIRED** (parts B–E not implemented). Not APPROVED_LOCAL_PROOF. M05 is not DONE.

Base: `main` @ 2ca1e91a053dddb39da47dc9d81c4ce59be50da7
Branch: `codex/cb-m05-p1c-local-ha-proof-r89`
Toolchain: Node v22.19.0, npm 10.9.3 (Node 26 was rejected: npm ci was invalid there).

## Changed files (intended write surface only)

| File | git blob | SHA-256 |
|---|---|---|
| src/modules/CB-M05/p1c-local/local-cms.mjs | accab325433de4adbe91be5aaf24ec94edbd1baa | 3d9bc4dcdd8109601fe15372ac90c3291534fd3e362081043f07310463818d60 |
| test/modules/CB-M05/p1c-local-cms.test.mjs | e4bd4648a498a7bc1770432bb8e7c46c6016f104 | 1eaea9204ba87ec5b339b30825aff217fe8dcfbab7773f453bc1b1d346292a92 |
| test/modules/CB-M05/p1c-fixtures/schema.sql | 6b308e28a1dbc584c87b72b162c6221c2abf22f3 | 242a2bdb472f4830d336e9edb2ebd1763c8b8a31342a44fd8e3d616e161bca0f |

## Commands and exit codes

- `node --test test/modules/CB-M05/p1c-local-cms.test.mjs` → exit 0, 24/24 pass (`p1c-local-cms.node-test.log`)
- `npm run lint` → exit 0 (`lint.log`)
- `npm run typecheck` → exit 0, 0 errors / 0 warnings (`typecheck.log`)
- Earlier in this run (not re-run for this commit): `npm test` exit 0 (441 unit, build, 48 Playwright). Its E2E step rewrote tracked CB-M01 golden evidence; those changes were restored with `git checkout` and are **not** part of this commit.

## Part A — Owner bootstrap (implemented, tested)

Single-winner bootstrap via a one-batch atomic transaction (`db.batch`) with a conditional `INSERT ... SELECT ... WHERE EXISTS(...)` gated on a per-attempt consume marker. A PK/UNIQUE violation inside the batch rolls back the whole batch. Ticket and challenge are HMAC/digest-stored.

Observed status histograms from the suite:

- BOOT-2: `{201:1, 409:1}`
- BOOT-10: `{201:1, 409:9}`
- BOOT-100 (asserted in waves of 10): `{201:1, 403:90, 409:9}`
- BOOT-BURST-100 (single 100-way burst, DB invariants only): `{201:1, 409:93, 500:6}`
- BOOT-SAME: `{201:1, 409:9}`

Invariant in all runs: exactly one owner row and one primary credential.

## Known finding — Miniflare transport failure under 100-way burst

Under a single 100-way concurrent burst of WebAuthn-verifying claims, about 6 requests returned 500. A temporary diagnostic showed `fetch failed ECONNRESET`. Isolated probes (plain 100-way inserts; 100-way batches with and without idle) did not reproduce it, so the trigger seems specific to the full handler path. Root cause is **not** established. The asserted test uses waves of 10 as a workaround. This is a harness/transport limit, not a security-logic failure, but it is an open risk.

## Finding — E2E suite mutates tracked golden evidence

`npm test` regenerates `.engineering/evidence/CB-M01-WO-001/*` (visual-check.json and PNGs) on every run. This must be a separate ticket. It was reverted here.

## Not implemented (blocks APPROVED_LOCAL_PROOF)

- Part B: recovery credential enrollment, second device, revocation, lost-primary recovery, one-use offline emergency authorization, lost-both denial.
- Part C: deny-by-default negative matrix over all privileged GET and mutating verbs, cookie attributes, digest-only session storage, CSRF/Origin checks.
- Part D: migration replay, CAS under concurrent revisions, failure injection, backup/restore.
- Part E: Chromium virtual-authenticator browser flow, a11y, no-egress capture.

## Secrets

No secret values, credentials, or real Owner data were introduced. All fixtures are synthetic and local (Miniflare). No `--remote`, no deploy, no publication, no merge.
