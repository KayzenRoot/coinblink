# CB-M05-P1 · Proposed single-Owner secure editorial CMS architecture

**Status:** PROPOSED / NOT EFFECTIVE / NO P1 CODE AUTHORITY
**Prepared:** 2026-10-15
**Owner scope:** CoinBlink M05; this is an architecture option for review, not a migration, rollout, grant of privileges, commercial rights decision, or instruction to deploy.
**Main base:** 85ece8e63e56ac8006701eda121f462d901d2d2f
**M05 P0 demonstrator:** PR #59, HEAD 3991540f163c9a391bb8cbc9a29737a74c3f9ca5, 6/6 hosted checks GREEN; this app code remains outside main.
**Other distinct proposals:** PR #70 is limited to a D1 LOCAL spike and remains NOT ADOPTED; nothing in PR #70 or this document authorizes any local/remote database migration. Issue #72 rights/commercial review and PR #80 M01 public-code integration are independent.

## 1. Problem and hard constraints

Transform the current static, public, non-privileged MOCK editor into a safe persistent CMS for one permanent human Owner, then an auditable approval and publishing workflow. V1 must not create a second human privileged account. Editorial author bylines are plain article metadata, not identities. Public readers and bots have zero CMS mutation powers. Existing /demo/editorial routes MUST remain demonstrative and cannot be reused as a privileged authorization boundary.

Hard invariants:
- No public sign-up, email-only recovery, setup-bypass URL, shared administrator token, client-only RBAC, publicly accessible bootstrap secret or unauthenticated mutation endpoints.
- No public site/Cloudflare deploy or external paid resource automatically triggered by merging this ADR.
- A PUBLIC GitHub source repository may contain audited code and synthetic fixtures, never a real CPF, real operator name/address, passkey credential, session, recovery code, secret, backup or valid production customer/article data.
- All stateful side effects require server-side unique Owner authorization and audit. No publication from a mock state.
- Security-critical code remains BLOCKED by canonical Work Order until separate Owner-approved Security/Data ADR, precise Context Lock, ownership and dependency gates have formally passed.
- No alteration to canonical checkpoint; M00 remains COMPLETE at 5%, M05 only P0 ADMITTED, P1 NOT AUTHORIZED.

## 2. Decision options (none approved yet)

| Area | Recommended P1 candidate | Alternative considered | Resolution needed |
| --- | --- | --- | --- |
| Application runtime | Existing Astro UI served with Cloudflare Workers server-side endpoints in a private/non-public, gated test environment | Self-managed Node backend or VPS | Owner chooses runtime/deploy cost boundary and provider |
| Persistence | Cloudflare D1 (SQLite) with isolated local fixtures, explicit migrations and rollbacks; provisioned remote DB only after separate permission | Managed PostgreSQL / isolated local SQLite for development | Confirm D1 compatibility, migration security, free quota and correct atomic setup |
| Human authentication | Phishing-resistant WebAuthn/passkey with mandatory verified user presence; at least two distinct authenticators registered | Password + TOTP + independent recovery, if passkeys unsuitable | Choose and threat-model before any credential code |
| First Owner claim | Secure operator-controlled out-of-band bootstrap (one-use short-lived enrollment ticket scoped to deployment and origin), committed via atomic unique record | Manual operator CLI with temporary signed enrollment claim | Concrete activation/recovery protocol and rollback required |
| Recovery | Second enrolled passkey + offline single-use recovery codes (server hashed with independent pepper), strict rate-limit and manual rebootstrap as last resort | Managed hardware security-key challenge | No email-only privilege reset; decide whether offline recovery is required |
| Sessions | Opaque 256-bit random session id, server-stored keyed hash, strict HTTPS HttpOnly Secure SameSite cookie and explicit revocation | Short-lived signed state only with key rotation + revocation store | Must preserve revocation and CSRF defense |
| Credential vault | Per-value authenticated encryption with independent Worker secret key material and write-only UI; metadata-only readback | Separate audited secrets manager, subject to cost and availability | Key custody, versioning, rotation, rollback and leak tests |
| Content publication | Server-owned review state machine; publish only after real Owner re-auth and explicit idempotent approval, licensing and factual review flags | Publishing disabled until separate launch release | Initial P1 may ship persistence + review without publishing |

All selections are PROPOSED and require Owner review. This document intentionally does not say the current mock has working auth.

## 3. Threat model and security boundary

Actors: real Owner; unauthenticated visitor; malicious submitter; stolen browser session; leaked source commit; compromised or reused passkey/recovery device; malicious insider or addon; bot exploiting setup race, CSRF, origin mix-up or server-side action; compromised DB dump; leaked encrypted third-party token; provider admin with misconfigured permissions.

