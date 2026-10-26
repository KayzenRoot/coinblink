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

## HIGH_ASSURANCE Reconciliation Delta 01 · 2026-10-25 · M09 P1 user-visible Spanish return

**Authority and scope:** Owner specifically authorized non-destructive reconciliation of protected main `9a92bf362c5c415b18b25b227fa8b372a177ece6` into existing Draft PR #237 original HEAD `7affffb2f268330a961e4ba24268bc73bad965d5` on branch `feat/cb-m09-p1-es-home-return-001`, plus test/evidence corrections confined to the six paths already in this PR. Owner did **not** authorize Ready, PR squash merge, deploy, costs, data LIVE, production admin/D1, global header/favicon, rights, rulesets or checkpoint promotion.

### Work Order / Source Check / Context Lock
- Verified via REST: protected main `9a92bf362c5c415b18b25b227fa8b372a177ece6`, original PR #237 branch HEAD `7affffb2f268330a961e4ba24268bc73bad965d5`, historical PR base `524a93a970af9cf8cfb411f8ba7aa9f57ca79603`, PR OPEN/DRAFT, zero unresolved review threads, 13/13 old-HEAD checks SUCCESS, SonarCloud old HEAD 0 new issues and 0 Security Hotspots. These are **historical evidence only**.
- Verified main tree `bd4e592712fc39b71ba89db8843db11cdef458fc` and PR tree `30b211d1a7ffcc1497546e77b7cd00ced9abc654` are complete (`truncated=false`). Relative diff before reconciliation: 6 files exclusively. Old PR base to new main changed 57 files / 6 commits with ZERO intersection with these six paths. The other 20 open PRs were also checked for exact path collisions, ZERO.
- User-visible confirmed original defect: `/es/news` displayed `Inicio (EN)` returning to `/en`, although noindexed local-only `/es` already exists. This PR corrects `Inicio` → `/es`; English `/en` and Portuguese `/pt-br` unaffected.

### Files / architecture constraints
- Allowed paths: `src/modules/CB-M09/news-locale-meta.mjs`, `src/modules/CB-M02/NewsWorkbench.astro`, `src/modules/CB-M02/news-i18n.mjs`, `test/modules/CB-M02/m09-spanish-news.test.mjs`, `e2e/m09-spanish-news.spec.mjs`, this Evidence Bundle. Merge base tree will be protected-main tree + five original feature/test Git blobs above + new Evidence Bundle blob. All other paths retain protected-main blobs.
- Non-evidence blob fingerprints are intentionally unchanged by this reconciliation: `e2e/m09-spanish-news.spec.mjs=eccc31a98412a2d81c47dbf574111e42343d4a67`; `NewsWorkbench.astro=dc3d8b3a18fcd5fc19c59cedf0852805409a3712`; `news-i18n.mjs=12325a9f919cc6bb9ea3630c718f6890ca32f117`; `news-locale-meta.mjs=b57df297930797d80639090cadcbd2bda1117285`; `m09-spanish-news.test.mjs=91470cc07d9767241b5ca7668600bd42557bcad1`.
- Parent order planned: `[original PR #237 HEAD 7affffb2f268330a961e4ba24268bc73bad965d5, protected main 9a92bf362c5c415b18b25b227fa8b372a177ece6]` on same branch with `force=false`, expected prior SHA lock. No rebase, branch replacement or force-push.
- No new dependencies, workflow/CI config, remote providers, CMS auth/session, production news, rights, Golden assets, favicon or commercial operations. 3 canonical immutable fictional stories, noindex and GET-only same-origin browser policy unchanged.

### Acceptance / test plan (pending hosted execution on reconciled HEAD)
- Exact-head M02/M09 Node contracts: canonical locale map, bad/prototype/injected locale fallback, Spanish label/destination and original EN/PT routing; original three fictional story specimens, invalid-slug HTTP 404, copy unchanged other than Spanish home.
- Exact-head Chromium: `/es/news` return via keyboard Enter, actual `/es` landing and `lang=es`, `noindex`, viewports 390/768/1366, axe WCAG A/AA, EN/PT controls stable, 0 off-origin egress and 0 non-read requests. Integrated M01–M05 and M09 E2E where applicable.
- All triggered required and applicable checks on exact new HEAD: Build (Ubuntu), SonarCloud Code Analysis 0 untriaged blocking findings, Socket PR Alerts vs actual `Skipped`, Socket Project Report, CI Quality lint/typecheck/Gitleaks/Node, PR Assurance, Reviewdog, real browser and module regressions. Preserve 0 blocking threads.
- Record new CI job/run IDs, 34/34 Node and 16/16 Chromium only if actually observed on new HEAD; historical RED run #40148025320 and GREEN run #40148110228 remain historical. No deployment or local test claim without executed proof.

### Review / deliverables / proposed checkpoint delta
- Produce one new reconciled two-parent commit on the existing PR; read back exact parents, main SHA, six-path diff, source blobs and tests. Update final result as a separate top-level exact-HEAD audit comment rather than changing the tested HEAD again.
- Internal reviewer `kayzenweb3` is a GitHub review option but `COMMENTED` does not equal APPROVED and is not an independent human audit. Actual GitHub protections always prevail.
- Proposed only: M09 Spanish DEMO home navigation fixed and tested. The complete M09, SEO, licensed production news and launch remain NOT ADMITTED. **No canonical checkpoint promotion.**

### STOP CONDITION
- Until exact reconciled HEAD has green, non-skipped applicable gates: `PENDING_CI / DRAFT / NO_READY_NO_MERGE_NO_DEPLOY`.
- Regression, actionable HIGH/CRITICAL, stale reference, unexpected six-path diff, failing/untested required check or loss of protections => `CORRECTION_REQUIRED` or `BLOCKED`. Integration with protected main requires separate PR-specific Owner authorization.
