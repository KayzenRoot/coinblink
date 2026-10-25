# CB-M09-P1-ES-HOME-RETURN-001 | Hosted RED→GREEN Evidence Bundle

**Repository:** `KayzenRoot/coinblink` · [PR #237](https://github.com/KayzenRoot/coinblink/pull/237) · DRAFT · `LOCAL_DEMO_ONLY`.

## Context Lock / scope

- `main=524a93a970af9cf8cfb411f8ba7aa9f57ca79603` checked before branch creation, test publication and this evidence write. New branch `feat/cb-m09-p1-es-home-return-001`.
- Implementation SHA verified before evidence write: `b4919e3350aa45226c69dec489ef4b49e0fca53a`.
- All 15 previously open PRs, including #236 M08, #233 M05 Owner, #209 ECC and the dependency remediations, compared per filename before writing; **zero exact-path collisions**.
- Five existing paths changed and only the Evidence Bundle added as sixth: `src/modules/CB-M09/news-locale-meta.mjs`, `src/modules/CB-M02/NewsWorkbench.astro`, `src/modules/CB-M02/news-i18n.mjs`, `test/modules/CB-M02/m09-spanish-news.test.mjs`, `e2e/m09-spanish-news.spec.mjs`, `.engineering/evidence/CB-M09-P1-ES-HOME-RETURN-001/EVIDENCE-BUNDLE.md`.
- No change to `main`, routes, deployment, CMS, privileged sessions, source licensing, LIVE news/prices, cloud services, dependencies, lockfiles, secrets, workflow/rulesets or checkpoints.

## User-visible product improvement

The Spanish M09 newsroom `/es/news` previously exposed a home link labelled `Inicio (EN)` pointing to `/en`, even though `/es` now exists. This P1 improvement brings the demonstrative reader **back to their original language**, with `Inicio` pointing to `/es`, while English `Home → /en` and Brazilian Portuguese `Início → /pt-br` remain unchanged. No external or arbitrary URLs: `getNewsHomeHref` returns one of three canonical same-origin public demo entry paths, falling back to English on unrecognized input, including prototype keys.

## Genuine hosted test-first RED

1. Test-only commit `141b9209f0f4f50073fa2ccda47625d6f6f7186f`: Node checks three canonical home destinations, translations, invalid-locale fail-closed behavior and module integration without private API or browser storage.
2. Test-only commit `a0d856c215967cadf3cbe82d9cefd6a82a84bb7f`: Chromium check for accessible navigation landmark, keyboard Enter, Spanish/EN/PT destinations, `noindex`, same-origin GET-only requests, no browser exceptions and WCAG axe scan.
3. [Hosted M02/M09 RED run #40148025320](https://github.com/KayzenRoot/coinblink/actions/runs/40148025320), job `121033453619`: Node test stage **FAILURE** with actual `SyntaxError: ... news-locale-meta.mjs does not provide an export named getNewsHomeHref`; no changes to product implementation yet. The runner installed locked dependencies; Chromium correctly marked **SKIPPED / NOT_RUN** after RED. It is not a credential, timeout or npm installation failure.

## Minimal implementation

- `c2d5dfe932cdf30c5e87e50dbfc65669710003d5`: M09 pure fixed-route resolver, `Object.hasOwn` prototype hardening.
- `859658bcee14b180df01b7f5da4e87c076c40868`: Spanish-only home copy `Inicio (EN) → Inicio`.
- `b4919e3350aa45226c69dec489ef4b49e0fca53a`: M02 `NewsWorkbench.astro` consumes resolver, preserving all other canonical M02 contracts.

## Hosted GREEN on implementation SHA

- [M02/M09 GREEN run #40148110228](https://github.com/KayzenRoot/coinblink/actions/runs/40148110228), job `121033720918`: **34/34 Node tests PASS**, including new M09 localized return and previous M02/M09 anti-fabrication contracts; **16/16 Chromium PASS**, including a keyboard-operated 3-locale return, Spanish WCAG A/AA, no external egress or browser mutation. This confirms the link works in real browser rather than only in source.
- [Integrated journey #40148110169](https://github.com/KayzenRoot/coinblink/actions/runs/40148110169): M01–M10 multi-module Chromium, **SUCCESS**.
- [Quality #40148110170](https://github.com/KayzenRoot/coinblink/actions/runs/40148110170): Node focused tests and LCOV artifact, lint, Astro typecheck, Gitleaks secrets scan, **SUCCESS**. No assertion of project-wide or Sonar measured coverage percentage is made here.
- Build `40148110187`, PR Assurance `40148110251` and Reviewdog `40148110240`: **SUCCESS**. Six applicable workflows: **6/6 SUCCESS**.
- Exact-SHA GitHub Check Runs: **13/13 SUCCESS**, including three branch-required checks: Build (Ubuntu), SonarCloud Code Analysis (Quality Gate PASS) and Socket Security: Pull Request Alerts (SUCCESS/**Skipped** because no dependency delta). Socket Security: Project Report SUCCESS. A skipped PR alert is not a complete dependency audit.

## STOP, review, HEAD recheck

- This document's commit changes the branch HEAD. **Do not treat 13/13 on implementation SHA as evidence of 13/13 on the later documentation SHA**. Revalidate `main`, new HEAD, six paths, applicable workflows, required checks, SonarCloud, Socket, reviews and threads independently after this write.
- Owner-designated connected `kayzenweb3` may submit a technical `COMMENTED` review on the final exact SHA. This does **not** constitute independent human approval, and does not authorize merge.
- No Ready, merge, deployment, production SEO/hreflang/canonical, personal data, external APIs, premium costs, publishing, credentials or real market/news providers.
- **Implementation verdict:** `M09_P1_LOCAL_NAVIGATION_GREEN / FINAL_HEAD_CI_RECHECK_REQUIRED / DRAFT / NO_READY_NO_MERGE_NO_DEPLOY`.
