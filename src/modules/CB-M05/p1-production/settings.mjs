// CB-M05-P1-SETTINGS-001: owner-managed integration settings.
//
// Every value is encrypted with AES-GCM under a settings-specific HKDF key.
// Stored secrets are never rendered back; the panel shows only whether a value
// is configured and where it came from. Core Worker secrets stay in Cloudflare.
import { escapeHtml, page } from './owner-auth.mjs';
import { decryptToken, encryptToken } from '../../CB-M07/token-vault.mjs';

export const SETTINGS_INFO = 'settings-v1';

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u;
const FROM = /^(?:[^<>]{1,80}<\s*)?[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+(?:\s*>)?$/u;

export const SETTINGS = Object.freeze([
  { key: 'RESEND_API_KEY', label: 'Resend API key', group: 'Email', secret: true,
    pattern: /^re_[A-Za-z0-9_-]{8,128}$/u, hint: 're_…' },
  { key: 'COINBLINK_EMAIL_FROM', label: 'Sender', group: 'Email', secret: false,
    pattern: FROM, hint: 'CoinBlink <news@your-domain>' },
  { key: 'COINBLINK_TEST_EMAIL', label: 'Test recipient', group: 'Email', secret: false,
    pattern: EMAIL, hint: 'founder@nexlabs.company' },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe secret key', group: 'Billing', secret: true,
    pattern: /^sk_(?:test|live)_[A-Za-z0-9]{8,200}$/u, hint: 'sk_test_…' },
  { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe webhook secret', group: 'Billing', secret: true,
    pattern: /^whsec_[A-Za-z0-9]{8,200}$/u, hint: 'whsec_…' },
  { key: 'STRIPE_PRICE_MONTHLY', label: 'Monthly price ID', group: 'Billing', secret: false,
    pattern: /^price_[A-Za-z0-9]{8,200}$/u, hint: 'price_…' },
  { key: 'STRIPE_PRICE_YEARLY', label: 'Yearly price ID', group: 'Billing', secret: false,
    pattern: /^price_[A-Za-z0-9]{8,200}$/u, hint: 'price_…' },
  { key: 'X_CLIENT_ID', label: 'X client ID', group: 'Social', secret: false,
    pattern: /^[A-Za-z0-9_-]{8,200}$/u, hint: 'OAuth 2.0 client ID' },
  { key: 'X_CLIENT_SECRET', label: 'X client secret', group: 'Social', secret: true,
    pattern: /^[A-Za-z0-9_-]{8,200}$/u, hint: 'OAuth 2.0 client secret' },
  { key: 'META_APP_ID', label: 'Meta app ID', group: 'Social', secret: false,
    pattern: /^[0-9]{6,32}$/u, hint: 'Meta app ID' },
  { key: 'META_APP_SECRET', label: 'Meta app secret', group: 'Social', secret: true,
    pattern: /^[A-Za-z0-9_-]{8,200}$/u, hint: 'Meta app secret' },
  { key: 'TIKTOK_CLIENT_KEY', label: 'TikTok client key', group: 'Social', secret: false,
    pattern: /^[A-Za-z0-9_-]{8,200}$/u, hint: 'TikTok client key' },
  { key: 'TIKTOK_CLIENT_SECRET', label: 'TikTok client secret', group: 'Social', secret: true,
    pattern: /^[A-Za-z0-9_-]{8,200}$/u, hint: 'TikTok client secret' },
  { key: 'M08_MODEL', label: 'Workers AI model', group: 'AI', secret: false,
    pattern: /^@cf\/[a-z0-9][a-z0-9./-]{2,120}$/u, hint: '@cf/meta/llama-3.1-8b-instruct-fp8' },
]);

const BY_KEY = new Map(SETTINGS.map((entry) => [entry.key, entry]));

export function settingEntry(key) {
  return BY_KEY.get(key) ?? null;
}

export function validateSettingValue(key, value) {
  const entry = BY_KEY.get(key);
  if (entry === undefined) throw new TypeError('unknown setting');
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '' || normalized.length > 500) throw new TypeError('invalid value for ' + key);
  if (!entry.pattern.test(normalized)) throw new TypeError('invalid value for ' + key);
  return normalized;
}

