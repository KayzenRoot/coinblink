# ADR-CB-M05-P1C-001 · Single-Owner Admin Boundary (CANDIDATE)

**Decision status:** PROPOSED / NOT ADOPTED. Prepared by Integration Steward on canonical main `6919125c9a6eb593e66b2b909575534937fef76c`. No credential, production binding, migration, real passkey, release, publication, secret, paid service or checkpoint delta is approved by writing this file. Exactly one human Owner: KayzenRoot.

## Context and evidence
- M05 P0 nonprivileged editorial demo is canonical in main from PR #59.
- A synthetic/local-only security laboratory has effective P1-A/P1-B Source Pack evidence. [Draft PR #91](https://github.com/KayzenRoot/coinblink/pull/91) implements isolated Local CMS with two **disposable** WebAuthn cryptographic fixtures, local D1, session revocation, revisions, tested Chromium preview. It is NOT merged, production bound, or real owner enrollment.
- Current global DoD demands a genuinely protected Owner CMS, a verifiably attributed source-backed publication journey, full P1/P2 security, evidence and a separately reviewed checkpoint. Green checks or local fixture passkeys are not equivalent to this.
- The immutable M01 Golden demo and M02/M03/M04 synthetic content are not approval to expose or republish data.

## Proposed architecture decisions requiring explicit Owner P1-C GO
1. **Runtime:** Astro front end plus server-side Cloudflare Worker endpoints *only after separately approved Free-plan resource and security inventory*. Existing M00 protected Preview is not automatically an admin endpoint; no automatic push deploy.
2. **Persistence:** design for transactional D1 with explicit schema version, migration ledger, rollback and least-privilege binding; continue local Miniflare/D1 for proof. No remote D1 creation/migration without separate consent.
3. **Identity:** exactly one durable Owner principal; no registration UI, invite, OAuth sign-in that could enroll a second human or bootstrap bypass. First enrollment via short-lived one-use out-of-band operator-controlled, origin-bound ticket and unique atomic owner claim.
4. **WebAuthn:** two separate independently enrolled passkeys (primary/recovery); server generates and binds per-action challenge with origin/RPID/UV/expiry/replay guarantees and credential sign-count monitoring. No real credentials/tokens may enter this PUBLIC repo, logs or screenshots.
5. **Recovery:** second passkey preferred. Lost-both recovery is an offline operator-controlled emergency procedure with audit, timeout and revoked sessions, **not email-only password reset**. No fake production recovery decision.
6. **Sessions:** opaque random tokens represented as server-side keyed digests; strict Secure/HttpOnly/SameSite cookies, CSRF, origin/referrer/Fetch Metadata enforcement, revocation/expiry/replay tests, fixed per-IP/device quota and secure error envelopes.
7. **Authorization:** Owner identity verified **server-side on every privileged HTML and API request**. No role spoofing from headers, browser state or demo routes; no public `/demo/editorial` route may share mutation power.
8. **Separation:** propose protected `/admin/**` route, centralized middleware and D1 Worker bindings only in a *separate Integration Steward PR* after source contracts and explicit file ownership. All local test endpoint paths `/local/**` remain fixture-only; never expose `https://owner.example.test` as real configuration.
9. **Vault:** P1-D separate approval, use authenticated encryption per secret, independent non-database root KEK and key rotation; UI readback metadata only. No plaintext in GitHub, browser, DB dump or telemetry. Actual provider test does not imply activation.
10. **Editorial:** P1-E separate Owner-reviewed state machine and signed publish gate; public article path additionally waits on M02/M03 source contracts, verifiable evidence/attribution and correction workflow. Synthetic/mock drafts can never be published as news.

## Hard acceptance / adversarial scenarios
- Atomic Owner-claim competition with 2, 10 and 100 independent requests: <=1 Owner, no partial signup.
- Invalid, reused, expired and other-origin challenges; incorrect RPID, absent user verification, credential/device loss, counter replay, stolen-session attempts.
- GET and POST admin unauthorized denial, CSRF cross-site, CORS confusion, malicious Origin/Sec-Fetch headers, access after revoke/expiry.
- Rollback on failed multi-row enrollment, revision conflict and key rotation; audits redact secrets and report origin/scope.
- Production-bound resource inventory, deployment isolation, no direct browser D1/secret and no simultaneous write to M01 route or shared sources.
- Browser Playwright with **real test-only virtual authenticator** before optional physical-key acceptance (not claimable without real actual execution).
- GEF Ubuntu/Windows, Docker, typecheck, build, SonarCloud all findings classified, Socket, a11y and security tests pass on exact HEAD. A skipped CodeRabbit status is only a status, not peer review.
- Sole Owner protected GO for each real privileged work order and release separately; no unauthorized spending or customer data.

## Alternatives and STOP
Alternative self-hosted Node/Postgres would add operational overhead and costs; no provider choice becomes binding until Owner approves the exact risk/resource boundaries. While this ADR is a candidate, **execution ceiling stays unchanged:** #91 test-only synthetic local auth, no publicly exposed CMS, no remote/cloud D1 writes or passkey enrollment, no provider vault and no publishing. The global checkpoint stays M00_COMPLETE / 5%.

**STOP CONDITION:** `P1C_ADR_CANDIDATE_AWAITING_OWNER_SECURITY_ARCHITECTURE_DECISION`.
