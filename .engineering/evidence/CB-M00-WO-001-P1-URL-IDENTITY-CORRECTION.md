# CB-M00-WO-001 · P1 Preview URL identity correction evidence

**Change:** `CB-M00-WO-001-P1-URL-IDENTITY-CORRECTION`
**Repository:** `KayzenRoot/coinblink`
**Frozen base / deployed build SHA:** `9c900fda5044c1cfa42934f20dcd3621a48cd613`
**Branch:** `codex/cb-m00-wo-001-p1-url-identity`
**Scope:** correct the URL identity comparison for Wrangler 4.149.0 UUID deployment IDs and preserve test/evidence provenance.
**Checkpoint:** not edited or promoted. M00 remains admitted/in progress, P1 validation remains pending, total progress 0%, and no other module is admitted.

## Actual protected workflow run

- Run [38045607351](https://github.com/KayzenRoot/coinblink/actions/runs/38045607351) was manually dispatched on canonical `main` at the exact SHA above, with the `action=deploy` and `authorize-preview` inputs.
- The exact-main preflight succeeded, including the pinned runtime, dependency audit, lint, typecheck, local unit/build/Playwright/accessibility checks, and clean-checkout GEF steps.
- The protected `cloudflare-preview` Environment approval was recorded for this run. The Owner/account/plan/cost/IAM/isolation/secrets gate and exact-SHA Worker build succeeded.
- Wrangler created a real isolated Preview for dedicated Worker `coinblink-m00-preview`, selected Preview name `coinblink-m00-run-38045607351-1`, and Cloudflare's UI shows the Preview `Ready`, created by Wrangler, with zero reported errors.
- **Workflow result: FAILURE.** Step `Create isolated Worker Preview` returned structured Wrangler output, then the recorder failed with `immutable Deployment URL hostname does not match the returned Preview or deployment identity`. The official URL verification step was skipped. No security gate was bypassed and no production deploy ran.

## Actual URLs and independent remote verification

Cloudflare's authenticated Preview detail page identifies these two different HTTPS origins for that same managed Preview:

- Stable Preview: [https://coinblink-m00-run-38045607351-1-coinblink-m00-preview.kayzendev.workers.dev/](https://coinblink-m00-run-38045607351-1-coinblink-m00-preview.kayzendev.workers.dev/)
- Immutable deployment: [https://14557496-coinblink-m00-preview.kayzendev.workers.dev/](https://14557496-coinblink-m00-preview.kayzendev.workers.dev/)

The Cloudflare UI showed the immutable URL under the dedicated Worker Preview's deployment activity, its status `Ready`, source `Wrangler`, and the commit message of the deployed exact main SHA. The dashboard's Preview details showed one `Assets` binding containing three built assets; the dedicated Worker's production overview showed zero product resource bindings, no routes/custom domain, and no Workers or Queues bound. This is the expected static-assets bundle, not an R2/KV/D1, production service, or market-data connection.

The pinned project checker was then run against both actual origins:

```text
node scripts/verify-worker-preview.mjs <stable-url> <immutable-url> 9c900fda5044c1cfa42934f20dcd3621a48cd613
PASS: Verified both Worker Preview URLs at exact SHA 9c900fda5044c1cfa42934f20dcd3621a48cd613.
```

Both origins returned HTTPS responses with the expected exact build SHA, preview environment, `X-Robots-Tag: noindex`, and configured security headers. On both origins the verifier passed `/health` (200 with the SHA), `/preview-status` (200; demonstration-only and preview environment), `/en` (200), and an unknown path (404).

Remote Playwright using pinned Node.js `22.19.0`, Chromium and axe-core exercised `/en` on the stable URL at all required dimensions. Each reported status 200, `noindex, nofollow, noarchive`, no horizontal overflow, zero axe violations, and zero page errors. These screenshots were captured and visually inspected:

| Screenshot | SHA-256 |
|---|---|
| `CB-M00-WO-001-P1-preview-run-38045607351/stable-desktop-1536x864.png` | `62b11fa6fcdfe40161a0eb76e45663c55b27210573ad32adf5cb9c30506bd145` |
| `CB-M00-WO-001-P1-preview-run-38045607351/stable-tablet-768x1024.png` | `bd54a64ee87eaf3e5a27e3baf6e804712c8cbbdb8c1068203cdd0b765fe44f4e` |
| `CB-M00-WO-001-P1-preview-run-38045607351/stable-mobile-390x844.png` | `72fafb5e008ff4c76ce48d6d11d6e6c29de259a43427b43c41290fea0c0e68db` |

The screenshots and responsive/browser assertions cover the current deployed app build at SHA `9c900f…`, not the not-yet-merged recorder correction. This independent remote verification does not change the failed status of workflow `38045607351`.

## Confirmed defect and bounded correction

Wrangler's immutable hostname uses the first eight hexadecimal characters of its UUID deployment ID, followed by `-coinblink-m00-preview`. The recorder compared the full UUID string with that hostname label and rejected this valid result. `scripts/record-preview-output.mjs` now normalizes canonical UUID deployment IDs to the eight-character hostname prefix for both nested CLI JSON and structured output-file events. It still requires exact dedicated Worker identity, exact run Preview name, matching deployment-to-Preview identity, HTTPS `workers.dev`, the exact hostname labels, and distinct stable and immutable origins.

`test/cloudflare-preview-output.test.mjs` adds mocked UUID/prefix acceptance tests for both real Wrangler response shapes and rejects a mismatched eight-character prefix. The fixture is a format regression test; it is not claimed to be a copy of the uncaptured runner event. The full CI runner's temporary event file was not uploaded because the official step stopped at the recorder.

## Account, isolation, and cost evidence

- Account and dedicated Worker were previously confirmed in the authenticated Cloudflare account; the Preview detail page identifies the same `coinblink-m00-preview` service.
- The Workers Free plan and its request/CPU quotas were confirmed in the Cloudflare dashboard before dispatch; current Free limits and pricing are documented by [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/). The billing dashboard last observed before this run showed `$0.00`; it was not refreshed after this run. No paid plan, R2, Billing change, production route, or other Worker was used or changed. The existing `$10` alert is only a notification, not a hard spending cap.
- The failed-run Preview reports 13 invocations, 4 ms CPU, and zero errors in the dashboard. These are the read-only follow-up checks against the same deployed Preview.
- The job's approval and scoped credentials remain inside the existing protected GitHub Environment. Credential values were not read or logged.

## Validation state

| Gate | Result |
|---|---|
| Main at base `9c900f…` | Five post-merge checks passed before the Preview dispatch. |
| Exact-main preflight in run `38045607351` | PASS. |
| Protected Environment approval and authorization gate | PASS for run `38045607351`. |
| Exact-SHA build before Wrangler | PASS. |
| Official create/record/verify workflow | **FAIL** at URL identity recorder; final official verify step skipped. |
| Both actual Preview URLs, route and security verifier | PASS independently at exact deployed SHA `9c900f…`. |
| Remote desktop/tablet/mobile Playwright and accessibility | PASS on stable URL; three screenshots above. |
| `npm ci --ignore-scripts` | PASS with Node.js `22.19.0` and npm `10.9.3`; 437 packages installed, 0 vulnerabilities. |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities. |
| `npm run lint` | PASS; ESLint `--max-warnings=0`. |
| `npm run typecheck` | PASS; 38 files, 0 errors, warnings, or hints. |
| `npm test` | PASS with Node.js `22.19.0` on `PATH`; 81/81 unit tests, Astro build and no-SESSION/data/service/production-binding guard, 7/7 Playwright tests. The first attempt without the pinned runtime directory on `PATH` failed because subprocess tests found system Node 24; it was rerun with the required pinned `PATH` and passed. |
| `gef doctor --target . --json` | Exit 0; checkpoint/toolchain valid, but linked-worktree repository observation is `FINDING` with `GIT_DIRECTORY_NOT_A_DIRECTORY` / `WORKING_TREE_NOT_OBSERVED`; dependency provenance is `unverified` and GitHub policy is `REVIEW`. Not reported as a clean GEF pass. |
| `gef status --target . --json` | Exit 0; checkpoint is readable and valid. Dirtiness is `UNKNOWN`, drift baseline absent, and stale operator projection is conservatively unknown because this is a linked worktree. |
| Local Docker Compose smoke | PASS on final candidate SHA `f358f7a4fa499594eed0d106be29c78e9a65a7d4`, isolated project `coinblink-m00-p1-urlid-f358f7a`, alternate port `3187`; `/health` and `/preview-status` returned the exact SHA and the missing route returned 404. Only this temporary project was removed; existing containers were preserved. |
| Exact-head correction PR checks | PASS on PR #47 SHA `f358f7a4fa499594eed0d106be29c78e9a65a7d4`, run `38047645192`: Ubuntu, Windows, Docker Compose smoke, SonarCloud, and both Socket checks. |
| CodeRabbit final-head review | PASS; review completed for base `9c900fda5044c1cfa42934f20dcd3621a48cd613` to head `f358f7a4fa499594eed0d106be29c78e9a65a7d4`, run `76021d75-d475-4f35-9e2b-ffa8d8a9e7e7`, with no actionable comments. Its separate docstring-coverage advisory is informational and is not an admitted project gate. |
| PR #47 state | OPEN and ready for Owner audit/merge; no merge or checkpoint promotion is claimed. The current five post-merge checks on canonical `main` remain successful at `9c900fda5044c1cfa42934f20dcd3621a48cd613`. |

## Required next gates

1. Complete Owner audit and merge PR #47 through the normal PR process; no merge or checkpoint promotion is claimed here.
2. Re-read current `main`, dispatch the existing protected Preview workflow on that exact SHA, and obtain the required per-run `cloudflare-preview` Environment approval.
3. Require the official workflow to succeed end-to-end, including URL recording and both-origin checks. Revalidate the new run's actual stable/immutable origins, bindings, endpoints, headers, noindex, and screenshots before any P1 checkpoint promotion.
4. Keep M00 `IMPLEMENTATION_IN_PROGRESS`, P1 pending, overall completion `0%`, and M01+ not admitted until all remaining DoD gates and the separately audited checkpoint process pass.

The related proposal is `.engineering/evidence/CB-M00-WO-001-P1-URL-IDENTITY-CORRECTION-CHECKPOINT-DELTA.md`; it records no promotion in this correction.

## 2026-10-10 follow-up superseding the next-gate section above

The previously planned corrected exact-main dispatch occurred as protected run [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) on `e8886e21c6f152ca374b1e42852c6b6638543f40` and completed SUCCESS with the official stable/immutable verifier. The real URLs, route/security results, fresh Playwright/axe screenshots, read-only plan/billing observation, and remaining live-binding limitation are recorded in [the P1 closeout Evidence Bundle](CB-M00-WO-001-P1-CLOSEOUT.md). The earlier workflow/PR #47 instructions above remain historical. Do not repeat deployment, alter the checkpoint, or mark M00 complete from this evidence correction.

## 2026-10-10 follow-up superseding the next-gate section above

The previously planned corrected exact-main dispatch occurred as protected run [#38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879) on `e8886e21c6f152ca374b1e42852c6b6638543f40` and completed SUCCESS with the official stable/immutable verifier. The real URLs, route/security results, fresh Playwright/axe screenshots, read-only plan/billing observation, and remaining live-binding limitation are recorded in [the P1 closeout Evidence Bundle](CB-M00-WO-001-P1-CLOSEOUT.md). The earlier workflow/PR #47 instructions above remain historical. Do not repeat deployment, alter the checkpoint, or mark M00 complete from this evidence correction.
