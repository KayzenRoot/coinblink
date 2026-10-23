# CB-M05 P1-A: Synthetic Security and Data Contracts

Status: **PROPOSED / NON-EXECUTABLE TEST DESIGN / NO P1 CODE AUTHORITY**.
Prepared 2026-10-15. Base public main 85ece8e63e56ac8006701eda121f462d901d2d2f.
Architecture source: ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md in this draft PR.
M05 P0 evidence: PR #59, HEAD 3991540f163c9a391bb8cbc9a29737a74c3f9ca5, 6/6 hosted checks previously SUCCESS.

## Objective

Define falsifiable, synthetic test contracts for one-human Owner bootstrap, passkeys, session revocation, article concurrency and vault ciphertext. These are design vectors ONLY, not a database migration, executable privileged route, provider decision, authentication approval, or cloud deployment. All tokens, article text, keys and identities below are fake.

## A. Synthetic fixtures

| Type | Dummy fixture | Acceptance invariant |
| --- | --- | --- |
| Owner | synthetic singleton id=1 | unique at the database level, no public signup |
| WebAuthn | fake credential id TEST-OWNER-PASSKEY-A, fake key | real challenge/origin/UV crypto separately proven |
| Challenge | fake nonce TEST-NONCE-001; T0+120s | one-time, expiry enforced atomically |
| Session | fictitious random 32-byte blob | server stores only keyed hash; revocable |
| Article | synthetic article-001, revision=1 | server-authoritative version |
| Source | https://example.org/synthetic | URL format only, no fetch |
| Claim | NEEDS_HUMAN_REVIEW | no approval from local marker |
| Provider token | NOT-A-REAL-API-TOKEN | never returned, logged or persisted plaintext |
| Clock | deterministic fixed T0 and offsets | repeatable timeout/recovery tests |

No CPF digits, personal names, real passkeys, actual emails, marketplace access, genuine financial advice or real publisher media belong in test fixtures.

## B. Candidate API and authorization contracts (not implemented)

| Future operation | Server-side boundary | Required negative test |
| --- | --- | --- |
| Owner bootstrap | one-use out-of-band activation; unique singleton | concurrent claims: exactly one success; no second owner |
| Issue challenge | bounded nonce, RP + origin + action + TTL | wrong origin, rate exhaustion, expired request refused |
| Verify passkey | cryptographically validated assertion + user verification | replay, wrong RP, missing UV, forged signature denied |
| Refresh or end session | opaque session hash, idle and absolute TTL, server revoke | revoked session cannot read previous drafts |
| Read private article | unique authenticated Owner, never public MOCK | anonymous and expired session reads denied |
| Write draft | CSRF, Owner, expected revision, idempotency key | concurrent update: one wins, loser 409; no lost update |
| Add article revision | atomic immutable history + actor | failed partial transaction has no visible revision |
| Editorial review | allowed transition plus real Owner step-up | local checkboxes never authorize approval/publish |
| Write provider vault item | fresh step-up, AES-GCM, root key outside DB | ciphertext only, no leaked raw key/token |
| Read vault metadata | authorized Owner | masked fields only; no plaintext GET endpoint |

The actual HTTP endpoint names are not frozen. Integration Steward must own shared routes, migration and platform wiring after a formal admission. **Publishing remains separately denied**, even if draft editing eventually works.

## C. Candidate D1/SQLite schema constraints (not migration SQL)

1. owner_identity: primary key restricted to the sole integer id=1; atomic once-only claim invariant.
2. owner_passkeys: globally unique credential id; immutable verified origin association; revoked_at.
3. auth_challenges: random challenge hash, audience, RP, origin, expires_at and single transactional consume.
4. owner_sessions: keyed token hash, absolute/idle deadlines, revocation, audit; never a raw token in D1.
5. articles: UUID primary key, unique current revision >=1, normalized title/locale/state.
6. article_revisions: unique (article_id, revision), content hash and append-only snapshot, optimistic concurrency.
7. article_sources: article FK, attribution URL and explicit source/rights review status, never inferred verified.
8. article_claims: article FK, nullable reference FK, review states distinct from factual clearance.
9. review_events: immutable actor/transition/revision/idempotency key UNIQUE; forbidden state jumps blocked.
10. provider_vault_items: ciphertext, unique nonce, key version, AAD and masked metadata, with separate root key.
11. security_audit: redacted actor/event/correlation ID, bounded retention, never secrets/credential material.

Schema uniqueness and race safety must be tested against the actual chosen driver and real concurrent Worker requests; an in-memory model does not prove D1 transaction semantics. Rehearse migration failure, snapshot and restoration using only synthetic state.

## D. Falsifiable adversarial matrix for later execution

| Vector | Required assertion |
| --- | --- |
| SET-01/02/03 | 2, 10, 100 simultaneous owner claims yield 1 owner, no zombie state |
| AUTH-01/02/03/04 | wrong RP/origin, missing UV, forged signature cannot authenticate |
| AUTH-05/06/07 | expired and simultaneous reused challenge rejected; rate limit cannot be bypassed |
| SESS-01/02/03/04 | idle/absolute expiry, logout revocation and fixation/rotation prohibit old session |
| CSRF-01/02/03 | foreign Origin, missing CSRF token and malformed content type denied |
| ARTICLE-01/02/03 | anonymous edit denied; update collision yields 409; retry is idempotent |
| ARTICLE-04/05 | huge payload and malformed source-note appendix fail safely, no truncation |
| CLAIM-01/02/03 | removed source remains flagged, placeholder not approval, state machine cannot skip steps |
| VAULT-01/02/03 | plaintext response denied; tampered ciphertext rejected; nonce never reused |
| VAULT-04/05 | key rotation interruption and backup without key fail safely without leaking secrets |
| QUOTA-01/02/03 | quota, CPU or provider failure never bypasses authorization or writes partial state |
| RESTORE-01/02 | migration rollback and synthetic backup restore preserve revision/audit integrity |
| UI-01/02/03 | mock routes have zero private-data access; admin not indexable; accessible keyboard navigation |

Each case must produce a stable fixture, negative expected outcome, cleanup evidence and exact code revision. Nothing listed above is passing until executed in the separately authorized runtime.

## E. Proposed admission path and STOP CONDITION

Owner explicitly decides passkey/recovery and provider/cost, followed by reviewed security/data ADR, module contract, local Context Lock and Integration Steward routing/schema ownership. After an authorized P1-A GO, code may implement LOCAL synthetic proof only. Any remote D1 migrations, Worker deployment, real bootstrap, real secrets or CMS publication require further separate authorization.

Current checkpoint remains M00_COMPLETE/5%, M05 admitted P0 MOCK only. PR #59, #70 and #81 are independent, unmerged. **STOP: no implementation of privileged auth, real database, Cloudflare binding, deployment, paid service, protected main merge, release or checkpoint promotion.**
