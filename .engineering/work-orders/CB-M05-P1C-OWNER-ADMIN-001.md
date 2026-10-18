# CB-M05-P1C-OWNER-ADMIN-001 · Secure Single-Owner Admin Integration (STAGED WO)

**State:** PROPOSED, NOT EXECUTABLE. **Risk:** HIGH_ASSURANCE. **Owner:** KayzenRoot. **Base:** `6919125c9a6eb593e66b2b909575534937fef76c`. This candidate is an execution contract, not code authority. A separate exact-SHA Owner GO and protected merge of the effective Source Pack is required before a production/privileged implementation task.

## Product objective
Deliver a truly protected **one-person** Owner admin, backed by server-side challenge/identity/session, with local reproducible D1 contract tests and real application routing, **without publishing a single article yet**. Maintain separate later scopes for secret vault (P1-D) and source-attributed editorial publish (P1-E); none may be counted DONE individually.

## Inputs and dependencies
- Canonical `.engineering/CHECKPOINT.json`, global Scope/Architecture/Requirements/Security/DoD, `.engineering/SOURCE-HIERARCHY.md`, M05 contract, P1-A/P1-B selected synthetic contracts and evidence, P1-C ADR candidate, threat model and Source Pack.
- Source code baseline PR #91 is DRAFT and not merged. The executor shall not import it as if merged. First complete its existing local-only review and protected merge if separately authorized, or account for the exact tree explicitly.
- M01 PR #58 is an independent Golden Home application integration; do not edit Home-owned routes, share public mutation privileges or trigger deploy/publishing. Commercial-paperwork review was retired from engineering gates in PR #101.
- Cloudflare Workers Free M00 Preview does not authorize admin Worker rights, provisioning D1, real operator claims or deployment.

## Proposed future scope, contingent on explicit admission
- Integration Steward owns `src/pages/admin/**`, centralized auth middleware, Worker/D1 configuration, migration runner and rollback, approved deploy pipeline. Each needs a separately frozen allowlist.
- M05 agent owns only `src/modules/CB-M05/**`, `test/modules/CB-M05/**` for server-side Owner credential, challenge, session, draft and audit interfaces. No M01/M02/M03/M04, global checkpoint, packages or build pipelines without a scoped Steward delta.
- Allow no production keys in code, fixtures or PR comments. Use disposable test authenticators and local D1 first, no real remote resource until a separate Owner Cloudflare account/budget/permissions decision.
- Minimal secure admin P1-C must include a clean first-device setup/second-device recovery path, sessions/revocation/authorization, protected admin shell, server-side safe draft create/revise/history, privacy/a11y/negative tests and deterministic restore. No production publishing endpoint, provider API use or secret vault in this scope.

## Required tests
- Fresh exact-main fingerprints; lint/typecheck/build; exact-HEAD Ubuntu/Windows GEF and Docker, Sonar, Socket.
- Real crypto tests, UV and RP challenges, race-resistant DB writes, source URL validation, anti-CSRF, denial of unauthorized GET HTML and API, no client-only RBAC, no cross-origin leakage or real customer data.
- Recovery replay, lost-device lockout, session fixation/revocation, invariant single Owner and cloud-offline fail closed.
- Local/Preview trust boundary check, D1 migration apply/revert with evidence and no real secrets or paid bindings.
- Actual responsive secure browser flow with reproducible screenshots and a11y.
- Sonar findings must be individually triaged by rule, severity and path, never blanket-suppressed or labeled harmless from the count alone.
- Explicit owner approval of security design, exact implementation HEAD and any cloud resource use.

## Exit gates (strict)
1. Security ADR reviewed/effective (separate protected merge).
2. All real runtime/privacy/security/provider-access decisions made; grant exact file allowlist and production-binding preflight.
3. Code PR passes high assurance exact-head tests, changes only admitted files; capture full Evidence Bundle.
4. Owner GO for protected code merge; no deploy/publication by merging. Real Owner onboarding only after security/operational approvals.
5. M05 P1-D Vault and P1-E editorial publish flow subsequently completed and evidenced before **whole-module DONE**.
6. Checkpoint promotion is **separate**, with M00→M01/M05 accounting only if full global DoD fulfilled.

**STOP:** `P1C_WO_CANDIDATE_NO_RUNTIME_OR_CLOUD_OR_OWNER_IDENTITY_AUTHORITY`. No automatic dispatch, no merge on generic “continue,” no fabricated percent.

## 2026-10-17 proposed-work-order source refresh (not admitted)

Protected `main` at review: `5cbb808ebcc052780ba7e4f426080ddb0ef62f64`; the earlier `6919125c` base is retained above as provenance only. Nine of nine identified critical source blobs on current `main` match the proposed Context Lock's original fingerprints; the accompanying ADR and this WO receive appended technical readback only. The scope, risk classification HIGH_ASSURANCE, file ownership, future P1-C security decision, separately authorized bindings, P1-D/P1-E dependencies, tests, non-production boundaries and STOP condition **remain unchanged**. Recompute a fresh *execution* lock against whatever `main` and PR #91 actually are before dispatch. This refresh is not Owner implementation approval.

## 2026-10-18 · Post-PR #128 integrated baseline and candidate C0 handoff (DOCUMENT ONLY)

**New protected main:** `247315405408efcbda7d0ac49be833711fa8170a` after exact-HEAD protected squash of PR #128, with synthetic LOCAL proof A–E integrated but no public `/admin` routes, no D1 remote, no real passkeys or secrets. R106 CI 7/7, R107 sole-Owner LOCAL proof acceptance, no checkpoint change. Historical baseline and draft references above are provenance only.

**This staged Work Order remains `PROPOSED / NOT EXECUTABLE`.** Proposed near-term C0 integration/trust-boundary plan is [`../proposals/CB-M05-P1C-RUNTIME-BOUNDARY-PLAN-20261018.md`](../proposals/CB-M05-P1C-RUNTIME-BOUNDARY-PLAN-20261018.md). The C0 document defines route-by-route server authorization matrix, M05-vs-Steward path ownership, HIGH_ASSURANCE tests and C1/C2/C3 admission gates. No new privileged/runtime code authority, D1 remote, provider keys, publications, deploy or checkpoint is granted. **Before C1/C2, require a fresh exact-main Context Lock, Owner scoped code approval and complete security review.**

`STATUS=C0_DOCUMENT_CANDIDATE`; `P1C_RUNTIME_CODE_GO=NO`; `M05_DONE=false`; `CHECKPOINT_DELTA={}`.
