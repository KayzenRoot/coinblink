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
1. Inspect canonical sources, GEF/ADR and PR #91's Correction Delta + Sonar rule/severity/path evidence. Verify no HIGH/CRITICAL outstanding. If not, `BLOCKED`: correct #91 **in same PR** first.
2. Obtain scoped exact-head protected merge of THIS documentary ADR/WO/lock candidate after required checks and Owner decision. This creates effective source; documentation cannot silently promote itself.
3. Re-freeze a NEW execution Context Lock against **then-current** main, effective ADR, baseline/code PR head SHA and immutable path fingerprints. If any mismatch, `STALE`.
4. Codex may implement/test the narrowly scoped **synthetic local-only** P1-C proof in a non-conflicting worktree, respecting existing #91 correction path ownership. No public route, no production Worker/D1 and no REAL identity.
5. Evidence Bundle -> CI 7/7 exact HEAD -> security audit -> Owner GO for protected squash -> `CHECKPOINT_DELTA={}`.

## Scope & runtime tripwires
Only local synthetic WebAuthn + local D1 + negative/provenance tests; no `src/pages/admin/**`, root bindings, live credentials or cloud calls, vault, publication/deploy, paid products, real URL/Owner enrollment or checkpoint edits. No auto-dispatch or implicit merge. STOP: `STAGED_NOT_VALID_FOR_EXECUTOR_UNTIL_PROTECTED_ADR_MERGE_FRESH_LOCK_AND_91_CORRECTIONS`.
