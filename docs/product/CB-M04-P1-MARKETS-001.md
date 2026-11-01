# CB-M04-P1-MARKETS-001 · attributed market prices, display only

Status: the public markets page and the home ticker show CoinGecko prices with
attribution, behind `PUBLIC_MARKETS_LIVE`, with a monthly budget guard.

## Rules

- **Display only**: no order flow, no storage of prices, no redistribution
  through the paid API. The snapshot states `side: NO_ORDER_FLOW` and
  `commercialUseAllowed: false`.
- **Attribution** is rendered next to the quotes ("Market data by CoinGecko")
  and the page states the delay (60 seconds) and "not investment advice".
- **Fail closed**: timeout, HTTP error, malformed payload or a missing asset
  becomes `UNAVAILABLE` with a reason; no price is guessed or shown stale.
- **Budget guard**: `cms_provider_calls` counts calls per provider per UTC month
  with an atomic `WHERE calls < limit`. The cap is 8,000 against the Demo plan's
  10,000, so a busy month cannot exhaust the account. A database without the
  migration does not block the feed.
- The demo key travels in `x-cg-demo-api-key`, never in the URL.

## Where it renders

- `/en/markets`, `/pt-br/markets`, `/es/markets`.
- The home ticker strip, which falls back to the reviewed placeholder wording
  when the feed is off or unavailable.

## Rights caveat

The CoinGecko Demo plan is meant for demonstration and requires attribution; it
is not a commercial redistribution licence. Before charging for market data or
exposing it through `/v1`, a paid plan or a licensed provider is required. This
is recorded as a manual item in `/admin/launch`.

## Verification

`test/modules/CB-M04/markets-page.test.mjs` covers the enable switch, the
attribution and delay fields, three malformed payloads, two provider failures,
the budget guard (including a missing table), the key header and the page plus
ticker wiring.