export async function getSetting({ db, secret, env, key }) {
  if (!BY_KEY.has(key)) return null;
  try {
    const row = await db.prepare('SELECT ciphertext,iv FROM cms_settings WHERE key=?').bind(key).first();
    if (row !== null && row !== undefined) {
      return await decryptToken({
        secret, ciphertext: row.ciphertext, iv: row.iv, info: SETTINGS_INFO,
      });
    }
  } catch {
    // Fall through to the Worker environment; a broken row must not break the page.
  }
  const fallback = env?.[key];
  return typeof fallback === 'string' && fallback.trim() !== '' ? fallback.trim() : null;
}

export async function setSetting({ db, secret, key, value, nowMs }) {
  const normalized = validateSettingValue(key, value);
  const entry = BY_KEY.get(key);
  const encrypted = await encryptToken({ secret, plaintext: normalized, info: SETTINGS_INFO });
  const now = Math.floor(nowMs / 1000);
  const marker = crypto.randomUUID();
  try {
    const results = await db.batch([
      db.prepare(
        'INSERT INTO cms_settings(key,ciphertext,iv,is_secret,updated_at,updated_by) VALUES (?,?,?,?,?,1) '
        + 'ON CONFLICT(key) DO UPDATE SET ciphertext=excluded.ciphertext,iv=excluded.iv,'
        + 'is_secret=excluded.is_secret,updated_at=excluded.updated_at',
      ).bind(key, encrypted.ciphertext, encrypted.iv, entry.secret ? 1 : 0, now),
      db.prepare("INSERT INTO cms_settings_audit(event_id,key,action,actor,created_at) VALUES (?,?,'set','owner-session',?)")
        .bind(marker, key, now),
    ]);
    return results.every((result) => result?.meta?.changes === 1);
  } catch {
    return false;
  }
}

export async function clearSetting({ db, key, nowMs }) {
  if (!BY_KEY.has(key)) return false;
  try {
    const existing = await db.prepare('SELECT 1 AS present FROM cms_settings WHERE key=?').bind(key).first();
    if (existing === null || existing === undefined) return false;
    const now = Math.floor(nowMs / 1000);
    const results = await db.batch([
      db.prepare('DELETE FROM cms_settings WHERE key=?').bind(key),
      db.prepare("INSERT INTO cms_settings_audit(event_id,key,action,actor,created_at) VALUES (?,?,'clear','owner-session',?)")
        .bind(crypto.randomUUID(), key, now),
    ]);
    return results.every((result) => result?.meta?.changes === 1);
  } catch {
    return false;
  }
}

export async function recordSettingsAudit({ db, key, action, nowMs }) {
  try {
    const result = await db.prepare('INSERT INTO cms_settings_audit(event_id,key,action,actor,created_at) VALUES (?,?,?,\'owner-session\',?)')
      .bind(crypto.randomUUID(), key, action, Math.floor(nowMs / 1000)).run();
    return result?.meta?.changes === 1;
  } catch {
    return false;
  }
}

export async function listSettings({ db, secret, env }) {
  let rows;
  try {
    const result = await db.prepare('SELECT key,ciphertext,iv,updated_at AS updatedAt FROM cms_settings').all();
    rows = result?.results ?? [];
  } catch {
    rows = [];
  }
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const entries = [];
  for (const entry of SETTINGS) {
    const row = byKey.get(entry.key);
    let value = null;
    let source = null;
    let updatedAt = null;
    let broken = false;
    if (row !== undefined) {
      source = 'database';
      updatedAt = Number(row.updatedAt);
      if (!entry.secret) {
        try {
          value = await decryptToken({ secret, ciphertext: row.ciphertext, iv: row.iv, info: SETTINGS_INFO });
        } catch {
          broken = true;
        }
      }
    } else if (typeof env?.[entry.key] === 'string' && env[entry.key].trim() !== '') {
      source = 'environment';
      if (!entry.secret) value = env[entry.key].trim();
    }
    entries.push(Object.freeze({
      key: entry.key, label: entry.label, group: entry.group, secret: entry.secret,
      hint: entry.hint, configured: source !== null, source, updatedAt, value, broken,
    }));
  }
  return Object.freeze(entries);
}

