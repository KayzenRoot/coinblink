# CB-M05-P1A-LOCAL-001: Execution Context Lock

**State:** CANDIDATE. Effective only after the parent P1A admission PR protected-squash merges and this exact document is present on canonical main with a recorded KayzenRoot go/no-go. No test implementation is credited while this is only a candidate branch.
**Source main SHA:** 00ac6c69419449890f3ff41132296f65cc190ad7.
**Owner security review:** KayzenRoot alone; no outside reviewer or second account needed. All mandatory CI and negative tests remain.
**Scope:** test-only local D1 emulator and synthetic security/data invariants; no public or private web endpoints, real WebAuthn, credentials or production CMS.

## Frozen canonical source fingerprints

All values are Git blob IDs observed from source main above, not prospective candidate branch files:

| Source | Git blob SHA |
| --- | --- |
| AGENTS.md | 4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7 |
| .engineering/SOURCE-HIERARCHY.md | 46b2f93c9cc65a468e33b16036e8c5627a442d4d |
| .engineering/CHECKPOINT.json | eb9a00c4ae1e6b20d781bc6f2b995889b118b6be |
| .engineering/work-orders/CB-M05-P1A-LOCAL-001-CANDIDATE.md | ddbb8c201fd2123a7e836417aa3a7c8e3c981a78 |
| .engineering/context-locks/CB-M05-P1A-LOCAL-001-CANDIDATE.md | 97befad07ac3cfbfdd740bd7d3bd6389aa027c35 |
| docs/architecture/ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md | e5a0054773fa8f6c669ab3861f8cc71bcea73886 |
| docs/architecture/CB-M05-P1-A-SYNTHETIC-SECURITY-CONTRACTS.md | 5dfce42a6e37dcefa0f1782207888c8affa26407 |
| docs/architecture/contracts/CB-M05.md | 2b35f56903bb00f9c4025eafb6b40d7265c26405 |
| package.json | 77391db66af630f8dc8463f1c90f903356533322 |
| package-lock.json | bf984890253d1fc09c8cda60adf98c10e9ec4e15 |
| wrangler.jsonc | 980a4af6a5c3cd40a37797ad53d27530a54bbbe2 |

After a protected documentation merge, future local executor must re-read the actual main SHA and relevant blobs. This list records provenance and prevents silently substituting different configuration/dependencies; intentional main updates require a refreshed checked lock before code execution.

## Exact future branch path allowlist

Module test agent MAY write only:
1. src/modules/CB-M05/p1a-local/** (pure synthetic model helpers, no exposed runtime imports).
2. test/modules/CB-M05/p1a-*.test.mjs (test runner/integration code).
3. test/modules/CB-M05/p1a-local-fixtures/** (synthetic SQL, local-only Wrangler JSONC config, fake fixture-only data).
4. .engineering/evidence/CB-M05-P1A-LOCAL-001.md (measured test evidence, not assertions of future results).

No tracked DB state file is permitted. A disposable untracked .local-p1a-d1-state directory may be used ONLY after verifying .gitignore excludes it. The agent may not edit .gitignore; request separate Integration Steward path authorization if necessary.

Integration Steward (the KayzenRoot-controlled integration role, not a separate human account) owns ALL shared source paths: src/pages, public, global middleware, package manifests, global config, root Wrangler, production SQL migrations, CI/workflows, scripts, Docker and .engineering/CHECKPOINT.json. The existing P0 PR #59 is a different branch and must not be amended by this work.

## Local-only executable checks after admission

- Use repository-pinned Wrangler 4.149.0 and supported Node 22; test local CLI flags before running. Abort on a missing local binding or any remote flag.
- D1 operations must use explicit --local, dedicated fixture --config and --persist-to untracked local state; commands NEVER contact a real Cloudflare account.
- Primary and recovery passkeys are only distinct synthetic IDs, never cryptographic signing credentials. Do NOT record a WebAuthn PASS.
- Prove 1 Owner at most, concurrent requests, nonce replay denial, recovery after second-device revocation, synthetic session expiry, revision CAS/rollback and restore/fail closed. D1 emulator verification must not be inferred from tests using Node in-memory SQLite.
- Evidence must contain git exact HEAD, OS, Node/Wrangler versions, command, local fixture digest, measured assertion counts, redacted logs and result PER CASE: PASS, FAIL, NOT_EXECUTED.
- Future coding on a separate isolated worktree and PR; CI 6 hosted execution checks plus any existing required status, zero unresolved reviews, KayzenRoot exact-HEAD acceptance and an explicit separate merge decision.

## Known constraints and STOP

A direct GitHub connector attempt to create synthetic auth/SQLite test harness was refused. Do not circumvent via alternative Git API, payload disguise, renamed files or different identity. The source docs are the safe handoff to the user's authorized local execution environment after the lock is effective.

M05 P0 remains admitted and MOCK, P1 privileged code remains NOT ADMITTED; this narrow P1-A synthetic scope does not imply P1 production adoption, full CMS completion, checkpoint promotion or a deployment.

**STOP CONDITION:** no direct auth/passkey implementation, no real session/secret/CPF, no SQL applied remotely, no user-facing admin routes, no Cloudflare account login, no paid resources, no Worker deploy, no public article publication, no modification of GEF rules, no protected main or PR #59 merge. If no safe local execution channel is available, report NOT_EXECUTED instead of inventing results.
