# Evidence Bundle · CB-M00-WO-001

**Verdict:** `P0_LOCAL_VALIDATED / P1_PREVIEW_AND_REMOTE_BROWSER_EVIDENCE_VERIFIED_AT_e8886e21 / CLOSEOUT_AUDIT_PENDING / M00_NOT_DONE`.
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001`; change: local M00 P0 foundation.
**Execution branch:** `codex/cb-m00-wo-001-p0`.
**Authorized base:** `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` (CB-GOV-005 / PR #32 merge SHA).
**Execution Context Lock SHA-256:** `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e`.
**Candidate fingerprints:** `.engineering/evidence/CB-M00-WO-001-FINGERPRINTS.json` records Git blob SHA-1 and raw-blob SHA-256 for 45 changed paths at immutable implementation snapshot `6a33bf25b3bf31c65f2dd47f490b84e74a9a4cfe`; the manifest and this Evidence Bundle are excluded to avoid self-reference. All 45 blob pairs were revalidated against that snapshot. The c716/ccbce follow-up commits before this review correction preserved that implementation snapshot; correction-delta fingerprints for the workflow, its contract test, and the DoD are recorded below. This Evidence Bundle remains excluded from self-reference.
**Last audited candidate:** `ccbce66b216796012689869b9de17effd2327f5a`; exact-head run `37870422086` passed on this SHA. Earlier run `37870129338` at `c716e109ed87d679cc54f2c119079efb98ad2351` is retained as historical evidence. The current correction candidate SHA and its exact-head checks are in PR #33; predecessor CI does not validate a later candidate.
**Context Lock:** original base SHA-256 `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e` and its 29 base source fingerprints are unchanged. The review corrections affect the CI workflow, its contract test, and documentary status, not the locked base decisions.
**Historical implementation checkpoint:** the original P0 evidence base recorded `M00_ADMITTED`, `IMPLEMENTATION_NOT_STARTED`, 0%, preview `NOT_DEPLOYED`, and no `stopState`; that snapshot is preserved here as history. **Current canonical checkpoint:** `.engineering/CHECKPOINT.json` at main `e8886e21c6f152ca374b1e42852c6b6638543f40` records `M00_ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, `NOT_DEPLOYED`, 0%, and no `stopState`. Its current operational Preview evidence and still-pending checkpoint promotion are recorded in the 2026-10-10 P1 closeout addendum below.

## Current P1 closeout record · 2026-10-10

Protected Preview run [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) succeeded on canonical `main` `e8886e21c6f152ca374b1e42852c6b6638543f40`; real stable/immutable URLs, exact-SHA routes, headers, screenshots, axe, and read-only plan/billing evidence are consolidated in [the P1 closeout Evidence Bundle](CB-M00-WO-001-P1-CLOSEOUT.md). Live provider binding inventory and final Owner/independent audit remain pending. This evidence update does not change the canonical GEF checkpoint; M00 is not done at 0%, and M01+ remains unadmitted.

## Review correction fingerprint delta

These exact Git blob fingerprints preserve the original 45-path implementation snapshot above and bind the M00 review corrections. The Evidence Bundle and the historical manifest remain excluded from self-reference; the Context Lock's base fingerprints are unchanged.

| Path | Git blob SHA-1 | Raw blob SHA-256 |
|---|---|---|
| `.engineering/DEFINITION-OF-DONE.md` | `3804f6f521de9f5251c4329f4cc02b8e7ec2631e` | `4952f2b7ec9ac6479c0c3723054d521b702aeee0499130e2c1e12f658a98ac5d` |
| `.github/workflows/gef-validation.yml` | `3d9c6e3823be195074cafd8004f27de4ef59b2d8` | `1c84923eeda3d182f7ebb9c5e4b5ed4a425e802665187c072f24166c052129a4` |
| `test/exact-head-ci.test.mjs` | `f36a5a219c6b0f293c55e1dc72e67b927991f06b` | `318345af4aaa79da5de327aedf7c45071e8a7817ec1cf508d23444f5ec860987` |

