# CB-M15-P1-LAUNCH-GATE-001 · owner launch readiness

Status: `/admin/launch` shows ten gates. Seven are measured from D1 or from the
deployed configuration; three are owner decisions and never turn `PASS` on their
own.

## Why

The readiness criteria were spread across `/admin/ops`, billing, the API page
and the drill document. A single page that answers "can this launch?" — and says
exactly what blocks it — replaces the reading.

## Measured gates

| Gate | Measurement |
|---|---|
| Primary and recovery passkey | `cms_credentials` active count ≥ 2 |
| Entitling subscription and Stripe settings | `billingStatus` plus `missingBillingKeys` |
| Live API key for partner access | active `cms_api_keys` ≥ 1 |
| Email sender and Resend key configured | `RESEND_API_KEY` and `COINBLINK_EMAIL_FROM` present |
| Newsletter opt-in confirmed at least once | `cms_newsletter_subscribers` with `status='confirmed'` |
| No operational event in the last 24h | `cms_ops_events` count in the window |
| Owner origin on a custom domain | `M05_ORIGIN` is https and not `*.workers.dev` |

## Manual gates

`rights`, `legal` and `signoff` render as `MANUAL`. They are owner decisions and
are never derived from data, so the verdict cannot become `READY` because
everything measurable happened to pass.

## Verdict

`launchVerdict` returns `ready` only when no measured gate is `BLOCKED` and no
manual item is outstanding, and the page states the counts otherwise.

## Verification

`test/modules/CB-M15/launch.test.mjs` covers the healthy state, every failing
measurement with its number, the manual items that never pass, the verdict in
both directions, the rendered page and the route plus dashboard link.
