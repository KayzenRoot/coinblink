# CB-M05-P1C-LOCAL-001 · Staged Context Lock (NOT YET EXECUTION-FROZEN)

**Decision:** OWNER_LOCAL_ONLY_GO recorded 2026-10-17. **Status:** `STAGED_WAITING_ADR_MERGE_AND_PR91_REMEDIATION`. **Main at preparation:** `960f9a12686841b8fdc05e44de2ca5d0a6a1a93e`, Git tree `95fd3c997f23aa82faf5e5a61f7beb9aef9424bb`. These fingerprints are *authoring baseline only* and SHALL be recalculated after this ADR is merged.
**PR #91 at preparation:** `7ad9b3b1014b79c47b19d3ed5a987e65a841fed3` (local-only, DRAFT, unmerged). Do not execute if branch changes.
**Checkpoint:** `M00_COMPLETE`, 5% (M01/M05 not DONE) Git blob `72618bef100e6f82e4655b2c6ed482794e0c4649`.

## Critical main fingerprints (Git blob SHA1; no secret values)
- `AGENTS.md`: `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7`
- `.engineering/SOURCE-HIERARCHY.md`: `3ba4fb9bb89d8aaf17b87ca0adba2d72081a20f2`
- `.engineering/CHECKPOINT.json`: `72618bef100e6f82e4655b2c6ed482794e0c4649`
- `.engineering/SCOPE.md`: `dfa1ce336ee8d05d0a93a37215e34a760708ea51`
- `.engineering/DEFINITION-OF-DONE.md`: `00702a0dfe54fcc22ad9e146255be1665fa4624c`
- `.engineering/ARCHITECTURE.md`: `dc6797e169f24b5ed6056ed3740b77741249c7c0`
- `.engineering/REQUIREMENTS.md`: `588c221e3ba88be3fb957ee27719671a731d8595`
- `.engineering/SECURITY.md`: `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45`
- `docs/architecture/contracts/CB-M05.md`: `2b35f56903bb00f9c4025eafb6b40d7265c26405`
- `docs/architecture/ADR-CB-M05-P1A-001-LOCAL-SYNTHETIC-ADMISSION.md`: `6753274e2230a9f289711102fb9c4f341c839d33`
- `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md`: **this PR modifies it**; hash to be captured from protected main only *after* adoption merge.

## Authoritative execution order
1. Obtain scoped exact-head protected merge of THIS **documentation-only** ADR/WO/lock candidate after required checks and the Owner's exact-HEAD decision. This adoption merge is independent of the unfinished code review in #91; it does not accept or merge the laboratory.
2. Read canonical sources, GEF/ADR and PR #91's Correction Delta plus actual Sonar rule, severity, file and line. Before *any P1-C code execution*, fix actionable HIGH/CRITICAL findings in the **same #91** PR, prove CI and obtain a separate exact-HEAD Owner GO. Unresolved findings => `BLOCKED`, never bypass.
3. Re-freeze a NEW execution Context Lock against **then-current** main, effective ADR, baseline/code PR head SHA and immutable path fingerprints. If any mismatch, `STALE`.
4. Codex may implement/test the narrowly scoped **synthetic local-only** P1-C proof in a non-conflicting worktree, respecting existing #91 correction path ownership. No public route, no production Worker/D1 and no REAL identity.
5. Evidence Bundle -> CI 7/7 exact HEAD -> security audit -> Owner GO for protected squash -> `CHECKPOINT_DELTA={}`.

## Scope & runtime tripwires
Only local synthetic WebAuthn + local D1 + negative/provenance tests; no `src/pages/admin/**`, root bindings, live credentials or cloud calls, vault, publication/deploy, paid products, real URL/Owner enrollment or checkpoint edits. No auto-dispatch or implicit merge. STOP: `STAGED_NOT_VALID_FOR_EXECUTOR_UNTIL_PROTECTED_ADR_MERGE_FRESH_LOCK_AND_91_CORRECTIONS`.

## 2026-10-17 source refresh after protected no-deploy gate merge (#120)

