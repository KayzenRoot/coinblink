# CB-M03-P1-LAST-VISIT-001 · new since your last visit

Status: implemented. Returning readers see which headlines arrived after their
previous visit, marked in the browser only.

## Why

A live reader that looks identical every time hides the only thing a returning
reader wants: what is new. Accounts are not available, so the marker cannot
live on a server. It does not need to: the last visit timestamp is enough.

## Contract

`src/modules/CB-M03/last-visit.mjs` is pure and offline:

- `LIVE_LAST_VISIT_KEY` — `coinblink.live.last-visit.v1`.
- `parseLastVisit(value)` — a valid ISO timestamp as milliseconds, otherwise
  `null`; numbers, empty strings and junk are rejected.
- `isNewSince(publishedAt, lastVisitMs)` — true only when the headline carries
  a valid time strictly after the visit. Equality is not new, and an undated
  headline is never new.
- `countNewSince(items, lastVisitMs)` — count over the visible collection.

`last-visit.client.mjs` is progressive enhancement. On load it reads the stored
visit, badges each item whose `<time datetime>` is newer, reveals a status line
with the localized count, and stores the current time as the next visit. A
first visit shows no badges. If storage is denied, markers stay off and the
visit is not recorded. The script uses `textContent`, never `innerHTML`, and
makes no request.

## Rendering and copy

The reader exposes `data-m03-live-list` (with the localized badge label),
`data-m03-new-status` (hidden template with `{count}`) and a note explaining
that the marker is local. Three key-major rows: `newBadge`, `newStatus`,
`newNote`, in en, pt-br and es. Without JavaScript the page is unchanged, and
the marker never appears in the server HTML.

## Boundaries

- The stored value is a single timestamp per browser profile; there is no
  account, cookie, server write or cross-device sync.
- Markers describe arrival in this collection, not a read receipt: opening the
  page updates the timestamp.
- A stale or malformed timestamp simply turns markers off for that load.

## Verification

`test/modules/CB-M03/last-visit.test.mjs` covers parsing, the strict
comparison, undated items, counts, storage denial handling and the absence of
network or `innerHTML`. The M03 copy contract requires the three rows in every
locale, and the disabled-reader e2e asserts the list and status slot are absent
when live news is off.
