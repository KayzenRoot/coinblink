# CB-M14-P1-ALERT-EMAIL-001 · operational alerts by email

Status: the first operational event of a type inside an hour is emailed to the
owner address. Repeats are only recorded. Delivery is best effort.

## Why

`/admin/ops` showed alerts only to someone already looking at the page. A
rejected Stripe webhook at night stayed invisible until the next visit.

## Contract

`notifyEvent` runs after `recordOpsEvent` in the Stripe webhook:

- `isFirstInWindow` counts the same event type in the last hour
  (`ALERT_WINDOW_SECONDS = 3600`); only the first one is emailed, so a burst of
  bad requests cannot flood the inbox.
- Settings come from the owner store, falling back to the Worker environment:
  `RESEND_API_KEY`, `COINBLINK_EMAIL_FROM`, `COINBLINK_TEST_EMAIL`.
- Missing settings return `not_configured`; a provider error returns `failed`.
  Neither changes the HTTP response of the webhook, which stays `400` for a
  rejected request.
- Subjects are fixed per type, and the body carries the type, the UTC timestamp
  and the detail.

## Not yet

- Only the webhook paths notify. Research and email failures are recorded but
  not emailed.
- No digest, no per-severity routing and no acknowledgement.

## Verification

`test/modules/CB-M14/alert-email.test.mjs` covers the window predicate, a sent
message with subject and detail, throttling, missing settings, an unknown type,
a provider failure and a thrown fetch, and the webhook wiring.
