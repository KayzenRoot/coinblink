# CB-M09-ES-ENTRY-A11Y-001 | Spanish DEMO entry and accessible return

## Context / source of truth
- Repository: KayzenRoot/coinblink. Locked original main: b283e1cd40f6934a8bf0edef52b38a7e2ba5b289.
- Branch: feat/cb-m09-es-entry-a11y-001. Draft PR #229. No production authorization.
- Existing /es/news and /es/news/[slug] in M09 were functional but no /es entry route existed; BaseLayout used the English skip link for lang=es; the Spanish news locale switcher lacked a link back to /es.
- Only an additional local, noindex, demo-only Spanish entry is in scope. The existing M01 Golden Home EN/PT is not translated or modified.

## Authorized bounded scope (seven paths)
1. src/pages/es.astro (new): locally rendered entry linking to /es/news, /en, and /pt-br with explicit fictional/no-LIVE disclaimer.
2. src/layouts/BaseLayout.astro: the Spanish language renders 'Saltar al contenido' while retaining EN and PT-BR copy.
3. src/modules/CB-M09/NewsLocaleSwitch.astro: localized link 'Volver al inicio' only on ES news list and article pages.
4. test/modules/CB-M02/m09-spanish-news.test.mjs: Node RED first, then GREEN.
5. e2e/m09-spanish-news.spec.mjs: real browser regression, keyboard, responsive sizes, axe, no external requests or writes.
6. docs/product/CB-M09-ES-ENTRY-A11Y-001.md (this document).
7. .engineering/evidence/CB-M09-ES-ENTRY-A11Y-001/EVIDENCE-BUNDLE.md.

## Acceptance and security
- Spanish entry is HTTP 200, html lang=es, noindex/nofollow/noarchive, a single visible h1, main#main and keyboard-reachable Spanish skip link.
- EN/PT-BR labels and routes unchanged; existing /es/news, article, 404 and 3-language canonical fictional news behavior preserved.
- Spanish link back to /es only; no new user data, keys, accounts, cookies, storage, APIs, provider feeds, live prices/headlines, scripts, dependencies, CSS pipeline changes or external access.
- Use Astro text output and existing CSS classes; no innerHTML or remote asset requests. The links only navigate within same origin.
- Tests must fail against the original product without corresponding product edits; then pass on GitHub-hosted Node and Chromium workflows.
- Require all exact-HEAD applicable GitHub Actions, SonarCloud 0 new issues and 0 hotspots, Socket Project Report and PR Alerts, reviewdog, PR Assurance, zero blocking threads.
- Measured SonarCloud new-code coverage remains 0.0% unless new measured evidence changes it. Passing functional tests does not imply instrumented coverage.

## Historical RED and GREEN
- RED test-only HEAD 2a71a8b2295b7aaf905885d41662a67f0d27d92a; M02/M09 run 40082134581 genuinely failed 3 new assertions, existing 30 passed. Browser was skipped in that run after Node failure, not falsely claimed executed.
- First GREEN product HEAD 9077c4b63cf06bf1ad85b7fd4d4c8578ec5fc003; M02/M09 run 40082229113: 33/33 Node pass, 15/15 Chromium pass, including actual /es browser journey. Other applicable checks are tracked in the Evidence Bundle.

## STOP / release control
- This is a demo-only increment, not M09 completion or multilingual production SEO. No production domain, canonical/hreflang configuration, commercial rights clearance or live content.
- Keep PR #229 Draft; no merge, deploy, spending, publication, ECC #209, other PR mutations, rulesets, main changes or checkpoint promotion.
- Review exact new HEAD, base, 7-file diff, CI, Sonar, Socket and threads before any separate owner authorization to Ready/squash merge.
