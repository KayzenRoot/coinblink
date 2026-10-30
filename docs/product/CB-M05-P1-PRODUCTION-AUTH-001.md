# CB-M05-P1-PRODUCTION-AUTH-001 · owner passkey authentication

Status: implemented. The production Worker now exposes a passkey-only owner
entry point on the D1 schema created by `0001_owner.sql`.

## Routes

| Route | Behaviour |
|---|---|
| `GET /admin` | Valid owner session → dashboard; otherwise an indistinguishable 404. |
| `GET /admin/login` | Public sign-in page while the owner environment is enabled. Redirects to `/admin` when a session already exists. |
| `POST /admin/login/challenge` | Returns a WebAuthn assertion challenge for the active primary credential. |
| `POST /admin/login` | Verifies the assertion, advances the counter, creates a session and sets `__Host-cb_owner`. |
| `POST /admin/logout` | Revokes the current session and clears the cookie. |
| `GET /admin/bootstrap` | One-time registration page; 404 once an owner exists. |
| `POST /admin/bootstrap/challenge` | Validates the bootstrap ticket and returns registration options. |
| `POST /admin/bootstrap/claim` | Verifies the attestation and atomically creates the owner, primary credential and audit event. |

All production responses are `no-store`, `noindex`, same-origin and require the
request origin to match `M05_ORIGIN`. Writes also require `Origin` and
`Sec-Fetch-Site: same-origin`.

## Credentials and sessions

- The bootstrap ticket is minted out of band, valid for 15 minutes and stored
  only as an HMAC-SHA256 digest. It works once.
- Registration and login use `@simplewebauthn/server` with ES256, user
  verification required and the RP ID from `M05_RP_ID`.
- Sessions are 32 random bytes, stored as an HMAC digest, valid for 12 hours,
  revocable, and carried in `__Host-cb_owner` (`Secure`, `HttpOnly`,
  `SameSite=Strict`, `Path=/`).
- No access token, refresh token, credential secret or session value is logged
  or rendered.

## Recovery passkey

The owner can enroll one recovery passkey from the authenticated dashboard. The
enrollment challenge is bound to the current session digest and issuer
credential, requires the CSRF value issued at login, excludes the active
credential and writes a `device_enrolled` audit event. The login page exposes
two entries: primary and recovery; each request selects the matching active
credential, so a lost primary does not lock the owner out. The session's CSRF
value is carried in `cb_owner_csrf` (`Secure`, `SameSite=Strict`, scoped to
`/admin`, readable by the same-origin form code) and must be sent as
`x-cb-csrf` for enrollment.

## Configuration

Worker secrets/vars (never commit real values):

```
M05_OWNER_ENABLED=true
M05_SESSION_SECRET=<64 hex>
M05_RP_ID=kayzendev.workers.dev
M05_ORIGIN=https://coinblink-production.kayzendev.workers.dev
```

`CMS_DB` is the reviewed D1 binding. The public client is
`/admin-auth.js`; the stylesheet is `/admin.css`. Both are same-origin and
contain no third-party script.

## Boundaries

- This is the owner CMS gate, not reader accounts. No social login, email
  password, wallet or third-party auth provider is used.
- Publishing, billing, customer data and real rights remain disabled.
- The local synthetic CMS and its tests are untouched; production never accepts
  the local test opt-in.

## Verification

- `test/modules/CB-M05/production-owner-auth.test.mjs` — environment gate, HMAC,
  origin checks, fail-closed bootstrap/login and asset/secret contracts.
- `e2e/m05-admin-prod-guard.spec.mjs` — anonymous `/admin` and owner entry
  points stay 404 without the production owner environment.
- The real ceremony is completed in Chrome against the deployed Worker; the
  dashboard is only served after a valid passkey assertion.
