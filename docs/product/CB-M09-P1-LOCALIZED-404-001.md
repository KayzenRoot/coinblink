# CB-M09-P1-LOCALIZED-404-001 · a 404 in the language of the address

Status: implemented. Unknown paths now render a localized not-found page
instead of an English page that still mentioned the M00 foundation.

## Why

The reader and the coverage page exist in en, pt-br and es. A reader who
mistypes `/pt-br/...` or `/es/...` deserves an answer in the same language, with
links back to that locale. The old page was English-only and described a
foundation that no longer matches the product.

## Contract

`src/modules/CB-M09/not-found-copy.mjs` holds key-major copy for the three site
locales (`pageTitle`, `pageDescription`, `eyebrow`, `h1`, `body`, `home`,
`news`, `lang`).

`localeFromPathname(pathname)` reads the first path segment and accepts it only
when it is a registered site locale. `/pt-br/...` and `/es/...` get their
language; `/fr/...`, `/404`, `/` and malformed values fall back to English.
Prototype keys never resolve to a locale.

`src/pages/404.astro`:

- sets `Astro.response.status = 404`;
- renders `BaseLayout` with the localized `lang`, title and description;
- exposes `data-m09-not-found={locale}` for contracts;
- links to `/{locale}` and `/{locale}/news`;
- contains no form, script or `set:html`.

## Boundaries

- The localized 404 is the fallback for unmatched paths. The news category
  route keeps its existing behaviour for an unknown category (it renders the
  index with a 404 status), which is a different surface.
- The page is `noindex` through the shared layout like every demo surface.
- No new request is made.

## Verification

`test/modules/CB-M09/not-found.test.mjs` covers copy parity, translations,
plain text, locale detection and fallbacks, prototype safety and the route
wiring. `site-surfaces` now checks `/nao-existe`, `/pt-br/nao-existe`,
`/es/no-existe` and `/404` for status, document language and localized heading.
