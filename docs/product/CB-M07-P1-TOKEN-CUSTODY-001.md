# CB-M07-P1-TOKEN-CUSTODY-001 · encrypted social token custody

Status: implemented. The owner can connect X from `/admin/social`; the access
and refresh tokens are encrypted at rest. Publishing is still disabled.

## Flow

1. `GET /api/oauth/x/start` requires the owner session, creates a PKCE pair and
   inserts a one-use SHA-256 state digest in `cms_social_oauth_states`, then
   redirects to X with the S256 challenge.
2. X redirects to `/api/oauth/x/callback`. The callback checks the state cookie,
   atomically consumes the D1 state row, exchanges the code, reads the public
   profile and hands the tokens to the vault.
3. `/admin/social` lists the connected handle and scopes. Disconnect deletes the
   row with the owner session and form CSRF value.

The owner cookie is `SameSite=Strict`, so it is not sent on the cross-site
redirect back from X. The D1 state digest proves the flow was started by the
owner; the state cookie still binds it to the same browser. A replayed or
expired callback is refused.

## Encryption

`token-vault.mjs` derives an AES-256-GCM key with HKDF-SHA256 from
`M05_SESSION_SECRET` (salt `coinblink-m07-vault`, info `social-token-v1`). Each
token gets a random 12-byte IV. Only ciphertext and IVs are stored; the raw
access and refresh tokens are never written to a table, log or page. The
`cms_social_accounts` row keeps the provider, account id, username, display
name, scopes, expiry and timestamps.

## Data

`migrations/0004_social.sql` creates `cms_social_oauth_states` and
`cms_social_accounts`. The state table is consumed with a single conditional
`UPDATE`, so concurrent callbacks cannot both succeed.

## Publishing

No posting endpoint exists. The page states that connecting an account does not
publish anything. A future approval flow must decrypt a token only inside the
posting request, re-check the owner session and show the exact payload before
sending it.

## Verification

`test/modules/CB-M07/token-vault.test.mjs` covers the AES-GCM round-trip, wrong
key and tampering failures, ciphertext-only storage, one-use state, owner-scoped
revocation, the page render and the route wiring. The OAuth tests assert that
the exchange now returns the refresh token and the callback hands it to the
vault. `/admin/social` is in the anonymous 404 guard.
