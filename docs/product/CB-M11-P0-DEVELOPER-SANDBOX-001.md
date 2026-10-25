# CB-M11-P0-DEVELOPER-SANDBOX-001 | Offline developer API sandbox

## Owner authorization / immutable baseline
- GitHub repository KayzenRoot/coinblink; authorized original main `28bd75a4acac58703ad8a3ac247332e7d9a6bd1e`.
- PR #230 / branch `feat/cb-m11-p0-developer-sandbox-001` must remain Draft. This is a small P0 functional increment, not complete M11 admission, launch, licensing or M12 monetization.
- Exactly 8 owned paths only: `src/modules/CB-M11/demo-articles.mjs`, `src/pages/developers.astro`, `src/pages/v1/demo/articles.ts`, `test/modules/CB-M11/demo-articles.test.mjs`, `e2e/m11-developer-demo.spec.mjs`, `.github/workflows/m11-developer-demo.yml`, this Work Order and its matching Evidence Bundle.

## Product-facing acceptance
- `GET /developers` renders an accessible, responsive local explanatory page. `BaseLayout` provides a keyboard skip link and robots noindex/nofollow/noarchive. The page never promises customers, real articles, prices, signups, keys or a LIVE/paid API.
- `GET /v1/demo/articles` renders exactly three canonical M02 fictional, unpublished specimens. `mode=SYNTHETIC`, `status=DEMO_ONLY`, `live=false`, `redistributable=false`; every item has exactly `id`, `slug`, `category`, `title`, `summary`, `published=false` and `rights=SYNTHETIC_NOT_LICENSED_NEWS`.
- Original M02 records remain the immutable source of truth. M11 strictly validates data shape and equality to canonical fixtures, rejects rogue/extra/private fields and emits only an allowlisted metadata projection without body text.
- No query parameters accepted in P0 (400 with no data). Methods other than GET return 405 with Allow: GET; bad canonical data returns UNAVAILABLE without records. This is not the future licensed `/v1/articles` API.
- Responses use application/json, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow, noarchive`, and no Access-Control-Allow-Origin override.

## Security and DoD
- Zero backend writes, remote network calls, provider SDK, runtime secrets, user-specific state, real Owner access, D1/DB, sessions, billing, payment, API keys, redistribution or production publishing.
- No new dependencies/package changes; strict `script-src 'self'` policy untouched. Do not publish via an external API. Browser GET requests to local origin are permitted test I/O; no external outbound I/O.
- First commit tests and CI only, prove RED hosted without product files, then implement minimal GREEN. Node test canonical fixture and hostile injection, HTTP method/query errors and headers, browser axe AA, EN mobile/tablet/desktop, real GET and M02 regression.
- Exact-head Build, isolated M11 CI, CI quality/Gitleaks/lint/typecheck, PR Assurance, Reviewdog, SonarCloud 0 new issues and 0 hotspots, both Socket reports, reviews/threads, 8-file diff and SHA lock before any potential future Ready action. Coverage on Sonar remains 0.0% measured unless independently updated.

## Recorded hosted proof
- Genuine RED: test-only HEAD `b6a584228123a097c561117d7f15da0a4dc50244` / M11 workflow run `40084748931`: 3 existing M02 Node PASS, 4 new M11 Node FAIL from missing files/modules. Chromium NOT_RUN because Node step failed.
- First full implementation GREEN: HEAD `4ddfb947c912802ca96f5a5620191575fb187c5b` / M11 workflow run `40084868015`: Node 7/7 PASS; Chromium 15/15 PASS including existing M02. Five applicable workflow runs and 12 individual check runs SUCCESS. SonarCloud 0 new issues/hotspots; both Socket success; measured coverage 0.0%. See Evidence Bundle.
- This documentation is committed after the preceding GREEN, so exact final-HEAD gates must run again. Never promote a checkpoint or mark READY automatically.

## STOP
- Any main drift from the locked SHA, additional path, provider use, data publishing/redistribution, unauthorized side effects, missing required checks or substantive review request blocks integration.
- No merge, deploy, costs, ECC #209, other PRs, rulesets, checkpoints, production secrets or release authorization.
