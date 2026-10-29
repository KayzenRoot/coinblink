# Security response headers

Every response from the Astro middleware (`src/middleware.ts`) carries the
reviewed header set below. The same values are asserted by a Node security
contract and by the M00 browser test against real routes.

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; media-src 'self'; frame-src 'none'; worker-src 'none'` | Only same-origin scripts, styles, fonts and connections; no framing, plugins, workers or inline code |
| `Permissions-Policy` | `accelerometer=(), browsing-topics=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()` | The product needs none of these browser capabilities |
| `Referrer-Policy` | `no-referrer` | Outbound publisher links must not leak the reader's path or query |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolate the browsing context; the site opens no cross-origin windows |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | One year of HTTPS-only for the worker host; ignored when served over HTTP |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing, especially for the JSON endpoints |
| `X-Frame-Options` | `DENY` | Redundant with `frame-ancestors` for older clients |
| `X-Robots-Tag` | `noindex, nofollow, noarchive` | The whole deployment is a labelled demo |

## Deliberate choices

- **No `unsafe-inline` or `unsafe-eval`.** The one inline style introduced while
  documenting the status API was moved to the external stylesheet because the
  CSP correctly blocked it.
- **No `Cross-Origin-Resource-Policy`.** The public status endpoint is meant to
  be read cross-origin through CORS; CORP is not needed for that and would
  surprise non-CORS consumers.
- **No `upgrade-insecure-requests`.** Local development runs over HTTP and the
  directive would rewrite same-origin development URLs.
- **HSTS is sent by the app, not only by Cloudflare,** so a future host keeps
  the policy without relying on provider defaults.

## Verification

- `test/security/security-headers.test.mjs` pins the header set, the CSP
  directives and the absence of unsafe keywords.
- `e2e/m00-shell.spec.mjs` requests `/en`, `/health`, `/preview-status` and an
  unknown route and asserts every header, so middleware regressions fail in a
  browser as well.
- The shared surfaces sweep fails on any page error, which catches resources
  blocked by the CSP.
