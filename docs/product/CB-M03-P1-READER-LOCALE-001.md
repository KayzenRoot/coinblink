# CB-M03-P1-READER-LOCALE-001 · language switch across the reader

Status: implemented. Every reader surface now exposes the same three-language
switch, and switching keeps the current path and query string.

## Why

The reader exists in English, Brazilian Portuguese and Spanish, but only the
home page offered a visible choice: a reader who landed on `/en/news/live` had
to edit the URL to reach another language. Search filters and the coverage
filters made that worse, because a hand-edited URL dropped the query.

## Contract

`src/modules/CB-M03/reader-locale.mjs` is pure:

- `READER_LOCALES` — `en`, `pt-br`, `es`, the same registry the site uses.
- `readerLocaleLinks(locale, pathname, search)` — rewrites only the first path
  segment to each site locale and appends the query string unchanged. It throws
  when the path is not absolute or does not start with the current locale, so a
  foreign URL never becomes a fabricated sibling.
- `readerLocaleTag`, `readerLocaleName`, `readerLocaleLabel` — the BCP-47 tag,
  the language's own name (endonyms are never translated) and the localized
  accessible label, falling back to English for unknown values.

`ReaderLocaleSwitch.astro` renders a `nav` with `hreflang`, `lang`, the
endonym, and `aria-current="page"` on the active language. It omits itself when
the current path does not belong to the component's locale — an unknown-locale
404 has no honest sibling route.

## Surfaces

The switch appears on the live reader, the coverage page, the publisher pages
and the source directory. The query string is preserved, so a filtered view in
English opens the same filtered view in Portuguese or Spanish.

## Verification

`test/modules/CB-M03/reader-locale.test.mjs` covers path rewriting, query
preservation, nested routes, locale roots, malformed input and the fallbacks.
The M03 surface contracts assert the component is wired into all four reader
surfaces, and the live-reader e2e follows the Portuguese link from
`/en/news/live?q=bitcoin&since=24`, checking the URL, the document language and
the localized heading.
