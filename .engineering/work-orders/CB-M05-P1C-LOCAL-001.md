# CB-M05-P1C-LOCAL-001 · One-Owner Admin Boundary · LOCAL HIGH_ASSURANCE

**Status:** OWNER_SCOPED_GO / EFFECTIVE_AFTER_ADR_PROTECTED_MERGE_AND_PREFLIGHT. **Risk:** HIGH_ASSURANCE. **Owner:** KayzenRoot. **Executor:** Codex local. **Source proposal:** ADR-CB-M05-P1C-001. **Source main at authoring:** `960f9a12686841b8fdc05e44de2ca5d0a6a1a93e`.

## OBJECTIVE
Validate the P1-C architecture for a **single synthetic Owner**, wholly isolated on LOCAL WebAuthn + Miniflare/D1, by making authorization of both simulated HTML and API requests a server-side check, and proving enrollment/recovery, session/CSRF, revision/audit/rollback invariants. It is a **test harness**, not a deployed CMS, not production authentication and not M05 P1/P2 completion.

## CONTEXT / FILES TO READ (strict precedence)
Read `.engineering/CHECKPOINT.json`, Source Hierarchy, Scope, DoD, Architecture, Requirements, Security, ADR-CB-M05-P1C-001, M05 contract, ADR P1A/P1B, PR #91 source/tests/evidence and unresolved reviews, plus exact repo current status. `main=960f9a12686841b8fdc05e44de2ca5d0a6a1a93e` at drafting only. PR #91 HEAD at drafting `7ad9b3b1014b79c47b19d3ed5a987e65a841fed3`, DRAFT and not merged. Do not treat these as permanent execution fingerprints. Existing full production staged WO `CB-M05-P1C-OWNER-ADMIN-001` remains PROPOSED and is explicitly **not** this Work Order.

## SCOPE (NECESSARY ONLY)
1. Resolve outstanding **#91 Correction Delta** first on the existing PR. Read each actual Sonar finding's rule, severity, file and line; fix actionable problems, preserve tests and record rationales for any nonaction. Do not multiply or silently suppress findings.
2. After baseline and ADR have been accepted, implement/extend **only module-local synthetic handlers and tests**, with no public route or Worker attachment: `src/modules/CB-M05/p1c-local/**`, `test/modules/CB-M05/p1c-*/**`, `test/modules/CB-M05/p1c-local-*.mjs`. If ownership overlaps unresolved #91, continue inside #91 with the same stable correction identity first. Do not open concurrent conflicting worktrees.
3. Prove server-side single-Owner for negative GET/POST across simulated admin shell and API; atomic claim (2/10/100 contenders), passkey replay/RP/UV/origin, independently simulated primary+recovery authenticator, session rotation/revocation/expiry and CSRF, source-aware draft revision/version/history and deterministic audit/restore with entirely synthetic rows.
4. Fail-closed: no real secrets or accounts, restricted origin `owner.example.test` for fixtures, local D1 only, no network egress or remote fallback, credential/session values redacted. Negative coverage includes malformed/cross-origin/oversized inputs, fake principals, credentials, revoked tokens, concurrent revisions, and recovery replay.

## OUT OF SCOPE
No `src/pages/**` or global Astro middleware, `astro.config.*`, `package.json`, `.github/workflows/**`, root Wrangler, production environment, actual `/admin`, hosted D1, real passkeys, paid services, D1 migration on Cloudflare, vault keys/P1-D, article publication/P1-E, M01/M02/M03/M04, external API requests, Cloudflare deployments (including DEMO), checkpoint, rights decisions. Any new shared path requires a *separate* frozen Integration Steward delta and Owner approval; do not infer it here.

## REQUIREMENTS / ARCHITECTURE RULES / CONSTRAINTS
One permanent human Owner; no signup, multi-owner, credential fake bypass, client-only auth or password/email-only recovery. Challenge one-use/expiry/origin/RPID/UV, credential counters/rotation, audited emergency recovery only simulated. Cookies Secure/HttpOnly/SameSite; server sessions with digest-only persistence, deny unauthorized GET and mutation API on every action, CSRF and origin/fetch-metadata checks. Real data or real Cloudflare connections are explicitly forbidden. Node 22 and repo-pinned dependencies only. Preserve main protected rules and no force-push. Keep English canonical source, Brazilian Portuguese reviews.

## CONTEXT LOCK / PREFLIGHT
Freeze **fresh** protected main SHA+tree, this ADR merged Git blob, `.engineering/CHECKPOINT.json`, Source Hierarchy, Scope, DoD, Architecture, Requirements, Security, M05 contract, relevant P1A/P1B decisions and exact #91 head plus files. The attached staging lock is NOT reusable after ADR merge or any source drift. Mark `STALE` and recompile before code. Inspect tests and paths before edit. Record a baseline on Node 22 Ubuntu+Windows/Chromium and local D1; classify Sonar by rule/path/severity. If local environment cannot be accessed, stop before code rather than assert it ran.

## ACCEPTANCE CRITERIA
- Exact frozen source inputs; no scope violations or remote resources.
- A local-only synthetic server boundary checks authorization on every admin-like HTML and API route; 0 successful unauthenticated privileged operations, 0 extra Owner claims under 2/10/100 racing attempts; challenges/recoveries single-use and fail-closed.
- Local D1 contract/migration apply+rollback+restore tested; session invalidation and audit are persistent across handler instances.
- Chromium virtual authenticator flow and a11y/keyboard responsive acceptance are executed (no screenshots with secrets); actual test reports show PASS/FAIL with independent fixtures.
- Node 22 unit/regression, GEF Ubuntu/Windows, Docker, lint, typecheck, build, Socket, Sonar and CodeRabbit *status* all verified at exact HEAD. Sonar actionable HIGH/CRITICAL=0; skipped CodeRabbit review is not independent assurance.
- Security review written in PT-BR with threats, failures, coverage and precise evidence. Owner exact-head GO required for protected merge.

## TESTS / EVIDENCE / DELIVERABLES
Provide Evidence Bundle including base/head SHA, branch/PR/WO ID, critical Git blobs, file diff, tests with commands/output, worker/D1 LOCAL inventory, browser capture and a11y, secret/egress negative assertions, 2/10/100 atomic contention, permission/origin/RPID/UV/replay, backup/recovery/restore, Sonar findings matrix, remaining risks, and `CHECKPOINT_DELTA={}`. Commit and push non-force; create/update only the scoped PR and correct introduced failures. Preserve existing #91 until independently accepted.

## REVIEW FORMAT / STOP
Review in Brazilian Portuguese: `APPROVED` only with independent technical checks and Owner GO for exact HEAD; `CORRECTION REQUIRED` for same PR/WO with delta; `BLOCKED` for stale fingerprints, unresolved #91 high-risk faults, missing tool/test evidence or unauthorized Cloudflare/real credentials. **Stop at LOCAL test proof**, never start production admin, D1 remote, vault, publishing, deployment or checkpoint. `STOP=P1C_LOCAL_PROOF_ONLY`.
