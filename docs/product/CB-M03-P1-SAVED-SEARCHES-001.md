# CB-M03-P1-SAVED-SEARCHES-001 · searches remembered in the browser

Status: implemented. The live reader can keep up to eight searches in the
visitor's browser. Nothing leaves the page.

## What is stored

Only the three filter values that define a narrowed view:

```json
{ "q": "bitcoin", "source": "coindesk", "since": 12, "id": "bitcoin|coindesk|12" }
```

No headline text, no titles, no account, no cookie, no server call and no
tracking. The key is versioned: `coinblink.live.saved-searches.v1`. The payload
is capped at eight entries and a test asserts that only those four fields can
appear.

## Behaviour

- Saving the current view is a button in the live section. An empty view (no
  query, publisher or window) cannot be saved and the button stays disabled.
- A saved entry that already exists is reported as a duplicate; the newest
  save appears first; the ninth save is rejected with a clear message.
- Each entry has a link back to its canonical live URL and a remove button with
  an accessible label. A clear-all button appears when at least one entry
  exists.
- Reads tolerate corrupt JSON, a non-array payload, unknown publishers, invalid
  windows, duplicates and oversized arrays. A storage failure (quota, disabled
  storage) is reported to the reader and leaves the previous list intact.
- The section is rendered hidden and is only revealed after the script finds
  usable storage. Without JavaScript, or with storage blocked, the reader keeps
  exactly the behaviour it had before this slice.

## Privacy stance

The panel states "Stored in this browser only. No account, no server and no
tracking." The client module is asserted to contain no `fetch`,
`XMLHttpRequest`, cookies or `sessionStorage`, and it writes only through the
versioned key. Saved searches are preferences, not analytics: there is no
identifier, timestamp or usage record.

## Localization

Labels, instructions and status messages are translated in en, pt-br and es
through the existing key-major live copy module; `{label}` and `{max}` are the
only placeholders. Saved entries are stored as values, so the same saved search
renders in the current language on every visit.

## Verified with the reader enabled (2026-10-29)

- Saving `?q=bitcoin&since=12` produced the label "bitcoin · Last 12h", the
  link `/en/news/live?q=bitcoin&since=12` and the status "Search saved in this
  browser."
- The entry survived a reload. A second save (CoinDesk) appeared first.
- Removing one entry left the other; clearing left zero, showed the empty
  message and wrote `[]` to storage.
- pt-br: "Últimas 3h", "Busca salva neste navegador."
- es: "Últimas 24h", "Búsqueda guardada en este navegador."
- Axe: zero violations; no external requests.

## Contracts

- `saved-searches.test.mjs` — normalization, canonical links, corrupt and
  foreign payloads, dedupe, bound, error handling, and the stored-field
  assertion.
- `live-news-surface.test.mjs` — the section, the bundled client import and the
  no-network/no-innerHTML contract.
- `e2e/m03-live-news.spec.mjs` — with the reader off the section is absent and
  the page remains inert.
- With the reader off, CI cannot exercise the enabled UI; the model and the
  source contract carry that coverage, and the enabled path was verified in a
  real browser as described above.
