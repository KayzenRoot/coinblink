# CB-CF-RELEASE-GATE-001 · Staged Context Lock

**Status:** FROZEN_FOR_REVIEW / NOT_AUTHORIZATION_TO_DEPLOY. **Authoring main:** `960f9a12686841b8fdc05e44de2ca5d0a6a1a93e`; tree `95fd3c997f23aa82faf5e5a61f7beb9aef9424bb`.

## Frozen source fingerprints on original main
- `.engineering/CHECKPOINT.json`: `72618bef100e6f82e4655b2c6ed482794e0c4649` (M00_COMPLETE/5%; M01/M05 ADMITTED).
- `.engineering/SOURCE-HIERARCHY.md`: `3ba4fb9bb89d8aaf17b87ca0adba2d72081a20f2`.
- `.engineering/SECURITY.md`: `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45`.
- `.engineering/SCOPE.md`: `dfa1ce336ee8d05d0a93a37215e34a760708ea51`.
- `.engineering/DEFINITION-OF-DONE.md`: `00702a0dfe54fcc22ad9e146255be1665fa4624c`.
- `.github/workflows/cloudflare-production-main-only.yml`: `11c3ce50e52d4f68c98238ac0bd83bfd6666d40c`.
- `scripts/cloudflare-production-policy.mjs`: `4259535ef93381a3cc4d402f041d021377dbe27a`.
- `scripts/assert-production-deploy-eligibility.mjs`: `db5dd5bf32ddea07eb4014abd4cf07242235f4b0`.
- `test/cloudflare-production-eligibility.test.mjs`: `1e21965a9278cbbca0e68bc5cb36dbe8485b4d1a`.

**Owned paths:** two scripts, one test and two Work Order/lock documents. **Dependency:** PR #119 architectural adoption is waiting on this guard; do not modify #119 in this WO. **Context stale condition:** if main or one of the frozen critical Git blobs changes, recalculate/mark STALE rather than blindly merging.

**Cloud boundary:** read-only GitHub checks in CI; `wrangler deploy` must not run on docs, LOCAL P1-C or this guard's own merge. Cloudflare Workers account or token is not a source for this execution. No provider action, no rights clearance, no production secrets or real Owner identity, no checkpoint.

**POST-PR:** hosted tests/GEF exact SHA, issue matrix, Owner exact-HEAD GO for guarded squash, then read back resulting main and workflow result. **STOP:** `NO_PROVIDER_ACTIONS` unless separately authorized per source PR and SHA.
