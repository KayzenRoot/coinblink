# CB-M10-P1-NEWSLETTER-001 · double opt-in subscriber list

Status: public subscribe endpoint, confirmation and unsubscribe links, and an
owner list. Sending depends on a verified Resend domain; until then a
subscription stays `pending` and the failure is recorded.

## Flow

1. `POST /api/newsletter/subscribe` with `email` (form or JSON) and optional
   `locale` (`en`, `pt-br`, `es`).
   - Malformed address → `400 invalid_email`.
   - Any well-formed address → `202 accepted`, whether it was new, already
     pending or already confirmed. The response never reveals list membership.
2. A new or returning address gets a fresh pending row and a 32-byte token. The
   token is stored only as a SHA-256 digest and travels only by email.
3. `GET /newsletter/confirm?token=...` confirms the row; the same link with
   `&action=unsubscribe` removes it. Confirmation is single use through the
   `status='pending'` guard, and the digest is kept so the same link can
   unsubscribe later.
4. `/admin/newsletter` lists the last 100 rows and the counts per state.

## Email

The confirmation message is sent with the existing `sendEmail` from M10, using
`RESEND_API_KEY` and `COINBLINK_EMAIL_FROM` from the owner settings or the
Worker environment. If sending fails the row stays pending and
`email_failed` is recorded in `cms_ops_events` (M14), so `/admin/ops` shows it.

## Data

`migrations/0009_newsletter.sql` creates `cms_newsletter_subscribers`. Rows are
never deleted — a trigger refuses `DELETE` — and unsubscribing sets
`status='unsubscribed'`.

## Verification

`test/modules/CB-M10/newsletter.test.mjs` covers normalization, the pending
token, the confirmed address that is not re-subscribed, single-use confirmation,
unsubscription, counts and listing, the owner section without tokens, and the
route contract.
