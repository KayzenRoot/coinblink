# CB-M04-P1-LIVE-ADAPTER-001 | Optional third-party market adapter

## What this is

A real provider integration for M04, built so that turning it on is a deployment decision, not a code change. It stays **off** by default because the offline M04 model requires verified rights before a quote may be shown (`rightsStatus: NOT_CLEARED`, `REQUIRES_VERIFIED_LICENSE_AND_REAL_PROVIDER_CONTRACT`), and a keyless public endpoint is not that licence.

## How it behaves

| Deployment state | Page | Network |
|---|---|---|
| `PUBLIC_MARKET_LIVE` unset or not affirmative | `LIVE FEED DISABLED`, with the reason that no request was made | none |
| enabled and the provider answers | live table with pair, USD price, source, observation time | one request per 60 s window |
| enabled and the provider fails | `LIVE FEED UNAVAILABLE` with a machine reason (`TIMEOUT`, `NETWORK`, `HTTP_<code>`, `NO_FETCH`) | none shown as data |

Only `1`, `true`, `enabled` or `on` (case-insensitive, trimmed) enable it. Everything else, including `0`, `false`, `no`, empty and non-strings, keeps it disabled.

## Safety rules

- **Strict projection.** The payload must be a plain object carrying a positive finite `usd` price for each of the three assets. Anything else throws and becomes `UNAVAILABLE`; a missing, zero, negative, `NaN` or infinite price is never rendered.
- **Attribution always.** Every live value is shown with `Market data by CoinGecko` and a link, plus `RIGHTS UNREVIEWED`, `NOT INVESTMENT ADVICE` and `NO ORDER FLOW` in the page.
- **Bounded quota.** A per-process cache holds one snapshot for 60 seconds, so a burst of visitors cannot exhaust a free quota. The provider is never asked without the switch.
- **No storage, no orders, no accounts.** The adapter reads and renders; it does not persist, trade or authenticate.
- **Fail closed.** A timeout aborts at 4 seconds; an HTTP error or malformed payload produces no price at all.

## Enabling it

Set the repository variable `PUBLIC_MARKET_LIVE=enabled` (Settings → Secrets and variables → Actions → Variables). The deploy workflow already forwards it into the production build. For local runs, add the same name to `.env` and rebuild.

Before enabling, confirm that the provider's terms allow displaying its data on this demo with attribution. This document records the engineering position, not a legal clearance.

## Explicitly not done

No commercial use claim, no redistribution claim, no price history, no charts, no trading, no subscription and no account. The offline market lab remains the default surface.
