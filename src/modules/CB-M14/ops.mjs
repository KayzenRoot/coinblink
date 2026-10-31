// CB-M14-P1-OPS-CONSOLE-001: one owner screen that answers "what is the
// platform doing right now and what still blocks a launch".
//
// Every number is read from D1 or from the deployed build; nothing is
// estimated and nothing editorial is rendered.

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function number(value) {
  return Number.isFinite(Number(value)) ? String(Number(value)) : '0';
}

export async function readOps({ db, nowMs }) {
  const counts = await db.prepare(
    'SELECT (SELECT COUNT(*) FROM cms_drafts WHERE owner_id=1) AS drafts, '
    + '(SELECT COUNT(*) FROM cms_credentials WHERE owner_id=1 AND revoked_at IS NULL) AS passkeys, '
    + '(SELECT COUNT(*) FROM cms_research_notes WHERE owner_id=1) AS notes',
  ).first();
  const api = await db.prepare(
    'SELECT COUNT(*) AS keys, COALESCE(SUM(CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END),0) AS active '
    + 'FROM cms_api_keys',
  ).first();
  const usage = await db.prepare(
    'SELECT COALESCE(SUM(calls),0) AS calls FROM cms_api_usage WHERE period=?',
  ).bind(new Date(nowMs).toISOString().slice(0, 7)).first();
  const views = await db.prepare('SELECT COALESCE(SUM(views),0) AS total FROM cms_pageviews').first();
  return Object.freeze({
    drafts: Number(counts?.drafts ?? 0),
    passkeys: Number(counts?.passkeys ?? 0),
    notes: Number(counts?.notes ?? 0),
    apiKeys: Number(api?.keys ?? 0),
    apiKeysActive: Number(api?.active ?? 0),
    apiCalls: Number(usage?.calls ?? 0),
    pageviews: Number(views?.total ?? 0),
  });
}

/**
 * Launch gates are facts, not opinions: each row is true only when the
 * measured state allows it. A missing fact stays false with the reason shown.
 */
export function launchGates({ ops, billing, research }) {
  return Object.freeze([
    Object.freeze({
      id: 'owner-recovery',
      label: 'Owner has a primary and a recovery passkey',
      pass: ops.passkeys >= 2,
      detail: number(ops.passkeys) + ' active passkey(s)',
    }),
    Object.freeze({
      id: 'billing',
      label: 'Stripe test billing configured and subscribed',
      pass: billing.missing.length === 0 && billing.active === true,
      detail: billing.missing.length === 0
        ? (billing.active ? 'subscription active' : 'no active subscription')
        : 'missing: ' + billing.missing.join(', '),
    }),
    Object.freeze({
      id: 'api-key',
      label: 'At least one live API key for partner access',
      pass: ops.apiKeysActive > 0,
      detail: number(ops.apiKeysActive) + ' active of ' + number(ops.apiKeys),
    }),
    Object.freeze({
      id: 'research-cap',
      label: 'Research desk inside the daily cap',
      pass: research.used < research.cap,
      detail: research.used + ' / ' + research.cap + ' notes today',
    }),
  ]);
}

export function opsPage({ ops, gates, build, subscription, csrf }) {
  const rows = [
    ['Deployed commit', '<code>' + escapeHtml(build.sha) + '</code> (' + escapeHtml(build.environment) + ')'],
    ['Subscription', subscription === null
      ? 'none'
      : escapeHtml(subscription.status) + ' · <code>' + escapeHtml(subscription.priceId ?? '—') + '</code>'],
    ['API keys', number(ops.apiKeysActive) + ' active of ' + number(ops.apiKeys) + ' · ' + number(ops.apiCalls) + ' calls this month'],
    ['Drafts', number(ops.drafts)],
    ['Research notes', number(ops.notes)],
    ['Pageviews (all time)', number(ops.pageviews)],
  ];
  const gateRows = gates.map((gate) => '<tr><td>' + (gate.pass ? '<strong>PASS</strong>' : 'BLOCKED')
    + '</td><td>' + escapeHtml(gate.label) + '</td><td>' + escapeHtml(gate.detail) + '</td></tr>').join('');
  return '<p><a href="/admin">Owner workspace</a> · <a href="/admin/billing">Billing</a>'
    + ' · <a href="/admin/api">API access</a> · <a href="/admin/analytics">Analytics</a>'
    + ' · <a href="/admin/research">Research desk</a></p>'
    + '<dl class="admin__facts">' + rows.map(([term, value]) => '<dt>' + escapeHtml(term) + '</dt><dd>' + value + '</dd>').join('') + '</dl>'
    + '<h2>Launch gates</h2>'
    + '<table class="admin__table"><thead><tr><th>State</th><th>Gate</th><th>Measured</th></tr></thead><tbody>'
    + gateRows + '</tbody></table>'
    + '<p class="admin__note">Every value is read from D1 or from the deployed build. '
    + 'A gate is PASS only when the measured state allows it.</p>'
    + '<form method="post" action="/admin/logout">'
    + '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">'
    + '<button type="submit">Sign out</button></form>';
}