Trust boundaries: browser to privileged Worker route, Worker runtime to D1 binding, Worker runtime to Cloudflare secrets, environment to deployment account, publishing API to public read model. Every privileged endpoint verifies a session, Owner claim, audience/origin, CSRF policy, authorization and revision match on the server. Never trust a UI disabled button or the presence of a cookie alone. Public/demo route and privileged route must not share write-bearing state.

Threat response:
- Open invitation/signup => hard 404/405 or 403; one Owner identity enforced by DB unique singleton constraint and concurrency test.
- Credential replay => challenge stored with nonce, expiry, origin and RP binding; single-use transactional consume; reject attempts without required user verification.
- Session theft => server revocation, idle+absolute TTL (initial targets: 30 minutes idle and 12 hours max, to be validated), rotation after privilege event, generic response, device/session management and audit.
- CSRF => SameSite Strict where usable, Origin/Referer and Fetch Metadata validation as defense-in-depth, anti-CSRF nonce on unsafe methods, strict content type and idempotency.
- Brute force/denial => appropriate per-account/IP limits without relying on paid-only features; bounded login challenges and backups; fail closed if mandatory limits unavailable.
- IDOR/mis-scoped media => Owner auth on every read/write of private articles, version, status and attachments; no blind public article ID access.
- Vault exfiltration => encrypted at rest, root encryption key outside D1; NO secret GET endpoints, logging, static bundle, screenshots, backups or outbound analytics; protected rotation and audit.

## 4. P1 staged implementation plan (not authorized by this proposal)

### Stage P1-A · Synthetic local contracts and security proof

Developer may prepare only documentation, static schema contracts and pure validation/test fixtures until separate P1 code GO. Never create real Owner credentials. Integration Steward owns database migrations and shared runtime. Build a local all-synthetic test harness, verify Cloudflare compatibility, WebAuthn or alternative server signature verification and free-worker CPU budget. Do not run any remote migrations or Worker deployments.

Acceptance: threat checklist reviewed; private API error envelope frozen; schema uniqueness/race proof; rollback plan and recovery drills using synthetic material; same-origin CSP; secret-negative test design.

### Stage P1-B · Protected identity and persistence (new admission required)

After a reviewed Owner-specific GO: use unique Owner singleton and passkey credentials with challenge one-time expiry/replay control, CSRF, sessions and per-request Owner checks. Tests must prove unauthorized users never read drafts or mutate content; concurrent setup produces exactly one Owner. Schema and migrations must be versioned and reversible where feasible; D1 export/snapshot recovery procedure must be tested for the chosen schema before production. Never activate production without a preflight.

### Stage P1-C · Editorial database and revision trail

Persist drafts, article revisions and source/claim notes with server-authoritative version numbers. Implement conflict check via optimistic concurrency and idempotency key for each write. Map current local R43–R48 plain-text Markdown format into article body, preserving backwards-compatible import/export as an offline recovery path. Reject invalid/malformed user content and giant payloads. Attribution is metadata, not secondary human identity.

### Stage P1-D · Review state and vault (separate incremental security acceptance)

Adopt or revise the existing proposed state flow: draft -> source-check -> fact-check -> owner-review -> approved -> scheduled/published -> corrected/withdrawn. Transition cannot skip source/legal/owner gates. Every transition records actor, previous/new revision, date, reason and idempotency. A recorded local heuristic/citation or self-attestation is NEVER a factual or rights clearance. Live publication and provider connections remain independently blocked until distinct release authorization.

Vault: encrypt provider key payload with AES-GCM (unique nonce per operation, authenticated context containing owner, provider, schema and key version) using random encryption key in protected Worker Secret binding, not in D1. Store only ciphertext, nonce, authenticated metadata and last-four masked display metadata. Distinguish CONNECTED / TESTED / ACTIVE / FAILED; token tests must never echo the secret. Rotate keys with documented backfill and rollback. No generic Cloudflare account-admin token permitted in CMS Settings.

## 5. Proposed minimal relational model (not migration SQL)

No ORM or product schema is authorized at this stage. A future migration will specify primary/unique/foreign-key constraints, indexes, concurrency proof and rollback.

