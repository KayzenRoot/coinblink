# CB-M05-P1-OWNER-ACCESS-001 — HIGH_ASSURANCE LOCAL Evidence Bundle

**State:** IMPLEMENTATION_DRAFT / RED_PENDING / GREEN_NOT_RUN / NOT_ADMITTED_TO_PRODUCTION / NO_READY_OR_MERGE.  
**Context Lock (implementation)**: `KayzenRoot/coinblink/main@e6620609ab95fdf75e20c3bf3132a829bf43af9c`, exact SHA revalidated on 2026-10-24.  
**Docs canonical on locked main:** `docs/architecture/ADR-CB-M05-P1-OWNER-ACCESS-001.md`, `docs/security/CB-M05-P1-OWNER-ACCESS-THREAT-MODEL.md`, `docs/product/CB-M05-P1-OWNER-ACCESS-001.md`.

## Immutable critical-blob attestation on locked main

| Path | Git blob SHA |
|---|---|
| `src/pages/admin/[...route].js` | `91a90f33c591616952d5b767cf7bed6c6cf57c91` |
| `src/modules/CB-M05/p1c-local/local-cms.mjs` | `dbaa91335ef0191f26305c94d2021bb2c4f1fb7e` |
| `src/modules/CB-M05/p1c-local/local-admin-router.mjs` | `64aac0708cd1bc088c6b9cb083ccc1419924cd44` |
| `test/modules/CB-M05/p1c-fixtures/schema.sql` | `cc862472a81e3f50e25e761179da43f7811492da` |
| `wrangler.jsonc` | `980a4af6a5c3cd40a37797ad53d27530a54bbbe2` |
| `package.json` | `eed320228166097da9ab8839149350e2706f05fa` |
| `.github/workflows/m05-local-cms-browser.yml` | `44aaa3f9fb0d8ece0328af8e68bb86744ff65ea5` |
| `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md` | `6a590ef487556ed62296f558296b6ad5a334d3dc` |
| `docs/architecture/ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md` | `e5a0054773fa8f6c669ab3861f8cc71bcea73886` |

**Preflight:** all nine blobs match, 10 future paths absent, 13 existing open PRs inspected, 0 direct path collisions. Nearby PRs #201/#207 touch legacy editorial modules; do not edit them.

## RED-first sequence and evidence requirements

1. Create only test/fixture/new workflow files before new implementation. Host PR Draft to capture genuine negative Node tests for absent `p1-owner` contracts; distinguish code-absent RED from infra/network problems.
2. GREEN must show complete executed tests, relevant legacy Workerd 2/10/100, negative and positive WebAuthn, isolated Chromium and fail-closed production route 404.
3. Log exact RED and GREEN SHAs, workflow IDs and failed/passed test counts **after observing runs**. No invented outcomes.
4. SonarCloud measured new-code coverage 0.0% on main; do not claim instrumentation where not observed.
5. RED/CI new statuses: **NOT_RUN** as of this document version.

**Strictly local**: no D1 remote, cloud token, secret, real passkey, deployment, payment, Ready or merge. 10 new paths only; other three documents remain unmodified.

**STOP** if main moves before authorized new work, HEAD/diff leaves scope, security fail-open, unplanned file needs adjustment or any outside production resource is required.

## Hosted RED evidence (genuine test-first, not an environmental failure)

