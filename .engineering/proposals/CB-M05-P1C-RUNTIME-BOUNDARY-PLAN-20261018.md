# CB-M05-P1C-RUNTIME-BOUNDARY-PLAN · Owner-only Admin Integration (DESIGN ONLY)

**Status:** `PROPOSED_DOCUMENT_ONLY` · **Risk:** HIGH_ASSURANCE · **Source baseline:** protected `main=247315405408efcbda7d0ac49be833711fa8170a` · **Owner:** KayzenRoot · **Integration Steward:** future separately admitted owner of shared paths.

**Purpose:** turn the now-merged, *strictly synthetic* LOCAL A–E proof into a carefully staged **proposal** for a secure Owner-only `/admin` application. This document grants **zero executable permissions** and does not authorize public route creation, real admin login, Worker/D1 binding, secrets, deploy, publishing or checkpoint promotion. Related existing staged WO: [`CB-M05-P1C-OWNER-ADMIN-001`](../work-orders/CB-M05-P1C-OWNER-ADMIN-001.md). Do not create a duplicate security WO.

## 0. Canonical baseline, provenance, source hierarchy

- PR [#128](https://github.com/KayzenRoot/coinblink/pull/128) merged by protected **squash** into `main=247315405408efcbda7d0ac49be833711fa8170a` from audited PR HEAD `c23845626298522e4fa742476b525f37f2ec0a80`.
- [R106 review](https://github.com/KayzenRoot/coinblink/pull/128#pullrequestreview-5564651155), [R107 acceptance](https://github.com/KayzenRoot/coinblink/pull/128#issuecomment-6254354777) and [7/7 source CI](https://github.com/KayzenRoot/coinblink/actions/runs/39159615914): each OS 462/462 Node and 48/48 Playwright, Sonar 0 newly open issues and 0 hotspots, Socket and Docker pass. CodeRabbit status success but review skipped; the Owner is the only required human reviewer.
- Original `.engineering/context-locks/CB-M05-P1C-LOCAL-001.md` blob `98781a14fdbd432e8e91a7de05a0a27a1b873577` applies **only** to the prior LOCAL scope; never reuse it to authorize production or shared routes.
- Canonical checkpoint `.engineering/CHECKPOINT.json` blob `72618bef100e6f82e4655b2c6ed482794e0c4649`: `M00_COMPLETE / 5%`, unchanged. M05 is **NOT DONE**.
- `src/pages/admin/**` and a centralized Astro auth middleware are **absent** in the merged baseline. Existing `src/modules/CB-M05/p1c-local/**` and D1 fixtures remain internal LOCAL proofs; none has a remote binding.
- Canonical authority: `.engineering/SOURCE-HIERARCHY.md`, `.engineering/GLOBAL-QUALITY-REVIEW-POLICY.md`, `.engineering/DEFINITION-OF-DONE.md`, `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md`, M05 contract, issue #12. Historical headings that still say DRAFT/NOT MERGED are provenance, not current GitHub state.

## 1. Trust-boundary and runtime architecture decision record to resolve

**Separate untrusted PUBLIC reader/browser, pre-session owner activation/authentication, authenticated OWNER console, module-local service and backing transaction store.** Browser-supplied roles, `authorLabel`, fixture hostnames, browser localStorage and synthetic environment flags **never confer rights**. Exactly one durable human Owner. No public signup or automatic alternative Owner.

Proposed runtime edges, each pending distinct Source Pack/Steward approval:

1. **In-boundary transport:** Astro server request `/admin/**` -> centrally enforced server-side Owner authentication/CSRF/origin controls -> M05 module service adapter -> approved, versioned database abstraction -> transactional audited storage. Fail closed on unknown credentials, missing bindings or mismatched environment.
2. **Static/preview:** keep `/demo/**` and LOCAL fixtures isolated; no production registration or mutation via `/local/**`; prohibit deployment of fixture-only host `owner.example.test` as a real relying-party identifier.
3. **Worker/storage:** continue local Miniflare D1 only for future development experiments under explicit new code authority. D1 **remote** schema, database ID, migration, binding, rollback, IAM scope, costs and data retention require another Owner decision. Do not infer Worker capability from an existing M00 Preview.
4. **Credential boundary:** WebAuthn origin, RPID, UV, challenge TTL, sign-counter, recoverability and session digest must be generated and checked by server. A real operator bootstrap/recovery procedure needs an offline operations design before any actual device/key enrollment; never accept fake credentials as live.
5. **Secrecy:** no KEK/vault or provider credentials in this Work Order; P1-D later. No personally identifying account details, secret tokens, production backups or real session cookies in GitHub artifacts.

## 2. Proposed Owner-only route authorization matrix (not yet implemented)

| Planned route | Unauthenticated intent | Authenticated intent | Required server-side guarantees |
|---|---|---|---|
| `GET /admin/login` | pre-session login UX only | safe redirect | never reveals private drafts/sessions; no mock flag bypass |
| `POST /admin/login` | credential challenge/assertion | new Owner session | one-use WebAuthn assertion, strict RPID/Origin/UV/TTL, quota, session issuance |
| `/admin/setup` | disabled except one-use offline Owner activation | Owner-assisted device add | atomic unique Owner claim; ticket, expiry, no second Owner |
| `/admin/recovery` | no email-only reset | session-bound recovery and revocation | independent recovery factor, one-use challenge, cross-session replay denied |
| `GET /admin/articles` | HTTP 401/403, no privileged HTML content | list Owner drafts | authorization before render, pagination, sanitized content |
| `/admin/articles/new` | deny GET protected body and POST | create draft | CSRF/Origin/Fetch Metadata, validation and audit on every mutation |
| `/admin/articles/[id]/edit` | deny GET protected body and mutations | revision/restore | optimistic CAS, immutable history, failure rollback; no direct publication |
| `/admin/settings` | deny sensitive UI/API | non-secret preferences | authorizes every operation; audit changing configurations |
| `/admin/settings/integrations` | deny secret form/data | future metadata-only shell | P1-D vault absent: no plaintext/secret saving/testing until separate approval |

Method and path matching must be exact. No unauthenticated privileged HTML GET. Non-mutating failures produce zero DB changes; state-changing failures cannot partially create credentials, sessions, revisions or audit auth grants. 401 vs 403 vs 409 selections must be consistent in tests and not leak identity existence.

## 3. Ownership and serial Integration Steward delta

**M05 module**: candidate `src/modules/CB-M05/**` and `test/modules/CB-M05/**` only, for adapters, service/auth interfaces, negative tests and local D1 compatibility.

**Steward-owned shared integration (all forbidden until separate admission):** `src/pages/admin/**`, global Astro middleware, `astro.config.*`, Worker config/bindings, global migration manifest, dependency and workflow changes. Allocate one exact-path ownership table and serialized merge order before development to prevent M01/M02/M03 parallel conflicts.

**Forbidden now:** any privileged production code edit, any `/admin` or provider route actually mounted, `src/pages/**` change, D1 remote/keys, production secrets, external egress, deployment, publishing or new checkpoint.

## 4. Practical milestones, each with independent security evidence

**C0 · Plan/Contract (this PR):** inventory existing source and current main; freeze proposed route matrix, security data flow, de-risk central trust boundary, define rollback and the candidate Steward file allowlist. Draft **new Context Lock** only after acceptance, with fresh exact-main SHA/tree, all critical blob fingerprints, positive/negative tests and STOP condition. This phase is **documentation-only**.

**C1 · Isolated LOCAL adapter (NOT authorized yet):** after separately scoped code GO, adapt previously tested LocalWebAuthn service to a non-public synthetic Astro request harness; demonstrate no exposed `/admin` production endpoint, no network egress, zero secret leaks and no auth bypass from demo pages. Denied GET/POST and origin/RPID/CSRF/replay tests on real framework dispatch boundary. Keep module-local code and Steward code in non-conflicting PR/worktree lanes.

**C2 · Protected route integration (NOT authorized yet):** only with approved Integration Steward WO and explicit Owner code GO, build server-side `/admin/**` route/middleware boundaries and DI with local-only synthetic storage; fail closed if no approved runtime environment. No live Cloudflare release; security review before protected merge.

**C3 · Remote/provider activation (explicitly NOT authorized):** a future separately approved environment/IAM, RPID/origin, D1 binding/migration, cost budget and actual human credential onboarding plan. Never couple to C0/C1/C2 generic approvals.

**P1-D · Vault (separate):** AEAD secret envelopes and non-DB KEK, write-only UI and rotation; design/mock until separate security/provider approval.

**P1-E · Editorial publish (separate):** source-licensed/auditable factual provenance M02/M03, approval transition from draft through review to publication/correction; no actual `LIVE` publication in C0–C2.

**P2 · Module DONE (separate):** full accepted P1-C/P1-D/P1-E, a11y/security/rollback/observability, real provider binding evidence if authorized, and Owner final checkpoint-only approval. Global 19-module counter does not increment for an isolated local harness.

## 5. Proposed HIGH_ASSURANCE tests and STOP

Before any new executable WO, select measurable pass criteria and fresh locked baseline:
- **Owner uniqueness:** 2/10/100 simultaneous bootstrap attempts, exactly one winner, no partial row, restart-safe and replay-denied.
- **WebAuthn:** challenge bound to purpose, session, credential, origin/RPID, UV and expiry; no cross-session recovery redemption, counter rollback, forged assertion or reuse.
- **Sessions:** 256-bit opaque token, digest-only server storage, Secure/HttpOnly/SameSite, expiry, revocation, fixation resistance, CSRF/Origin/Fetch-Metadata.
- **Authorization:** deny unauthenticated HTML/API GET/POST, fake bylines as identities, invalid content/body size, IDOR, second Owner, privileged `/demo` and `/local` escape.
- **DB:** transaction/CAS, untrusted input, migration checksum/version, apply/rollback/restore, audit immutability and failure injection; no remote D1 while forbidden.
- **Browser:** Playwright virtual authenticator, representative desktop/mobile, accessibility, CSP, no secret exposure, zero egress, negative path assertions.
- **CI & review:** exact final-head Ubuntu/Windows GEF, Docker, SonarCloud, Socket, CodeRabbit status disclosure; negative security findings resolved; solo Owner exact-head review and subsequent protected merge decision. Coverage ingestion separately tracked: no pretending Sonar 0.0% is tested coverage.

**STOP CONDITION:** `P1C_RUNTIME_BOUNDARY_DOCUMENTATION_READY_FOR_OWNER_REVIEW`, else `BLOCKED_WITH_EVIDENCE`. `APPROVED_LOCAL_PROOF=true` refers **only to already-merged LOCAL #128**; `M05_DONE=false`; `P1C_RUNTIME_CODE_GO=NO`; `D1_REMOTE=FORBIDDEN`; `REAL_CREDENTIALS=FORBIDDEN`; `DEPLOY=NO`; `PUBLISH=NO`; `CHECKPOINT_DELTA={}`.
