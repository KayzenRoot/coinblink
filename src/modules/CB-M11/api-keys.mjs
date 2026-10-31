// CB-M11-P1-API-KEYS-001: owner-issued API keys, plans, monthly quota and
// metering for the partner-facing beta endpoint.
//
// The presented key is shown once and stored only as a SHA-256 digest plus a
// short display prefix. Quota consumption is a single atomic upsert, so two
// concurrent calls can never exceed the plan limit.

export const API_PLANS = Object.freeze({
  sandbox: Object.freeze({ limit: 1_000, label: 'Sandbox' }),
  starter: Object.freeze({ limit: 25_000, label: 'Starter' }),
  pro: Object.freeze({ limit: 250_000, label: 'Pro' }),
});

const PLAN_IDS = Object.freeze(Object.keys(API_PLANS));
const PAID_PLANS = Object.freeze(['starter', 'pro']);
const KEY_PATTERN = /^cbk_[0-9a-f]{16}\.[0-9a-f]{64}$/u;
const PREFIX_LENGTH = 12;

function hex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function randomHex(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

async function digestOf(key) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return hex(new Uint8Array(digest));
}

/** UTC month bucket, the unit every plan limit is counted in. */
export function usagePeriod(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 7);
}

/** First instant of the next UTC month, in seconds, for Retry-After. */
export function periodResetSeconds(nowMs) {
  const now = new Date(nowMs);
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  return Math.max(1, Math.ceil((next - nowMs) / 1000));
}

/** A paid plan requires an entitling subscription; sandbox never does. */
export function planAllowed({ plan, active }) {
  if (!PLAN_IDS.includes(plan)) return false;
  return active === true || !PAID_PLANS.includes(plan);
}

export function quotaFor(plan) {
  return API_PLANS[plan]?.limit ?? 0;
}

export async function createApiKey({ db, label, plan, active, nowMs = Date.now() }) {
  const cleanLabel = String(label ?? '').trim();
  if (cleanLabel.length < 2 || cleanLabel.length > 60) {
    throw new Error('Label must be between 2 and 60 characters.');
  }
  if (!planAllowed({ plan, active })) {
    throw new Error('Plan ' + String(plan) + ' needs an active subscription.');
  }
  const keyId = randomHex(8);
  const presented = 'cbk_' + keyId + '.' + randomHex(32);
  const now = Math.floor(nowMs / 1000);
  await db.prepare(
    'INSERT INTO cms_api_keys(key_id,owner_id,label,prefix,secret_digest,plan,created_at) VALUES (?,1,?,?,?,?,?)',
  ).bind(keyId, cleanLabel, presented.slice(0, PREFIX_LENGTH), await digestOf(presented), plan, now).run();
  return Object.freeze({ keyId, key: presented, plan, label: cleanLabel, createdAt: now });
}

/** Accepts `Authorization: Bearer <key>` or `x-api-key: <key>`. */
export function readPresentedKey(request) {
  const header = request?.headers?.get?.('authorization') ?? '';
  if (/^bearer\s+\S+$/iu.test(header)) return header.replace(/^bearer\s+/iu, '').trim();
  const direct = request?.headers?.get?.('x-api-key') ?? '';
  return direct.trim();
}

export async function authenticateApiKey({ db, presented }) {
  if (typeof presented !== 'string' || !KEY_PATTERN.test(presented)) {
    return Object.freeze({ status: 'missing' });
  }
  const row = await db.prepare(
    'SELECT key_id AS keyId, plan, revoked_at AS revokedAt FROM cms_api_keys WHERE secret_digest = ?',
  ).bind(await digestOf(presented)).first() ?? null;
  if (row === null) return Object.freeze({ status: 'invalid' });
  if (row.revokedAt !== null && row.revokedAt !== undefined) {
    return Object.freeze({ status: 'revoked', keyId: row.keyId, plan: row.plan });
  }
  return Object.freeze({ status: 'ok', keyId: row.keyId, plan: row.plan });
}

/**
 * Counts one call against the plan limit and reports the remaining allowance.
 * `meta.changes === 0` means the guard refused the increment: the quota is
 * already spent and the caller must be told 429.
 */
export async function consumeQuota({ db, keyId, plan, nowMs = Date.now() }) {
  const period = usagePeriod(nowMs);
  const limit = quotaFor(plan);
  const now = Math.floor(nowMs / 1000);
  const inserted = await db.prepare(
    'INSERT INTO cms_api_usage(key_id,period,calls,updated_at) VALUES (?,?,1,?) '
    + 'ON CONFLICT(key_id,period) DO UPDATE SET calls=calls+1, updated_at=excluded.updated_at WHERE calls < ?',
  ).bind(keyId, period, now, limit).run();
  const allowed = inserted?.meta?.changes === 1;
  const row = await db.prepare('SELECT calls FROM cms_api_usage WHERE key_id = ? AND period = ?')
    .bind(keyId, period).first() ?? null;
  const used = Number(row?.calls ?? 0);
  await db.prepare('UPDATE cms_api_keys SET last_used_at = ? WHERE key_id = ?').bind(now, keyId).run();
  return Object.freeze({
    allowed,
    used: allowed ? used : Math.min(used, limit),
    limit,
    remaining: Math.max(0, limit - used),
    period,
    resetsInSeconds: periodResetSeconds(nowMs),
  });
}

