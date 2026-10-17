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
