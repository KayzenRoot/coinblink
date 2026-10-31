# CB-M07-P1-MANUAL-TOKEN-001 · pasted token for Instagram and TikTok

Status: while the Instagram and TikTok developer apps are not connected, the
owner can paste an access token and it is stored with the same AES-GCM vault as
the X tokens.

## Rules

- Only `instagram` and `tiktok` are accepted; any other provider is refused.
- The handle is 2–40 characters of letters, digits, dot, dash or underscore; a
  leading `@` is stripped.
- The token must be 20–4096 characters. It is encrypted with
  `social-token-v1` and **never rendered back**; the account row stores
  `manual:<handle>` as its account id.
- Re-pasting the same handle replaces the ciphertext and keeps one row.

## Not yet

- No OAuth flow for these providers: that needs their developer apps and
  redirect URIs.
- No refresh: a pasted token is used as-is and expires when the provider says.

## Verification

`test/modules/CB-M03/source-policy.test.mjs` covers the encryption, the stored
shape and the three refusals (provider, handle, token length).