| Table | Minimum columns / constraints | Retention and risks |
| --- | --- | --- |
| owner_identity | singleton integer PK fixed = 1; active state; created_at | atomic uniqueness, immutable human identity |
| owner_passkeys | credential_id UNIQUE; owner_id FK; public_key; sign_count; transports; created_at/revoked_at | no private key; challenge replay prevention |
| auth_challenges | id random; hashed challenge; owner/audience/origin; expires_at; consumed_at UNIQUE | short TTL, deletion and transactional consume |
| owner_recovery | id; salted+peppered hash; consumed_at; created_at; reset_version | never raw recovery codes in DB/logs |
| owner_sessions | HMAC(session token); owner_id FK; expires_at; idle_deadline; revoked_at; device audit | no raw cookie/session secrets in DB |
| articles | UUID PK; current_revision; working_state; locale; title/summary/body; created_at/updated_at | indexed visibility and state; versioned writes |
| article_revisions | UUID PK; article_id FK; revision UNIQUE within article; content checksum; snapshot; timestamp | append-only correction history |
| article_sources | UUID PK; article FK; reference URL, attribution, license decision, status | provenance, avoid leaking unpublished sources |
| article_claims | UUID PK; article FK; claim text; linked_source_id optional; review status; updated_at | NOT_VERIFIED distinct from reviewed |
| review_events | id; article FK; actor fixed Owner; from/to state; revision; reason; idempotency_key UNIQUE | immutable audit of approvals |
| security_audit | id; event type; owner singleton; redacted target; timestamp; correlation id | bounded retention and no secrets |
| provider_vault_items | owner_id FK; provider key; ciphertext+nonce+key_version+AAD; masked metadata | independent secret KEK, never plaintext readback |

No assumption that the full design fits Cloudflare Free until the CPU/row/access pattern is benchmarked. Full-text search and assets/media storage are out of this immediate schema.

## 6. Public/privileged routes and sample access matrix

- Public: GET /demo/editorial/** is always nonprivileged MOCK and displays no real draft, PII or Owner identity. No POST/PATCH/DELETE for privileged data.
- P1 admin: POST /admin/setup initially available only behind out-of-band one-use activation with origin/rate checks; never public self-service. Actual route is separately security-reviewed.
- P1 session: POST /admin/auth/challenge and /admin/auth/verify enforce one-time challenge + passkey assertion, with bounded errors; POST /admin/logout invalidates on server.
- P1 articles: GET /admin/articles and private article details require Owner session; POST/PATCH/DELETE and review events additionally require CSRF/anti-replay/revision check; public readers denied.
- P1 vault: POST/PUT /admin/settings/integrations requires fresh step-up verification, write-only secret field and masked response. GET may disclose ONLY masked metadata, not secret values.
- P1 publish: all worker endpoints for actual publication remain OFF until separate product/release/legal go/no-go even if P1-authenticated content editing is working.

## 7. Cost, provider, operational constraints

Cloudflare D1 Workers Free, official documentation read 2026-10-15: 5 million rows read/day; 100,000 rows written/day; 5 GB total D1 storage. D1 Free LIMITS ARE ENFORCED: request errors occur after daily row quota. Cloudflare Workers Free includes 100,000 requests/day and 10ms CPU per invocation; check that WebAuthn challenge processing and encryption meet the runtime's CPU budget (and that the account/plan entitlements truly match). No quota or cost guarantees beyond current official docs.

Source links:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/changelog/product/d1/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/local-development/environment-variables/

On Free-tier exhaustion, protected CMS mutations must return explicit safe error and retry guidance, never fall back to a bypass or silent lost write. No accounts, binding, projects, paid plan or Worker deploy created by this proposal.

Observability: redacted security event taxonomy, audit retention window, access-controlled metrics, alerting on abnormal login/first-Owner claims, session revocation and backup/restore success. Redact sensitive legal/CPF data in this PUBLIC repository.

## 8. Required acceptance and STOP CONDITION

BEFORE ANY P1 CODE: (a) Owner names and approves auth, DB, recovery and secrets approach in a separate explicit decision; (b) Integration Steward reviews P1 route/migration/CI ownership, costs, rollback and Cloudflare plan capabilities; (c) independent security/DoD review and canonical Source Pack/Context Lock admission updated by reviewed protected merge; (d) exact-head required checks GREEN. PR #70 remains local-D1-only proposal and cannot silently serve as P1 admission.

For P1 implementation completion: 1/1 Owner race under concurrent bootstrap; no public signup; passkey assertion UV/challenge/origin replay tests; recovery safe under compromise; cookie, CSRF, step-up, rate limits and revocation; unauthorized HTML/API reads and mutations denied; revised article saves, version conflict, revision rollback and integrity; audit and idempotent review transitions; ciphertext-only DB test, secret GET denial and key rotation; synthetic restore test; accessibility + browsers + exact-head Linux/Windows/Docker/GEF/SonarCloud/Socket; owner product/security validation. Only after these and deploy-specific acceptance may a separate release be considered.

**Explicit STOP:** PROPOSAL ONLY. NO AUTH IMPLEMENTATION, NO D1 MIGRATION (LOCAL OR REMOTE), NO CLOUDFLARE DEPLOY, NO SECRETS, NO PROVIDER TOKEN, NO PR MERGE, NO RELEASE, NO RIGHTS CLEARANCE, NO CHECKPOINT PROMOTION. M05 P0 PR #59 stays separately open until owner-visible acceptance and its own merger decisions.
