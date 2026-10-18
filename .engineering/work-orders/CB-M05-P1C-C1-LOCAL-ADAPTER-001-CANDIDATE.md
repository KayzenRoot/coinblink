# CB-M05-P1C-C1-LOCAL-ADAPTER-001 · Work Order candidate

**Status:** CANDIDATE / DOCUMENT ONLY / NOT ADMITTED / NOT EXECUTABLE  
**Risk class:** HIGH_ASSURANCE for any future C1 execution  
**Owner:** KayzenRoot; **proposed executor:** M05 local-test owner, after separate Owner code GO  
**Created:** 2026-10-18  
**STOP:** NO_CODE_GO / NO_DEPLOY / NO_REMOTE_D1 / NO_REAL_CREDENTIALS / NO_PUBLICATION / NO_CHECKPOINT_PROMOTION

## 1. Goal and frozen source

This is a **proposed future bounded C1 experiment**, not an instruction to begin implementation. Prove the request/response security boundary of the already-merged synthetic single-Owner WebAuthn + D1 LOCAL CMS when dispatched through a **private, isolated local test adapter**. Denial must occur in server-owned logic before rendering sensitive HTML or mutating the database. It must remain disconnected from Astro public routes, production Workers and Cloudflare bindings.

| Audit input | Exact current value |
|---|---|
| Protected source branch | `KayzenRoot/coinblink:main` |
| Protected source commit | `06505e6937a6b90c7ef82006d32b8894d8843e71` |
| Source Git tree | `0c193ebfe43420b3daff8356273cc2dd1eb5f78d` |
| Parent commit | `ab75c844298d2054404a6db5bf355cf791353ab5` |
| Accepted C1 **documentary** Context Lock | `.engineering/context-locks/CB-M05-P1C-C1-LOCAL-ADAPTER-001-CANDIDATE.md`, blob `40acaf8adb0953c4f2c60017e5092506edf7c24e` |
| Approved C0 *plan only* | `.engineering/proposals/CB-M05-P1C-RUNTIME-BOUNDARY-PLAN-20261018.md`, blob `87985db66dae92d1b8d96a8e29d3532e8cebdc58` |
| Pre-existing staged real Admin integration WO | `.engineering/work-orders/CB-M05-P1C-OWNER-ADMIN-001.md`, blob `c359fb75dcc2b3167c595db1d9718d26c4c05da6` |
| Checkpoint | `.engineering/CHECKPOINT.json`, blob `72618bef100e6f82e4655b2c6ed482794e0c4649`, `M00_COMPLETE / 5%` |
| Existing LOCAL CMS source | `src/modules/CB-M05/p1c-local/local-cms.mjs`, blob `add16cc5762aff8040dadff963c3b8d478b8dcf2` |
| Existing regression suite | `test/modules/CB-M05/p1c-local-cms.test.mjs`, blob `c6e21982f07fe008f630647aa34a812def78585f` |
| Existing private fixture worker | `test/modules/CB-M05/p1c-fixtures/bootstrap-worker-entry.mjs`, blob `bcadae12ea1c04ac6a1eca40445a4f14d18a0b69` |
| Existing LOCAL D1 schema | `test/modules/CB-M05/p1c-fixtures/schema.sql`, blob `cc862472a81e3f50e25e761179da43f7811492da` |
| Existing LOCAL browser harness | `test/modules/CB-M05/p1c-local-preview.mjs`, blob `4be179f73739a0186b6ab99590e3e55e9db2ee5e` |

All hashes above are **Git blob object hashes**, not plain SHA-256 of file contents. The C1 documentary Context Lock pins **26 additional** source fingerprints; all must be verified again at any future code admission. Source drift: **STALE, do not dispatch**. This candidate cannot be silently upgraded into an executable lock after merge.

## 2. Scope of a *future separately approved* C1

Proposed work is a small, isolated vertical assurance slice, reusing `createLocalCmsHandler({now})` and synthetic `CMS_TEST_ORIGIN` / `CMS_TEST_RP_ID` in an **ephemeral local Miniflare/D1 request dispatcher**, with a browser/Node contract harness. It must never share authentication state or mutation routes with the public demo application. Prefer zero production-module changes; if an adapter truly requires module source changes, return to Owner with an explicitly justified exact-path delta.

Candidate **file-exact** create-only allowlist for future review (not permission to write now):

| Candidate path | Proposed responsibility |
|---|---|
| `test/modules/CB-M05/p1c-fixtures/c1-request-boundary-adapter.mjs` | Private request/response integration fixture using only synthetic origin, disposable secrets and local D1 |
| `test/modules/CB-M05/p1c-c1-request-boundary.test.mjs` | Node negative/positive contract tests, fail-closed HTML/API, CSRF/session/recovery/rollback/race assertions |
| `test/modules/CB-M05/p1c-c1-browser-a11y.test.mjs` | Browser virtual-authenticator and accessibility/security tests if a test-only browser harness is necessary |

