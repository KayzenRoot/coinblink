# Incident drill · 2026-10-31 · production

Environment: `https://coinblink-production.kayzendev.workers.dev`, deploy
`c29b3c2`. Every value below is an observed response or a row read back from
D1 — nothing is simulated in prose.

## Scenario 1 · Stripe webhook without a valid signature

```
$ date -u +%FT%TZ
2026-10-31T12:56:00Z
$ curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "stripe-signature: t=1,v1=deadbeef" -d '{"id":"evt_drill"}' \
    .../api/stripe/webhook
400
```

Read back:

```
webhook_invalid_signature | rejected by signature check | 2026-10-31T12:56:02.000Z
```

Expected and observed: the request is rejected, one append-only event is
recorded, and `/admin/ops` raises the critical `ops-events` alert for the last
24 hours.

## Scenario 2 · Monthly quota exhaustion

A sandbox key was created directly in D1 with the month counter pre-set to
999 of 1000, then called twice.

```
call1=200 call2=429
Retry-After: 39817
```

Read back:

```
label=Drill prefix=cbk_96ba9612 calls=1000 period=2026-10
```

Expected and observed: the first call is served and counts, the second is
refused with `429 QUOTA_EXCEEDED` and `Retry-After` pointing at the first
instant of the next UTC month. The key was revoked right after the drill, so
`keysNearQuota` no longer reports it.

## Scenario 3 · Subscription cancellation (procedure, not executed today)

Cancelling the only active test subscription would leave the owner without an
entitlement until a new checkout, so the drill stops at the procedure:

1. `DELETE /v1/subscriptions/{id}` in Stripe test mode.
2. Stripe sends `customer.subscription.deleted`; `handleStripeEvent` stores
   `status=canceled`.
3. `/admin/ops` must show the critical `billing-status` alert and gate 2 must
   flip to `BLOCKED`; `/admin/billing` must show the plan without entitlement.
4. Recover with a new test checkout (`4242 4242 4242 4242`).

## What the drill proved

- A rejected webhook is visible to the owner without reading logs.
- The quota guard refuses the call that would exceed the limit, with a usable
  `Retry-After`, and the counter cannot exceed the plan limit.
- Alerts derive from measured rows, and a revoked key stops raising quota
  alerts.

## Known gaps

- Alerts are in-app only; there is no email or push notification yet.
- Scenario 3 has a documented procedure but no executed evidence.
- Cost observability (Workers, D1 and AI usage) is not wired to this page.
