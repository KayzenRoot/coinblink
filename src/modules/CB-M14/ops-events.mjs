// CB-M14-P1-ALERTS-001: operational events and the alert feed.
//
// Events are written only where a real failure already returns an error, so the
// feed cannot invent a problem. Alerts are derived from measured state plus the
// last 24 hours of events; nothing is estimated.

export const EVENT_TYPES = Object.freeze([
  'webhook_invalid_signature',
  'webhook_invalid_event',
  'research_failed',
  'email_failed',
]);

const DETAIL_LIMIT = 200;
const DAY_SECONDS = 86_400;

export async function recordOpsEvent({ db, type, detail = '', nowMs = Date.now() }) {
  if (!EVENT_TYPES.includes(type)) return false;
  const clean = String(detail).replaceAll(/[\r\n\t]+/gu, ' ').slice(0, DETAIL_LIMIT);
  await db.prepare('INSERT INTO cms_ops_events(type,detail,created_at) VALUES (?,?,?)')
    .bind(type, clean, Math.floor(nowMs / 1000)).run();
  return true;
}

export async function listOpsEvents({ db, limit = 20 }) {
  const rows = await db.prepare(
    'SELECT type, detail, created_at AS createdAt FROM cms_ops_events ORDER BY created_at DESC, id DESC LIMIT ?',
  ).bind(Math.min(Math.max(Number(limit) || 20, 1), 100)).all();
  return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
    type: row.type,
    detail: row.detail,
    createdAt: Number(row.createdAt),
  })));
}

export async function countOpsEvents({ db, nowMs, windowSeconds = DAY_SECONDS }) {
  const since = Math.floor(nowMs / 1000) - windowSeconds;
  const row = await db.prepare('SELECT COUNT(*) AS total FROM cms_ops_events WHERE created_at >= ?')
    .bind(since).first();
  return Number(row?.total ?? 0);
}

/**
 * Alerts are ordered by severity and always carry the measurement that raised
 * them. `quotaNear` receives keys already resolved with calls and limit.
 */
export function buildAlerts({ subscription, quotaNear, eventsLastDay, research, nowMs }) {
  const alerts = [];
  if (subscription === null) {
    alerts.push({ severity: 'warning', id: 'billing-missing', text: 'No subscription row; checkout was never completed.' });
  } else if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    alerts.push({ severity: 'critical', id: 'billing-status', text: 'Subscription status is ' + subscription.status + '.' });
  }
  if (eventsLastDay > 0) {
    alerts.push({
      severity: 'critical',
      id: 'ops-events',
      text: eventsLastDay + ' operational event(s) in the last 24h.',
    });
  }
  for (const key of quotaNear) {
    alerts.push({
      severity: key.calls >= key.limit ? 'critical' : 'warning',
      id: 'quota-' + key.keyId,
      text: 'Key ' + key.label + ' used ' + key.calls + ' of ' + key.limit + ' calls this month.',
    });
  }
  if (research.used >= research.cap) {
    alerts.push({ severity: 'warning', id: 'research-cap', text: 'Research desk reached the daily cap.' });
  }
  return Object.freeze(alerts.map((alert) => Object.freeze({ ...alert, at: nowMs })));
}

/** Keys at 90% or more of the monthly limit, worst first. */
export function keysNearQuota(keys) {
  return Object.freeze(keys
    .filter((key) => key.revokedAt === null && key.limit > 0 && key.calls * 10 >= key.limit * 9)
    .sort((a, b) => (b.calls / b.limit) - (a.calls / a.limit)));
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function alertsSection({ alerts, events }) {
  const list = alerts.length === 0
    ? '<p>No alerts. Every measured signal is inside its limit.</p>'
    : '<ul class="admin__alerts">' + alerts.map((alert) => '<li class="admin__alert admin__alert--'
      + escapeHtml(alert.severity) + '">' + escapeHtml(alert.text) + '</li>').join('') + '</ul>';
  const rows = events.length === 0
    ? '<p>No operational events recorded.</p>'
    : '<table class="admin__table"><thead><tr><th>When</th><th>Type</th><th>Detail</th></tr></thead><tbody>'
      + events.map((event) => '<tr><td>' + escapeHtml(new Date(event.createdAt * 1000).toISOString())
        + '</td><td><code>' + escapeHtml(event.type) + '</code></td><td>' + escapeHtml(event.detail || '—')
        + '</td></tr>').join('') + '</tbody></table>';
  return '<h2>Alerts</h2>' + list + '<h2>Recent operational events</h2>' + rows;
}