function csrfField(csrf) {
  return '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
}

function statusLabel(entry) {
  if (entry.broken) return 'saved but unreadable';
  if (!entry.configured) return 'missing';
  return entry.source === 'environment' ? 'from environment' : 'saved';
}

function settingRow(entry, csrf) {
  const type = entry.secret ? 'password' : 'text';
  const value = entry.secret ? '' : escapeHtml(entry.value ?? '');
  const placeholder = entry.secret
    ? (entry.configured ? 'configured — enter a new value to replace' : entry.hint)
    : entry.hint;
  const clear = entry.configured && entry.source === 'database'
    ? '<form method="post" action="/admin/settings/clear" class="admin__inline">' + csrfField(csrf)
      + '<input type="hidden" name="key" value="' + escapeHtml(entry.key) + '">'
      + '<button type="submit">Clear</button></form>'
    : '';
  return '<div class="admin__setting"><h3>' + escapeHtml(entry.label)
    + ' <span class="admin__note">· ' + escapeHtml(statusLabel(entry)) + '</span></h3>'
    + '<p class="admin__note"><code>' + escapeHtml(entry.key) + '</code>'
    + (entry.updatedAt === null ? '' : ' · updated ' + escapeHtml(new Date(entry.updatedAt * 1000).toISOString())) + '</p>'
    + '<form method="post" action="/admin/settings/save" class="admin__inline">' + csrfField(csrf)
    + '<input type="hidden" name="key" value="' + escapeHtml(entry.key) + '">'
    + '<input type="' + type + '" name="value" value="' + value + '" placeholder="' + escapeHtml(placeholder) + '"'
    + ' autocomplete="' + (entry.secret ? 'new-password' : 'off') + '" maxlength="500" required>'
    + '<button type="submit">Save</button></form>' + clear + '</div>';
}

function resultBlock(result) {
  if (result === null || result === undefined) return '';
  if (result.status === 'sent') {
    return '<p class="admin__note" role="status">Test email accepted by Resend'
      + (result.id === null ? '' : ' · id <code>' + escapeHtml(result.id) + '</code>') + '.</p>';
  }
  if (result.status === 'not_configured') {
    return '<p class="admin__error" role="alert">Missing settings: ' + escapeHtml(result.missing.join(', ')) + '.</p>';
  }
  if (result.status === 'invalid_recipient') {
    return '<p class="admin__error" role="alert">The test recipient is not a valid email address.</p>';
  }
  return '<p class="admin__error" role="alert">Resend rejected the test: '
    + escapeHtml(result.name ?? 'error') + ' · ' + escapeHtml(result.message ?? 'unknown error') + '</p>';
}

export function settingsPage({ entries, csrf, result = null, message = '' }) {
  const groups = [...new Set(SETTINGS.map((entry) => entry.group))];
  const sections = groups.map((group) => '<h2>' + escapeHtml(group) + '</h2>'
    + entries.filter((entry) => entry.group === group).map((entry) => settingRow(entry, csrf)).join('')).join('');
  const testRecipient = entries.find((entry) => entry.key === 'COINBLINK_TEST_EMAIL')?.value ?? 'founder@nexlabs.company';
  return page('Settings', '<p><a href="/admin">Owner workspace</a> · <a href="/admin/social">Social accounts</a>'
    + ' · <a href="/admin/security">Security and audit</a></p>'
    + (message === '' ? '' : '<p class="admin__note" role="status">' + escapeHtml(message) + '</p>')
    + '<p class="admin__note">Integration values are encrypted with AES-GCM in D1 and are never rendered back. '
    + 'A value saved here overrides the Worker environment. Core secrets (M05 session key, Cloudflare token) are not editable here.</p>'
    + sections
    + '<h2>Test email</h2><form method="post" action="/admin/settings/test-email" class="admin__inline">' + csrfField(csrf)
    + '<input type="email" name="to" value="' + escapeHtml(testRecipient) + '" placeholder="founder@nexlabs.company" maxlength="200">'
    + '<button type="submit">Send test email</button></form>'
    + resultBlock(result)
    + '<form method="post" action="/admin/logout">' + csrfField(csrf) + '<button type="submit">Sign out</button></form>');
}
