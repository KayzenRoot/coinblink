# CB-M16-P1-READERS-001 · reader accounts by magic link and watchlists

Status: a reader signs in with an emailed one-use link, keeps a watchlist of up
to 20 symbols and can sign out. Email alerts are the next increment.

## Account

- `POST /api/reader/login` always answers the same way: a browser form gets a
  `303` back to `/reader/signin?sent=1`, an API client gets `202 accepted`.
  The endpoint never reveals whether the address already had an account.
- A reader row is created as `pending` and becomes `active` only when a link is
  consumed.
- The link token is 32 random bytes, stored as a SHA-256 digest, expires in
  **15 minutes** and works once. Requests are throttled to **5 per reader per
  hour**.
- `GET /reader/login?token=...` consumes the token, opens a 30-day session and
  sets `cb_reader` (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`).
- `POST /reader/logout` revokes the session server-side and clears the cookie.

## Watchlist

`/reader` requires a session and lists the symbols. `POST /reader/watchlist`
adds or removes one, requires `Origin` to match the request origin, accepts
2–12 uppercase alphanumeric characters and caps the list at 20.

## Data

`migrations/0013_readers.sql` creates `cms_readers`, `cms_reader_tokens`,
`cms_reader_sessions` and `cms_watchlist`. Tokens and sessions are digests only.

## Not yet

- Email alerts per symbol: the watchlist is stored but nothing is sent.
- Password recovery, profile editing and account deletion.
- Rate limiting by IP (only per reader is enforced).

## Verification

`test/modules/CB-M16/readers.test.mjs` covers normalization, the single-use and
expiry rules, throttling, the session lifetime, logout, the bounded watchlist,
the emailed link and the route wiring including the origin check.
