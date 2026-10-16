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

## R72 correction delta: exact-source execution preflight proposal (2026-10-16)

**Scope unchanged:** HIGH_ASSURANCE, local fake-identity WebAuthn + synthetic D1 proof ONLY, same stable Work Order ID. This is a **non-executable preparation delta**, not acceptance of product P1. The original main SHA above remains historical. Updated protected baseline `54d3f21bbfd34fef5b57d3acb84e11cc6800b60a`. Full source/fingerprint review is recorded in the R72 Context Lock addendum; the original Source Pack hierarchy is unchanged.

**Dependency boundary:** existing PR #87 proposed `@simplewebauthn/server@14.0.3` but did NOT approve a package modification or run a verifier. Its exact tarball integrity, full direct+transitive vulnerability audit (including dev deps), license/provenance and Node 22/Workers/Wrangler compatibility remain **NOT_EXECUTED**. The current chat sandbox uses Node 22.16.0, below repository required Node >=22.19; npm registry DNS responded `EAI_AGAIN`. No offline bypass and no security test result claimed.

**NEXT NECESSARY INCREMENT, ONLY AFTER SEPARATE OWNER GO:** future Integration Steward may propose a targeted dependency/lockfile change to use a pinned, reviewed verifier, paired with a LOCAL isolated synthetic test harness in the **same** `CB-M05-P1B-LOCAL-001` implementation PR. `package.json` and `package-lock.json` are Steward-owned shared files and may not be modified by the M05 module agent without explicit path grant. Prefer local test-only import over production bundle, and prove `astro build` excludes test crypto from production routes. No second WO/PR for the same code scope, and no broad package refactor.

**PRECHECK / ACCEPTANCE ADDITIONS:** Reconfirm main SHA and current canonical WO + Scope/DoD/Security/ADR fingerprints (mark STALE on changes). Verify npm registry SRI, lockfile reproducibility, Node engine, license and supply chain; test **actual** cryptographic assertions with generated ephemeral ES256 keys including tampering, origin/RPID/UP/UV, bound nonce expiry/replay and second distinct credential, rather than `verified=true` stubs. Use Wrangler D1 local-only for stateful nonce/session/Owner tests, label mock vs cryptographic vs D1 evidence accurately, run P0/P1-A regressions and all hosted checks. Explicitly report `FAIL` or `NOT_EXECUTED`; protect the mock editor and do not alter real admin routes. Stop at a reviewed PR/evidence bundle, not a merge or deploy.

**R72 Review Format:** PT-BR with base/head SHA, change list, test commands/results, SRI and advisory report, risks HIGH/CRITICAL, architecture/rights check, suggested `CHECKPOINT_DELTA={}`, and verdict. **STOP:** This addendum alone does not admit an executor or authorize any installed dependency, code, cookie, credential, remote Cloudflare or P1-C/D work.
