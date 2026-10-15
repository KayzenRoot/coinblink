# ADR-CB-M05-P1A-001: Local-only synthetic D1 security-contract proof

**State:** ADMISSION CANDIDATE. Effective ONLY after KayzenRoot exact-head technical review, all existing CI checks, protected squash merge, and canonical main readback. This is NOT authorization for a real CMS, real sign-in, production D1, or provider integration.
**Owner:** KayzenRoot, the sole human administrator and reviewer, supported by automated checks and technical analysis.
**Source main:** 00ac6c69419449890f3ff41132296f65cc190ad7.
**Previous decision:** Issue #12 R51 selected passkeys with a second DISTINCT recovery authenticator and D1 locally emulated with exclusively synthetic data. PR #82 established sole-admin review policy. PR #81 integrated the security/Data proposals as documents, not as production code admissions.

## Decision limited to P1-A synthetic proof

Once EFFECTIVE, a dedicated Codex Desktop LOCAL executor may create disposable synthetic test-only resources to prove a sole Owner invariant, nonce replay/expiry, simulated device recovery, modeled session revocation, versioned article writes and rollback. Tests must ACTUALLY execute against Wrangler's Cloudflare D1 LOCAL emulator for D1-specific result claims. In-memory SQLite can serve as a clearly labeled preliminary model, never a substitute for D1 emulator concurrency. Real WebAuthn cryptography, passkey registration, credential recovery, session cookies, server routes and actual persistence in a deployed CMS are OUT OF SCOPE.

The logical Integration Steward is a responsibility assigned to KayzenRoot/Codex, not another human GitHub reviewer. Protected repository branches, mandatory CI and explicit Owner decisions remain in effect. M05 P0 implementation PR #59 is separate and must not be modified by P1-A.

## Test isolation and available tools

- Use Node >=22.19.0 <23 and repository-pinned Wrangler 4.149.0. No unapproved new dependencies, no npm commands that might deploy, and no external API/remote fallback.
- Any Wrangler config must be a synthetic-only file inside test/modules/CB-M05/p1a-local-fixtures/, NEVER edit the root wrangler.jsonc. Use a dedicated synthetic database binding name CB_M05_P1A_LOCAL and a placeholder database ID with no real Cloudflare target; explicitly disallow remote=true.
- Local D1 command MUST contain --local, --config for this fixture, and --persist-to for a disposable Git-ignored path. Example future CLI invocation, NOT executed by this ADR:

    npm exec --no -- wrangler d1 execute CB_M05_P1A_LOCAL --local --config test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc --persist-to .local-p1a-d1-state --file test/modules/CB-M05/p1a-local-fixtures/schema.sql

- Executor must inspect pinned CLI help and test config before executing; if requiring Cloudflare login, remote account, credential, deployment or paid provisioning, STOP.
- Fixtures MUST be fake (TEST device labels, example.test URLs, fabricated articles) and must not contain a real CPF, passkey, token, key, account, session or customer data.
- Real two-device recovery is not validated by boolean mocks. Explicitly name status SIMULATED_DEVICE_MODEL, not PASSKEY_VERIFIED.

Official Cloudflare references:
https://developers.cloudflare.com/d1/best-practices/local-development/
https://developers.cloudflare.com/d1/wrangler-commands/

## Bounded executable acceptance contract

| Case | Required observed result |
| --- | --- |
| OWNER-01 | 2, 10, 100 genuinely concurrent LOCAL D1 Owner claims, at most one committed unique Owner; a single synchronous SQLite connection is insufficient proof |
| REC-01 | Different fake recovery authenticator required; revocation removes modeled recovery eligibility |
| CHAL-01 | Nonce consumed once atomically; wrong origin/RP, expiry and replay rejected; NO WebAuthn signature claims |
| SESSION-01 | Synthetic token stored only as digest; expiry and revocation deny modeled access; NO real cookie |
| ARTICLE-01 | CAS update with expected revision 1 -> 2; second stale writer denied |
| ARTICLE-02 | Deliberately failed version/audit insertion rolls back entire synthetic write |
| RESTORE-01 | Disposable local fixture reset and restore recover expected state without leaking data |
| FAIL-01 | Invalid config, missing source binding or oversized payload fails CLOSED, never attempts remote Cloudflare |

Evidence must include exact Git HEAD, CLI version and arguments (redacted), platform, local data path, test counts and PASS/FAIL/NOT_EXECUTED per case. An intended test case is not a result.

## Prior connector restriction and project status

A previous GitHub connector attempt to write a synthetic auth/SQLite test harness was REFUSED. Do not repeat via altered endpoint, alternate Git API, branch tricks or hidden paths. This ADR provides a path for a SEPARATELY ADMITTED LOCAL Codex Desktop execution, not a way around connector restrictions.

M05 remains a single module. Current module admission is P0 MOCK; proposed P1-A adds only local synthetic test evidence, not privileged CMS authorization. Do not modify .engineering/CHECKPOINT.json, mark M05 DONE, merge P0 PR #59, run remote D1, create accounts, deploy, publish, use real provider secrets or spend money.

**STOP CONDITION:** This documentation PR may only approve a future local synthetic scope after protected integration. Real implementation, cloud operations, live user identity, P1 production login, release, rights clearance and checkpoint promotion remain blocked.