**Main rechecked for proposal:** `b4f58f1a62d6fa7c92b94324cf6e359df7c2614e`; Git tree `8fe7c52b136c2e3096ee693cbac4933570d41257`. This is **not** an executable P1-C code lock. The previous `960f9a1` snapshot is immutable historical provenance and is superseded solely for **documentation review** by this addendum.

**New effective main guard fingerprints:**
- `scripts/cloudflare-production-policy.mjs`: `1a4dc270ac8246743886b0611220d2335e82a934`.
- `scripts/assert-production-deploy-eligibility.mjs`: `77260e30721f8e245888383b63df1f4d63e25053`.
- `.engineering/work-orders/CB-CF-RELEASE-GATE-001.md`: `b8d9e816edff41e0fe48b648f0fdad042cdeeca0`.
- `.engineering/context-locks/CB-CF-RELEASE-GATE-001.md`: `4e4afcaefd308eb4f0040de1f9db7b47a64100c1`.
- `.engineering/CHECKPOINT.json`: `72618bef100e6f82e4655b2c6ed482794e0c4649` (still M00_COMPLETE / 5%, M01/M05 not DONE).

Protected squash #120 integrated the fail-closed deployment policy requiring **both** deployable public application changes **and** an explicit per-source-PR exact-HEAD Owner DEMO release GO. This P1-C architectural-docs PR modifies only three documents and must not carry such a GO. **After this documentation PR is merged** (which still needs its own Owner exact-HEAD merge approval), a fresh, independent executable lock shall be compiled on then-current main and only after #91 security triage/corrections. No deploy, credentials, remote D1, production vault, published article or checkpoint is authorized by this refresh.

**STOP remains:** `STAGED_NOT_VALID_FOR_EXECUTOR_UNTIL_PROTECTED_ADR_MERGE_FRESH_LOCK_AND_91_CORRECTIONS`.

## Prepared source refresh after local CMS lab #91 · 2026-10-17 (not executable)

**STATE:** `STAGED_SOURCE_REFRESH / WAIT_MAIN_GEF_AND_NO_DEPLOY_EVIDENCE / NOT_EXECUTION_FROZEN`.
Canonical main observed `4300642e8bdd00ae029ccbb30ed8facd70089df3`, Git tree `6d63e31d2d37a6785e486a22deffa15002a3f09e`; prior `b4f58f1` and `960f9a1` fingerprints above remain **historical provenance only**. Current canonical checkpoint Git blob `72618bef100e6f82e4655b2c6ed482794e0c4649` = `M00_COMPLETE / 5%`; M05 is ADMITTED, NOT DONE. Security ADR `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md` blob `6a590ef487556ed62296f558296b6ad5a334d3dc` grants local synthetic architecture direction only. P1-C current Work Order original blob `bb3109ebb92924cd92973b84fe4385c372b6e5a2` (this PR changes it; must be refingerprinted on merge). Local handler blob `d6b7080f0a2ec11bd3b7ed3da46c6b457fe558e7`; unit test blob `28c0a306085eaa116b50c3b18d4a1c1a50650de8`. `.engineering/SECURITY.md` blob `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45`; `docs/architecture/contracts/CB-M05.md` blob `2b35f56903bb00f9c4025eafb6b40d7265c26405`.