## Scope and source boundary

- Implemented only the admitted local P0 M00 shell, service endpoints, Astro/Cloudflare Worker-compatible build, Compose setup, checks, and narrowly required status-only reconciliation.
- No M01–M18 code, CMS, real market data, Owner authentication, payments, ads, production configuration, Cloudflare resources, provider credentials, or remote deployment were added.
- The original Golden raster files remain absent from Git; no substitute assets or Golden-fidelity claims were introduced.
- The local `.gef/` directory from the original checkout was not copied to this clone, staged, or modified. No repository GEF `init --apply` or `adopt` was run.

## Toolchain and dependency evidence

| Check | Result | Evidence |
|---|---|---|
| Git base and branch | PASS | Local regular clone; `HEAD` initially matched the requested base exactly; new branch `codex/cb-m00-wo-001-p0`. The original checkout and existing linked worktree were preserved. |
| Node archive | PASS | Official Node v22.19.0 Windows x64 archive SHA-256 matched the official `SHASUMS256.txt`: `ea3fad0e67a991d8477d8c01344b56e69c676ccb733f065b22436994b1253f86`. Runtime reported `v22.19.0`; bundled npm `10.9.3`. |
| Dependency set | PASS / REVIEW | Pinned `astro@7.3.8`, `@astrojs/cloudflare@14.3.4`, `wrangler@4.149.0`, Playwright `1.64.0`, ESLint `10.12.0`, TypeScript `6.0.3`; `npm ci --ignore-scripts` completed and reported 0 vulnerabilities. The Linux Docker build and the CI workflow use the same restricted install mode; the full local build and tests passed with lifecycle scripts disabled. |
| `npm audit --audit-level=high` | PASS | Exit 0; `found 0 vulnerabilities`. |
| `npm audit signatures` | REVIEW / BLOCKED BY PACKAGE METADATA | Exit 1 / E404 for transitive `@gef-bootstrap/config@0.0.0`; the signature check was not disabled. GEF doctor also continues to report dependency provenance `unverified` / `REVIEW`; retain this for owner review. |

## GEF 1.1.2 evidence

| Command | Result | Observations |
|---|---|---|
| `npm run gef -- doctor --target . --json` | PASS / REVIEW | Exit 0, effect `NONE`; checkpoint present and valid; repository observable `HEALTHY`; Node/platform/Git healthy. Dependency provenance is `unverified` / `REVIEW`. GEF GitHub policy is also `REVIEW` because the execution branch is mutable (`immutableRef=false`; `writePermission=false`). |
| `npm run gef -- status --target . --json` | PASS / REVIEW | Exit 0, effect `NONE`; checkpoint reads `M00_ADMITTED`, `IMPLEMENTATION_NOT_STARTED`, 0%; dirtiness observed. `operator.stale=true`, drift baseline `ABSENT`, and `operator.stale.unknown_conservative` are retained because this separate clone has no local GEF drift/adoption baseline. No baseline was fabricated. |
| `npm test` GEF unit coverage | PASS | GEF 1.1.2 version/commands, read-only plan/doctor/status, checkpoint module boundaries, official package tarball/SLSA evidence and Context Lock fingerprints passed. The test exercises `init --apply` only in a disposable temporary directory and verifies repeated apply refuses to clobber; repository state is not applied. |

## Local application and security checks

