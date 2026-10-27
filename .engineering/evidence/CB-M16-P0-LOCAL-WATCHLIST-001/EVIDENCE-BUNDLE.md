# CB-M16-P0-LOCAL-WATCHLIST-001 · Local evidence bundle

**Pinned main base:** `04d73c63080171215ca2297408b5f12e592222ee`. **Isolated branch:** `feat/cb-m16-p0-local-watchlist-001`.

## Context and boundary
- Catalog Issue #23 and the long M16 Work Order stay `PLANNED / NOT_ADMITTED / NO CODE AUTHORIZED`. This is one bounded **LOCAL synthetic** watchlist preview. It does not admit M16, does not create an alert service and does not touch production.
- The owned path set is listed in the Work Order document. No shared file, demo navigation, admin route, dependency, lockfile, workflow of another module or other PR is modified.

## Capability under test
- Ordered list management: add a fictional entry, move it up or down, remove it, reset. The browser spec exercises the reorder through the keyboard (`focus` then `Enter`), because mouse-only coverage would miss the focus-restoration path.
- Focus restoration is asserted explicitly: after an entry moves to the first position its `Move up` control becomes disabled, and focus must land on that entry's remaining enabled move control instead of falling back to the document body.

## Negative contract
- `watchlist-model.mjs` exposes an immutable four-entry catalog (`btc`, `eth`, `stable`, `index`) carrying `id` and `label` only, plus directions `none|above|below`.
- `moveLocalWatchlistEntry` returns a new frozen array, or `null` at the edges, for an unknown id, for a non-allowlisted or duplicated order, and for an unsupported direction; the input is never mutated.
- `buildLocalWatchlist` returns `LOCAL_PREVIEW_ONLY` with `alertDelivery=NOT_CONFIGURED`, `alertsEnabled=false`, `notificationsSent=0`, `realTimeData=false`, `live=false`, `providerConnected=false`, `personalDataStored=false`, `accountRequired=false`, `pushEnabled=false`, `emailEnabled=false`, `orderLocked=false` and frozen `actions=[]` for every accepted input, and `INVALID_PREVIEW` otherwise.
- Asserted absence across shipped browser sources: no `fetch`, `XMLHttpRequest`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `innerHTML`, `outerHTML`, `iframe`, `form`, e-mail or password field, `img`, `document.cookie`, `process.env`, `new Notification`, `Notification.requestPermission`, `serviceWorker` or `/admin/api`.

## Local verification performed
- `node --test test/modules/CB-M16/watchlist-model.test.mjs`: 5 contracts, all passing.
- `npm run lint` (`--max-warnings=0`): clean. `npm run typecheck`: 0 errors, 0 warnings.
- `npm run build` on Node 22.19.0.
- `playwright test e2e/m16-local-watchlist.spec.mjs e2e/m04-market-demo.spec.mjs`: 3 passed, with axe WCAG A/AA at zero violations, no horizontal overflow across the five widths, no third-party request, no page-initiated non-GET request, no page errors, and `/admin` plus `/admin/login` denied.
- A first browser run failed and was correctly diagnosed as a stale build rather than a product defect; the spec was re-run after rebuilding.

## Not performed
Any real market feed, provider connection, alert delivery, account, personal data, consent record, deployment, remote D1, paid service or production claim. Not verified by a separate human reviewer.

## STOP
PR remains Draft. Never Ready, merge, deploy, monitor a real market, deliver a real alert, spend, or use real data or credentials.