**Verification dependencies:** main [GEF #39087548845](https://github.com/KayzenRoot/coinblink/actions/runs/39087548845) and its exact-main Cloudflare workflow pending at authored snapshot. Require GEF main SUCCESS and provider workflow deploy job SKIPPED before calling #91 post-merge no-deploy verified. No real Cloudflare action, remote D1, credentials or vault is needed for this source refresh. Original #91 merged after 7/7 exact-head tests, but those are historical evidence, not approval to start follow-on code.

**STALENESS TRIGGER:** any change to `main`, Security, Scope, DoD, ADR, module contract, original test harness, owner authorization or file ownership requires a new lock before execution. No `src/**`, `test/**`, workflow or package mutations in this candidate. STOP: `LOCAL_P1C_EXECUTION_LOCK_NOT_FROZEN`.


## M05 P1-C LOCAL HIGH_ASSURANCE execution-lock candidate · source freeze after #121 · 2026-10-17

**STATUS: HIGH_ASSURANCE_EXECUTION_CONTEXT_CANDIDATE / NOT_DISPATCHABLE.** This is a refingerprinted preparation for the already-adopted P1-C **entirely synthetic LOCAL** proof within existing Work Order \`CB-M05-P1C-LOCAL-001\`, not an authorization for privileged application routes or a replacement of earlier historical records. Canonical source main \`b144d8ae68ac5fa8ef2388c304dae3c80252b5cb\`, tree \`816c470286eceeab907f87c065451e65161b81bb\`; checkpoint \`M00_COMPLETE/5%\` remains unchanged. This annex itself will change the lock blob; after reviewed protected adoption of its candidate, freeze the *effective* lock, and mark STALE if main or critical source changes.

**Git-frozen authoritative sources (current main):**
- \`AGENTS.md\` \`4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7\`
- \`.engineering/SOURCE-HIERARCHY.md\` \`3ba4fb9bb89d8aaf17b87ca0adba2d72081a20f2\`
- \`.engineering/CHECKPOINT.json\` \`72618bef100e6f82e4655b2c6ed482794e0c4649\`
- \`.engineering/SCOPE.md\` \`dfa1ce336ee8d05d0a93a37215e34a760708ea51\`
- \`.engineering/DEFINITION-OF-DONE.md\` \`00702a0dfe54fcc22ad9e146255be1665fa4624c\`
- \`.engineering/ARCHITECTURE.md\` \`dc6797e169f24b5ed6056ed3740b77741249c7c0\`
- \`.engineering/REQUIREMENTS.md\` \`588c221e3ba88be3fb957ee27719671a731d8595\`
- \`.engineering/SECURITY.md\` \`7f8a39a1a9296dad04ada71b0750eb05e9d8cf45\`
- \`docs/architecture/contracts/CB-M05.md\` \`2b35f56903bb00f9c4025eafb6b40d7265c26405\`
- \`docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md\` \`6a590ef487556ed62296f558296b6ad5a334d3dc\`
- \`.engineering/work-orders/CB-M05-P1C-LOCAL-001.md\` \`8a00346e0e84265bf4c3a7de1b81f196b473942b\`
- \`src/modules/CB-M05/p1c-local/local-cms.mjs\` \`d6b7080f0a2ec11bd3b7ed3da46c6b457fe558e7\`
- \`test/modules/CB-M05/p1c-local-cms.test.mjs\` \`28c0a306085eaa116b50c3b18d4a1c1a50650de8\`
- \`test/modules/CB-M05/p1c-fixtures/schema.sql\` \`cd3f73326acbc66a55014c67163e644e41b410da\`

**Proof obligations (NECESSARY, no widened scope):** Server-side synthetic one-human-Owner atomic claim 0→1, deterministic 2/10/100 contenders and **never 2 Owners**, expiring single-use enrollment/recovery and second synthetic authenticator; denial of unauthenticated **admin-like HTML GET** and every synthetic API/mutation, CSRF/origin/fetch-metadata/RPID/UV/counter/replay; digest-only sessions, rotation/expiry/revocation across handler restart; local D1 schema/transaction failure injection/backup/restore/rollback and audit/revision CAS with deterministic concurrency tests; no egress, real identity/passkey, stored secrets, provider binding or deployed route. Preserve existing #91 lab baseline and prior false-positive disposition supported by SQLite evidence.

**Mandatory preflight before any code:** verify #121 GEF & no-deploy jobs; verify all fingerprints, Node22, deps, local Miniflare/D1 and Chromium virtual authenticator baseline, Security/DoD/ADR, path ownership, threat model and proof/test matrix; acquire the Owner's additional code-admission instruction where required. DO NOT activate the older historical \`STAGED\` lock by implication. No writes outside \`src/modules/CB-M05/p1c-local/**\` and owned \`test/modules/CB-M05/p1c-*\` without explicit steward approval. No \`src/pages/admin/**\`, shared middleware, root wrangler/cloud workflows, actual credential/enrollment, remote D1 or vault. Security-negative tests, rollback and error-path proofs are HIGH_ASSURANCE release gates. After source/testing, Evidence Bundle + exact-head 7/7 CI + sole-Owner security review and separate exact-head squash GO. \`CHECKPOINT_DELTA={}\`. STOP: \`P1C_LOCAL_HIGH_ASSURANCE_PREFLIGHT_NOT_YET_PASSED\`.

## M05 P1-C LOCAL preflight refresh after #122 protected merge · 2026-10-17

**STATUS: PREPARATION_ONLY / NOT_DISPATCHABLE.** Exact protected main: `9509a06d7e72d64b5672ffe28a8207c4cfd54780`, Git tree `0dfdaa0f9a41c340c93918d0e1bb6b8f0194bf51`. The sole change since the prior `b144d8ae68ac5fa8ef2388c304dae3c80252b5cb` baseline is protected M01 Context Lock PR #122; this appendix refreshes source identity, **not** privileged execution admission. The Owner authorized **only** that #122 merge and preparation of this #123 candidate. #123 requires a **separate** exact-head protected-squash GO after final CI/review. No deploy approval.

**Verified source Git blob fingerprints at the new protected main:**

- `.engineering/CHECKPOINT.json`: `72618bef100e6f82e4655b2c6ed482794e0c4649` (M00_COMPLETE/5%; M01/M05 not DONE).
- `.engineering/SOURCE-HIERARCHY.md`: `3ba4fb9bb89d8aaf17b87ca0adba2d72081a20f2`.
- `.engineering/SCOPE.md`: `dfa1ce336ee8d05d0a93a37215e34a760708ea51`.
- `.engineering/DEFINITION-OF-DONE.md`: `00702a0dfe54fcc22ad9e146255be1665fa4624c`.
- `.engineering/ARCHITECTURE.md`: `dc6797e169f24b5ed6056ed3740b77741249c7c0`.
- `.engineering/REQUIREMENTS.md`: `588c221e3ba88be3fb957ee27719671a731d8595`.
- `.engineering/SECURITY.md`: `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45`.
- `.engineering/work-orders/CB-M05-P1C-LOCAL-001.md`: `8a00346e0e84265bf4c3a7de1b81f196b473942b`.
- `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md`: `6a590ef487556ed62296f558296b6ad5a334d3dc`.
- `src/modules/CB-M05/p1c-local/local-cms.mjs`: `d6b7080f0a2ec11bd3b7ed3da46c6b457fe558e7`.
- `test/modules/CB-M05/p1c-local-cms.test.mjs`: `28c0a306085eaa116b50c3b18d4a1c1a50650de8`.
- `test/modules/CB-M05/p1c-fixtures/schema.sql`: `cd3f73326acbc66a55014c67163e644e41b410da`.
- `.engineering/context-locks/CB-M01-WO-001.md`: `acc048645f7a45242922726b39a3aecc61c76110` (new effective #122 document).

**Required post-merge evidence for #122:** At creation of this annex, [main GEF run #39091828599](https://github.com/KayzenRoot/coinblink/actions/runs/39091828599) had not yet been observed completed. Require exact-main GEF success and Cloudflare workflow **deploy job SKIPPED** evidence before claiming #122 no-deploy proof. The separate main-only deployment policy must remain fail-closed for docs-only changes; never produce a DEMO release GO.

**HIGH_ASSURANCE local-only execution preflight:** After #123's own protected merge and an additional **fresh executable** lock, independent executor must confirm Node 22, working clean clone, virtual-WebAuthn/Chromium, local D1/Miniflare and no egress; prove single synthetic Owner 0→1 claim under 2/10/100 contenders, one-use enrollment/recovery, RP ID/origin/UV/replay, admin-like HTML/API fail-closed, CSRF, session revocation/restart, D1 rollback/restore/failure injection, CAS and audit integrity. Scope is only synthetic LOCAL M05 module paths/tests, with **no** public `/admin`, provider binding, actual secret, production credential or deployed route. No privilege escalation, vault, D1 remote, Cloudflare deploy, commercial publishing or checkpoint promotion.

**Decision and STOP:** `CHECKPOINT_DELTA={}`. `P1C_LOCAL_EXECUTION_PENDING_FRESH_LOCK_AND_HIGH_ASSURANCE_PREFLIGHT`. Any change to main, source fingerprint, Owner permission, #91 local test baseline or security contract invalidates an earlier executable lock: `STALE` and recompile. This is a **review candidate**, not permission to run privileged P1-C code.
