// CB-M05-P1-SECURITY-001: owner security and audit surface.
//
// Read-only history plus bounded revocation. The last active passkey can never
// be revoked; revoking the credential used by this session signs the owner out.
import { escapeHtml, page } from './owner-auth.mjs';

const CREDENTIAL_ID = /^[A-Za-z0-9_-]{12,512}$/u;
const HEX64 = /^[0-9a-f]{64}$/u;

function short(value) {
  return escapeHtml(String(value ?? '').slice(0, 12));
}

export async function securityPage({ db, csrf, currentDigest, now, error = '' }) {
  const credentials = (await db.prepare('SELECT credential_id,device_kind,revoked_at FROM cms_credentials WHERE owner_id=1 ORDER BY device_kind,revoked_at').all())?.results ?? [];
  const sessions = (await db.prepare('SELECT s.session_digest,s.credential_id,s.issued_at,s.expires_at,c.device_kind FROM cms_sessions s JOIN cms_credentials c ON c.credential_id=s.credential_id WHERE s.owner_id=1 AND s.revoked_at IS NULL AND s.expires_at>? ORDER BY s.issued_at DESC').bind(now).all())?.results ?? [];
  const events = (await db.prepare('SELECT event,actor,subject,device_kind,created_at FROM cms_audit_events ORDER BY created_at DESC LIMIT 50').all())?.results ?? [];
  const activeCredentials = credentials.filter((entry) => entry.revoked_at === null);
  const credentialRows = credentials.map((entry) => {
    const active = entry.revoked_at === null;
    return '<tr><td><code>' + short(entry.credential_id) + '…</code></td><td>' + escapeHtml(entry.device_kind)
      + '</td><td>' + (active ? 'active' : 'revoked') + '</td><td>'
      + (active && activeCredentials.length > 1
        ? '<form method="post" action="/admin/security/credential/revoke">'
          + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
          + '<input type="hidden" name="credentialId" value="' + escapeHtml(entry.credential_id) + '">'
          + '<button type="submit">Revoke</button></form>'
        : '—') + '</td></tr>';
  }).join('');
  const sessionRows = sessions.map((entry) => '<tr><td><code>' + short(entry.session_digest) + '…</code></td><td>'
    + escapeHtml(entry.device_kind) + '</td><td>' + escapeHtml(new Date(entry.issued_at * 1000).toISOString())
    + '</td><td>' + escapeHtml(new Date(entry.expires_at * 1000).toISOString()) + '</td><td>'
    + (entry.session_digest === currentDigest ? 'this session' : '<form method="post" action="/admin/security/session/revoke">'
      + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
      + '<input type="hidden" name="digest" value="' + escapeHtml(entry.session_digest) + '">'
      + '<button type="submit">Revoke</button></form>') + '</td></tr>').join('');
  const eventRows = events.map((entry) => '<li><strong>' + escapeHtml(entry.event) + '</strong> · '
    + escapeHtml(entry.actor) + (entry.subject ? ' · <code>' + short(entry.subject) + '…</code>' : '')
    + (entry.device_kind ? ' · ' + escapeHtml(entry.device_kind) : '')
    + ' <span class="admin__note">· ' + escapeHtml(new Date(entry.created_at * 1000).toISOString()) + '</span></li>').join('');
  return page('Security and audit',
    (error === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(error) + '</p>')
    + '<p><a href="/admin">Owner workspace</a> · <a href="/admin/drafts">Drafts</a></p>'
    + '<h2>Passkeys</h2><table class="admin__table"><thead><tr><th>Credential</th><th>Kind</th><th>Status</th><th></th></tr></thead><tbody>'
    + credentialRows + '</tbody></table>'
    + '<h2>Active sessions</h2><table class="admin__table"><thead><tr><th>Session</th><th>Kind</th><th>Issued</th><th>Expires</th><th></th></tr></thead><tbody>'
    + sessionRows + '</tbody></table>'
    + '<h2>Audit events</h2><ul class="admin__drafts">' + eventRows + '</ul>'
    + '<p class="admin__note">The last active passkey cannot be revoked. Revoking this session\'s passkey signs you out.</p>');
}

export async function revokeCredential({ db, credentialId, currentCredentialId, now }) {
  if (!CREDENTIAL_ID.test(credentialId ?? '')) return { status: 'missing' };
  const target = await db.prepare('SELECT credential_id,device_kind FROM cms_credentials WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL').bind(credentialId).first();
  if (!target) return { status: 'missing' };
  const active = await db.prepare('SELECT COUNT(*) AS n FROM cms_credentials WHERE owner_id=1 AND revoked_at IS NULL').first();
  if (Number(active?.n) <= 1) return { status: 'last' };
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare('UPDATE cms_credentials SET revoked_at=? WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL').bind(now, credentialId),
    db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE credential_id=? AND revoked_at IS NULL').bind(now, credentialId),
    db.prepare("INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at) VALUES (?,'device_revoked','owner-session',?,?,?)").bind(marker, credentialId, target.device_kind, now),
  ]);
  if (results[0]?.meta?.changes !== 1 || results[2]?.meta?.changes !== 1) return { status: 'conflict' };
  return { status: 'revoked', current: credentialId === currentCredentialId };
}

export async function revokeSession({ db, digest, currentDigest, now }) {
  if (!HEX64.test(digest ?? '')) return { status: 'missing' };
  if (digest === currentDigest) return { status: 'current' };
  const result = await db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE session_digest=? AND owner_id=1 AND revoked_at IS NULL').bind(now, digest).run();
  return result?.meta?.changes === 1 ? { status: 'revoked' } : { status: 'missing' };
}
