# CB-M07-P1-X-OAUTH-001 · X OAuth 2.0 connection check

Status: implemented. The X app configured by the owner can complete an OAuth
2.0 authorization-code flow with PKCE, and the callback shows the authenticated
handle. It deliberately stores no token and publishes nothing.

## Routes

- `GET /api/oauth/x/start` — reads `X_CLIENT_ID` from the Worker runtime,
  creates a state value and an S256 PKCE pair, stores both in `HttpOnly`,
  `Secure`, `SameSite=Lax` cookies scoped to `/api/oauth/x`, and redirects to
  X with `tweet.read tweet.write users.read offline.access`.
- `GET /api/oauth/x/callback` — validates the state cookie, exchanges the code
  with `X_CLIENT_SECRET` using HTTP Basic auth, calls `/2/users/me`, clears the
  cookies and renders the handle.

The redirect URI is derived from the request origin plus
`/api/oauth/x/callback`, matching the app configured as
`https://coinblink-production.kayzendev.workers.dev/api/oauth/x/callback`.

## Security

- `X_CLIENT_ID` and `X_CLIENT_SECRET` are Worker runtime secrets, read through
  `cloudflare:workers` env; they are never inlined at build time, logged or
  rendered.
- The access and refresh tokens live only inside the callback request. They are
  not stored, logged or put in the HTML.
- State and verifier are single-use cookies with a 10-minute lifetime; a
  mismatch, an error from X or a failed exchange returns a generic page.
- The pages are `no-store`, `noindex` and make no external asset request.
- Publishing remains disabled until M05 provides owner storage, authorization
  and token custody. This increment proves the app and callback only.

## Configuration

Add to `D:\Projects\coinblink-main\.env` (never commit):

```
X_CLIENT_ID=
X_CLIENT_SECRET=
```

The same names are listed in `docs/automation/env.example`. For production,
they are written as Worker secrets (`wrangler secret put`) without printing the
values.

## Verification

`test/modules/CB-M07/x-oauth.test.mjs` covers PKCE S256, the authorize URL,
callback normalization, the token exchange (including Basic auth and body),
viewer projection, HTML escaping and the absence of storage/logging/token
rendering in both routes. `e2e/m07-x-oauth.spec.mjs` proves both routes exist
and fail closed with 503 while the credentials are absent.
