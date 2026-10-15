# CB-M05-P1A-LOCAL-001 | Proposed Context Lock

Status: CANDIDATE, NOT EFFECTIVE. Prepared 2026-10-15.
Frozen main SHA: 85ece8e63e56ac8006701eda121f462d901d2d2f.
Parent proposal: draft PR #81, preceding head b6c78a05ff34ce759f46be9ca6fe2aced0013a84. Re-audit final HEAD after this change.
P0 separate PR #59 current HEAD c0946706186bccd5b4fc96632b05a28151086d35. PR #70 remains a distinct unadopted local-only D1 candidate.
Owner decision: Issue #12 R51, passkey as primary and a separate second recovery authenticator; Cloudflare D1 local emulator only, synthetic data only.

## Objective and exact scope after future formal admission

Enable reproducible **local-only synthetic** proof of database and review invariants for an eventual one-human-Owner CMS. This document alone does NOT admit executable P1 code, grant protected merge, establish a remote D1 database, or activate owner credentials.

Tentative M05 agent allowlist AFTER formal reviewed approval of the Security/Data ADR and exact Context Lock:
- src/modules/CB-M05/p1a-local/** : pure synthetic local model only; no public/admin routes.
- test/modules/CB-M05/p1a-*.test.mjs : tests only, not a running login service.
- test/modules/CB-M05/p1a-local-fixtures/** : fabricated test source/SQL, no persistent tracked database or real private key.
- .engineering/evidence/CB-M05-P1A-LOCAL-001.md : measured test evidence after Steward approval.

Integration Steward exclusively owns shared src/pages, middleware, global config, package manifests, CI, Docker, Worker, Wrangler config, migrations, source hierarchy and checkpoint. Any necessary shared-path modification needs its OWN reviewed admission and exact file ownership. Do not change code on draft PR #81 or overwrite PR #59.

## Three clearly distinct evidence levels

SQLITE_IN_MEMORY: Node SQLite in-memory constraints only. It does NOT prove Cloudflare D1 production transactional behavior.
D1_LOCAL_EMULATOR: a real, explicitly --local Wrangler D1 run with disposable fake data. Requires verified local config and Steward-admitted migration files before running.
WEBAUTHN_REAL_CRYPTO: NOT IN SCOPE. Fake credential IDs, booleans for origin/RP/UV, or toy signatures are not a cryptographic assertion test.

## Required future execution cases

| Contract | Measured invariant |
| --- | --- |
| OWNER-01 | 2, 10, 100 actually concurrent local D1 claim attempts commit at most one Owner; a single synchronous mock connection does not count |
| REC-01 | Two distinct synthetic authenticators; revoke recovery device and ensure recovery unavailable |
| CHAL-01 | Atomic single-consume challenge with expiry, audience/RP and origin binding; replay denied |
| SESS-01 | Only test-token digests stored; modeled expiry/revocation deny |
| ARTICLE-01 | Compare-and-swap revision, stale-write conflict and atomic audit insertion |
| RESTORE-01 | Synthetic rollback/restore, failure safe with no partial records |
| BUDGET-01 | Local runtime compatibility and fail-closed resource-limit behavior |

Every result must identify actual executable, OS, toolchain, Git HEAD, fixture, assertions and observed logs. Expected behavior in Markdown is NOT a passing test.

## Safety and STOP conditions

- PUBLIC GitHub repo; no real CPF, personal data, passkeys, provider credentials, API tokens, owner session, real article, secret or signing private key committed.
- No Cloudflare account API, D1 --remote/create, Worker/Pages deploy, DNS, real database ID, paid resource, production route or publish endpoint.
- Do not run undocumented npm workflows that could deploy. No auth cookies, signup, privileged mutations, vault, publication or artificial checkpoint promotion.
- Prior GitHub connector write for a synthetic SQLite/auth harness was REFUSED. Do not bypass by alternate Git write API, another account, renamed content, hidden paths or indirect deployment. Use a supported local execution route only after explicit reviewed admission.
- Cloudflare Git-linked auto-deploy/webhook state remains unverified. Do not merge any PR as an incidental consequence of P1-A preparation.
- This candidate requires final exact-HEAD review, separate Owner protected documentation merge GO, effective Security/Data ADR, Integration Steward ownership, post-merge canonical readback and an admitted work-order Context Lock before executable P1-A tests can be credited.

Canonical checkpoint remains M00_COMPLETE / 5%; M05 P0 MOCK admitted, P1 not admitted. Neither this document nor passing doc CI changes those facts.