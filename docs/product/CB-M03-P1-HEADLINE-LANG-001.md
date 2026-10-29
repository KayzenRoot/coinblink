# CB-M03-P1-HEADLINE-LANG-001 · tag the language of publisher text

Status: implemented. Headline titles and excerpts now carry their own
`lang` attribute, so a Portuguese or Spanish page does not claim that English
publisher text is Portuguese or Spanish.

## Why

The reader is localized in en, pt-br and es, but every reviewed publisher
writes in English. With only the document-level language, a screen reader
pronounces the headlines with Portuguese or Spanish phonetics and browser
translation can treat them as page copy. The language of quoted text is a
property of the text, not of the surrounding page.

## Contract

- `LIVE_NEWS_SOURCES` gains `language: "en"` on every reviewed publisher. A
  future non-English publisher carries its own BCP-47 tag.
- `parseRssFeed` projects `language` on every item, defaulting to `"en"` when a
  source does not declare one (synthetic test sources keep working).
- `clusterLiveHeadlines` carries `language` into each `LiveCoverageMember`
  (`null` when unknown), so the coverage highlight and page can tag the
  headline without a second lookup.
- Surfaces set `lang` on publisher text only:
  - live reader: headline link and excerpt, plus the "most covered" headline;
  - coverage page: the newest headline of each story;
  - publisher pages: headline link and excerpt;
  - news index strip: headline link.
- Page chrome, publisher names, relative times and navigation stay in the page
  language and are untouched.

## Boundaries

- The attribute describes the publisher's text; it is not a translation and
  does not change the text.
- Unknown languages are omitted (`undefined`) rather than guessed.
- The JSON APIs do not expose item language; they remain content-free.

## Verification

- `test/modules/CB-M03/live-news.test.mjs` requires every reviewed source to
  declare English and the parsed item to carry it.
- `test/modules/CB-M03/live-clusters.test.mjs` checks propagation and the
  `null` fallback.
- M03 surface contracts assert `lang={item.language}` on the reader, publisher
  page and strip, and `lang={cluster.members[0].language ?? undefined}` on the
  coverage page.
