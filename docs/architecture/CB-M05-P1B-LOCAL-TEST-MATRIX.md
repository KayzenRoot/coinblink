# CB-M05-P1B-LOCAL-001 — Security proof test matrix (candidate only)

**STATE: SPECIFICATION / NOT_EXECUTED / NOT_ADMITTED.** PASS must mean the test truly executed at an identified SHA. P1-A modeled nonce/Owner/session tests are not WebAuthn signature verification.

| ID | Proof obligation | Explicit failures to assert | Evidence class |
| --- | --- | --- | --- |
| WA-01 | Verify real generated fake-key WebAuthn signature with vetted verifier | modified signature/authenticatorData, wrong COSE key or algorithm | REAL_CRYPTO_LOCAL |
| WA-02 | Validate action-bound challenge and consume once atomically | stale, already consumed, wrong action/audience, concurrent replay | REAL_CRYPTO_LOCAL + D1_LOCAL |
| WA-03 | Enforce expected origin/RP hash/UP/UV/type | malicious origin, RP mismatch, user verification disabled, wrong type | REAL_CRYPTO_LOCAL |
| WA-04 | Verify registration credential structure and public-key-only persistence | malformed/oversize JSON/CBOR/COSE, duplicate credential ID, unsupported alg | REAL_CRYPTO_LOCAL + D1_LOCAL |
| WA-05 | Verify credential belongs to sole Owner and can be revoked | changed public key, alien ID, revoked key, duplicate Owner | REAL_CRYPTO_LOCAL + D1_LOCAL |
| WA-06 | Defend against replay even for synced passkey counter 0 | unchanged sign count / cloned counter / reused challenge | REAL_CRYPTO_LOCAL + D1_LOCAL |
| REC-01 | Require independently registered second device | stolen/revoked second device, same credential twice, email-only reset | LOCAL_CRYPTO + MODELLED_RECOVERY |
| OWN-01 | Enforce Owner singleton under 2, 10, 100 genuine concurrent connections | multiple successful Owner claims, conflict handling, rollback | D1_LOCAL_EMULATOR |
| SES-01 | Synthetic 256-bit tokens hashed/HMAC at rest, expiry/revocation/rotation | replaced/expired/revoked token, stale key, fixation | D1_LOCAL_EMULATOR |
| CSRF-01 | Unsafe mutation requires appropriate origin and CSRF controls | cross-site POST, missing CSRF, invalid content type/idempotency | LOCAL_MODEL_HARNESS |
| D1-01 | Atomic nonce/session row changes and failure recovery | fault injection, partially committed transaction, restore and retry | D1_LOCAL_EMULATOR |
| SEC-01 | No cloud fallback, real IDs, keys, auth endpoint or prod dependency | --remote, live Worker, private key artifact, creds in logs, API write | SOURCE_AND_CI |
| REG-01 | Existing M05 P0 and P1-A tests remain valid | P0 publish enabled, CSP loosened, network call, previous CAS test failure | REGRESSION_CI |

Each case requires PASS / FAIL / NOT_EXECUTED and exact command, runtime + verifier version, SHA and redacted logs. Separate labels for actual local cryptographic proof, local D1 transactional behavior and simulated application/session behavior. Fake signed assertions do **not** certify real hardware/passkey UX, production D1, or the deployed Worker. Do not infer a live CMS, payment, publication or release from this matrix.