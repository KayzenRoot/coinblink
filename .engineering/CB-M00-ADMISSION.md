# CB-M00-WO-001 · Formal Admission Candidate (CB-GOV-005)

**Canonical main state:** `M00_SCOPE_APPROVED / FORMAL_ADMISSION_PENDING / APP_NOT_STARTED` at `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`. M00 is not admitted on that base.
**Candidate state:** this governance PR proposes `CB-M00-WO-001` admission effective only when the exact candidate passes all required checks and independent review, receives the Owner's exact-head audit, and merges. An open or draft PR is not executable authority.
**Repository:** `KayzenRoot/coinblink`; Issue #7; change `CB-GOV-005`.
**Executor:** Codex Desktop local only, under GEF ADR-0008. No Codex Cloud execution is used or implied.

## Verified authority and baseline

1. The Owner approved the bounded M00 Scope/Requirements/Architecture/Security/DoD source pack in PR #30, comment `6067708856`, for the source HEAD recorded there. That approval does not freeze global Issue #6, authorize Cloudflare deployment, or admit another module.
2. CB-GOV-004 / PR #31 merged the truthful schema-v2 checkpoint to `main` at `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`. Its canonical state records 0% implemented application progress, M00 not admitted, no active Work Order, and no deployment.
3. CB-GOV-005 proposes the separate formal admission and binds this candidate to that exact base. The candidate preserves 0% completion and `applicationImplementation: NOT_STARTED`; only M00's proposed admission changes on merge. CB-M01..CB-M17 remain `NOT_ADMITTED`; CB-M18 remains `FUTURE_NOT_ADMITTED`; Issue #6 remains open.
4. The official GEF CLI 1.1.2 checkpoint observer accepts the schema-v2 project checkpoint. `doctor` and `status` are read-only validators and do not promote checkpoints. The M17 continuation-capsule schema is unrelated and is not an admission mechanism.

## Admission gates

All gates must apply to one exact PR HEAD. Until they pass, keep the PR as a non-executable candidate and do not start application code.

1. The exact base is current `main` `cca3802d22b0ea49cafd7aa9778f2c73a8f6a45f`; preserve `.gef/adopt-state.json` and receipts locally, exclude them from Git, and do not rerun repository `init` or `adopt`.
2. On the candidate, pinned GEF 1.1.2 `doctor --json` and `status --json` must exit successfully, report a present/valid checkpoint and preserve truthful 0%/not-started facts. Record REVIEW findings without suppressing them.
3. The refreshed Context Lock must bind the candidate's canonical LF Git blobs and raw-file SHA-256 values. All locked files must exist and match; `.gef` stays untracked and excluded.
4. The repository's locked-dependency workflow and `npm test` must pass on the exact candidate HEAD in Ubuntu and Windows. The admission test must assert that the candidate proposes only M00, leaves every unrelated module unadmitted, and leaves application implementation stopped.
5. Secret scan and `git diff --check` must be clean. No application files, new runtime dependencies, provider credentials, or production claims may enter this governance PR.
6. Obtain an independent CodeRabbit review on the final candidate HEAD and resolve any findings actually made. The Owner must then audit that same HEAD and authorize the merge. A prior review/check run does not cover a later head.
7. After merge, verify the resulting exact `main` SHA and its checks, then start implementation only on a fresh branch from that SHA. Cloudflare account authorization remains a separate gate for remote Preview; it does not gate local P0 after valid admission.

## Security/provenance finding carried forward

GEF reports dependency provenance as `unverified` / `REVIEW`. The current local `npm audit signatures` run returned `E404` for bundled `@gef-bootstrap/contracts@0.0.0` (the earlier Issue instruction described `@gef-bootstrap/config@0.0.0`). Retain the observed result for Owner review. Do not disable signature checks or describe a zero-vulnerability audit as verified provenance. Any exact CI/security finding that blocks the admission gates keeps the PR pending.

## STOP

The canonical state remains `M00_NOT_ADMITTED` until CB-GOV-005 passes exact-head checks and review and is merged with the Owner's audit. This PR contains governance and tests only. Do not implement the app, claim M00 is already executable, close Issue #6, admit CB-M01..CB-M18, or mark any module `DONE` from this proposal. PR #29's stale base is never an execution base.
