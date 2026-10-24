# CB-M05-P1-OWNER-ACCESS-001 — HIGH_ASSURANCE LOCAL Evidence Bundle

**State (current correction):** LOCAL_HIGH_ASSURANCE_CORRECTION_GREEN_AT_IMPLEMENTATION_SHA / FINAL_EVIDENCE_HEAD_RECHECK_REQUIRED / DRAFT / PRODUCTION_NOT_ADMITTED / NO_READY_OR_MERGE.  
**Context Lock (original implementation, historical)**: `KayzenRoot/coinblink/main@e6620609ab95fdf75e20c3bf3132a829bf43af9c`, exact SHA revalidated on 2026-10-24.  
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

## Correction Delta 2026-10-24 — CB-M05-P1-OWNER-ACCESS-001 (same PR #233)

**Owner authorization:** repair strictly within the existing ten paths of PR #233, LOCAL HIGH_ASSURANCE only, no other PR/main/ruleset/checkpoint/cloud change. The prior evidence above is historical and must not override this newest state.

### New context lock and scope audit (before any new write)
- `main`: `524a93a970af9cf8cfb411f8ba7aa9f57ca79603`, verified exactly (compare to `main`: ahead=0/behind=0).
- Original PR #233 HEAD: `fe3bb5efc9edc7e35c76eddb51eda2fb7b073ebf`, open/Draft.
- Original nine critical blobs listed above: **9/9 exact MATCH** on new main.
- Ten changed paths: **10/10 within the already approved set**; compare old base `e6620609ab95fdf75e20c3bf3132a829bf43af9c` → new main: 7 paths from M03/M07, **zero collisions** with this PR. Other 13 open PR path manifests checked, **zero direct overlap** with the ten paths.
- Canonical ADR, threat model, Work Order read on locked main; **no change** to their source blobs, no added file, no D1 remote or production route.

