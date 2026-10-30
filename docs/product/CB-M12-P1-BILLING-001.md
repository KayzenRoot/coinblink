# CB-M12-P1-BILLING-001 · Stripe test-mode billing

Status: implemented for Stripe **test mode**. Live keys are refused. No card
data is stored by CoinBlink.

## Keys

The module reads `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` and `COINBLINK_TEST_EMAIL` from
the owner settings store, falling back to Worker secrets/vars. Only
`sk_test_...` is accepted; a live key makes checkout fail closed with a clear
message.

## Checkout

`/admin/billing` shows the current entitlement and, when the test keys and both
price IDs are present, two forms:

- `POST /admin/billing/checkout` with `plan=monthly` or `plan=yearly`.

The Worker creates a Stripe Checkout Session in `subscription` mode with
`client_reference_id` and `metadata.owner_id = 1`, the success/cancel URLs on
`/admin/billing`, and the configured test email as `customer_email`. Stripe
hosts the payment page; CoinBlink never sees a card number.

`form-action` in the global CSP also governs the redirect target of a form POST,
so the policy allows `https://checkout.stripe.com` — the only external origin in
the CSP. Without it the session is created but the browser refuses the
redirection and the owner stays on the billing page.

The success and cancel URLs point at `/billing/return?status=...`, a public
endpoint that only 303s to `/admin/billing?checkout=...`. The owner cookie is
`SameSite=Strict`, so the cross-site navigation from Stripe carries no session;
the second, same-site hop does, and the authenticated page renders the outcome.

## Webhook

`POST /api/stripe/webhook` is public but authenticated by the
`Stripe-Signature` HMAC-SHA256 over `timestamp.payload`, with a 300-second
tolerance and a timing-safe comparison. It handles:

- `checkout.session.completed`: records the Stripe customer id and email.
- `customer.subscription.created`, `.updated`, `.deleted`: upserts status,
  price, period end and cancel-at-period-end. Stripe moved the period end to the
  subscription item, so the handler reads the subscription field first and then
  `items.data[0].current_period_end`.
- `invoice.paid`: recorded for idempotency; entitlement follows the
  subscription status.

`cms_billing_events` makes processing idempotent; a duplicate event returns
`duplicate: true` without a second write. Subscription upserts are idempotent.

## Entitlement

Only `active` and `trialing` subscriptions are entitled. `past_due`, `canceled`
and `incomplete` are not. `cms_billing_subscriptions` keeps the latest state
per Stripe subscription and `cms_billing_customers` maps owner 1 to one Stripe
customer.

## Data

`migrations/0006_billing.sql` creates the customer, subscription and event
tables. Event rows are append-only. No payment method, card, CVC or bank data
is written.

## Test procedure

1. Configure the test keys and both price IDs in `/admin/settings` (or Worker
   secrets).
2. Open `/admin/billing`, choose monthly or yearly.
3. Pay with `4242 4242 4242 4242`, any future expiry and any CVC.
4. Stripe redirects to `/admin/billing?checkout=success`; the webhook writes the
   subscription and the page shows the active plan.

The temporary `stripe-test-setup.yml` workflow creates the test products
($9/month and $90/year), recreates the webhook endpoint and writes the Stripe
secret and webhook secret to the Worker with `wrangler secret put`. It refuses
non-test keys and prints only non-secret IDs.

## Verification

`test/modules/CB-M12/billing.test.mjs` covers signature acceptance/rejection,
expiry, tampering, idempotent subscription/customer writes, checkout body and
test-key guard, missing settings, live-key refusal, entitlement states, page
rendering and route wiring. `/admin/billing` is in the anonymous 404 guard.
