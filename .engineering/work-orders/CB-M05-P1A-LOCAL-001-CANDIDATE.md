# CB-M05-P1A-LOCAL-001 · Candidate Codex Desktop work order

**Status: CANDIDATE ONLY, NOT EXECUTABLE YET.** Owner selected primary passkey + independent recovery authenticator and Cloudflare D1 locally emulated, strictly synthetic. See Issue #12 R51 and the proposed ADR and synthetic contract matrix in PR #81.

## Precise target

Produce an isolated, **fully local** executable proof of the selected persistence/security invariants. Output must distinguish: SQLite-only contract, Wrangler local D1 emulator contract, and actual cryptographic WebAuthn server verification. Do not claim equivalence of these three layers.

### In-scope after formally admitted Context Lock

- Use existing pinned Node/Wrangler tooling. Do not upgrade dependencies or invoke npm package install with network unless a separately approved dependency review authorizes it.
- Integration Steward owns all temporary Wrangler configuration and migration path changes. For each invocation of D1, force explicit `--local`, use a synthetic-only database name and a separately pinned `--persist-to` path underneath ignored local test state. No `--remote`, `d1 create`, `wrangler deploy`, bindings to real Cloudflare database IDs, cloud tokens, preproduction environments or customer data.
- Exercise transactional singleton Owner uniqueness, one-time nonce consume and expiry, article update/revision compare-and-swap, rollback on insert failure and migration/restore, including race probes. D1 emulator-specific tests must actually execute against local Wrangler D1, not silently against a Node in-memory SQLite mock.
- Represent distinct primary/recovery passkeys with **noncryptographic synthetic credentials only** at this stage. Verify candidate enrollment uniqueness and revoke/lockout behavior as model tests. Explicitly exclude real WebAuthn registration/assertion and treat origin/RP/user verification mock booleans as nonsecurity evidence.
- Use a bounded set of synthetic fixtures (no CPF, private identity, provider key, login password, usable tokens) and avoid any plaintext sensitive information in the PUBLIC repository.
- Add unit/integration tests only within newly admitted test/module-owned paths. Any runtime changes under `src/pages/**`, `.github/**`, configs, shared dependencies and migration folders are Integration Steward-only and need exact path admission.
- Local DB state must be ignored by Git and disposable. Confirm no bind-mounted cloud session and no accidental publish target.

### Preconditions to implementation

1. Owner selected architecture, recorded in Issue #12. (YES)
2. Security/Data ADR in draft PR #81 reviewed and merged under normal protected exact-head gate, with separate explicit Owner security adoption decision. (NO)
3. Context Lock frozen against the future admitted exact main SHA, including path fingerprints, dependency owner and STOP conditions. (NO)
4. No auto-deploy from pushing protected main, signed-off from authenticated GitHub/Cloudflare settings. (UNVERIFIED, MUST CHECK BEFORE ANY MAIN MERGE)
5. Selected test backend supported on permitted plan and environment, with correct local-only credentials; current Cloudflare official guide says `wrangler d1 execute <DB> --local --file=<SQL_FILE>` and local simulation is default in `wrangler dev`, but configuration must be audited before any command. (GUIDANCE VERIFIED, RESOURCE NOT PROVISIONED)
6. KayzenRoot's own recorded high-assurance threat/technical review on the exact source HEAD and mandatory CI, including negative security tests when implemented. No second human account or outside reviewer required. (PENDING OWNER FINAL REVIEW / IMPLEMENTATION TESTS NOT RUN)

### DoD and evidence (after admission)

- Recorded reproducible local CLI commands and scrubbed output confirming no remote traffic.
- Tests assert 1/1 owner across 2/10/100 contested attempts, challenge replay/origin/RP/expiry rejection in the chosen actual runtime, separate synthetic recovery device requirement, session revocation model, revision conflict, unique key constraints and rollback.
- Clear matrix labeling any expected negative behavior **not yet tested** vs observed pass; don't credit mocks as live WebAuthn.
- Exact-head Linux/Windows GEF, Docker, SonarCloud and both Socket checks; all mandatory.
- Summary of remaining real WebAuthn, recovery key custody, CSRF, quota and deployment blockers.
- No checkpoint promotion, module completion, remote database, published route, production key, deploy or main merge.

## STOP CONDITION

If admission/Config Lock/Integration Steward path ownership is absent, stop at test-plan and synthetic fixture **design**, never privileged runtime code. If any tool blocks a security-related write, do not route around it. If a command might contact Cloudflare, omit it until the local-only path is fully verified.

Official reference: https://developers.cloudflare.com/d1/wrangler-commands/ and https://developers.cloudflare.com/d1/best-practices/local-development/.
