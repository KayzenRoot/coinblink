# CB-M14-P1-COST-REPORT-001 · provider cost inputs

Status: `node scripts/cost-report.mjs [--days N] [--json]` prints the measured
drivers of the Cloudflare bill for the production Worker.

## Why not in the Worker

The Cloudflare API token is a deploy credential. Putting it in the Worker to
render a dashboard would turn a read-only report into a live attack surface.
The report runs from the operator machine or CI, where the token already lives,
and `/admin/ops` keeps showing the product-owned counters (pageviews, API calls,
research notes) that need no external credential.

## What it reads

| Counter | Source |
|---|---|
| Worker requests and errors | `workersInvocationsAdaptive` |
| D1 rows read and written | `d1AnalyticsAdaptiveGroups` |
| Workers AI neurons | `aiInferenceAdaptiveGroups` (`sum.totalNeurons`) |

The query is filtered by account, time window and, when set, `scriptName`
(`COINBLINK_CF_WORKER_NAME`, default `coinblink-production`) and `databaseId`.
A GraphQL error is surfaced with its message instead of printing zeros.

## Environment

- `CLOUDFLARE_API_TOKEN` — needs Account Analytics read.
- `CLOUDFLARE_ACCOUNT_ID`

Both are required; the script exits `2` without them.

## Observed

```
$ node scripts/cost-report.mjs --days 3
CoinBlink provider cost inputs
window: 2026-10-28T13:18:36.324Z → 2026-10-31T13:18:36.324Z

Workers requests: 2136
Workers errors:   0
D1 rows read:     1712
D1 rows written:  352
Workers AI neurons: 9.248
  script coinblink-production: 2136 requests, 0 errors
  model @cf/meta/llama-3.1-8b-instruct-fp8: 9.248 neurons
```

## Gaps

- Stripe fees and Resend usage are not included; billing provider exports remain
  the source for those.
- The report is manual. A scheduled job would need the token as a CI secret.

## Verification

`test/modules/CB-M14/cost.test.mjs` covers the envelope normalization, the API
error path, the query window and filters, token and HTTP failures, and the
formatted report.
