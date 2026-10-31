# CB-M16-P1-ALERTS-001 · watchlist digest

Status: the owner previews and sends one digest per reader per UTC day, built
from the reader's watchlist and the current headline collection.

## Matching

Each symbol maps to topic words (`BTC` → `bitcoin`, `btc`; `ETH` → `ethereum`,
`ether`, `eth`; and so on), with the lowercased symbol as the fallback. A
headline matches when its title contains one of the words. Only title, publisher
and the original link are used — no article text.

## Sending

- One row per reader per UTC day in `cms_reader_alert_sends`; the `INSERT OR
  IGNORE` is the claim, so a second run the same day skips that reader.
- A reader with no matching headline receives nothing.
- Missing `RESEND_API_KEY` or sender returns `not_configured` and sends nothing.
- A provider failure is recorded per reader and the run continues.

## Owner screen

`/admin/alerts` previews the day: readers with a match, headlines matched, how
many already received today and a three-reader sample. **Send today's digest**
runs the same code the preview counted.

## Data

`migrations/0014_reader_alerts.sql` creates `cms_reader_alert_sends`.

## Not yet

- No automatic schedule: sending is an owner action, because a cron that reads
  secrets needs separate authorization in this repository.
- No per-reader frequency choice and no quiet hours.

## Verification

`test/modules/CB-M16/alerts.test.mjs` covers the keyword map, per-reader
matching, the one-per-day rule, the unconfigured path, the preview and the route
wiring.