These are **candidates**, not accepted implementation paths or requirements to create every file. No production source path is included. Existing files must be read, not mutated, unless separately approved in a refreshed effective WO. No package, lockfile or workflow edit. Reuse pinned dependencies as-is; if test discovery cannot execute newly proposed tests under existing CI, stop and propose a small, separately owned CI adjustment rather than claim tests ran.

**Explicitly excluded:** `src/pages/**`, real `/admin/**`, Astro middleware, `astro.config.*`, `wrangler.jsonc`, `package.json` and lockfile, `.github/workflows/**`, `public/**`, external secret stores, real credential enrollment, D1 remote migrations or Cloudflare account access, production Preview/deploy, provider/API network requests, vault/P1-D, content publish/P1-E, checkpoint and other module ownership. Never import fixture `owner.example.test` as an actual relying-party origin. Do not introduce publicly reachable fixture diagnostic endpoints.

## 3. Acceptance gates and evidence plan (future, NOT run by this document)

**Preflight / security:** pin fresh exact `main` SHA/tree, 26 source blobs, Context Lock, Scope/Architecture/Requirements/Security/DoD; threat-map trust boundaries and ownership; confirm no parallel changes in M05 or Integration Steward surfaces. Confirm that C1 stays entirely local and synthetic. All provider, production and runtime actions are disallowed.

**Test matrix:**
1. **Owner uniqueness:** deterministic 2/10/100 simultaneous claimant races: exactly one winner and losers leave no extra Owner, session or credential; replay after restart rejected.
2. **Server-side request boundary:** anonymous GET of protected synthetic HTML and unauthenticated/forged API POST denied; no private draft leaked in response body, no partial D1 mutation. `authorLabel`, forged role headers, demo flags and localhost debug parameters cannot elevate.
3. **WebAuthn:** origin/RPID, user verification, challenge purpose, expiry/replay, sign counter and primary/recovery distinction enforced. Preserve cross-session recovery R102 B6: a challenge issued by session A cannot be redeemed by session B even with the same passkey.
4. **Session/CSRF:** only Secure/HttpOnly/SameSite opaque-cookie semantics, server keyed-digest storage, expiry, logout/revocation, denied CSRF/origin/fetch-metadata and session fixation.
5. **Transactions/data:** D1 local one-Owner constraint, consistent revisions/optimistic CAS, audit trail, safe rollback, injected DB failure, idempotency and denial of mutated invalid bodies (including oversized/forged Content-Length).
6. **Browser/privacy/a11y:** synthetic virtual authenticator/browser flow only, accessible errors and keyboard flow, CSP, zero external egress, redacted diagnostics, no secrets in screenshot/HTML/logs, responsive preview.
7. **CI:** Node 22 pinned dependencies; exact-final-HEAD Ubuntu, Windows, Docker, SonarCloud, Socket, CodeRabbit status and any other effective required controls **7/7 PASS**; zero unresolved threads; substantive Owner security review, then **separate exact-HEAD squash authorization**. CodeRabbit status `success` with review skipped is not substantive approval.

Evidence bundle must contain commands, exit codes, test count and 2/10/100 observed histograms, D1 row/rollback evidence, negative test failures/rejections, zero-egress and leak evidence, accessibility/browser artifact links, source/final SHA and changed-file manifest. Do not claim coverage based on Sonar 0.0% new-code coverage without a report, and do not promote fixture proofs to production.

## 4. Gates, handoff and stop conditions

- **D0, NOW:** review this one-document **WO candidate PR**, require fresh checks and an explicit Owner exact-HEAD documentary squash GO if integration is desired. A merged candidate remains **NOT EXECUTABLE**.
- **D1, FUTURE only after fresh permission:** recheck actual protected `main` and source fingerprint list; approve a separate execution lock with an exact allowed-file list and a direct **`OWNER_C1_LOCAL_ADAPTER_CODE_GO`**. No generic `continue`, documentary merge or historical LOCAL approval implies this GO.
- **D2, FUTURE if D1 valid:** run C1 implementation only in newly admitted test-only surfaces and execute all HIGH_ASSURANCE tests; review final exact HEAD and obtain independent protected squash GO. Until D2 it is not integrated.
- **D3, SEPARATE:** any route/middleware integration C2, remote/provider activation C3, Vault P1-D, publish P1-E or P2/module DONE needs its own threat model, file owner and explicit Owner decision.

**This document's STOP CONDITION:** `CB-M05-P1C-C1-WO_CANDIDATE_DOCUMENT_READY_FOR_OWNER_REVIEW` on passing CI and final technical review; otherwise `BLOCKED_WITH_EVIDENCE`.

`C1_WO_EXECUTABLE=NO`; `OWNER_C1_LOCAL_ADAPTER_CODE_GO=NO`; `OWNER_C2_ADMIN_ROUTE_GO=NO`; `D1_REMOTE=FORBIDDEN`; `REAL_CREDENTIALS=FORBIDDEN`; `DEPLOY=NO`; `PUBLICATION=NO`; `M05_DONE=false`; `CHECKPOINT_DELTA={}`.
