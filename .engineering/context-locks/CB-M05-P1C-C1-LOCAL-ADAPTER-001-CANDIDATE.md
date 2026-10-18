# CB-M05-P1C-C1-LOCAL-ADAPTER-001 · Candidate Context Lock

**Date:** 2026-10-18. **Risk:** HIGH_ASSURANCE. **Owner:** KayzenRoot.
**Status:** `CANDIDATE_DOCUMENT_ONLY / NOT_EFFECTIVE / NO_CODE_GO`.
**Purpose:** prepare the NEXT M05 local-only C1 adapter assurance step after the C0 documentary plan. This is NOT an execution order, production release, credential or remote D1 approval.

## Audited source snapshot

- Repository `KayzenRoot/coinblink`, protected main commit: `ab75c844298d2054404a6db5bf355cf791353ab5`.
- Main tree: `5147be37c79fec89351bdecfd004f080f6050aac`.
- Parent: `247315405408efcbda7d0ac49be833711fa8170a`.
- Merged C0 plan: PR #130, source `252ac62f53a5c83ab4232209373a68c2b0c617ab`.
- Earlier accepted LOCAL A–E proof: merged PR #128, source `c23845626298522e4fa742476b525f37f2ec0a80`.
- Checkpoint blob: `72618bef100e6f82e4655b2c6ed482794e0c4649`. M00_COMPLETE / 5%; M05_NOT_DONE.
- No real `src/pages/admin/**` or centralized auth middleware on main; existing Astro config has `session: false`. Fixture WebAuthn RP `owner.example.test` is TEST ONLY.
- Existing staged Work Order: `.engineering/work-orders/CB-M05-P1C-OWNER-ADMIN-001.md`; still PROPOSED/NOT_EXECUTABLE. C0 plan: `.engineering/proposals/CB-M05-P1C-RUNTIME-BOUNDARY-PLAN-20261018.md`.

**Fingerprint format:** these are exact Git blob SHAs read from protected main, not SHA-256. The future execution evidence must obtain any requested SHA-256 digest from actual checked-out file bytes.

| Source path | Git blob SHA |
|---|---|
| `.engineering/CHECKPOINT.json` | `72618bef100e6f82e4655b2c6ed482794e0c4649` |
| `.engineering/SOURCE-HIERARCHY.md` | `3225fbb0bad445069ce98d8373ac4ace3630e3cb` |
| `.engineering/GLOBAL-QUALITY-REVIEW-POLICY.md` | `0661a172f65a33f24004675ac97e69485946979a` |
| `.engineering/SCOPE.md` | `dfa1ce336ee8d05d0a93a37215e34a760708ea51` |
| `.engineering/ARCHITECTURE.md` | `dc6797e169f24b5ed6056ed3740b77741249c7c0` |
| `.engineering/REQUIREMENTS.md` | `588c221e3ba88be3fb957ee27719671a731d8595` |
| `.engineering/SECURITY.md` | `7f8a39a1a9296dad04ada71b0750eb05e9d8cf45` |
| `.engineering/DEFINITION-OF-DONE.md` | `3f04f5e2c4c5a03c3139d7e8abdbb46ebb287a92` |
| `.engineering/proposals/CB-M05-P1C-RUNTIME-BOUNDARY-PLAN-20261018.md` | `87985db66dae92d1b8d96a8e29d3532e8cebdc58` |
| `.engineering/work-orders/CB-M05-P1C-OWNER-ADMIN-001.md` | `c359fb75dcc2b3167c595db1d9718d26c4c05da6` |
| `.engineering/work-orders/CB-M05-P1C-LOCAL-001.md` | `8a00346e0e84265bf4c3a7de1b81f196b473942b` |
| `.engineering/context-locks/CB-M05-P1C-LOCAL-001.md` | `98781a14fdbd432e8e91a7de05a0a27a1b873577` |
| `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md` | `6a590ef487556ed62296f558296b6ad5a334d3dc` |
| `docs/architecture/contracts/CB-M05.md` | `2b35f56903bb00f9c4025eafb6b40d7265c26405` |
| `docs/architecture/ADR-CB-M05-P1A-001-LOCAL-SYNTHETIC-ADMISSION.md` | `6753274e2230a9f289711102fb9c4f341c839d33` |
| `docs/architecture/ADR-CB-M05-P1B-LOCAL-001-CANDIDATE.md` | `4579a8c95abc52d378633234011e96a798c4bc6e` |
| `src/modules/CB-M05/p1c-local/local-cms.mjs` | `add16cc5762aff8040dadff963c3b8d478b8dcf2` |
| `src/modules/CB-M05/p1c-local/local-cms-ui.mjs` | `1eef65a5b379a6820e19e32202976548b9bfb0b2` |
| `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs` | `bcadae12ea1c04ac6a1eca40445a4f14d18a0b69` |
| `test/modules/CB-M05/p1c-fixtures/schema.sql` | `cc862472a81e3f50e25e761179da43f7811492da` |
| `test/modules/CB-M05/p1c-local-cms.test.mjs` | `c6e21982f07fe008f630647aa34a812def78585f` |
| `test/modules/CB-M05/p1c-local-preview.mjs` | `4be179f73739a0186b6ab99590e3e55e9db2ee5e` |
| `astro.config.mjs` | `0aac3db4256ec4c1a3a29149b90c570e54352420` |
| `wrangler.jsonc` | `980a4af6a5c3cd40a37797ad53d27530a54bbbe2` |
| `package.json` | `786a23f1d9dcb406f868785497a9b7d0dad63e46` |
| `.github/workflows/gef-validation.yml` | `d29833428c93e9c8479909255d285f61d839bdb1` |

