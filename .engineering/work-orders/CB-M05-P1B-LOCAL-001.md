# CB-M05-P1B-LOCAL-001 — Work Order candidate for local cryptographic security proof

**STATE:** CANDIDATE / NOT EXECUTABLE. **Risk:** HIGH_ASSURANCE. **Owner:** KayzenRoot. **Base SHA:** `58321c21508bd6089de1c1a77c21f93a4f0b856a`.

## OBJECTIVE
Produce evidence of actual WebAuthn signature verification plus D1 LOCAL Owner/challenge/session invariants without real human credentials or a live privileged CMS. This prepares but does not complete P1-B, P1-C, P1-D or the M05 DoD.

## CONTEXT / FILES TO READ
Read `.engineering/CHECKPOINT.json`, `.engineering/SOURCE-HIERARCHY.md`, Scope, DoD, Architecture, Requirements, Security, Decisions Ledger, `docs/architecture/contracts/CB-M05.md`, `docs/architecture/ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md`, P1-A ADR, WO, evidence and test fixtures merged via PR #85, Issue #12 decision R51, and this candidate ADR + Context Lock + test matrix. Historical claims remain history. The approved single-admin review policy from PR #82 applies.

## SCOPE (only after separate exact-SHA admission)
1. Preflight repo state, main SHA, 16 source blob fingerprints, current ruleset/CI, Node 22 and Wrangler local emulator. Preserve dirty worktrees; no reset, force-push, or history rewriting.
2. In a NEW isolated `codex/cb-m05-p1b-local-001` branch/worktree, implement generated fake-key WebAuthn cryptographic verification with an independently reviewed/pinned verifier. STOP for security/dependency approval if not already installed/verified.
3. Test two cryptographically distinct synthetic authenticators; server-bound action/challenge/origin/RP and user verification, replay/expiry/unknown credential/malformed signature denials, recovery revocation/lockout.
4. Extend only fake local D1 challenge, Owner and session models; demonstrate genuine independent local contention, digest-only session storage, revoke-all, rotation/expiry/rollback, and CSRF/Origin/idempotency negative controls.
5. Check original P0 and P1-A regressions, lint/typecheck/build/security/GEF and full applicable hosted CI. Export evidence exact base/head SHA, PASS/FAIL/NOT_EXECUTED and redacted logs.

## OUT OF SCOPE
Real passkey enrollment or bootstrap, user data or CPF, protected `/admin` application endpoints, persisted production CMS, D1 remote/migrations, Worker bindings, mail/API providers, domain config, secret vault, production sessions/cookies, paid plan, article publish/release, M01/branding, settings permissions or checkpoint changes.

## FILES / OWNERSHIP (future implementation allowlist)
- `src/modules/CB-M05/p1b-local/**` (synthetic test harness never imported by production app)
- `test/modules/CB-M05/p1b-*.test.mjs`
- `test/modules/CB-M05/p1b-fixtures/**` (safe text fixtures; no private key or DB file committed)
- `.engineering/evidence/CB-M05-P1B-LOCAL-001-EXECUTION.md`
Integration Steward only (not in this WO): `src/pages/**`, middleware, package/lockfile, `.github/**`, Wrangler root config, Astro config, migrations, app secrets, shared security sources. If a dependency is essential, STOP for a separately reviewed change; do not smuggle it into the allowlist.

## ARCHITECTURE RULES / CONSTRAINTS
Exactly one human Owner. Passkey primary + second distinct authenticator. Use a maintained verifier and actual signature bytes, not boolean `isVerified`. Require origin/RP/UV, session digest/expiry and server-side auth. Use isolated Wrangler D1 `--local`, synthetic-only config and ignored local state. Never use `--remote`, Cloudflare login, deploy or external secrets. GitHub network access for development is allowed under existing Owner constraints, Cloudflare/account/provider writes are not.

## ACCEPTANCE CRITERIA
A1: Source and Context Lock exact at execution; chosen library supply-chain/security review and license verified.
A2: Real locally generated signature validates, while modified `clientDataJSON`, signature, origin, RP ID, challenge, UV/UP, credential ID and replay are denied.
A3: Two distinct authenticators; device revocation and total-loss recovery model fail closed without email-only reset.
A4: D1 LOCAL emulator independently proves atomic single-use, contention, expiry and session revocation/rollback; no credit from P1-A mocks alone.
A5: P0 remains `MOCK / SECURITY DISABLED`; no privileged route, cloud access or sensitive artifact added.
A6: Exact-head unit/integration/lint/typecheck/build plus GEF Ubuntu/Windows, Docker, SonarCloud, Socket and required statuses pass; record skipped CodeRabbit as skipped, not independent security review.
A7: Evidence Bundle contains base/head SHA, paths, test vectors, real-crypto vs modeled vs D1 emulator classifications, errors, risks, rollback/roll-forward notes and NO_CHANGE checkpoint delta.

## TESTS
Use `docs/architecture/CB-M05-P1B-LOCAL-TEST-MATRIX.md`. Include negative signatures, malformed CBOR/JSON, concurrency, replay, CSRF, second-device revocation, session lifecycle, no-network guard, and existing P1-A/P0 regression.

## DELIVERABLES / REVIEW FORMAT
Future Codex Desktop LOCAL execution makes one new PR (not edits #59/#58), Evidence Bundle and proposed checkpoint delta. Review in PT-BR: exact HEAD, controls, sources, test PASS/FAIL/NOT_EXECUTED, high/critical findings, verdict APPROVED/CORRECTION REQUIRED/BLOCKED.

## STOP CONDITION
This candidate has no code authority until exact final source/delta is approved by the Owner, protected-merged to main, context refreshed and a separate implementation authorization is issued. After local test execution, STOP for security review. No production, real auth, P1-C/P1-D, deployment, publication, merge or module completion automatically follows.