### Hosted RED, test-first (real Workerd/D1, not an environment failure)
- Test-only commit: `4b97ec012603553a63e40a2417b010322166c488`, touching **only** `test/modules/CB-M05/p1-owner-race.test.mjs`.
- Workflow: [HIGH_ASSURANCE RED run 40131969770](https://github.com/KayzenRoot/coinblink/actions/runs/40131969770), failing Node job **120985395707** with `node --test test/modules/CB-M05/p1-owner-policy.test.mjs test/modules/CB-M05/p1-owner-race.test.mjs`.
- Exact TAP result: **11 total / 9 PASS / 2 FAIL / 0 skipped**; both failures were **assertions of fail-open security behavior** and not an install/module/CI fault:
  1. `P1 BOOT SECURITY: consumed ticket and identical marker cannot claim twice in same second`: second claim returned `true` instead of `false`.
  2. `P1 SESSION SECURITY: credential revocation between SELECT and UPDATE must deny`: after a real persisted D1 credential revocation, authorization returned `true` instead of `false`.
- Dependent Chromium job **SKIPPED** on RED, correctly not counted as PASS.

### Minimal correction and hosted GREEN
- First code fix: `ea65c6d2518b358d464382098da4e045ff8aed6a`, one-line SQL **EXISTS non-revoked credential** guard inside the conditional `p1_session` activity UPDATE; keeps the previously repaired `meta.changes===1` requirement. Revoke-between-read-and-update now fails closed without refreshing the session.
- Second code fix: `41687a6295071f8c34e89f7c6471fde1a2414399`, `claimOwnerOnce` requires successful **new INSERT and ticket UPDATE** (`meta.changes===1` on both), and `changes()=1` inside the transactional ticket UPDATE; prevents replay or consuming fresh tickets when the singleton Owner already exists.
- Enhanced regression: `184af889b25fdef32bc8747f01d49549a5eb5982` tests a **new** ticket using the same pre-existing marker; must fail without consuming the ticket. No other files touched.
- **GREEN implementation SHA:** `184af889b25fdef32bc8747f01d49549a5eb5982`.
- [HIGH_ASSURANCE GREEN run 40132132398](https://github.com/KayzenRoot/coinblink/actions/runs/40132132398), Node job **120985906683**: new Node/Miniflare-D1 tests **11/11 PASS**, cryptographic WebAuthn **19/19 PASS**, existing 100-way workerd Owner claims: **three trials**, each `201:1,409:99`, `d1Failures {}` and 1/1 selected regression PASS. The 2 and 10 contender D1 cases are included in the 11/11 tests.
- Same run, Chromium job **120986077676**: production `/admin` denial **1/1 PASS**; existing isolated LOCAL browser/D1/passkey fixture **10/10 PASS**. No live route enabled.
- Full applicable GitHub Actions workflows on exact GREEN implementation SHA: **7/7 SUCCESS**:
  - [Build 40132132488](https://github.com/KayzenRoot/coinblink/actions/runs/40132132488)
  - [CI Quality 40132132418](https://github.com/KayzenRoot/coinblink/actions/runs/40132132418): lint, typecheck, Node/LCOV, Gitleaks success
  - [PR Assurance 40132132417](https://github.com/KayzenRoot/coinblink/actions/runs/40132132417)
  - [Reviewdog 40132132478](https://github.com/KayzenRoot/coinblink/actions/runs/40132132478)
  - [M05 LOCAL Chromium 40132132470](https://github.com/KayzenRoot/coinblink/actions/runs/40132132470)
  - [M01-M05 Chromium 40132132460](https://github.com/KayzenRoot/coinblink/actions/runs/40132132460)
  - [M05 Owner HIGH_ASSURANCE 40132132398](https://github.com/KayzenRoot/coinblink/actions/runs/40132132398)
- **SonarCloud PR bot** (2026-10-24T20:58:49Z, [comment 6389458112](https://github.com/KayzenRoot/coinblink/pull/233#issuecomment-6389458112)): `Quality Gate passed`, **zero new issues, zero accepted issues, zero Security Hotspots, 0.0% duplication, 0.0% measured new-code coverage**. CI passing is **not** measured Sonar coverage.
- **Socket external PR Alerts and Project Report check-runs:** `NOT_INDEPENDENTLY_VERIFIED` by the accessible GitHub read-only connector (commit combined-status API returns no check-run inventory). Do not relabel the absence of check-run API access as PASS. Confirm in PR's Checks tab before technical APPROVED/Ready decision.
- Formal submitted reviews: **0**; inline review threads: **0** at GREEN implementation audit.

### Limits, rollback, audit and STOP
- Affects **only** test-only LOCAL M05 Owner, no new external API, service binding, credential, secret, persistent remote migration, Worker deploy or public `/admin`.
- No real human Owner, two physically independent hardware passkeys, recovery ceremony, remote D1, production rollback, publishing, or real funds: **NOT_RUN / NOT_AUTHORIZED**. Coverage: SonarCloud **0.0% measured**.
- Roll-forward: retain both guards, rerun hosted positive and negative contracts. Rollback is revert of only correction commits within this Draft branch after separately passing safety regression; do not revert the main or bypass gates. No rollback executed.
- **Checkpoint Delta PROPOSED ONLY**: `CB-M05-P1-OWNER-ACCESS-001 LOCAL_SECURITY_CORRECTION_GREEN`, for audit review; **not promoted to canonical checkpoint**.
- This evidence-only commit will create another HEAD; **all applicable checks, 9 blobs, 10 paths, reviews, threads, Sonar/Socket need a fresh exact-HEAD check after it**. Prior GREEN evidence proves the implementation SHA, not an untested future HEAD.
- **Verdict before final-HEAD audit:** `CORRECTION_GREEN / FINAL_HEAD_GATES_PENDING / SOCKET_NOT_INDEPENDENTLY_VERIFIED / PR_DRAFT / NO_READY / NO_MERGE / NO_DEPLOY / NO_PRODUCTION_AUTHORITY`.
