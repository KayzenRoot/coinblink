# CB-M05-P1-SETTINGS-001 · owner integration settings

Status: implemented. `/admin/settings` manages the integration keys used by the
owner modules. Values are encrypted in D1 and a stored secret is never rendered
back.

## Catalog

| Group | Keys |
|---|---|
| Email | `RESEND_API_KEY` (secret), `COINBLINK_EMAIL_FROM`, `COINBLINK_TEST_EMAIL` |
| Billing | `STRIPE_SECRET_KEY` (secret), `STRIPE_WEBHOOK_SECRET` (secret), `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` |
| Social | `X_CLIENT_ID`, `X_CLIENT_SECRET` (secret), `META_APP_ID`, `META_APP_SECRET` (secret), `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` (secret) |
| AI | `M08_MODEL` |

Each key has an exact shape check. Unknown keys are refused. Core Worker
secrets (`M05_SESSION_SECRET`, `M05_RP_ID`, `M05_ORIGIN`, the Cloudflare API
token) are deliberately not editable here: rotating them from a web form would
invalidate sessions and the encrypted token/settings vault.

## Storage and precedence

`migrations/0005_settings.sql` creates `cms_settings` and an append-only
`cms_settings_audit`. Values are encrypted with AES-256-GCM under an HKDF key
derived from `M05_SESSION_SECRET` with info `settings-v1` (the social vault uses
`social-token-v1`). A database value overrides the Worker environment; when no
row exists, the Worker secret or var is used. Secret rows render as
`configured — enter a new value to replace`; only non-secret values are shown.

The panel requires the owner session and the form CSRF value. Save and clear
write an audit row with the key name only, never the value. A test email writes
a `test_email` audit row.

## Test email

`POST /admin/settings/test-email` reads `RESEND_API_KEY`,
`COINBLINK_EMAIL_FROM` and `COINBLINK_TEST_EMAIL`, sends one message through
`https://api.resend.com/emails` and renders the provider result. The API key is
never logged or rendered.

Resend requires a verified domain to send to arbitrary recipients. On
2026-10-30 the account had no verified domain, so the provider only accepts the
account owner's address (`astermir402@gmail.com`) with `onboarding@resend.dev`.
`founder@nexlabs.company` starts working after `nexlabs.company` is verified in
Resend and the DNS records (SPF/DKIM) are added; the sender can then be changed
to an address on that domain.

## Verification

`test/modules/CB-M05/production-settings.test.mjs` covers validation, the
encrypted write, environment fallback, secret hiding, clearing, the page, the
Resend adapter, the test send and the route wiring. `/admin/settings` is in the
anonymous 404 guard.
