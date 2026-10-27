# CB-M09-P1-SEO-METADATA-001 · Local evidence bundle

**Pinned main base:** `f96ad375d7e71beff0372d12eb63fcacada0a9dd`. **Isolated branch:** `feat/cb-m09-p1-seo-metadata-001`.

## Context and boundary
- Issue #16 and the wider M09 work stay `PLANNED / NOT_ADMITTED` beyond this slice. This increment covers only the "en/pt-br/es and SEO metadata" part of the M09 P1 scope, and it needs no external provider.
- The owned path set is listed in the Work Order document. The shared `src/layouts/BaseLayout.astro` is touched because metadata is emitted there; the layout prop signature is unchanged, so the other 21 consumers keep rendering as before.

## Negative contract
- `localeSiblings` returns `null` for `/`, for an empty string, for a non-localized route such as `/demo/sources` or `/demo`, for an unknown prefix such as `/fr/news`, for a trailing-slash path, and for non-string input. Only `/en`, `/pt-br` and `/es` prefixes produce siblings.
- `resolveSiteOrigin` returns `null` for an absent origin and throws for `http://`, a trailing slash, a bare host, a query string, or a non-string. A DEMO build therefore cannot emit an absolute URL by accident.
- `buildSeoMetadata` throws on a pathname without a leading slash, on an unsupported language, on an empty or padded title, on a non-string description, and on a malformed origin.
- With no origin, `absolute` is `false` and `canonical`, `alternates` and `og:url` are respectively `null`, `[]` and `null`.
- With an origin, a localized page gets a canonical, four alternates in order (`en`, `pt-BR`, `es`, `x-default`) and `og:url` equal to the canonical; a non-localized route gets a canonical but no alternates.

## Local verification performed
- `node --test test/modules/CB-M09/site-locales.test.mjs`: 7 contracts, all green, covering the registry, sibling derivation, origin normalization, both origin branches, fail-closed input handling and the shipped layout's static boundary.
- `npm run lint` (`--max-warnings=0`): clean. `npm run typecheck`: 0 errors. `npm run build` on Node 22.19.0.
- `playwright test e2e/m09-seo-metadata.spec.mjs e2e/m09-spanish-news.spec.mjs`: 6 passed. The new spec walks six localized routes asserting `html[lang]`, `og:locale`, `og:title` equality with the document title, `og:site_name`, `og:type`, `twitter:card`, the demo `robots` value, the absence of canonical, hreflang and `og:url` without an origin, no third-party request, and axe at zero violations.
- The full browser suite was run because the layout is shared: this is the check that protects the other 21 consumers.

## Not performed
No deployment, no production origin, no indexing, no sitemap, no `robots.txt` change, no hreflang for the demo labs, and no translation of the labs. Not verified by a separate human reviewer.

## STOP
PR remains Draft. Never Ready, merge, deploy, publish, index, or configure a production origin inside this increment.
