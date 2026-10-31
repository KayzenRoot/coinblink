// CB-M10-P1-NEWSLETTER-001: double opt-in list.
//
// `subscribe` never reveals whether an address was already present: it always
// answers the same way. Only the confirmation token confirms an address, and a
// confirmed address can leave through the same token.

export const LOCALES = Object.freeze(['en', 'pt-br', 'es']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

function hex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

async function digestOf(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return hex(new Uint8Array(digest));
}

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL.test(email)) return null;
  return email;
}

export function normalizeLocale(value) {
  return LOCALES.includes(value) ? value : 'en';
}

/**
 * Creates or refreshes a pending subscription. A confirmed address keeps its
 * state and receives no new token; an unsubscribed address can come back.
 * Returns `{ status: 'created' | 'existing' | 'invalid', token? }`.
 */
export async function subscribe({ db, email, locale, nowMs = Date.now() }) {
  const clean = normalizeEmail(email);
  if (clean === null) return Object.freeze({ status: 'invalid' });
  const now = Math.floor(nowMs / 1000);
  const current = await db.prepare('SELECT status FROM cms_newsletter_subscribers WHERE email = ?')
    .bind(clean).first() ?? null;
  if (current !== null && current.status === 'confirmed') return Object.freeze({ status: 'existing' });
  const token = randomToken();
  await db.prepare(
    'INSERT INTO cms_newsletter_subscribers(email,locale,status,token_digest,created_at) VALUES (?,?,\'pending\',?,?) '
    + 'ON CONFLICT(email) DO UPDATE SET locale=excluded.locale, status=\'pending\', '
    + 'token_digest=excluded.token_digest, unsubscribed_at=NULL, confirmed_at=NULL',
  ).bind(clean, normalizeLocale(locale), await digestOf(token), now).run();
  return Object.freeze({ status: 'created', token, email: clean });
}

export async function confirm({ db, token, nowMs = Date.now() }) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/u.test(token)) return Object.freeze({ status: 'invalid' });
  const now = Math.floor(nowMs / 1000);
  // The token digest stays, so the same link can also unsubscribe later; single
  // use comes from the status guard, not from rotating the secret.
  const result = await db.prepare(
    'UPDATE cms_newsletter_subscribers SET status=\'confirmed\', confirmed_at=? '
    + 'WHERE token_digest=? AND status=\'pending\'',
  ).bind(now, await digestOf(token)).run();
  return Object.freeze({ status: result?.meta?.changes === 1 ? 'confirmed' : 'unknown' });
}

export async function unsubscribe({ db, token, nowMs = Date.now() }) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/u.test(token)) return Object.freeze({ status: 'invalid' });
  const now = Math.floor(nowMs / 1000);
  const result = await db.prepare(
    'UPDATE cms_newsletter_subscribers SET status=\'unsubscribed\', unsubscribed_at=? '
    + 'WHERE token_digest=? AND status=\'confirmed\'',
  ).bind(now, await digestOf(token)).run();
  return Object.freeze({ status: result?.meta?.changes === 1 ? 'unsubscribed' : 'unknown' });
}

export async function listSubscribers({ db, limit = 100 }) {
  const rows = await db.prepare(
    'SELECT email, locale, status, created_at AS createdAt, confirmed_at AS confirmedAt '
    + 'FROM cms_newsletter_subscribers ORDER BY created_at DESC LIMIT ?',
  ).bind(Math.min(Math.max(Number(limit) || 100, 1), 500)).all();
  return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
    email: row.email,
    locale: row.locale,
    status: row.status,
    createdAt: Number(row.createdAt),
    confirmedAt: row.confirmedAt === null ? null : Number(row.confirmedAt),
  })));
}

export async function subscriberCounts({ db }) {
  const rows = await db.prepare(
    'SELECT status, COUNT(*) AS total FROM cms_newsletter_subscribers GROUP BY status',
  ).all();
  const counts = { pending: 0, confirmed: 0, unsubscribed: 0 };
  for (const row of rows?.results ?? []) counts[row.status] = Number(row.total);
  return Object.freeze(counts);
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function subscribersSection({ subscribers, counts }) {
  const rows = subscribers.length === 0
    ? '<p>No subscribers yet.</p>'
    : '<table class="admin__table"><thead><tr><th>Email</th><th>Locale</th><th>Status</th>'
      + '<th>Created</th><th>Confirmed</th></tr></thead><tbody>'
      + subscribers.map((row) => '<tr><td>' + escapeHtml(row.email) + '</td><td>' + escapeHtml(row.locale)
        + '</td><td>' + escapeHtml(row.status) + '</td><td>'
        + escapeHtml(new Date(row.createdAt * 1000).toISOString()) + '</td><td>'
        + (row.confirmedAt === null ? '—' : escapeHtml(new Date(row.confirmedAt * 1000).toISOString()))
        + '</td></tr>').join('') + '</tbody></table>';
  return '<dl class="admin__facts"><dt>Confirmed</dt><dd>' + counts.confirmed + '</dd>'
    + '<dt>Pending</dt><dd>' + counts.pending + '</dd>'
    + '<dt>Unsubscribed</dt><dd>' + counts.unsubscribed + '</dd></dl>'
    + rows;
}
