# CB-M05-P1A-LOCAL-001: Local Synthetic D1 Proof Work Order

**Status:** ADMISSION CANDIDATE; becomes EXECUTABLE LOCAL-ONLY only when the scoped ADR and execution Context Lock in this PR are exact-head reviewed, protected-merged and confirmed effective on canonical main. No P1 production code is admitted by this Work Order.
**Owner and sole human approver:** KayzenRoot. **Executor once admitted:** Codex Desktop LOCAL on an isolated branch, not Codex Cloud. Logical Integration Steward is a responsibility of KayzenRoot/Codex, never another mandatory account.
**Provenance:** user approved synthetic-only D1 and passkey-model plan (Issue #12 R51). Governance PR #82 merged, proposed architecture PR #81 merged. Main source 00ac6c69419449890f3ff41132296f65cc190ad7.
**Linked:** ADR-CB-M05-P1A-001-LOCAL-SYNTHETIC-ADMISSION.md, .engineering/context-locks/CB-M05-P1A-LOCAL-001-EXECUTION.md, docs/architecture/CB-M05-P1-A-SYNTHETIC-SECURITY-CONTRACTS.md.

## Mission for Codex Desktop LOCAL

Implement and RUN a bounded security/data test harness against **actual Wrangler local D1** with fake-only fixture data. Work on a NEW isolated branch after main readback, not in PR #59. Use the pinned tools and test commands, preserve the source contracts, and record real evidence in .engineering/evidence/CB-M05-P1A-LOCAL-001.md. Do not open or deploy a Worker server, add a browser login, or create any real credential or Cloudflare resource.

### Permitted exact path groups after admission

- src/modules/CB-M05/p1a-local/** : pure test-internal invariant models only; never a web-imported privileged module.
- test/modules/CB-M05/p1a-*.test.mjs : Node built-in runner and/or local emulated D1 harness tests; descriptive test names distinguish simulation vs real D1.
- test/modules/CB-M05/p1a-local-fixtures/** : fake SQL schema, fixture data and a dedicated wrangler.local.jsonc with synthetic database ID. No production binding or secret.
- .engineering/evidence/CB-M05-P1A-LOCAL-001.md : measured execution readback, results, risks and STOP.
- Local untracked persistence path .wrangler/p1a-local-state/** (MUST remain untracked/ignored; before execution verify current .gitignore covers it; if not, stop and request separate Integration Steward change).

### Integration Steward-only shared paths

src/pages/**, public/**, global middleware, root wrangler.jsonc, package.json, package-lock.json, tsconfig, Astro config, global scripts, CI workflows, root Docker, migrations and .engineering/CHECKPOINT.json. If a task needs any such path, STOP and request an exact narrow extension; do not silently change ownership. Package and runtime upgrades require a separate approval. D1 SQL fixtures in the test-only subtree are not real migrations.

### Strict local procedure

1. Check git status clean, current main commit, local Node >=22.19.0 <23, npm dependency lock, and npm exec --no -- wrangler --version matching pinned 4.149.0. Do not run npm install unless dependencies already available or approved.
2. Read existing production wrangler.jsonc READ-ONLY; create standalone TEST-only wrangler.local.jsonc under allowed fixtures. Verify it contains only synthetic D1 binding name/id, no remote=true, production account info, route, zone, credential, custom domain, or triggers.
3. Before each command, verify local option --local, explicit fixture --config and --persist-to .wrangler/p1a-local-state; refuse commands containing --remote, d1 create, deploy, publish, login, api token or a real resource ID. No command in this Work Order authorizes remote Cloudflare.
4. Run deterministic synthetic SQL and guards; for concurrent singleton tests use truly concurrent separate local D1 connections/requests. If only one synchronous SQLite client is used, label it a preliminary model, not a D1 concurrency PASS. CLI worker runtime may need a future Steward-owned harness; if so mark NOT_EXECUTED, do not fake passing behavior.
5. Tests: one-Owner constraint 2/10/100 concurrent contenders, two distinct fake recovery devices and revocation, atomic one-time challenge consume, wrong origin/RP/time/replay, synthetic hash-only sessions and revocation, atomic version compare-and-swap, downstream failure rollback, restore and fail-closed errors. Real WebAuthn signatures, step-up authentication, cookies and vault are explicitly NOT IMPLEMENTED.
6. Execute npm run lint, npm run typecheck, npm run test:unit and npm run build only after verifying these scripts are non-deploying; run full available local tests and then create an ordinary guarded PR; expect exact HEAD hosted Ubuntu/Windows/GEF/Docker/SonarCloud/Socket CI. Never weaken existing checks.
7. Present tests with direct observation versus unexecuted state and give KayzenRoot an exact final PR HEAD for Owner's single-human review. Do not merge test implementation without separate exact-head approval.

### Stop on refusal or uncertainty

A previous GitHub connector refused writing an auth/SQLite harness. NEVER circumvent by another API, changed paths, renamed payload or another identity. Only the approved LOCAL Codex Desktop execution channel may implement the admitted harness. If local D1 needs credentials, unexpected network, shared-path modifications, dependency installation, production Worker, deploy or paid service, stop with blockers.

### Definition of Done, not an approximate percentage

- all test fixtures synthetic and no external access;
- real local D1 emulator execution documented, not merely SQL mock;
- 2/10/100 concurrent Owner uniqueness evidenced or explicitly NOT_EXECUTED with reason;
- every other test case evidence PASS/FAIL/NOT_EXECUTED;
- no tracked local DB file and no API token;
- no real auth/account or CMS publish;
- exact-head CI and KayzenRoot review for subsequent test PR;
- canonical project checkpoint remains M00_COMPLETE / 5%, M05 not DONE.

**STOP CONDITION:** The admission documents are not executable until protected main merger and readback. Even after admission, ONLY local synthetic test files are allowed. No secrets, Cloudflare remote database, deployed Worker, paid resources, real credentials, provider integration, publication, P0 PR merge or checkpoint promotion.
