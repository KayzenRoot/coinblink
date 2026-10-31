# CB-M14-P1-ALERTS-001 · operational events and the alert feed

Status: `/admin/ops` shows an alert list and the last 20 operational events.
Events are written only where a failure already returns an error, so the feed
cannot invent a problem.

## Events

`migrations/0008_ops_events.sql` creates `cms_ops_events` with an allowlist:

- `webhook_invalid_signature` — Stripe webhook rejected by the HMAC check
- `webhook_invalid_event` — payload is not JSON or the event is malformed
- `research_failed` — reserved for the research desk
- `email_failed` — reserved for the email sender

Rows are append-only: triggers refuse `UPDATE` and `DELETE`. Details are
flattened to one line and capped at 200 characters.

The Stripe webhook already rejected these requests; it now also records them, so
the owner can see a signature mismatch instead of only reading logs.

## Alerts

`buildAlerts` derives alerts from measured state:

| Alert | Severity | Measurement |
|---|---|---|
| `billing-missing` | warning | no subscription row |
| `billing-status` | critical | subscription status is not `active`/`trialing` |
| `ops-events` | critical | any operational event in the last 24h |
| `quota-<key>` | warning at 90%, critical at 100% | calls vs monthly limit per live key |
| `research-cap` | warning | daily research cap reached |

Every alert carries the numbers that raised it, and an empty list renders
"No alerts" instead of a green claim about anything unmeasured.

## Verification

`test/modules/CB-M14/ops-events.test.mjs` covers the type allowlist, detail
flattening and truncation, newest-first listing, window counting, alert
derivation and ordering, the 90% quota threshold, both render states and the
webhook/route wiring.