- **RED SHA:** `999044c49f7227021caf68150d63695f1fa8bd07` (tests + D1 fixture + workflow + Evidence Bundle only, no production module files).
- **Run:** [HIGH_ASSURANCE LOCAL](https://github.com/KayzenRoot/coinblink/actions/runs/40097750285) · job `120883455200`, **FAILURE as expected**.
- `node --test test/modules/CB-M05/p1-owner-policy.test.mjs test/modules/CB-M05/p1-owner-race.test.mjs`: `2 tests / 0 pass / 2 fail`, `ERR_MODULE_NOT_FOUND` for the intentionally absent `src/modules/CB-M05/p1-owner/access-policy.mjs` and `claim-guard.mjs`.
- Separate early CI Quality job `40097750256` reported two **real lint findings** in new policy test (unused imports/rest binding). Both were corrected within that test file before GREEN. These lint failures are not presented as the desired RED.
- Existing browser job correctly skipped when the new Node gate was RED.

## Hosted GREEN evidence (implementation candidate, before final evidence-only commit)

- **GREEN implementation SHA:** `ec2b50257f3c8a6e919843705dfde02629a952f9`.
- New [HIGH_ASSURANCE LOCAL run](https://github.com/KayzenRoot/coinblink/actions/runs/40098437723):
  - Job `120885519739`, Node + Miniflare/D1: **8 tests / 8 PASS / 0 FAIL**, including real persisted D1 claim concurrency 2/10, invalid/expired ticket and wrong origin, D1-registered public key versus deliberately substituted key, genuine WebAuthn signature, one-use challenge and session, session replay rejection, idle timeout, absolute timeout and revocation.
  - Pinned cryptographic regression: **19/19 PASS**, `@simplewebauthn/server` 14.0.3 with disposable ES256 keys and negative RP ID/origin/UP/UV/signature cases.
  - Existing workerd-hosted **100 simultaneous Owner claims**, three fresh trials: `201:1,409:99` for each, `d1Failures {}` (1/1 selected test PASS).
  - Job `120885691059`, Chromium: new **production-preview 404** guard **1/1 PASS**; existing isolated LOCAL Chromium + virtual passkeys/D1 **10/10 PASS**.
- Existing M05 LOCAL CMS Chromium and D1 regression: [run 40098437798](https://github.com/KayzenRoot/coinblink/actions/runs/40098437798) **SUCCESS**.
- Existing M01–M05 Chromium regression: [run 40098437816](https://github.com/KayzenRoot/coinblink/actions/runs/40098437816) **SUCCESS**.
- CI Quality: [run 40098437739](https://github.com/KayzenRoot/coinblink/actions/runs/40098437739), **SUCCESS**, including lint/typecheck, Node/LCOV baseline, Gitleaks.
- Build: [run 40098437734](https://github.com/KayzenRoot/coinblink/actions/runs/40098437734) **SUCCESS**.
- PR Assurance: [run 40098437720](https://github.com/KayzenRoot/coinblink/actions/runs/40098437720) **SUCCESS**.
- Reviewdog: [run 40098437725](https://github.com/KayzenRoot/coinblink/actions/runs/40098437725) **SUCCESS**.
- **7/7 workflows completed SUCCESS, 16/16 check runs completed SUCCESS at implementation SHA.** SonarCloud: 0 new issues, 0 accepted, 0 Security Hotspots, 0.0% new-code duplication; Socket PR Alerts + Project Report SUCCESS. SonarCloud measured coverage on new code remains **0.0%**. Passing Node and Chromium tests do **not** prove measured statement coverage.

## Final Evidence-only commit and required revalidation

The commit adding this section changes **only** this Evidence Bundle; its new HEAD needs independent revalidation of **all applicable checks, workflow events, diff, main SHA, reviews, and threads** before the PR is eligible for technical sign-off. Never copy earlier results as evidence of final-HEAD checks.

## Explicit remaining limits / NOT_RUN

- **Real human Owner, hardware passkeys and physical independence of two devices:** NOT_RUN.
- **Lost-both-factor offline recovery in the new P1 boundary:** NOT_IMPLEMENTED / DENIED; the old P1-C synthetic emergency fixture is not real authorization.
- **New P1 read-only public HTTP route / production /admin**: NOT_IMPLEMENTED by design. Only isolated modules and synthetic tests exist, with the actual production route remaining closed.
- **D1 remote, migration, secret provision, Worker deploy, live publishing, provider API and recovery of real data:** NOT_RUN / NOT_AUTHORIZED.
- **Chromium axe/reflow for a future Owner P1 HTML UI:** NOT_APPLICABLE_TO_JSON_ONLY candidate, no new HTML UI. Existing M05 Chromium regressions are independently SUCCESS and cannot be relabeled as new P1 UI proof.
- Coverage measured by SonarCloud remains **0.0%**, even when all new tests are green.
- **Main frozen:** `e6620609ab95fdf75e20c3bf3132a829bf43af9c`. No edit to the 3 canonical documents, 9 critical blobs, other PRs, ECC #209, rulesets or checkpoints. 10 new paths only.

**Current policy:** `LOCAL_ONLY_IMPLEMENTED_IN_DRAFT / PRODUCTION_NOT_ADMITTED / READY_NOT_AUTHORIZED / MERGE_NOT_AUTHORIZED`.

**STOP CONDITION:** any changed base SHA or 9 critical blobs, unplanned path, failed or skipped required gate, missing security evidence, external cloud or real credentials, or attempted Ready/merge triggers immediate stop.

## Supplemental independently reproduced RED→GREEN: concurrent session revocation (2026-10-24)

**Discovery:** `src/modules/CB-M05/p1-owner/access-policy.mjs` previously authorized a read when the SQL `UPDATE` returned `success:true`, without checking that a row was actually renewed. A concurrent logout/revocation after the first `SELECT` could make the update affect **zero rows** yet still allow the read. The test faithfully injects that race without remote services.

- **Dedicated RED SHA:** `78ccf84f3d813fc6bec12e242dddd7e51bf3a936`. Hosted [run 40100498421](https://github.com/KayzenRoot/coinblink/actions/runs/40100498421), Node job `120891488798`: **9 tests, 8 pass, 1 fail**. Exact failure: `P1 OWNER POLICY SECURITY: revoke between SELECT and session activity UPDATE must deny when zero rows changed`; `zero affected rows cannot authorize already revoked session`. The Chromium dependent job was **SKIPPED** on RED, not misreported as PASS.
- **Minimal fix in 1 already authorized module:** `if(written?.success!==true||written?.meta?.changes!==1)return deny;`. Denies a stale session when a concurrent revocation defeats renewal.
- **GREEN SHA:** `52f8e6244dfda2814eaf9a02c5ba7f0459a2026f`. Hosted [run 40100607157](https://github.com/KayzenRoot/coinblink/actions/runs/40100607157), Node job `120891800989`: **9/9 new tests PASS**, including revoked-session race; WebAuthn **19/19 PASS**; three Worker-hosted 100-claim trials **each 1 accepted/99 rejected**, no D1 failures. Chromium LOCAL and production 404, existing M05 browser, M01–M05 browser, Build, lint, typecheck, Gitleaks, Reviewdog and PR Assurance all finished **SUCCESS** at GREEN SHA.
- At `52f8e6244dfda2814eaf9a02c5ba7f0459a2026f`, **7/7 workflows SUCCESS, 16/16 checks SUCCESS**, SonarCloud **zero new issues, zero hotspots, coverage measured 0.0%**, Socket PR Alerts and Project Report SUCCESS. The tests of real identity, recovery, D1 remote, production and independent physical devices remain **NOT_RUN / NOT_AUTHORIZED**.

**Final evidence-only HEAD MUST be checked independently after this append**; earlier GREEN does not automatically certify later commits. PR remains DRAFT. No Ready, merge, deploy, paid operations, real secrets or credential changes were authorized.
