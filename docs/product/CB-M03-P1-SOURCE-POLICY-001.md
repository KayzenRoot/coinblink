# CB-M03-P1-SOURCE-POLICY-001 · hide a collector from readers

Status: the owner hides or shows a collector from `/admin/sources` without a
deploy. Hiding is display-level: the collector keeps fetching.

## Why display-level

Collection and display are different risks. Hiding at the display layer is
reversible in one click, keeps the collected history, and cannot break the
collector. Disabling collection entirely would need a deploy and would lose the
window while the source is off.

## Rules

- `cms_source_policy(source_id, hidden, note, updated_at)`; a database without
  the migration hides nothing.
- The reader filters items **and** the feed list by `sourceId`, so a hidden
  source disappears from the live panel and from the locale news index.
- The admin screen lists every collector from `LIVE_NEWS_SOURCES` with its
  current state and note, and one toggle per row.

## Verification

`test/modules/CB-M03/source-policy.test.mjs` covers the toggle round-trip, an
invalid id, the missing-table path, the snapshot filter and the owner screen.
