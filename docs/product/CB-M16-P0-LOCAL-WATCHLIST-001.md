# CB-M16-P0-LOCAL-WATCHLIST-001 | Synthetic no-delivery watchlist preview

## Scope, authority and frozen base
- This is one bounded LOCAL fictitious UI increment, not admission of full M16 personalization work, not an alert service and not a production authorization. The long M16 Work Order and Issue #23 stay PLANNED / NOT ADMITTED.
- Main base `04d73c63080171215ca2297408b5f12e592222ee` (protected main after the M13/M14/M15 merges). Isolated branch `feat/cb-m16-p0-local-watchlist-001`.
- Only owned files: pure M16 model, Astro component, demo route, static JS/CSS, Node tests, browser spec, read-only CI workflow, this document and the Evidence Bundle. No changes to shared files, the demo navigation, admin, production infrastructure, package or lockfiles, security controls, rulesets or other PRs.

## Explicit fail-closed contract
- Immutable pure catalog of four fictional entries: `btc`, `eth`, `stable`, `index`. Each carries only `id` and `label`.
- Pure calculator accepts only distinct bounded allowlisted ids and a direction of `none`, `above` or `below`. Anything else, including duplicated, unknown, prototype-polluted, path-like or non-array input, fails closed with `INVALID_PREVIEW`.
- Any accepted selection, including all four entries with a direction set, returns `status=LOCAL_PREVIEW_ONLY`, `mode=LOCAL_SYNTHETIC`, `alertDelivery=NOT_CONFIGURED`, `alertsEnabled=false`, `notificationsSent=0`, `realTimeData=false`, `live=false`, `providerConnected=false`, `personalDataStored=false`, `accountRequired=false`, `pushEnabled=false`, `emailEnabled=false` and frozen `actions=[]`.
- `/demo/watchlist` uses BaseLayout noindex, external CSP-compatible JS/CSS, native checkboxes and a native select, a polite live status and a keyboard reset. Reset and reload clear all state. No storage, network, cookie, notification, service worker, account, e-mail or privileged endpoint.
- axe WCAG A/AA, no horizontal overflow at 320/390/768/1366/1536 px, no third-party requests, no page-initiated non-GET browser request, and `/admin` stays denied.

## Mandatory proof and STOP
- Local proof: Node contracts for the model and static browser contracts, `npm run build`, and the dedicated Chromium spec pairing M16 with the existing M04 market demo regression.
- Exceptional claim boundary: a real watchlist needs reader privacy and consent review, provider licensing, live market data, delivery infrastructure and separate documented owner decisions. All of that is NOT_RUN / NOT_ADMITTED here.
- STOP: PR remains Draft. Never Ready, merge, deploy, publish, monitor a real market, deliver a real alert, spend, use real data or credentials, or modify other PRs, main or checkpoints.
