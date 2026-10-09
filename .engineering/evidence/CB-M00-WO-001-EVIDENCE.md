# Evidence Bundle · CB-M00-WO-001

**Verdict:** `P0_LOCAL_CANDIDATE_VALIDATED / EXACT_HEAD_CI_AND_AUDIT_PENDING / M00_NOT_DONE`.
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001`; change: local M00 P0 foundation.
**Execution branch:** `codex/cb-m00-wo-001-p0`.
**Authorized base:** `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d` (CB-GOV-005 / PR #32 merge SHA).
**Execution Context Lock SHA-256:** `a209324291429ce22495abc0b3c7029e84686f621cadff80b1b6ff1f97eaee1e`.
**Candidate fingerprints:** `.engineering/evidence/CB-M00-WO-001-FINGERPRINTS.json` records Git blob SHA-1 and raw-blob SHA-256 for 45 changed paths at immutable implementation snapshot `6a33bf25b3bf31c65f2dd47f490b84e74a9a4cfe`; the manifest and this Evidence Bundle are excluded to avoid self-reference. All 45 blob pairs were revalidated against that snapshot; subsequent commits contain evidence-only changes.
**Implementation HEAD:** reported as the exact PR head in the PR description and required GitHub checks; this file avoids self-referencing its containing commit.
**Checkpoint:** `.engineering/CHECKPOINT.json` is unchanged; its admitted-base values remain `M00_ADMITTED`, `IMPLEMENTATION_NOT_STARTED`, 0%, preview `NOT_DEPLOYED`, with no `stopState`. Proposed candidate promotion is in `CB-M00-WO-001-CHECKPOINT-DELTA.md` only.

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

## Remote gates and outstanding audit

- [Initial GitHub workflow run 37868417930](https://github.com/KayzenRoot/coinblink/actions/runs/37868417930) on `1449d9b62b2b2df1e2dab47b1316c64407fdcd6c` exposed two candidate issues. Ubuntu/Windows failed because the shallow checkout omitted locked base `bf3a5f800ddb3ebf9a0a6b338268f59500b6547d`; Docker passed. [SonarCloud reported](https://sonarcloud.io/dashboard?id=KayzenRoot_coinblink&pullRequest=33) five MAJOR vulnerabilities tied to ad-hoc `npx`/install lifecycle scripts, plus a demo-label contrast issue and a redundant-branch complexity issue. Commits `1bbf835` and `6a33bf2` fetch required Git history, use the pinned local Playwright binary, disable dependency lifecycle scripts, add guard tests, simplify recursive binding detection, and set an explicit high-contrast demo-label surface. Local checks and exact-SHA Docker/E2E smoke pass after these corrections; fresh exact-head GitHub and SonarCloud checks are pending after publication.
- CodeRabbit posted `Review skipped: draft pull request`; this is not an independent review. Independent review and Owner audit remain pending. Keep this PR draft and unmerged.
- Cloudflare account, plan, cost ceiling, scoped credentials, and non-production isolation have not been verified or authorized. P1 is `PROVIDER_SETUP_REQUIRED`; no preview URL is claimed and no deployment was attempted.
- Exact-head workflow run URLs, checks, and the CI screenshot artifact must be linked from the PR after the new HEAD run completes. The initial run and local results are not represented as new-head CI.
- Known residuals: local port 3000 conflict above; GEF local drift baseline is absent; GEF doctor reports dependency provenance `unverified` and mutable-ref GitHub policy `REVIEW`; `npm audit signatures` returns E404 for unpublished transitive `@gef-bootstrap/config@0.0.0`. `npm audit --audit-level=high` reports no vulnerabilities; the pinned GEF tarball/SLSA test passes.

## Stop condition

Stop with the implementation PR ready for audit. Do not merge, promote `.engineering/CHECKPOINT.json`, mark M00 `DONE`, start another module, or run the Cloudflare preview lane. Only a later authorized audit/merge may promote the proposed delta.
