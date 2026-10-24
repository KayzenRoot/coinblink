# CB-M11-P0-DEVELOPER-SANDBOX-001 | Evidence Bundle

## Locked source / scope
- Original base main: `28bd75a4acac58703ad8a3ac247332e7d9a6bd1e`; branch `feat/cb-m11-p0-developer-sandbox-001`; PR https://github.com/KayzenRoot/coinblink/pull/230 DRAFT.
- Exclusive 8-file diff: M11 serializer, developers page, /v1/demo/articles endpoint, Node tests, Chromium tests, isolated Actions workflow, product Work Order and this Evidence Bundle. No touched packages, shared auth, existing M02 source, GitHub ruleset or checkpoints.

## Genuine RED (executed BEFORE any product implementation)
- Test and CI only HEAD: `b6a584228123a097c561117d7f15da0a4dc50244`.
- GitHub Actions `https://github.com/KayzenRoot/coinblink/actions/runs/40084748931`, job `120845268144` finished FAILURE exactly at Node contract step: 7 tests total, 3 M02 PASS and 4 new M11 FAIL.
- Failure detail: ENOENT `src/modules/CB-M11/demo-articles.mjs`; ENOENT `src/pages/developers.astro`; ERR_MODULE_NOT_FOUND in two behavior tests. These failures prove the expected missing functionality, not a regression to existing code.
- Chromium at RED: NOT_RUN because Node failed first. Sonar and workflow checks for RED are not considered release-quality gates.

## GREEN implementation (preceding documentation commit)
- First product HEAD: `4ddfb947c912802ca96f5a5620191575fb187c5b`.
- M11 dedicated Actions `https://github.com/KayzenRoot/coinblink/actions/runs/40084868015`, job `120845624401`: 7/7 Node PASS and 15/15 real Chromium PASS (M11 secure API + M02 existing regression). Browser verifies `/developers` in mobile/tablet/desktop, keyboard link focus, axe tags wcag2a/aa & wcag21a/aa, no external requests/writes, JSON metadata and fail-closed rejected methods/queries.
- At first product GREEN, five applicable workflow runs SUCCESS: build `40084868036`, reviewdog `40084868003`, quality `40084868042`, PR Assurance `40084868031`, M11 `40084868015`. All 12 individual checks completed SUCCESS.
- SonarCloud at first GREEN: 0 new issues, 0 accepted issues, 0 security hotspots, **0.0% coverage on new code measured**, 0.0% duplication on new code. Do not claim test instrumentation coverage improvement.
- Socket Project Report SUCCESS (SBOM https://socket.dev/dashboard/org/nexlabs/sbom/597def6f-5d31-4d1f-a851-f5bda6330443); Socket PR Alerts SUCCESS (no net dependency change). CI quality lint/typecheck, Node/LCOV baseline and Gitleaks SUCCESS.

## Final HEAD gates and evidence provenance
- This file is itself a later commit. Historical GREEN above applies only to `4ddfb947c912802ca96f5a5620191575fb187c5b`, NOT automatically to the eventual final-HEAD.
- Required final audit: read back PR/base/HEAD and exact eight paths, verify all applicable Actions completed SUCCESS and SonarCloud zero new issues/hotspots with both Socket SUCCESS, reviews, threads, build, scope/no external I/O.
- Instrumented new-code coverage remains 0.0% until demonstrable contrary data. An LCOV artifact existing in CI is not by itself evidence Sonar ingested it.
- Required runs that cannot be executed must be labelled NOT_RUN, and pending remains pending rather than success.

## STOP condition
- PR remains DRAFT. No Ready, merge, deploy, main change, external network/provider, account, real news/prices, credentials, API key, license redistribution, billing/spend, ECC #209, other PR, ruleset or checkpoint update.
- Any actual gate failure or added privileged behavior requires a strictly in-scope correction on the same branch and fresh exact-HEAD revalidation.

## Independent audit correction loop | 2026-10-24

### Bounded issue 1: missing M02-producer path trigger
- The existing M11 workflow did not re-run when its imported source producer `src/modules/CB-M02/news-workbench.mjs` changed. Corrected only `.github/workflows/m11-developer-demo.yml` by adding that explicit path to `pull_request.paths`.
- Static presence was read back against GitHub on the new branch. Changing M02 was explicitly OUT OF SCOPE, so no fabricated actual M02-change event is claimed. CI on M11 branch was re-executed and passed.

### Bounded issue 2: horizontal overflow, genuine browser RED
- Browser-test-only HEAD `f1acd4ba7df9d9c2d57fa157e1f1cbb4e2076d8d`, M11 workflow https://github.com/KayzenRoot/coinblink/actions/runs/40086440376, job `120850254019`: **7/7 Node PASS**; 15 existing Chromium PASS, **new reflow FAIL** twice. Actual width=320, viewport=320, document.scrollWidth=440, pre computed width=424. Test deliberately checks both 320 and 390, but 390 NOT_RUN on RED because the first 320 assertion failed.
- First attempted fix HEAD `2716f0dc56f0ac7314a8fc28aa6e8eb0bb0f133f`: a small scoped `<style>` in developers.astro, workflow https://github.com/KayzenRoot/coinblink/actions/runs/40086584741, job `120850666392`, FAILED: browser CSP blocked inline styles under `style-src 'self'`; document width remained 440 at 320 and the pre-existing no-console-error test also failed. This failure was NOT hidden or marked green. No CSP relaxation was permitted.
- Corrected implementation HEAD `f94f32f9ac9a3420c2fdcfdc48a8b0ade2f481af`, workflow https://github.com/KayzenRoot/coinblink/actions/runs/40086803876, job `120851304519`: removed blocked inline CSS and split the too-long preformatted demonstration lines **within the existing developers.astro page only**, preserving the locked CSP and global styling. User authorized local CSS but the security policy made the literal inline-style approach incompatible; the compatible page-local markup solution was necessary, with no global CSS or CSP edits.
- Hosted GREEN exact implementation-head: **7/7 Node PASS and 16/16 Chromium PASS**. Browser logs record **320px viewport / 320px document / 268px code block** and **390px viewport / 390px document / 268px code block**. Existing M02 regression, M11 accessibility, API-method and query-denial tests pass.
- At implementation HEAD f94f32f9, five applicable workflow runs completed SUCCESS: M11 `40086803876`, Build `40086803858`, Quality `40086803859`, PR Assurance `40086803868`, Reviewdog `40086803855`; 12 individual exact-implementation-head checks SUCCESS including SonarCloud zero new issues, zero hotspots and **0.0% measured new-code coverage**; both Socket Security checks SUCCESS.
- No code changes beyond the initial eight-file authorization, no dependencies, no global CSS, no CSP relaxation, no live/proprietary content or external network I/O. Main `28bd75a4acac58703ad8a3ac247332e7d9a6bd1e` unchanged. Draft preserved.
- This Evidence Bundle update itself changes PR HEAD and triggers fresh CI; **never treat the earlier implementation-head checks as exact evidence for the subsequent evidence-only HEAD**. Final-head checks and review status must be read back separately before any future Ready request.

### STOP
- No Ready, merge, deploy, spending, change to main or any other PR, ECC #209, rulesets or checkpoints. No coverage improvement claimed.
