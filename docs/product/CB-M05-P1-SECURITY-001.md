# CB-M05-P1-SECURITY-001 · owner security and audit

Status: implemented. `/admin/security` lists the owner's passkeys, active
sessions and append-only audit events, with bounded revocation.

## Behaviour

- Passkeys show kind, status and a revoke action. The **last active passkey can
  never be revoked**; revoking the passkey used by the current session signs the
  owner out and clears both cookies.
- Active sessions show the issuing credential, issue/expiry time and whether the
  row is the current session. Other sessions can be revoked; the current one
  signs out through the normal logout path.
- Audit events are read from `cms_audit_events` in reverse chronological order,
  capped at 50. Subjects are truncated to a 12-character prefix; no session
  token, credential secret or HMAC digest is rendered.
- Every write requires the owner session and the form CSRF value; the last
  passkey guard is enforced server-side, not only in the template.

## Verification

`test/modules/CB-M05/production-security.test.mjs` covers the empty security
render, the last-passkey guard, current-session handling and the route surface.
The admin e2e adds `/admin/security` to the anonymous 404 guard.
