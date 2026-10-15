# CB-M05 P1-A Owner Choice and Local Admission Candidate

Status: OWNER CHOICE RECORDED / CANDIDATE ADMISSION PENDING.
Date: 2026-10-15.
Repo: KayzenRoot/coinblink (PUBLIC).
Canonical main as last verified: 85ece8e63e56ac8006701eda121f462d901d2d2f.
Related: Issue #12 R51, draft PR #81; PR #59 is separate P0 product work and PR #70 is a separate local D1 experiment.

## Owner decision

The Owner explicitly approved the prior narrow proposal: passkeys as the preferred single-Owner login approach, a **distinct second enrolled authenticator** as recovery, and **Cloudflare D1 in a locally emulated environment only** for the first P1-A stage, using synthetic identities/data and security tests.

This approval is a decision on technology and limited local test preparation. It does NOT waive the already-required Security/Data ADR, integration-owner path controls, formal admission, exact-head validation or STOP conditions. It is not permission to enroll a real authenticator or create a real user or production account.

## Scope for a separately admitted local P1-A Work Order

- Freeze owner/device/login/recovery requirements in an approved source pack; no second administrator or public self-registration.
- Use synthetic fixtures only, with no identifiers, passwords, real private signing keys or real session cookies.
- Prove database uniqueness, replay denial, challenge expiration and revision conflict/rollback using real local SQLite/D1 semantics after the Integration Steward owns migration files.
- Test two distinct authenticator enrollments using **fake test vectors**; proving a mock boolean does not count as WebAuthn cryptographic verification. Real WebAuthn signature/origin/RP/user-presence/user-verification acceptance needs its own future isolated design and verified implementation.
- Test failing closed on exhausted quotas, invalid permissions, schema error and cloud-offline status, with deterministic cleanup.
- Establish a local-only Wrangler D1 configuration with a nonproduction binding and no remote database ID only if the reviewed Context Lock gives the Integration Steward ownership of those exact files. Never use any remote D1 command or Cloudflare credential.
- All test outputs must distinguish SQLITE_IN_MEMORY, D1_LOCAL_EMULATOR and ACTUAL_WORKER_RUNTIME, and only credit what was actually run.
- No global package/workflow/runtime modifications by the M05 module agent. If one is required, create a separate narrow Integration Steward delta and validate it at its exact SHA.

## Acceptance checklist for P1-A admission

1. The proposed P1 security/data ADR in PR #81 is reviewed and selected as EFFECTIVE by separate exact-head Owner GO and approved protected integration. The current draft PR is NOT effective simply by being written.
2. Explicit module Path Contract and local Context Lock specify source SHA, permitted paths and STOP condition. Integration Steward reserves shared migrations, Cloudflare configuration, Astro routes and package changes.
3. Tests are local-only and fake-only: owner uniqueness under contested requests, replay/expiry/origin/RP challenge guards, recovery with two separate simulated devices, optimistic concurrency and rollback with no nontransactional partial writes.
4. Before any privileged backend code: threat and recovery review; test-only code is not a substitute for a real cryptographic proof.
5. Exact-head CI Ubuntu+Windows, Docker, SonarCloud and Socket success, owner review of outputs and independent security review where required.
6. No public site deploy, provider provisioning, real credential, paid plan, public admin endpoint or publishing step.

## Execution state after current Owner authorization

- DECISION: passkeys + second recovery authenticator + local D1 candidate SELECTED.
- SOURCE/SECURITY ADR: reviewed as draft, NOT YET EFFECTIVE.
- P1-A IMPLEMENTATION: NOT CANONICALLY ADMITTED.
- D1 EMULATOR TEST: NOT RUN.
- WEBAUTHN AUTHENTICATION TEST: NOT RUN.
- FORMAL M05 COMPLETION: NO. Whole-project checkpoint M00_COMPLETE / 5%.
- A test-only local SQLite fixture harness write was not accepted by the connected GitHub integration; do not count any local SQL proof as completed or bypass the tool rejection.

STOP: No protected merge or deployment, real credentials or sessions, migrations or bindings, real user data, external D1 usage, release, publishing, license clearance or checkpoint promotion.