export async function listApiKeys({ db, nowMs = Date.now() }) {
  const period = usagePeriod(nowMs);
  const rows = await db.prepare(
    'SELECT k.key_id AS keyId, k.label, k.prefix, k.plan, k.created_at AS createdAt, '
    + 'k.last_used_at AS lastUsedAt, k.revoked_at AS revokedAt, COALESCE(u.calls, 0) AS calls '
    + 'FROM cms_api_keys k LEFT JOIN cms_api_usage u ON u.key_id = k.key_id AND u.period = ? '
    + 'ORDER BY k.created_at DESC',
  ).bind(period).all();
  return Object.freeze((rows?.results ?? []).map((row) => Object.freeze({
    keyId: row.keyId,
    label: row.label,
    prefix: row.prefix,
    plan: row.plan,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
    calls: Number(row.calls ?? 0),
    limit: quotaFor(row.plan),
    period,
  })));
}

export async function revokeApiKey({ db, keyId, nowMs = Date.now() }) {
  if (typeof keyId !== 'string' || !/^[0-9a-f]{16}$/u.test(keyId)) return false;
  const result = await db.prepare('UPDATE cms_api_keys SET revoked_at = ? WHERE key_id = ? AND revoked_at IS NULL')
    .bind(Math.floor(nowMs / 1000), keyId).run();
  return result?.meta?.changes === 1;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function csrfField(csrf) {
  return '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
}

/**
 * Owner-facing API access screen. `issued` carries the plaintext key exactly
 * once, in the response to the creation POST; it is never stored or re-rendered.
 */
export function apiKeysPage({ keys, active, csrf, issued = null, message = '' }) {
  const rows = keys.length === 0
    ? '<p>No API keys yet.</p>'
    : '<table class="admin__table"><thead><tr><th>Label</th><th>Prefix</th><th>Plan</th>'
      + '<th>Calls this month</th><th>Last used</th><th>State</th><th></th></tr></thead><tbody>'
      + keys.map((key) => '<tr><td>' + escapeHtml(key.label) + '</td><td><code>' + escapeHtml(key.prefix)
        + '…</code></td><td>' + escapeHtml(key.plan) + '</td><td>' + key.calls + ' / ' + key.limit
        + '</td><td>' + (key.lastUsedAt === null ? '—' : new Date(key.lastUsedAt * 1000).toISOString())
        + '</td><td>' + (key.revokedAt === null ? 'active' : 'revoked ' + new Date(key.revokedAt * 1000).toISOString())
        + '</td><td>' + (key.revokedAt === null
          ? '<form method="post" action="/admin/api/revoke" class="admin__inline">' + csrfField(csrf)
            + '<input type="hidden" name="key_id" value="' + escapeHtml(key.keyId) + '">'
            + '<button type="submit">Revoke</button></form>'
          : '') + '</td></tr>').join('')
      + '</tbody></table>';
  const plans = PLAN_IDS.map((id) => '<option value="' + id + '"'
    + (planAllowed({ plan: id, active }) ? '' : ' disabled') + '>' + API_PLANS[id].label
    + ' · ' + API_PLANS[id].limit + '/month</option>').join('');
  return '<p><a href="/admin">Owner workspace</a> · <a href="/admin/billing">Billing</a>'
    + ' · <a href="/admin/settings">Settings</a></p>'
    + (message === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(message) + '</p>')
    + (issued === null ? '' : '<p class="admin__ok" role="status">Key ' + escapeHtml(issued.label)
      + ' created. Copy it now — it is shown once.</p>'
      + '<p><code class="admin__secret">' + escapeHtml(issued.key) + '</code></p>')
    + '<p class="admin__note">Keys are stored as SHA-256 digests. '
    + (active ? 'The subscription is active, so paid plans are available.' : 'No active subscription: only Sandbox keys are available.')
    + '</p>'
    + '<form method="post" action="/admin/api/create" class="admin__draft-form">' + csrfField(csrf)
    + '<label>Label<input name="label" required minlength="2" maxlength="60" placeholder="Partner name"></label>'
    + '<label>Plan<select name="plan">' + plans + '</select></label>'
    + '<button type="submit">Create key</button></form>'
    + rows;
}