| Command / check | Result | Evidence |
|---|---|---|
| `npm run lint` | PASS | ESLint completed with `--max-warnings=0`. |
| `npm run typecheck` | PASS | Astro check: 21 files, 0 errors, 0 warnings, 0 hints. |
| `npm test` | PASS | 11 unit tests passed; Astro build completed; 6 Playwright tests passed. This includes WCAG 2.1 A/AA axe checks, three viewports, horizontal overflow, skip-link focus, browser console, sanitized endpoints, response headers, and honest 404. |
| Generated Worker binding assertion | PASS | Build emitted `dist/server/wrangler.json`; the build guard checks no `SESSION`, KV, D1, R2, Durable Object, Queue, or service bindings, requires only the `ASSETS` static binding, and rejects unchecked plaintext `vars`. `astro.config.mjs` sets `session: false`; image processing uses `passthrough`, so no `IMAGES` binding is needed. |
| Docker Compose build/smoke | PASS at alternate local port | Compose built the image, started a healthy container, returned `/health` status `ok`, `/preview-status` with `cloudflarePreview=not-deployed`, and HTTP 404 for a missing route. The exact implementation snapshot `6a33bf25b3bf31c65f2dd47f490b84e74a9a4cfe` was exercised on `127.0.0.1:3010`; `/health` and `/preview-status` reported that SHA, the container was healthy, and a missing route returned 404. Only Compose project `coinblink-m00-wo-001-final` was removed. |
| Host port 3000 | BLOCKED locally by unrelated service | Before and after the smoke, container `d76127e8ff37` (`nexlabs-website-web-1`) owned `127.0.0.1:3000->3000/tcp`. It was not stopped or modified. The Compose default remains port 3000; a dedicated Ubuntu exact-head CI smoke is configured to validate that binding on its isolated runner. |

## Screenshot artifacts

The local Playwright run created and visually inspected the following screenshots. They are demo UI captures, not replacements for the missing Golden references. CI uploads the corresponding exact-head PNG set as `coinblink-m00-playwright-<run_id>-<run_attempt>`; use the artifact linked from the PR checks for exact-head review.

| Artifact path | Viewport | SHA-256 |
|---|---:|---|
| `artifacts/playwright/6a33bf25b3bf/desktop-1536x864.png` | 1536 × 864 | `31d2429e642ef59a8adb07f408361400e0a019e7ae5ade39794274e8b89d5a5c` |
| `artifacts/playwright/6a33bf25b3bf/tablet-768x1024.png` | 768 × 1024 | `ad40e3c899c8bf52bc843e308fca86c93b8f2a9994d7566fbd091995f8e424f8` |
| `artifacts/playwright/6a33bf25b3bf/mobile-390x844.png` | 390 × 844 | `7a008f713a5612fcb5c28508b83ae39d74c3bb002cd022f3e67da6fa5f992549` |

## Historical PR #41 gates and residuals (as of 2026-10-09)

