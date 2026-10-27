# CB-M16-P0-LOCAL-WATCHLIST-001 · Local evidence bundle

**Pinned main base:** `04d73c63080171215ca2297408b5f12e592222ee`. **Isolated branch:** `feat/cb-m16-p0-local-watchlist-001`.

## Context and boundary
- Catalog Issue #23 and the long M16 Work Order stay `PLANNED / NOT_ADMITTED / NO CODE AUTHORIZED`. This increment is one bounded **LOCAL synthetic** watchlist preview only. It does not admit M16, does not create an alert service and does not touch production.
- Owned paths only: `src/modules/CB-M16/**`, `src/pages/demo/watchlist.astro`, `test/modules/CB-M16/**`, `e2e/m16-local-watchlist.spec.mjs`, `.github/workflows/m16-local-watchlist.yml`, `docs/product/CB-M16-P0-LOCAL-WATCHLIST-001.md` and this bundle. No shared file, demo navigation, admin route, dependency, lockfile, workflow of another module, or other PR is modified.

## Product and security negative contract
- `watchlist-model.mjs` exposes an immutable four-entry fictional catalog (`btc`, `eth`, `stable`, `index`) with `id` and `label` only, and a pure calculator that accepts distinct allowlisted ids plus a direction in `none|above|below`.
- Every accepted input, including all four entries with a direction, returns `status=LOCAL_PREVIEW_ONLY`, `mode=LOCAL_SYNTHETIC`, `alertDelivery=NOT_CONFIGURED`, `alertsEnabled=false`, `notificationsSent=0`, `realTimeData=false`, `live=false`, `providerConnected=false`, `personalDataStored=false`, `accountRequired=false`, `pushEnabled=false`, `emailEnabled=false`, frozen `actions=[]` and a frozen copy of the selection.
- Rejected inputs return `INVALID_PREVIEW` with no state: non-arrays, duplicates, unknown ids, `__proto__`, `constructor`, path-like values, wrong types, out-of-catalog extras, and any direction outside the allowlist.
- `/demo/watchlist` renders the noindex BaseLayout demo with four native checkboxes, a native select, a polite status and a keyboard reset. The blocked banner is a static constant in markup. State is browser-only and clears on reset and reload.
- Asserted absence in Node static contracts: no `fetch`, `XMLHttpRequest`, `sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `innerHTML`, `outerHTML`, `iframe`, `form`, e-mail or password field, `img`, `document.cookie`, `process.env`, `Notification`, `serviceWorker` or `/admin/api`.

## Local verification performed
- `node --test test/modules/CB-M16/*.test.mjs` — see the pull request for the recorded result.
- `npm run build` on Node 22.19.0.
- `playwright test e2e/m16-local-watchlist.spec.mjs e2e/m04-market-demo.spec.mjs`: no third-party requests, no page-initiated non-GET request, no page errors, axe WCAG A/AA with zero violations, no horizontal overflow at 320/390/768/1366/1536 px, and `/admin` plus `/admin/login` denied.
- Not performed: any real market feed, provider connection, alert delivery, account, personal data, consent record, deployment, D1 remote, paid service or production claim. Not verified by a separate human reviewer.

## STOP
PR remains Draft. Never Ready, merge, deploy, monitor a real market, deliver a real alert, spend, or use real data or credentials.
