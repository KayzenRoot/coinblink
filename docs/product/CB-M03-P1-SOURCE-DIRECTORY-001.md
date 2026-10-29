# CB-M03-P1-SOURCE-DIRECTORY-001 · public source directory

Status: implemented. `/{locale}/news/sources` lists every publisher CoinBlink
reads, in the three site languages, whether the reader is on or off.

## Why

Per-publisher pages exist, but there was no single place that explains the
whole source list: which publishers, what is taken from each, and what the
current collection received. A news product needs a provenance page that a
reader, editor or reviewer can open without knowing a publisher ID.

## Route and content

```
/en/news/sources
/pt-br/news/sources
/es/news/sources
```

- `h1` and intro explain the display contract: title, short excerpt,
  publication time and a link to the original article; nothing stored,
  republished or presented as CoinBlink reporting.
- Collection status: live with collection time and how many feeds responded;
  reader disabled with "no request was made"; or unavailable with the machine
  reason.
- One row per whitelisted publisher: name linking to its own page, an official
  site link with `rel="noreferrer noopener external"`, and, when live, the feed
  status and how many headlines that publisher has in the current collection.
- Rights note and a link back to the full live list.

The page reads the same cached collection as the reader: opening the directory
does not add a collection within the 15-minute window. With the reader off it
still renders the five publishers from the static whitelist and states that no
request was made.

## Localization

`source-directory-copy.mjs` is key-major with `{time}`, `{ok}`, `{total}`,
`{reason}`, `{status}` and `{count}` placeholders verified equal across en,
pt-br and es. Unknown locales fall back to English and prototype keys are
rejected.

## Navigation

- The live page's feed table links to the directory ("All sources →") in every
  locale.
- Each publisher page links to the directory from its aside.

## Verified with the real collection (2026-10-29)

- All three locales: 5 of 5 feeds responded, collection time shown, 5
  publisher rows, localized status text.
- Links from the live page and from `/en/news/source/coindesk` resolve to the
  directory.
- Axe: zero violations in the enabled build for en, pt-br and es.
- With the reader off (CI): 200 page, disabled status, 5 rows, no external
  requests.

## Contracts

- `source-directory-copy.test.mjs` — key parity, translations, placeholders,
  fallback and prototype safety.
- `source-directory-surface.test.mjs` — the three locale pages render the
  shared component, the component is gated and escaped, and both the reader
  and publisher page link to it.
- `e2e/m03-live-news.spec.mjs` — three locales, disabled state, five rows,
  internal and external link targets, no external requests, Axe.
- `e2e/site-surfaces.spec.mjs` — two representative routes keep the shared
  invariants.
- Deploy smoke checks `/en/news/sources`.
