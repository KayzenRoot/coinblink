# CB-M11-P1-API-KEYS-001 · API keys, plans and metered access

Status: owner-issued keys with monthly quota, metering and revocation. The
rights gate is unchanged: the metered endpoint serves **content-free
operational metadata**, never third-party article text.

## Keys

`/admin/api` lists keys and creates them. A key is `cbk_<16 hex>.<64 hex>`,
returned exactly once in the response to the creation POST. Only the SHA-256
digest and a 12-character display prefix are stored in `cms_api_keys`; nothing
can recover the secret afterwards. Keys are revoked, never deleted — a trigger
refuses `DELETE`, so usage history always points at a real row.

## Plans and quota

| Plan | Calls per UTC month | Requires an entitling subscription |
|---|---|---|
| Sandbox | 1 000 | no |
| Starter | 25 000 | yes |
| Pro | 250 000 | yes |

The entitlement comes from `billingStatus` (M12): only `active` and `trialing`
subscriptions unlock paid plans. Without one, only Sandbox can be created.

## Metering

`cms_api_usage(key_id, period, calls)` counts calls per key per UTC month.
Consumption is one atomic upsert:

```sql
INSERT INTO cms_api_usage(key_id,period,calls,updated_at) VALUES (?,?,1,?)
ON CONFLICT(key_id,period) DO UPDATE SET calls=calls+1, updated_at=excluded.updated_at
WHERE calls < ?
```

`meta.changes = 0` means the guard refused the increment, so two concurrent
calls can never exceed the limit.

## Metered endpoint

`GET /v1/status` requires `Authorization: Bearer <key>` or `x-api-key: <key>`:

- `401 API_KEY_REQUIRED` / `401 INVALID_API_KEY` with `WWW-Authenticate: Bearer`
- `403 API_KEY_REVOKED`
- `429 QUOTA_EXCEEDED` with `Retry-After` set to the seconds until the next UTC month
- `200` with `contract`, `plan`, `quota` (`limit`, `used`, `remaining`, `period`)
  and the content-free collection status

The response is `cache-control: no-store` because it is metered per key, and it
states `redistribution: false` plus the attribution path.

## Data

`migrations/0007_api_keys.sql` creates `cms_api_keys` and `cms_api_usage`.

## Verification

`test/modules/CB-M11/api-keys.test.mjs` covers the one-time secret, digest-only
storage, label and plan validation, the four authentication outcomes, header
precedence, atomic quota exhaustion, UTC period buckets, listing without
secrets, the owner screen and the route contract.