## Proposed C1 contract (unapproved)

If independently admitted in a future decision, C1 may only test a **synthetic local framework dispatch adapter** around existing `createLocalCmsHandler({now})`; keep the independent Miniflare/D1 fixture and synthetic WebAuthn authenticators. It must not mount new privileged `/admin/**` routes, connect production Workers, or create an actual Owner account.

**Candidate path ownership, not write authority:** module-owned `src/modules/CB-M05/p1c-local/**` and isolated `test/modules/CB-M05/p1c-*/**`, including `test/modules/CB-M05/p1c-local-*.mjs`. Before code, a future effective execution order must enumerate each exact target file and a serialized Integration Steward boundary, not rely on these broad candidates.

**Out of scope:** `src/pages/**`, Astro middleware, `astro.config.*`, root Wrangler, package/lockfiles, GitHub workflows, public assets, shared session infrastructure, Cloudflare provider bindings, remote databases, actual credentials, live passkeys, payment, vault/P1-D, publishing/P1-E, M01–M04, checkpoints and deployments. Those require separate explicit decisions.

## Future high-assurance acceptance tests (design only)

1. Verify single-Owner atomic bootstrap under 2/10/100 competing requests; exactly one Owner and zero partial writes.
2. Require server authorization for privileged synthetic HTML GET and API POST; deny anonymous, forged-owner, fake authorLabel, role headers and cross-context reuse.
3. Bind challenges to purpose, origin, RP ID, UV, expiry, passkey and recovery session; deny A-to-B recovery challenge reuse. Retain R102 B6 regression.
4. Reject revoked/expired/fixed sessions, bad CSRF, Origin and Fetch Metadata; assert Secure/HttpOnly/SameSite and digest-only persistence.
5. Prove D1 local CAS/revision/audit/rollback, malformed and oversized body rejection, fault injection, clean retry and idempotency.
6. Test request routing and a11y in isolated browser, zero external egress, no secret leaks to HTML, logs or screenshots. Existing test fixtures must remain PRIVATE to harness.
7. Reproduce Node 22, lint, typecheck, unit/build, Playwright/axe, Docker, audit, SonarCloud, Socket and required GitHub checks 7/7 on final HEAD across Windows/Ubuntu, zero unresolved review threads and substantive Owner security decision. Disclose CodeRabbit skipped review accurately.

**No current test or future C1 test proves production readiness.** Document exact observed result, failures, database row counts, 2/10/100 race histograms, negative security cases, source/run URLs and fingerprints. Production C2 shared-route integration, remote D1 C3, Vault P1-D and editorial publication P1-E have independent admission.

## Activation / STOP

**D0 now:** prepare/review/merge this documentary candidate only with exact-HEAD protected Owner GO; no runtime changes.
**D1 future:** refresh current protected main/tree and *all* fingerprints; stale input makes this candidate STALE. Admit a NEW, file-exact C1 local-only execution lock/Work Order and require separate `OWNER_C1_LOCAL_CODE_GO`. Neither generic `continue` nor D0 merge grants that right.
**D2 future:** implement only after D1; run all checks and high assurance evidence; merge only on distinct exact-code-HEAD Owner GO. No C2/C3 authority follows.
**STOP:** `CANDIDATE_ONLY / WAIT_OWNER_DOCUMENT_DECISION / P1C_C1_CODE_GO=NO / M05_DONE=false / CHECKPOINT_DELTA={} / NO_DEPLOY / NO_REMOTE_D1 / NO_REAL_CREDENTIALS / NO_PUBLICATION`.
