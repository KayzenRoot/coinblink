# CB-M14-P1-OPS-CONSOLE-001 · owner operations console

Status: `/admin/ops` renders measured platform state and the launch gates that
are still closed. It is owner-only and shares the `/admin` fail-closed 404.

## Why

The owner had a workspace with links and separate screens for billing, API
access, analytics and research, but no single place that answers "what is
deployed, what is being used and what still blocks a launch" without reading
logs or querying D1 by hand.

## Contract

Every value comes from D1 or from the deployed build:

| Fact | Source |
|---|---|
| Deployed commit and environment | `buildInfo` |
| Subscription status and price | `billingStatus` (M12) |
| API keys active / total, calls this month | `cms_api_keys`, `cms_api_usage` (M11) |
| Drafts, research notes, pageviews | `cms_drafts`, `cms_research_notes`, `cms_pageviews` |

## Launch gates

A gate is `PASS` only when the measured state allows it; anything unmeasured
stays `BLOCKED` with the reason:

1. Owner has a primary and a recovery passkey (`cms_credentials` count ≥ 2).
2. Stripe billing configured and subscribed (no missing keys and an entitling
   subscription).
3. At least one live API key.
4. Research desk inside the daily cap.

The page never invents a green state and renders no editorial content.

## Verification

`test/modules/CB-M14/ops.test.mjs` covers the measured counts, the gate
predicate in both directions, the rendered page (no scripts, both states shown)
and the route wiring plus the dashboard link.
