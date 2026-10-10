# Evidence Bundle · CB-M00-WO-001 P1 closeout readiness

**Verdict:** `PREVIEW_AND_PUBLIC_BROWSER_EVIDENCE_VERIFIED / EFFECTIVE_ZERO_COST_CEILING_UNMET / LIVE_BINDINGS_AND_FINAL_AUDIT_PENDING / M00_NOT_DONE`.
**Repository:** `KayzenRoot/coinblink`.
**Work Order:** `CB-M00-WO-001` (existing; no new Work Order).
**Base:** canonical `main` SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`.
**Preview workflow:** [run 38049696879](https://github.com/KayzenRoot/coinblink/actions/runs/38049696879), `workflow_dispatch`, completed `success`; exact SHA matched base, both jobs succeeded.
**Recovery procedure:** [Issue #36 comment 6097266338](https://github.com/KayzenRoot/coinblink/issues/36#issuecomment-6097266338).
**Canonical checkpoint:** unchanged in this PR; M00 admitted/in progress, P1 pending in machine state, 0% overall, no `stopState`.

## Actual remote URLs and exact build identity

| Resource | Verified URL | Result |
|---|---|---|
| Stable Preview | [https://coinblink-m00-run-38049696879-1-coinblink-m00-preview.kayzendev.workers.dev/](https://coinblink-m00-run-38049696879-1-coinblink-m00-preview.kayzendev.workers.dev/) | HTTPS valid; exact `/health` build SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`. |
| Immutable deployment | [https://5ca9306c-coinblink-m00-preview.kayzendev.workers.dev/](https://5ca9306c-coinblink-m00-preview.kayzendev.workers.dev/) | HTTPS valid; exact `/health` build SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`; same preview build metadata as stable origin. |

The workflow's official remote verifier passed both URLs at the exact `main` SHA. The capture harness independently rechecked stable and immutable `/health` before saving accepted screenshots. Both returned HTTP 200, JSON `{status:"ok", service:"coinblink", environment:"preview", buildSha:"e8886e21c6f152ca374b1e42852c6b6638543f40"}` and `cache-control: no-store`.

## Route, security, and responsive browser results

`/preview-status` returned HTTP 200 and the expected demonstration-only contract (`editorialFeed=not-connected`, `marketData=not-connected`, `cloudflarePreview=preview`, exact `buildSha`). `/robots.txt` returned HTTP 200 with `User-agent: *` and `Allow: /`. `/m00-closeout-intentional-404` returned a genuine HTTP 404 and visible “Page not found” heading.

All inspected application routes returned CSP (`default-src 'self'` plus restrictive directives), `Permissions-Policy: camera=(), geolocation=(), microphone=()`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `X-Robots-Tag: noindex`. `/en` also includes `<meta name="robots" content="noindex, nofollow, noarchive">`. `/robots.txt` allows crawlers to fetch the demo so the noindex directives remain visible; noindex is not access control.

The evidence collector uses pinned Playwright `1.64.0`, axe-playwright `4.13.0`, Chromium `156.0.8078.4`, fresh isolated contexts, normal TLS certificate validation, and no Chrome profile, cookies, extensions, or CDP attach. It allowlists only the two exact HTTPS Preview origins, blocks any other origin, blocks every 3xx response before it can be followed, and requires matching exact-SHA `/health` on both origins before clearing prior outputs or writing screenshots. Each capture is a real 8-bit PNG and its IHDR pixel dimensions are checked. The guard covers document navigations and all page resources.

The final review identified a redirect-routing gap in the initial collector. A local regression probe against the pinned Playwright version confirmed that a request redirected by `route.continue()` could reach its cross-origin destination without a second route callback. The collector now uses `route.fetch({ maxRedirects: 0 })` and aborts every 3xx response before fulfilling it. Local Chromium regression tests prove that neither a redirected document subresource nor a redirected navigation reaches the destination server. A further regression test proves that a fresh capture clears only its known prior success/failure artifacts and preserves unrelated files. Cleanup starts only after the stable exact-SHA `/health` gate passes. The final live Preview run recorded zero blocked origins, zero blocked redirects, and zero route-fetch errors.

| Viewport | Result | axe WCAG 2.1 A/AA | Overflow | Keyboard skip link | PNG SHA-256 |
|---|---|---:|---|---|---|
| Desktop 1536×864 | `/en` 200; visually inspected | 0 violations | none | visible focus verified | `81d8119e39133406486e686c25af86160c52a30c0861baaefb78dcbf1e363772` |
| Tablet 768×1024 | `/en` 200; visually inspected | 0 violations | none | visible focus verified | `bd54a64ee87eaf3e5a27e3baf6e804712c8cbbdb8c1068203cdd0b765fe44f4e` |
| Mobile 390×844 | `/en` 200; visually inspected | 0 violations | none | visible focus verified | `a0a54e76a826a927787172779f5d232b55c14363d7089ed2b3b3817285840f24` |

Browser console/page/network results: 0 ordinary console errors; 0 uncaught page errors; 0 failed requests; 0 failed subresources; 0 out-of-allowlist requests. One recorded browser console 404 corresponds only to the intentional unknown document route above and its HTTP 404 response. It is not a missing asset or failed subresource.

Raw artifacts: [desktop PNG](CB-M00-WO-001-P1-preview-run-38049696879/desktop-1536x864.png), [tablet PNG](CB-M00-WO-001-P1-preview-run-38049696879/tablet-768x1024.png), [mobile PNG](CB-M00-WO-001-P1-preview-run-38049696879/mobile-390x844.png), [machine-readable RESULTS.json](CB-M00-WO-001-P1-preview-run-38049696879/RESULTS.json) (SHA-256 `b1e7254654ee1ac5c9158a9527b1559eae428de71eac05a4e9ee87c9945065b5`), [Playwright log](CB-M00-WO-001-P1-preview-run-38049696879/PLAYWRIGHT-LOG.md) (SHA-256 `5981fc11d4b57b90df53b15d19f9fc0b276ddaf5f0017b208f8494e0578a235f`), and [SHA256SUMS](CB-M00-WO-001-P1-preview-run-38049696879/SHA256SUMS.txt). The collector, redirect guard, and focused output-cleanup helper are [`scripts/collect-m00-preview-evidence.mjs`](../../scripts/collect-m00-preview-evidence.mjs), [`scripts/preview-evidence-origin-guard.mjs`](../../scripts/preview-evidence-origin-guard.mjs), and `scripts/preview-evidence-output-cleanup.mjs`. Both stable and immutable health responses now pass before any prior capture artifact is cleared. The first collector rerun exposed a stylesheet-readiness race when reusing a page; a fresh-page diagnostic and hardened fresh-context/network-idle rerun gave the three zero-violation final results recorded above. No application source or dependency was changed.

## Provider plan, billing observation, and isolation boundary

On 2026-10-10, the authenticated Cloudflare dashboard was used only for read-only account/plan/billing inspection. It displayed Workers Free at `$0`; October cycle actual cost `$0.00`, projected `$0.00`, average daily cost `$0.00`, and 27 of 30 days elapsed, with usage within included tier limits. Displayed Free limits: 100,000 requests/day, 10 ms CPU per invocation, 50 subrequests/request, 100 Workers and 5 Cron triggers, consistent with Cloudflare's current [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/) documentation, checked 2026-10-10. The account already has a `$10` budget alert; it is informational and not a hard cap. These current observations do not guarantee future cost. Owner authorization and protected GitHub Environment checks passed for the recorded run, but they establish only per-run authorization; an effective monthly `$0` account-level cost ceiling was not verified and remains unmet. The successful run and its cost attestation are not evidence that the financial cap is enforced. No billing plan, alert, DNS, production resource, R2 resource, or other Worker was changed or used by this task. Credential values were masked; no secret value or deploy token was read or reused in the dashboard.

The account dashboard lists `coinblink-m00-preview`. The detailed Worker view did not expose the current deployed binding inventory in the authenticated session despite read-only inspection. Thus:

- **Verified from source/workflow:** `wrangler preview --ignore-base-config`, empty Preview bindings in configuration, `session: false`, and tests rejecting D1/KV/R2/Queue/Service/SESSION bindings; the generated build permits only static `ASSETS`.
- **Pending:** live provider-side inventory of bindings for the deployed Worker. Do not describe this as independently verified until the Owner provides authorized read-only dashboard/API evidence. The deploy token was not reused for that purpose.
- **Scope:** no production deployment, no R2 access, and no change to another Cloudflare project is claimed.

## DoD disposition and Checkpoint Delta

The real Preview run, exact-SHA route responses, security headers, noindex, responsive captures, accessibility, and per-run protected authorization are evidenced. M00 closeout remains open for (1) effective monthly USD 0 cost ceiling; (2) live Worker binding inventory; (3) Owner visual acceptance/DoD audit (the original Golden JPG bytes remain absent from Git, and these screenshots are not a Golden parity claim); (4) independent final audit; and (5) the separately governed checkpoint decision. The project stays at `M00_ADMITTED`, `IMPLEMENTATION_IN_PROGRESS`, `M00_P0_LOCAL_IMPLEMENTED_P1_PENDING`, 0%, and no `stopState`; M01–M17 are not admitted and M18 remains future/not admitted. **M00 is not DONE.**

See [proposed Checkpoint Delta](CB-M00-WO-001-P1-CLOSEOUT-CHECKPOINT-DELTA.md). This PR must not edit `.engineering/CHECKPOINT.json`, promote a checkpoint, merge, modify Cloudflare resources, or start M01+.

## Local validation record

Validation used Node.js `v22.19.0` and npm `10.9.3` from the already-present official Windows runtime archive. Its SHA-256, `ea3fad0e67a991d8477d8c01344b56e69c676ccb733f065b22436994b1253f86`, matched the official Node `SHASUMS256.txt` entry. No additional browser or test tool was installed.

| Command | Result |
|---|---|
| `npm run lint` | PASS, `eslint . --max-warnings=0`; after the collector's browser-only globals were explicitly declared for ESLint. |
| `npm run typecheck` | PASS, 42 files, 0 errors, 0 warnings, 0 hints. |
| `npm test` | PASS, 85/85 unit tests (including four local evidence-guard/cleanup/order regressions), Astro Worker build plus no-session/data/service/production-binding assertion, and 7/7 Playwright browser tests including desktop/tablet/mobile and axe. |
| `npm audit --audit-level=high` | PASS, 0 vulnerabilities. |
| `npm audit signatures` | REVIEW: npm returned HTTP 404 for unpublished transitive package `@gef-bootstrap/config@0.0.0`; no signature gate was disabled. |
| Docker Compose local smoke | PASS on candidate HEAD `2a2a99e24512a1cccd4d7037ede4566b0f595ac6` (container build marker `2a2a99e`), isolated project `coinblink-m00-closeout-2a2a99e`, bound to verified-free port `3002` while unrelated services held ports 3000/3001. `/health` and `/preview-status` returned the matching build marker and expected contracts; unknown route returned 404. Only this isolated Compose project was removed. |
| `npm run gef -- doctor --target . --json` | Exit 0 / read-only. Checkpoint present/readable/valid; Node/platform/Git healthy. In this linked worktree GEF reports repository observer `FINDING` (`GIT_DIRECTORY_NOT_A_DIRECTORY`, `WORKING_TREE_NOT_OBSERVED`), dependency provenance `unverified`/`REVIEW`, and mutable-ref GitHub policy `REVIEW`. |
| `npm run gef -- status --target . --json` | Exit 0 / read-only. Reads M00 admitted/in progress at 0%; repository dirtiness `UNKNOWN`, no local drift baseline, and operator freshness conservatively stale/unknown due the worktree observation limit. No baseline was fabricated. |

The GEF observer finding describes this linked-worktree filesystem layout, not a checkpoint parse failure or application finding. Exact-head PR CI runs in the repository's normal GitHub checkout and remains a separate required gate. The signature audit's 404 remains an open provenance review item; the ordinary high-severity audit passed.

## PR #48 audit disposition · 2026-10-10

The SonarCloud analysis for the audited pre-correction PR head `e92c559eb0f8fb84520b6a02804af6c971bd886e` passed its Quality Gate and reported zero Security Hotspots. The read-only SonarCloud issues API returned 19 open findings: all are `MINOR` / `CODE_SMELL`, rule `javascript:S9382` (“Unexpected await inside a loop”), in `scripts/collect-m00-preview-evidence.mjs` at lines 203, 207–209, 212–217, 220, 225, 230, 236–237, 239, 241–242 and 264. These are serial browser-context creation, navigation, assertions, capture, hashing and context-close operations in the viewport loop. They intentionally preserve ordered checks, one viewport at a time and deterministic artifact writes; parallelizing them would overlap contexts and undermine the bounded resource and evidence sequence. No correctness, security or reliability defect is demonstrated by these warnings, so no Sonar status was changed.

The API also returned one historical `CRITICAL` / `BUG`, `javascript:S2871`, at the same file with status `CLOSED`; it is not one of the 19 open issues. The comparator already uses `localeCompare`, and the issue is closed. No other open severities, rules or files were present in the 19-issue result.

SonarCloud measured `0.0% Coverage on New Code`. The repository's test script runs `node --test` without coverage instrumentation, and no LCOV report path or other coverage report is configured in the repository. This metric therefore means that SonarCloud received no measured new-code coverage; it does not mean the tests did not run. The M00 DoD and current Quality Gate do not define a numeric coverage threshold, so no coverage gate or instrumentation was invented for this evidence-only Work Order.

The collector used `page.route()` with fresh Chromium contexts that previously left Service Workers at Playwright's default. Playwright documents that requests intercepted by Service Workers can bypass route interception and recommends `serviceWorkers: "block"` when using routing ([BrowserContext routing](https://playwright.dev/docs/api/class-browsercontext#browser-context-route)). The closeout correction now creates all collector contexts through `createPreviewEvidenceBrowserContext`, which forces Service Workers to `"block"` even if an option attempts to allow them. The focused regression serves a valid local Service Worker script, attempts registration while passing an `"allow"` override, and verifies that no registration or running worker exists. No application code, site behavior, dependency, Preview resource, binding, billing setting or checkpoint value changed. The previously captured Preview screenshots remain historical evidence for the exact deployed application SHA; this correction hardens only the local collector.

### Correction validation

Validation used the repository-supported Node.js `v22.19.0` / npm `10.9.3` runtime archive, SHA-256 `ea3fad0e67a991d8477d8c01344b56e69c676ccb733f065b22436994b1253f86`, verified against the official Node.js release `SHASUMS256.txt` ([release archive](https://nodejs.org/en/download/archive/v22.19.0)). A preliminary attempt under the desktop's Node `v24.19.0` correctly failed the GEF major-version assertion; it is not counted as a project validation result.

| Command | Result |
|---|---|
| `node --test test/preview-evidence-origin-guard.test.mjs` | PASS, 6/6 including a valid Service Worker positive control, evidence-context blocking, and cross-origin redirect regressions. |
| `npm test` | PASS, 87/87 unit tests, Astro Worker build/no-binding guard, and 7/7 Playwright browser tests across desktop/tablet/mobile with axe. |
| `npm run lint` | PASS, ESLint with zero warnings. |
| `npm run typecheck` | PASS, 42 files; 0 errors, warnings or hints. |
| `npm audit --audit-level=high` | PASS, 0 vulnerabilities. |
| GEF 1.1.2 `doctor` / `status` | Both read-only commands exited 0 and read a valid checkpoint. The linked worktree observer remains `FINDING` / dirtiness `UNKNOWN` (`GIT_DIRECTORY_NOT_A_DIRECTORY`, `WORKING_TREE_NOT_OBSERVED`); no baseline or state was fabricated. |
| Exact-head GitHub checks | PASS on `faf105c3a2d3d4ea9855be7282b7da419471e8a7`: Ubuntu, Windows, Docker Compose, Socket Project Report, Socket PR Alerts, and SonarCloud all succeeded in [run 38061005514](https://github.com/KayzenRoot/coinblink/actions/runs/38061005514). |
| CodeRabbit review | Completed on `faf105c3a2d3d4ea9855be7282b7da419471e8a7`; it reported one minor documentation-clarity comment about naming the Context Lock in its own change-scope list. The list is corrected in this candidate. Final-head review of the resulting commit remains pending. |

No local Docker smoke or remote Cloudflare operation was run for this collector-only correction. No screenshot, Preview, cost, live-binding, Owner visual-acceptance or checkpoint-promotion result is newly claimed.

## Source fingerprints

The frozen base manifest `.engineering/evidence/CB-M00-WO-001-P1-CLOSEOUT-BASE-FINGERPRINTS.json` contains 32 source paths at exact base SHA `e8886e21c6f152ca374b1e42852c6b6638543f40`; all Git blob SHA-1 and raw-byte SHA-256 pairs were revalidated against those immutable Git objects. The candidate manifest `.engineering/evidence/CB-M00-WO-001-P1-CLOSEOUT-FINGERPRINTS.json` records the exact changed-path set against that base, including additions and modifications, with Git blob SHA-1 and raw-byte SHA-256. It excludes only itself to avoid self-reference. No source deletions are in scope.
