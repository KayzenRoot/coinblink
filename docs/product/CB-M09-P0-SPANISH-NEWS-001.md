# CB-M09-P0-SPANISH-NEWS-001 | Third language for fictional news

Module: M09 internationalization and accessibility. Canonical base: ad00d6a671f8af71c6e729d15347b261997ec75b. Dependencies: M02 and M05; related Issues #16, #9, #152.

## Working product
- Spanish-language /es/news and /es/news/:slug routes, including missing slug 404, reading path, categories, accent-insensitive search, clear filters, responsive layout and three-language switcher with article-slug continuity.
- All three already-existing fictional stories translated into Spanish; underlying identifiers and safety metadata remain canonical English self-authored specimens, with published=false.
- EN/PT-BR private draft preview and comparison are preserved only on their existing locales; no fake Spanish support is claimed for M05.
- Other demos remain English-only and are labeled accordingly on the ES pages. HTML lang=es plus noindex/nofollow/noarchive on all demo pages.

## Incomplete
M09 is not done: M01 Golden Home, M03/M04, M05 CMS and other routes are not localized to Spanish. No real SEO canonical or hreflang URLs before a verified production domain and publishable reviewed news rights. No AI translation, provider requests, third-party API, data storage, publishing or live market.

## Exact-HEAD checks required
M02 Node glob includes new M09 safety tests. Existing M02 free Chromium acceptance adds M09 English/Portuguese/Spanish tests, 404, axe accessibility, no writes/egress. Existing integrated M01–M05 Chromium via M02 path trigger; Build, lint/typecheck, SonarCloud 0 newly introduced issues/hotspots, Socket, Gitleaks, PR assurance and reviewdog must pass. All scanner skips honestly reported.

STOP: no merge, deployment, purchase, secret use, direct branch protection changes, main or checkpoint modifications. ECC experimental PR #209 and existing PR #210/#212 stay isolated.
