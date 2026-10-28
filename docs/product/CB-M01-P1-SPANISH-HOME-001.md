# CB-M01-P1-SPANISH-HOME-001 · the Spanish homepage

Status: implemented and deployed. `/es` is now the same product surface as
`/en` and `/pt-br`, not a placeholder.

## The gap

Until this slice, `/es` rendered a small standalone page ("CoinBlink en
español") with two links. The news section, the live reader and the SEO
metadata were already trilingual, so the Spanish entry point was the last
surface that did not feel like the product. The home is a single shared
component (`GoldenHome.astro`); the work was therefore translation and locale
wiring, not a second layout.

## What changed

| Surface | Before | After |
| --- | --- | --- |
| `/es` | Stub page with a heading and two links | Full Golden Home with `data-locale="es"` |
| Home copy | `en` and `pt-br` | 152 English source strings with `pt-br` and `es` side by side |
| Learning guides | 6 topics × 3 fields in en/pt | Same 6 topics with Spanish title, summary and checklist |
| Official sources | 6 publisher descriptions in en/pt | Spanish descriptions; URLs keep the verified English archive |
| Header navigation | Home / News / labs in en/pt | Spanish labels and `/es`, `/es/news` paths |
| Client interactions | Category filter, learning search, draft preview, explorer, share in en/pt | Spanish messages for all of them |
| Language switch | EN ↔ PT | On `/es`, links to both English and Portuguese; EN ↔ PT behaviour unchanged |

The home copy module is key-major: one row per English source string, with one
column per language, so a missing translation is visible in review and the
structure is written once. `translateHome` falls back to English for any string
without a row and rejects prototype keys before indexing.

## Language switch behaviour

- On `/en` the single chip still points to `/pt-br` and preserves category,
  search and section. This contract is asserted by the existing M00 tests and
  is unchanged.
- On `/pt-br` the chip points to `/en`, unchanged.
- On `/es` the primary chip points to `/en` and an additional PT chip points to
  `/pt-br`, because a Spanish reader may want either neighbour.

## Provenance

`GoldenHome.astro` is pinned by the M01 scene provenance registry. Editing the
component requires refreshing:

- `source.sha256` (new file hash),
- `source.gitBlobSha` (new Git blob hash),
- each `assets[].sourceGitBlobSha` reference.

The contract test fails if any of these is stale, which is how the refresh was
caught. The bounded hero and promo source fragments were not modified, so their
individual fragment hashes and byte lengths remain valid.

## Verification

- `home-copy.test.mjs` extracts all 132 `t("…")` keys from the component and
  proves each has a non-empty Portuguese and Spanish value, with an explicit
  allowlist for protocol names that are identical in Spanish.
- 6 Spanish learning guides and 6 Spanish source descriptions are covered by
  their module tests, including the unchanged external-URL allowlist.
- 77 M01 Node contracts pass, including the refreshed provenance.
- The Spanish browser spec exercises both viewports: `lang="es"`,
  `data-locale="es"`, hero "Mercado de Bitcoin, en foco.", 4 ejemplos,
  category filter ("1 ejemplo" / "Regulación"), learning search
  ("1 guía encontrada."), newsletter preview, official-source filter labels,
  no horizontal overflow, zero Axe violations, zero external requests and zero
  page errors.
- Existing M00/M01/M09 browser contracts were updated only where they asserted
  the retired stub (heading, language-link names, "DEMO" uniqueness); the
  English and Portuguese behaviour they protect is unchanged.

## Not changed

No new data source, no live market feed, no publication, no account and no
storage. The page remains `noindex` and every demo notice stays in place, now
in Spanish.
