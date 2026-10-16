# Evidence Bundle — CB-M05-P1B-LOCAL-001

**Disposition:** `LOCAL_IMPLEMENTATION_READY_FOR_INDEPENDENT_TECHNICAL_REVIEW` with one unrelated full-suite browser flake recorded below.

**Risk:** `HIGH_ASSURANCE`. **Checkpoint delta:** `{}`.

**Owner execution GO:** [Issue #12 comment 6214870491](https://github.com/KayzenRoot/coinblink/issues/12#issuecomment-6214870491).

**Verified base:** `c5077fadd053936fa83e3beff11097505b8a093c`.
**Implementation branch:** `codex/cb-m05-p1b-local-001`. The exact published PR HEAD is recorded in the PR metadata and hosted-check evidence after push.

This bundle proves a local synthetic WebAuthn/D1 test harness only. It does not implement or authorize real Owner enrollment, production authentication, privileged routes, a CMS, remote D1, deployment, module completion, merge, or checkpoint promotion. `authorizedToMerge=false`.

## Source and conditional-GO preflight

- `git fetch origin main` and GitHub API readback both returned `c5077fadd053936fa83e3beff11097505b8a093c`; the local branch is based directly on that commit. A final pre-publish readback confirmed `origin/main` remained unchanged.
- The 24 Git blob fingerprints in the R73 Context Lock table were recalculated against `origin/main`: **24/24 matched**. Work Order blob: `5a72e9f8d9f41f851cdabc70287b57b51b00a4a3`; Context Lock blob: `a0ea7150c4b175f1cb2df80d8484ae660dd2b9bd`.
- The R74 report was read in full and its SHA-256 recalculated as `2a595a462d6d0a5b9d88d74d69f5982c37874381b1f5a7e3a70d69bbf691f8fa`, matching the Owner's expected value. Its machine-readable runtime/smoke evidence reports Node `v22.19.0`, npm `10.9.3`, Wrangler `4.149.0`, a local D1 query returning `1`, and exit code `0`.
- The R73 report and scratch artifacts were read and checked. R73 report SHA-256: `b2eb4b1456f6b09d88e0684a98fd419f5786a1e7b871394d41f43c578f89deac`. The SimpleWebAuthn 14.0.3 tarball is 121,672 bytes; SHA-256 `308bba79bee038539cc32f6af54e4968fa75aa704574bb6184585ab2bc112130`; calculated SHA-512 SRI `sha512-D39/0fiDiYmGV+nraY9s63D1Ho2AX/waMLy22/9gUadTUuvbAnstfb4bpbHYbwZuV5ZLDYN1SmzDKuiHzKAA4Q==`, matching npm metadata and the lockfile. License: MIT.
- The exact dependency `@simplewebauthn/server@14.0.3` is pinned in `devDependencies` only. `npm audit` for the R73 lock reported zero findings across 569 non-root dependencies; the R75 current-lock audit reported zero findings across 545 dependencies. OSV returned 24/24 empty result objects for the added package graph. The successful clean-scratch npm signature/attestation audit reported 18 verified packages, 0 invalid, 0 missing and included this package. A separate R73 signature command against a scratch with no eligible installed registry dependencies emitted an npm error; that failed attempt is not counted as a pass.
- The supplied R74 evidence also records a successful `wrangler d1 execute ... --local` smoke and 24/24 source fingerprints. The current P1B test adds its own isolated synthetic fixture and independent local smoke. No Cloudflare environment variables were present in the test shell; test subprocesses also strip `CLOUDFLARE*`, `CF_*`, and `WRANGLER*` names before invoking Wrangler.

## Implementation and changed paths

- `package.json`, `package-lock.json`: Integration Steward's approved exact dev-only verifier pin; no scripts or production dependencies changed.
- `src/modules/CB-M05/p1b-local/webauthn-fixtures.mjs`: creates ephemeral ES256 synthetic authenticators in memory, produces registration/assertion responses, and calls the pinned library's actual registration/authentication verifiers. Selected-credential binding is enforced by the harness before authentication verification.
- `src/modules/CB-M05/p1b-local/request-model.mjs`: bounded model-only Origin, Fetch Metadata, JSON, CSRF, idempotency and two-authenticator recovery checks.
- `src/modules/CB-M05/p1b-local/d1-guardrails.mjs`: exact configuration and argument allowlists for the reserved synthetic D1 fixture; unknown, duplicated, alternate, remote/preview, out-of-root, traversal and symlink/junction persistence inputs fail closed before state creation.
- `test/modules/CB-M05/p1b-webauthn.test.mjs`, `p1b-request-model.test.mjs`, `p1b-guards.test.mjs`, `p1b-d1-local.test.mjs`: 43 new P1B tests across actual cryptographic verification, model controls, security guards and local D1 behavior.
- `test/modules/CB-M05/p1b-fixtures/wrangler.local.jsonc`, `schema.sql`: reserved synthetic D1 identity and schema. Persistent test state is kept under ignored `.wrangler/p1b-local-state/` and is not committed.
- `.engineering/evidence/CB-M05-P1B-LOCAL-001-EXECUTION.md`: this sanitized execution record.

## Evidence classification

- **`REAL_CRYPTO_LOCAL`:** actual `verifyRegistrationResponse()` and `verifyAuthenticationResponse()` executions over locally generated signatures. Positive cases and negative vectors cover modified signature/client data/authenticator data, wrong key, origin, RP ID, challenge/action, UP/UV flags, response type, credential ID substitution, malformed JSON/CBOR/COSE and unsupported algorithm. Private keys are ephemeral in-memory test material and are not written or logged.
- **`D1_LOCAL_EMULATOR`:** Miniflare's local Workerd D1 binding exercises concurrent requests against the synthetic database. For 2, 10 and 100 concurrent Owner claims, exactly one request reports a committed create and every loser receives an explicit conflict/contention denial; the database contains exactly one Owner. Separate cases exercise concurrent challenge replay (one consume, nine denials), action/audience/expiry binding, credential public-key-only storage, duplicate credential rejection, revocation/recovery, session HMAC digests, expiry, revoke/rotation, and transactional rollback/retry. The concurrency claim is limited to real concurrent local Workerd requests; it does not claim separate physical database servers or production D1 behavior.
- **`WRANGLER_LOCAL_SMOKE`:** one real Wrangler CLI invocation executes the allowlisted schema with `--local`, exact fixture config, ignored persistence path and JSON success assertion. The guard tests reject remote and preview modes. The smoke does not access Cloudflare accounts or services.
- **`MODELLED_ONLY`:** request-boundary and recovery rules. These tests are not WebAuthn cryptography, browser passkey enrollment, production cookies, or a production authorization service.

## Validation ledger

All commands used the isolated Node.js `v22.19.0` / npm `10.9.3` runtime. The local dependency install used the lockfile and disabled lifecycle scripts; all D1 state was synthetic/local.

| Command / check | Result |
| --- | --- |
| P1B Node test files, `--test --test-concurrency=1` | **PASS — 44/44**; all P1B cryptographic, model, guard and D1 cases passed on the final test sources, including symlink/junction rejection. |
| `npm run lint` | **PASS** — zero warnings/errors. An earlier run found an unused helper after the emulator refactor; it was removed and lint rerun successfully. |
| `npm run typecheck` | **PASS** — 89 files, 0 errors, 0 warnings, 0 hints. |
| `npm run build` | **PASS** — Cloudflare server build completed; session-binding guard found no SESSION, data, service or production binding in `dist/server/wrangler.json`. |
| Built server scan for verifier/harness names and synthetic challenge markers | **PASS** — no matches in `dist/server`. |
| `npm run test:e2e` | **PASS — 20/20** browser tests, including desktop/tablet/mobile and existing non-privileged M05 demonstration routes. |
| `npm run test:unit -- --test-concurrency=1` (final full-repository run after symlink hardening) | **PASS — 261/261**, 0 failed, 0 skipped. All P1B and P1-A tests passed. |
| Earlier full unit run and isolated browser retry | **FLAKE OBSERVED, THEN CLEARED** — one earlier full run returned 259/260 because the existing `test/modules/CB-M05/admin-workspace-visual.mjs` child browser reported `net::ERR_NO_BUFFER_SPACE` at `/admin/login`; that same test passed alone, and the final full run passed 261/261. No P1B code is imported by that visual fixture. |
| Wrangler CLI P1B synthetic fixture smoke | **PASS** — local only; all JSON results had `success: true`. |
| Checkpoint, ruleset, production routes, remote Cloudflare/D1, deploy, merge | **NO CHANGE / NOT RUN** — prohibited by the execution GO. |

The isolated retry is retained as evidence for the transient browser error; the subsequent full unit run after the final code change is authoritative and passed all 261 tests.

## Acceptance and limitations

| Criterion | Status | Evidence / boundary |
| --- | --- | --- |
| A1 — current source, Context Lock, verifier integrity/license/advisories | `PASS` | Source and artifact checks above; exact Owner GO recorded. |
| A2 — real signature verification and negative protocol vectors | `PASS` | 19 cryptographic registration/authentication tests within the 43-test P1B set. |
| A3 — distinct synthetic authenticators and fail-closed recovery/revocation | `PASS_LOCAL_MODEL` | In-memory cryptographic fixtures plus local database state; no human or hardware passkey. |
| A4 — D1 local contention, replay, expiry and session rollback/lifecycle | `PASS_LOCAL_EMULATOR` | Miniflare Workerd D1 plus a separate exact-fixture Wrangler `--local` smoke; not production D1. |
| A5 — P0 remains MOCK / SECURITY DISABLED; no application auth route | `PASS` | No app route/middleware/Wrangler root config changed; build-output guard and scan passed. |
| A6 — local full suite and exact-head hosted checks | `LOCAL_PASS / HOSTED_PENDING` | Lint/typecheck/build/P1B/e2e and the final 261-test unit suite passed. One earlier browser flake was isolated and did not recur. Hosted checks must be read on the exact published PR HEAD; CodeRabbit status is not an independent security review if skipped. |
| A7 — evidence and checkpoint delta | `PASS` | This bundle records classifications, errors, risks and `{}`; checkpoint stays M00_COMPLETE / 5%. |

**Residual risks:** this is not a production authentication implementation; no real WebAuthn device, account, Worker production runtime, Cloudflare account, external D1, or privileged route was exercised. Security review and exact-head hosted checks remain necessary. Rights/commercial publication are outside this work order and remain governed by their own gates.

**Final authorization state:** `authorizedToMerge=false`; `CHECKPOINT_DELTA={}`; stop at one draft PR for technical/security review. No merge, deploy, ruleset edit, real credential or remote service use occurred.
