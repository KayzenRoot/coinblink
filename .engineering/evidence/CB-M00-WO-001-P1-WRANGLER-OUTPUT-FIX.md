# CB-M00-WO-001 · P1 Wrangler output correction evidence

- **Change:** `CB-M00-P1-WRANGLER-OUTPUT-FIX`
- **Base:** canonical `main` SHA `27015adc87caacabbed0e318f892644ce0473f10` (PR #40 merge).
- **Branch:** `codex/cb-m00-wrangler-structured-output`.
- **Scope:** correct the pinned Wrangler 4.149.0 Preview output capture and make the M00 shell report its build environment accurately.
- **Checkpoint:** unchanged. M00 remains admitted and in progress; P1 has not passed its official workflow, overall completion remains 0%, and no other module is admitted.

## Finding and correction

The Owner-approved protected run [37968696916](https://github.com/KayzenRoot/coinblink/actions/runs/37968696916) dispatched against the exact merged `main` SHA above. Its exact-main preflight and authorization/build steps passed. The create step called the pinned Wrangler Preview CLI and created a real Preview, but the combined step failed when the recorder rejected stdout containing a progress preamble before the JSON. The GitHub log does not expose that preamble. The Cloudflare dashboard showed the resulting Preview as **Ready**; the run is still recorded as failed, not successful.

Inspection of the locked Wrangler `4.149.0` package confirms two distinct machine-readable channels: `wrangler preview --json` writes the nested `{ preview, deployment }` response to stdout, while Wrangler's structured output-file channel (`WRANGLER_OUTPUT_FILE_PATH`) appends versioned `wrangler-session` and `preview` event records. The workflow now validates the structured event record instead of parsing incidental progress output. Unit regressions retain coverage for the nested `--json` response and cover the pinned output-file event stream, exact Worker and Preview identities, URL identities, malformed/trailing data, duplicate records, and unsupported events. The workflow test verifies the pinned CLI source contract and output-file wiring. No output preamble is relaxed or logged.

The real base-Preview screenshot exposed stale M00 copy that claimed the provider deployment was still a separate gate and the environment was local. The shell now derives those labels and descriptions from the existing exact build environment (`local`, `ci`, or `preview`); tests cover each presentation. Demo-only and disconnected-data messaging remains intact.

The first PR analysis reported SonarCloud `javascript:S3776` as CRITICAL because the JSON event-stream scanner exceeded the cognitive-complexity limit (35 versus 15). After extracting `scanJsonObjectEnd`, Sonar's next candidate analysis still measured 17. A further refactor extracted string/brace transitions into `advanceJsonScanState`; this keeps the scanner behavior explicit and the regression suite passes without relaxing accepted JSON, event, Worker, Preview-name, or URL validation. SonarCloud must re-analyze the new exact PR HEAD before review is complete.

CodeRabbit's review of the first PR candidate reported one MAJOR issue: this correction's fixed-snapshot fingerprint assertion must not remain in the permanent `npm test` suite, where future changes to these files would fail against this historical manifest. The test is now a candidate-only validator under `scripts/`, with a dedicated CI step gated to this exact PR branch; the normal `npm test` suite no longer discovers it. The candidate validator still checks exact changed-path coverage, Git-index SHA-1/SHA-256, working-tree consistency, and deleted paths. The review did not cover this latest refactor, so a new final-HEAD review is required.

The CodeRabbit CLI review of candidate `a967115e9efd7dec0a91d019aacfdde74f808e54` returned 0 issues. SonarCloud then failed that candidate with critical deterministic-sort warnings and minor PATH-resolution security warnings in the dedicated validator. The candidate validator now uses an explicit code-point comparator and fixed absolute Git executable paths for the supported Ubuntu and Windows runners. Fresh SonarCloud and CodeRabbit results for this final adjustment remain required.

Candidate `55dfe9a910db99e5804a0ce26d528398393fd44d` passed all six required exact-head checks and the CodeRabbit CLI review returned 0 issues. SonarCloud's Quality Gate passed but its detailed API still reported one MINOR `javascript:S7780` code smell on the escaped Windows path literal. Candidate `cd24e27060a7fe05de7bf41cf1954faee462e7d6` uses `String.raw` for that fixed path and passed fresh exact-head CI, SonarCloud with no open issues, and a CodeRabbit review with 0 issues.

The GitHub CodeRabbit review [#5473986285](https://github.com/KayzenRoot/coinblink/pull/41#pullrequestreview-5473986285) was based on the older candidate `295846a6c42edc5bea177cdac004acfc62e5debd`. Its two comments were verified against the current branch: the E2E environment parser now trims whitespace and falls back to `local` for an empty value; the former fingerprint test was moved out of permanent test discovery into a candidate-only CI validator that skips when the checked-out branch does not match the manifest. That review is historical; each later PR HEAD is audited separately through PR #41.

The full CodeRabbit CLI review of candidate `703f0e3211684e93603bf75dc644bf22a87bc587` found one MINOR issue: when neither `GITHUB_HEAD_REF` nor `git branch --show-current` identifies a branch outside GitHub Actions, the candidate-only validator could silently skip. The validator now fails closed in that local state and has regression coverage for empty local branch, named branch mismatch, and the existing detached GitHub Actions behavior. This finding applies to the preceding candidate; exact-head validation and a fresh review are required for the corrected candidate.

## Existing Preview evidence (base SHA only)

- Stable Preview: [https://coinblink-m00-run-37968696916-1-coinblink-m00-preview.kayzendev.workers.dev/](https://coinblink-m00-run-37968696916-1-coinblink-m00-preview.kayzendev.workers.dev/)
- Immutable deployment: [https://927fe72a-coinblink-m00-preview.kayzendev.workers.dev/](https://927fe72a-coinblink-m00-preview.kayzendev.workers.dev/)
- Both endpoints served the exact build SHA `27015adc87caacabbed0e318f892644ce0473f10`. `/health` returned 200 and `environment: preview`; `/preview-status` returned 200 with `demonstration-only`, disconnected editorial/market feeds, and `cloudflarePreview: preview`; an unknown route returned 404. HTTPS, `X-Robots-Tag: noindex`, and the configured security headers passed `scripts/verify-worker-preview.mjs`.
- Headless Chromium checked `/en` on both origins at desktop 1536×864, tablet 768×1024, and mobile 390×844. All six loads returned 200 with the noindex meta tag, no horizontal overflow, zero axe violations, and no page errors. The screenshots below intentionally capture the **pre-correction base**; they document the inaccurate local-only copy found during the real Preview audit and are not evidence of the corrected UI.

| Preview base screenshot | SHA-256 |
|---|---|
| `.engineering/evidence/CB-M00-WO-001-P1-preview-base-27015adc/stable-desktop-1536x864.png` | `31d2429e642ef59a8adb07f408361400e0a019e7ae5ade39794274e8b89d5a5c` |
| `.engineering/evidence/CB-M00-WO-001-P1-preview-base-27015adc/stable-tablet-768x1024.png` | `ad40e3c899c8bf52bc843e308fca86c93b8f2a9994d7566fbd091995f8e424f8` |
| `.engineering/evidence/CB-M00-WO-001-P1-preview-base-27015adc/stable-mobile-390x844.png` | `7a008f713a5612fcb5c28508b83ae39d74c3bb002cd022f3e67da6fa5f992549` |

This Preview belongs to the base main SHA, not this correction candidate. It is not evidence that the workflow completed successfully or that P1 is admitted as complete.

## Validation and review boundary

| Check | Result |
|---|---|
| Toolchain | PASS: Node.js `22.19.0`, npm `10.9.3`. |
| `npm ci --ignore-scripts` | PASS: 437 packages installed; 0 vulnerabilities reported by the install audit. |
| `npm audit --audit-level=high` | PASS after the scanner correction: 0 vulnerabilities. |
| `npm run lint` | PASS after the scanner correction: ESLint with zero warnings allowed. |
| `npm run typecheck` | PASS after the scanner correction: 35 Astro/TypeScript files, 0 errors, warnings, or hints. |
| `npm test` | PASS after the scanner correction under the pinned Node 22.19.0/npm 10.9.3 runtime: 61/61 default unit tests; Astro Cloudflare build and generated Worker binding guard passed; 7/7 Playwright tests passed for local presentation. |
| `npm test` with whitespace-only `PUBLIC_BUILD_ENV` | PASS after normalizing both presentation and health/status expectations: 61/61 default unit tests, build and Worker binding guard passed, 7/7 Playwright tests passed. |
| Candidate fingerprint validator | PASS locally (1/1) via `node --test scripts/verify-p1-wrangler-output-fingerprints.mjs`; simulated `GITHUB_HEAD_REF=main` skips (1 skipped, exit 0). It remains a dedicated branch-gated CI step outside permanent mainline `npm test`; both OS jobs passed this step on candidate `ba22e3d7413595c39770156b9b75e713c4a042be`. |
| CodeRabbit follow-up worktree validation | PASS under Node.js `22.19.0` / npm `10.9.3`: `npm test` (61/61 unit tests, Astro Cloudflare build and binding guard, 7/7 Playwright), candidate validator (2/2), named-mismatch behavior (`GITHUB_HEAD_REF=main`: one expected skip), lint, typecheck (35 files), audit (0 vulnerabilities), and GEF doctor/status (exit 0). The default workstation Node 24 run failed only the GEF runtime-major assertion; rerunning on the pinned runtime passed. Exact-head GitHub CI and fresh review for the corrected commit remain pending. |
| Local preview-mode check | PASS on the first candidate: Astro build with `PUBLIC_BUILD_ENV=preview` and Playwright 7/7, including the correct non-production Worker Preview labels. This is local-only evidence, not a Cloudflare deployment. |
| Wrangler source/version inspection | PASS: local package reports `4.149.0`; Preview and delete help inspected without Cloudflare credentials or API calls. |
| GEF `doctor --target . --json` | Exit 0 after the scanner correction; checkpoint present/valid and toolchain healthy. Repository observation remains `FINDING` (`GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`), dependency provenance remains `unverified` / `REVIEW`; these findings are not suppressed. |
| GEF `status --target . --json` | Exit 0 after the scanner correction; canonical checkpoint reports M00 admitted/in progress, 0%, P1 authorization/evidence as next stage. Worktree dirtiness is `UNKNOWN` and absent drift baseline yields conservative stale status; no baseline was fabricated. |
| Local Docker Compose smoke | BLOCKED: Docker Desktop Linux engine is unavailable (`dockerDesktopLinuxEngine` named pipe not found). Read-only port check found no listener on 3000, 3010, or 3011. No container was stopped or altered. The exact-head GitHub Docker smoke passed in run `37976801288`. |
| Earlier PR candidate `789b57760cf97e2d9e748a95247086b6c93ba6cd` exact-head CI | PASS: Ubuntu, Windows, Docker Compose, SonarCloud Quality Gate, Socket Alerts, and Socket Project Report. SonarCloud reported the CRITICAL code smell described above. |
| Parser-refactored PR candidate `295846a6c42edc5bea177cdac004acfc62e5debd` exact-head CI | PASS: Ubuntu, Windows, Docker Compose, SonarCloud Quality Gate (0 new issues), Socket Alerts, and Socket Project Report. These checks predate the candidate-only fingerprint-validator adjustment. |
| Candidate `a967115e9efd7dec0a91d019aacfdde74f808e54` exact-head CI and review | Ubuntu, Windows, Docker Compose, and both Socket checks passed; SonarCloud failed on the dedicated validator issues described above. CodeRabbit CLI reviewed this SHA and returned 0 issues. These results predate the latest validator hardening. |
| Candidate `55dfe9a910db99e5804a0ce26d528398393fd44d` exact-head CI and review | PASS: Ubuntu, Windows, Docker Compose, SonarCloud Quality Gate, Socket Alerts, and Socket Project Report. CodeRabbit CLI returned 0 issues. SonarCloud's detailed issue query still showed one MINOR `javascript:S7780`, fixed in the next candidate. |
| Code candidate `cd24e27060a7fe05de7bf41cf1954faee462e7d6` exact-head CI | PASS: [run 37975979787](https://github.com/KayzenRoot/coinblink/actions/runs/37975979787) passed Ubuntu, Windows, Docker Compose, SonarCloud, Socket Alerts, and Socket Project Report. SonarCloud's open-issue API returned none. |
| Code candidate `cd24e27060a7fe05de7bf41cf1954faee462e7d6` CodeRabbit review | PASS: full CodeRabbit CLI review returned 0 issues. |
| Evidence candidate `ba22e3d7413595c39770156b9b75e713c4a042be` exact-head CI and review | PASS: [run 37976801288](https://github.com/KayzenRoot/coinblink/actions/runs/37976801288) passed Ubuntu, Windows, Docker Compose, SonarCloud, Socket Alerts, and Socket Project Report; SonarCloud has no open issues. CodeRabbit CLI returned 0 issues. |
| Cloudflare action for corrected HEAD | Not run. Requires correction PR review/merge and the existing protected Environment approval; no Cloudflare API, resource, billing, secret, production, or R2 operation was performed for this correction. |

Every remote result above names the SHA it validates. The live PR #41 shows the latest exact-head checks and review state after subsequent amendments. No checkpoint or Context Lock change is part of this correction.

The existing Context Locks and canonical `.engineering/CHECKPOINT.json` are preserved byte-for-byte. No checkpoint promotion is proposed in this correction. The next legal action is independent review of the correction PR; only after its normal merge can the protected workflow be run again against the corrected exact `main` SHA.
