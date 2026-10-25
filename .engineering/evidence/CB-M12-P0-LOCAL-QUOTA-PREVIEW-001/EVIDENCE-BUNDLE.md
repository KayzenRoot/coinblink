# CB-M12-P0-LOCAL-QUOTA-PREVIEW-001 · Hosted RED→GREEN Evidence Bundle

**PR** [#240](https://github.com/KayzenRoot/coinblink/pull/240) · DRAFT · Local-only synthetic demonstration.
**Baseline main** `524a93a970af9cf8cfb411f8ba7aa9f57ca79603` · **GREEN implementation SHA before Evidence Bundle** `3acc0b0123af18803381705fe4e1d9ae3d49860d`.
**Full M12 billing/paid subscriptions** from Issue #19: `PLANNED / NOT_ADMITTED`. This P0 work does not grant commercial admission or production access.

## Preflight, isolation and scope
- Owner authorized one explicitly bounded LOCAL fictional M12 increment, not a real monetization system.
- Main SHA `524a93a970af9cf8cfb411f8ba7aa9f57ca79603` checked before branch creation, before README/Work Order writes and before Evidence Bundle. Branch `feat/cb-m12-p0-local-quota-preview-001`.
- All **18** existing open PRs including #239, #238, #237, #236, #233, #209 and security/dependency/quality PRs compared by changed filename against all 10 proposed paths: **0 direct collisions**. No other PR file changed.
- Exactly 9 previously created paths: `src/modules/CB-M12/local-quota-preview.mjs`, `src/modules/CB-M12/LocalQuotaPreview.astro`, `src/modules/CB-M12/local-quota-preview.client.js`, `src/modules/CB-M12/local-quota-preview.css`, `src/pages/demo/api-usage.astro`, `test/modules/CB-M12/local-quota-preview.test.mjs`, `e2e/m12-local-quota-preview.spec.mjs`, `.github/workflows/m12-local-quota-preview.yml`, `docs/product/CB-M12-P0-LOCAL-QUOTA-PREVIEW-001.md`; this Evidence Bundle is path 10/10. No updates to M06 or M11 models, global navigation, app CSP, auth, packages, production route, customer information, workflows of other modules, checkpoint, ruleset or protected main.

## Contract and UX
- Pure `src/modules/CB-M12/local-quota-preview.mjs` model: frozen list of **three illustrative configurations** (sample=5, prototype=10, lab=20; UI label for prototype changed to `Builder sandbox` to avoid commercial-sounding naming). Only integers 0..20; `simulatedRemaining=Math.max(0,limit-used)`, `limitReached=used>=limit`. Invalid identifiers including `__proto__`, numeric invalidity and hostile strings fail closed to empty `INVALID_SELECTION`. No money or entitlement state.
- Successful model strictly `mode=LOCAL_SYNTHETIC`, `status=SIMULATION_ONLY`, `billingEnabled=false`, `purchaseEnabled=false`, `customerAccount=false`, `price=null`, `live=false`. Model returns frozen result with bounded fields.
- Accessible `/demo/api-usage` page uses native labels, select, integer number input, reset button and `aria-live` status. Native keyboard and focus, responsive 320/390/768/1366. Client uses no network, cookies, localStorage, sessionStorage, IndexedDB, tokens, secrets, subscriptions, purchases, pricing, real API metering or backend writes; UI only updates `textContent`.
- All screenshots/outputs must be labelled **ILLUSTRATIVE / NO BILLING / NO PAYMENTS / NO REAL ACCOUNTS**.

## Test-first hosted RED
- Tests committed before implementation: Node `fa18e81492128de8649f7bfb7de67a05ca3ef58e`; Chromium `2afdcb8ef6594cfc3dd50ec851bad005adad8671`; least-privileged dedicated M12 CI workflow, RED-only HEAD `5632ececb5ccc03a77954c9ee2f186497e907857`.
- [RED run #40178636585](https://github.com/KayzenRoot/coinblink/actions/runs/40178636585), job `121124702167`: **10 Node: 7 PASS / 3 FAIL**, caused specifically by `ERR_MODULE_NOT_FOUND` for absent M12 model and missing demo page; npm locked installation successful; browser NOT_RUN (skipped because RED Node failed). No fabricated Chromium RED.
- Safe example model plus Astro/JS/CSS/page and narrow Work Order added after RED.

## Hosted GREEN correction loop
- Initial candidate `c249a3fcd4d5c255b788a0c3dd2e8fd0c04d5f8f` in [M12 run #40178810269](https://github.com/KayzenRoot/coinblink/actions/runs/40178810269): **9/10 Node PASS, 1 FAIL**, because the deliberately strict test disallows the substring `pro` in marketing labels and `Prototype sandbox` matched; Chromium NOT_RUN. This was a product-copy contract regression, not an infrastructure error.
- Minimal fix `3acc0b0123af18803381705fe4e1d9ae3d49860d`: change **only** the fictional display label `Prototype sandbox` to `Builder sandbox`; preserve quota id `prototype` and max 10, no change to model logic, tests or sensitive files.
- [M12 GREEN run #40178888058](https://github.com/KayzenRoot/coinblink/actions/runs/40178888058), job `121125462714`: **10/10 Node PASS** including preexisting M11 articles/market-safety tests, **6/6 Chromium PASS** including new keyboard/viewport/axe/no-egress/zero-price/no-account demo checks and M11 docs regression. Automated Browser also validates live /admin remains denied.
- Exact green implementation HEAD: **5/5 applicable GitHub Actions workflows SUCCESS**, **12/12 Check Runs SUCCESS**, **3/3 protected main required checks**: Build (Ubuntu), SonarCloud Code Analysis, Socket Security: Pull Request Alerts. SonarCloud Quality Gate PASS; Socket Project Report SUCCESS. PR Alerts SUCCESS but **Skipped (no dependency delta)**, not a full dependency rescan. CI Quality lints, typecheck, Node/LCOV artifact, Gitleaks SUCCESS. No unverified code coverage percentage claimed.

## Final-HEAD evidence/review STOP
- This Evidence Bundle is an additional commit and advances the PR HEAD. Revalidate on the new SHA: main, 10/10 paths, 5/5 workflow conclusions, 12/12 check runs and required app IDs, SonarCloud/Socket, reviews/threads, exact SHA before declaring final GREEN.
- After exact HEAD GREEN, submit technical `COMMENTED` review via connected Owner-designated `kayzenweb3`. That account is not an independent human reviewer; no APPROVED event or bypass.
- **DRAFT / NO_READY / NO_MERGE / NO_DEPLOY / NO_BILLING / NO_SPENDING / NO_PERSONAL_DATA / NO_LIVE_API**. Full M12 remains PLANNED/NOT_ADMITTED; M06/M11 dependencies are not declared admitted to production from this local demo.
- **Implementation verdict only:** `M12_P0_LOCAL_QUOTA_GREEN / FINAL_SHA_RECHECK_REQUIRED / DRAFT`.
