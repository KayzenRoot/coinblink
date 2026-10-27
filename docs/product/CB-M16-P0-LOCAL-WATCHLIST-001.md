# CB-M16-P0-LOCAL-WATCHLIST-001 | Synthetic ordered watchlist preview

## Scope, authority and frozen base
- This is one bounded LOCAL fictitious UI increment, not admission of full M16 personalization work, not an alert service and not a production authorization. The long M16 Work Order and Issue #23 stay PLANNED / NOT ADMITTED.
- Main base `04d73c63080171215ca2297408b5f12e592222ee` (protected main after the M13/M14/M15 merges). Isolated branch `feat/cb-m16-p0-local-watchlist-001`.
- Owned files only: pure M16 model, Astro component, demo route, static JS/CSS, Node tests, browser spec, read-only CI workflow, this document and the Evidence Bundle. No shared file, demo navigation, admin route, dependency, lockfile, workflow of another module or other PR is modified.

## What this increment adds beyond a static preview
- The capability under test is **list management**, not a single checkbox count: a fictional catalog, an add-to-watchlist action, and per-entry **Move up / Move down / Remove** controls that must stay keyboard-operable while the list is re-rendered.
- Keyboard focus survives a reorder. After an entry moves, focus lands on the entry's remaining enabled move control, so a keyboard user is never dropped to the document body.

## Explicit fail-closed contract
- Immutable pure catalog of four fictional entries (`btc`, `eth`, `stable`, `index`), each carrying only `id` and `label`. Directions are limited to `none`, `above`, `below`.
- `moveLocalWatchlistEntry` swaps an entry with its neighbour and returns a new frozen array. It returns `null` at the first and last positions, for an unknown id, for a non-allowlisted or duplicated order, and for any direction outside the allowlist. It never mutates its input.
- `buildLocalWatchlist` accepts only distinct allowlisted ids within the catalog size and an allowlisted direction. Anything else fails closed with `INVALID_PREVIEW`.
- Every accepted ordering and direction returns `status=LOCAL_PREVIEW_ONLY`, `mode=LOCAL_SYNTHETIC`, `alertDelivery=NOT_CONFIGURED`, `alertsEnabled=false`, `notificationsSent=0`, `realTimeData=false`, `live=false`, `providerConnected=false`, `personalDataStored=false`, `accountRequired=false`, `pushEnabled=false`, `emailEnabled=false` and frozen `actions=[]`.
- `/demo/watchlist` is a noindex BaseLayout page built from external CSP-compatible JS/CSS. Rows are created with `createElement` and `textContent`; the list is refreshed with `replaceChildren`. State is browser-only and clears on reset and reload. No storage, network, cookie, notification, service worker, account, e-mail or privileged endpoint.
- axe WCAG A/AA, no horizontal overflow at 320/390/768/1366/1536 px, no third-party request, no page-initiated non-GET browser request, and `/admin` stays denied.

## Mandatory proof and STOP
- Local proof: Node contracts for the model and shipped browser sources, `npm run lint`, `npm run build`, `npm run typecheck`, and the Chromium spec pairing M16 with the existing M04 market demo regression.
- Exceptional claim boundary: a real watchlist needs reader privacy and consent review, provider licensing, live market data, delivery infrastructure and separate documented owner decisions. All of that is NOT_RUN / NOT_ADMITTED here.
- STOP: PR remains Draft. Never Ready, merge, deploy, monitor a real market, deliver a real alert, spend, use real data or credentials, or modify other PRs, main or checkpoints.