- [Initial GitHub workflow run 37868417930](https://github.com/KayzenRoot/coinblink/actions/runs/37868417930) on `1449d9b62b2b2df1e2dab47b1316c64407fdcd6c` exposed two candidate issues. Ubuntu/Windows failed because the shallow checkout omitted locked base `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`; Docker passed. [SonarCloud reported](https://sonarcloud.io/dashboard?id=KayzenRoot_coinblink&pullRequest=33) five MAJOR vulnerabilities tied to ad-hoc `npx`/install lifecycle scripts, plus a demo-label contrast issue and a redundant-branch complexity issue. Commits `1bbf835` and `6a33bf2` fetch required Git history, use the pinned local Playwright binary, disable dependency lifecycle scripts, add guard tests, simplify recursive binding detection, and set an explicit high-contrast demo-label surface. Those findings were corrected in the succeeding exact-head runs.
- Exact-head [GitHub Actions run 37870129338](https://github.com/KayzenRoot/coinblink/actions/runs/37870129338) passed on candidate `c716e109ed87d679cc54f2c119079efb98ad2351`: Ubuntu M00/GEF, Windows M00/GEF, isolated Docker Compose smoke, and exact-SHA screenshot upload. [Ubuntu job](https://github.com/KayzenRoot/coinblink/actions/runs/37870129338/job/113626046339), [Windows job](https://github.com/KayzenRoot/coinblink/actions/runs/37870129338/job/113626046277), and [Docker job](https://github.com/KayzenRoot/coinblink/actions/runs/37870129338/job/113626046054) each concluded success. SonarCloud Code Analysis and both Socket checks also passed. The Ubuntu job uploaded `coinblink-m00-playwright-37870129338-1` with the three exact-head viewport screenshots.
- Exact-head [GitHub Actions run 37870422086](https://github.com/KayzenRoot/coinblink/actions/runs/37870422086) passed on audited candidate `ccbce66b216796012689869b9de17effd2327f5a`: Ubuntu M00/GEF, Windows M00/GEF, isolated Docker smoke on port 3000, and exact-SHA screenshot upload. [Ubuntu job](https://github.com/KayzenRoot/coinblink/actions/runs/37870422086/job/113626988288), [Windows job](https://github.com/KayzenRoot/coinblink/actions/runs/37870422086/job/113626988021), and [Docker job](https://github.com/KayzenRoot/coinblink/actions/runs/37870422086/job/113626988217) each concluded success. SonarCloud Code Analysis and both Socket checks also passed. The uploaded artifact is `coinblink-m00-playwright-37870422086-1`.
- CodeRabbit full review [5464916541](https://github.com/KayzenRoot/coinblink/pull/33#pullrequestreview-5464916541) reported two actionable M00 items: update this Evidence Bundle and the DoD to record run `37870422086` at `ccbce66`, and set `persist-credentials: false` on both CI checkout steps. This PR records those corrections and a regression test for credential persistence. Its Windows-shell warning was explicitly unverified/trivial; generic 80% docstring coverage is not an admitted Work Order gate and was not added as scope.
- Technical audit comment [5464891245](https://github.com/KayzenRoot/coinblink/pull/33#pullrequestreview-5464891245) validated the local P0 evidence on its reviewed SHA, retained merge/Cloudflare/Owner gates, and flagged stale evidence wording. That review predates the current correction candidate; final-head audit remains pending.
- The live [PR #33 checks](https://github.com/KayzenRoot/coinblink/pull/33/checks) are authoritative for the current correction candidate SHA. The exact-head result for that SHA is linked from the PR description; run `37870422086` remains the historical result for audited SHA `ccbce66`.
- CodeRabbit previously skipped the draft review; the full review is now recorded above. Independent review of the corrected final HEAD and Owner audit remain pending. Keep this PR draft and unmerged.
- Cloudflare account, plan, cost ceiling, scoped credentials, and non-production isolation have not been verified or authorized. P1 is `PROVIDER_SETUP_REQUIRED`; no preview URL is claimed and no deployment was attempted.
- Known residuals: local port 3000 conflict above; GEF local drift baseline is absent; GEF doctor reports dependency provenance `unverified` and mutable-ref GitHub policy `REVIEW`; `npm audit signatures` returns E404 for unpublished transitive `@gef-bootstrap/config@0.0.0`. `npm audit --audit-level=high` reports no vulnerabilities; the pinned GEF tarball/SLSA test passes.

## Historical stop condition (before the 2026-10-10 Preview dispatch)

Stop with the implementation PR ready for audit. Do not merge, promote `.engineering/CHECKPOINT.json`, mark M00 `DONE`, start another module, or run the Cloudflare preview lane. Only a later authorized audit/merge may promote the proposed delta.

## 2026-10-10 P1 protected Preview follow-up

The next authorized exact-main Preview attempt is documented in [the URL identity correction Evidence Bundle](CB-M00-WO-001-P1-URL-IDENTITY-CORRECTION.md). Run [38045607351](https://github.com/KayzenRoot/coinblink/actions/runs/38045607351) used canonical main SHA `9c900fda5044c1cfa42934f20dcd3621a48cd613`; preflight, Owner-gated authorization/build, and independent verification of both real Preview origins succeeded, but the official run failed while validating Wrangler's eight-character immutable hostname identity against its UUID deployment ID. Cloudflare shows the isolated Preview as Ready and reports the exact build SHA on both routes. This updates the earlier historical “no Preview deployed” evidence; the official workflow remains failed, P1 is not yet complete, and the canonical checkpoint was not changed.

Stable/immutable origins, endpoint/security checks, remote responsive screenshots, invocation/binding observations, code correction, and the proposed no-promotion Checkpoint Delta are in the addendum. The immutable Context Locks and checkpoint remain untouched. A successful corrected exact-main workflow run and its audit are required before checkpoint promotion or M00 completion.
