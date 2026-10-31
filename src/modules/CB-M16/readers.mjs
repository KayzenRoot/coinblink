// CB-M16-P1-READERS-001: reader accounts by magic link, sessions and watchlists.
//
// A reader exists only after consuming a link. Tokens and sessions are stored as
// SHA-256 digests, the link expires in 15 minutes and works once, and the login
// request always answers the same way so the endpoint never reveals an account.

import { sendEmail } from '../CB-M10/resend.mjs';
import { getSetting } from '../CB-M05/p1-production/settings.mjs';

export const READER_LOCALES = Object.freeze(['en', 'pt-br', 'es']);
export const TOKEN_TTL_SECONDS = 900;
export const SESSION_TTL_SECONDS = 30 * 86_400;
const MAX_WATCHLIST = 20;
const SYMBOL = /^[A-Z0-9]{2,12}$/u;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

function hex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

async function digestOf(token) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return hex(new Uint8Array(digest));
}

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length >= 3 && email.length <= 254 && EMAIL.test(email) ? email : null;
}

export function normalizeSymbol(value) {
  const symbol = String(value ?? '').trim().toUpperCase();
  return SYMBOL.test(symbol) ? symbol : null;
}

export function normalizeLocale(value) {
  return READER_LOCALES.includes(value) ? value : 'en';
}

/**
 * Creates or reuses a reader and a fresh one-use login token. Returns the token
 * for the caller to email; it is never stored in clear.
 */
export async function requestLogin({ db, email, locale, nowMs = Date.now(), perHour = 5 }) {
  const clean = normalizeEmail(email);
  if (clean === null) return Object.freeze({ status: 'invalid' });
  const now = Math.floor(nowMs / 1000);
  const existing = await db.prepare('SELECT id, locale FROM cms_readers WHERE email = ?').bind(clean).first() ?? null;
  const readerId = existing?.id ?? crypto.randomUUID();
  if (existing === null) {
    await db.prepare("INSERT INTO cms_readers(id,email,locale,status,created_at) VALUES (?,?,?,'pending',?)")
      .bind(readerId, clean, normalizeLocale(locale), now).run();
  }
  const recent = await db.prepare('SELECT COUNT(*) AS total FROM cms_reader_tokens WHERE reader_id = ? AND created_at >= ?')
    .bind(readerId, now - 3600).first();
  if (Number(recent?.total ?? 0) >= perHour) return Object.freeze({ status: 'throttled' });
  const token = randomToken();
  await db.prepare(
    "INSERT INTO cms_reader_tokens(token_digest,reader_id,purpose,expires_at,created_at) VALUES (?,?,'login',?,?)",
  ).bind(await digestOf(token), readerId, now + TOKEN_TTL_SECONDS, now).run();
  return Object.freeze({ status: 'sent', token, email: clean, readerId });
}

/** Consumes a login token and opens a session. */
export async function consumeLogin({ db, token, nowMs = Date.now() }) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/u.test(token)) return Object.freeze({ status: 'invalid' });
  const digest = await digestOf(token);
  const now = Math.floor(nowMs / 1000);
  const row = await db.prepare(
    "SELECT reader_id AS readerId, expires_at AS expiresAt, consumed_at AS consumedAt FROM cms_reader_tokens WHERE token_digest = ? AND purpose = 'login'",
  ).bind(digest).first() ?? null;
  if (row === null) return Object.freeze({ status: 'invalid' });
  if (row.consumedAt !== null && row.consumedAt !== undefined) return Object.freeze({ status: 'used' });
  if (Number(row.expiresAt) <= now) return Object.freeze({ status: 'expired' });
  const consumed = await db.prepare('UPDATE cms_reader_tokens SET consumed_at = ? WHERE token_digest = ? AND consumed_at IS NULL')
    .bind(now, digest).run();
  if (consumed?.meta?.changes !== 1) return Object.freeze({ status: 'used' });
  const session = randomToken();
  await db.prepare('INSERT INTO cms_reader_sessions(session_digest,reader_id,issued_at,expires_at) VALUES (?,?,?,?)')
    .bind(await digestOf(session), row.readerId, now, now + SESSION_TTL_SECONDS).run();
  await db.prepare("UPDATE cms_readers SET status='active', confirmed_at=COALESCE(confirmed_at,?), last_login_at=? WHERE id=?")
    .bind(now, now, row.readerId).run();
  return Object.freeze({ status: 'ok', session, readerId: row.readerId });
}

export async function readSession({ db, token, nowMs = Date.now() }) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/u.test(token)) return null;
  const now = Math.floor(nowMs / 1000);
  try {
    const row = await db.prepare(
      'SELECT r.id AS id, r.email AS email, r.locale AS locale, s.expires_at AS expiresAt '
      + 'FROM cms_reader_sessions s JOIN cms_readers r ON r.id = s.reader_id '
      + 'WHERE s.session_digest = ? AND s.revoked_at IS NULL AND s.expires_at > ?',
    ).bind(await digestOf(token), now).first() ?? null;
    return row === null ? null : Object.freeze({ id: row.id, email: row.email, locale: row.locale });
  } catch {
    return null;
  }
}

export async function logout({ db, token, nowMs = Date.now() }) {
  if (typeof token !== 'string' || token === '') return false;
  const result = await db.prepare('UPDATE cms_reader_sessions SET revoked_at = ? WHERE session_digest = ? AND revoked_at IS NULL')
    .bind(Math.floor(nowMs / 1000), await digestOf(token)).run();
  return result?.meta?.changes === 1;
}

export async function addSymbol({ db, readerId, symbol, nowMs = Date.now() }) {
  const clean = normalizeSymbol(symbol);
  if (clean === null) return Object.freeze({ status: 'invalid' });
  const count = await db.prepare('SELECT COUNT(*) AS total FROM cms_watchlist WHERE reader_id = ?').bind(readerId).first();
  const existing = await db.prepare('SELECT symbol FROM cms_watchlist WHERE reader_id = ? AND symbol = ?')
    .bind(readerId, clean).first() ?? null;
  if (existing === null && Number(count?.total ?? 0) >= MAX_WATCHLIST) return Object.freeze({ status: 'full' });
  await db.prepare('INSERT OR IGNORE INTO cms_watchlist(reader_id,symbol,created_at) VALUES (?,?,?)')
    .bind(readerId, clean, Math.floor(nowMs / 1000)).run();
  return Object.freeze({ status: 'added', symbol: clean });
}

export async function removeSymbol({ db, readerId, symbol }) {
  const clean = normalizeSymbol(symbol);
  if (clean === null) return false;
  const result = await db.prepare('DELETE FROM cms_watchlist WHERE reader_id = ? AND symbol = ?')
    .bind(readerId, clean).run();
  return result?.meta?.changes === 1;
}

export async function listSymbols({ db, readerId }) {
  try {
    const rows = await db.prepare('SELECT symbol FROM cms_watchlist WHERE reader_id = ? ORDER BY symbol')
      .bind(readerId).all();
    return Object.freeze((rows?.results ?? []).map((row) => row.symbol));
  } catch {
    return Object.freeze([]);
  }
}

/** Emails the magic link; a failure is reported, never thrown. */
export async function sendLoginLink({ db, secret, env, email, token, origin, fetchImpl = globalThis.fetch }) {
  try {
    const apiKey = await getSetting({ db, secret, env, key: 'RESEND_API_KEY' });
    const from = await getSetting({ db, secret, env, key: 'COINBLINK_EMAIL_FROM' });
    if (typeof apiKey !== 'string' || typeof from !== 'string') return Object.freeze({ status: 'not_configured' });
    const link = new URL('/reader/login?token=' + token, origin).toString();
    const result = await sendEmail({
      fetchImpl, apiKey, from, to: email, subject: 'Your CoinBlink sign-in link',
      text: 'Open this link to sign in to CoinBlink. It works once and expires in 15 minutes:\n\n'
        + link + '\n\nIf you did not ask for this, ignore the message.',
    });
    return Object.freeze({ status: result?.status === 'sent' ? 'sent' : 'failed' });
  } catch {
    return Object.freeze({ status: 'failed' });
  }
}

const COOKIE = 'cb_reader';

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function sessionCookie(token) {
  return COOKIE + '=' + token + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + SESSION_TTL_SECONDS;
}

export function clearSessionCookie() {
  return COOKIE + '=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';
}

export function readSessionCookie(request) {
  const header = request?.headers?.get?.('cookie') ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=').trim();
  }
  return '';
}

function shell(title, body) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow, noarchive">'
    + '<title>' + escapeHtml(title) + ' · CoinBlink</title>'
    + '<link rel="stylesheet" href="/admin.css"></head><body class="admin-bare"><main class="admin">'
    + '<p class="admin__tag">CB-M16 · READER ACCOUNT</p><h1>' + escapeHtml(title) + '</h1>'
    + body + '</main></body></html>';
}

function respond(html) {
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow, noarchive',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    },
  });
}

export function signInPage({ message = '' } = {}) {
  return respond(shell('Sign in',
    (message === '' ? '' : '<p class="admin__error" role="alert">' + escapeHtml(message) + '</p>')
    + '<p>Enter your address and we send a link. The link works once and expires in 15 minutes. '
    + 'No password is stored.</p>'
    + '<form method="post" action="/api/reader/login" class="admin__draft-form">'
    + '<label>Email<input type="email" name="email" required maxlength="254" autocomplete="email"></label>'
    + '<label>Language<select name="locale"><option value="en">English</option>'
    + '<option value="pt-br">Português (BR)</option><option value="es">Español</option></select></label>'
    + '<button type="submit">Send the link</button></form>'
    + '<p class="admin__note"><a href="/en">Back to CoinBlink</a></p>'));
}

export function readerPage({ email, symbols }) {
  const items = symbols.length === 0
    ? '<p>No symbols yet.</p>'
    : '<ul class="admin__credentials">' + symbols.map((symbol) => '<li><code>' + escapeHtml(symbol) + '</code>'
      + ' <form method="post" action="/reader/watchlist" class="admin__inline">'
      + '<input type="hidden" name="action" value="remove"><input type="hidden" name="symbol" value="'
      + escapeHtml(symbol) + '"><button type="submit">Remove</button></form></li>').join('') + '</ul>';
  return respond(shell('Your watchlist',
    '<p>Signed in as <strong>' + escapeHtml(email) + '</strong>.</p>'
    + '<form method="post" action="/reader/watchlist" class="admin__draft-form">'
    + '<input type="hidden" name="action" value="add">'
    + '<label>Symbol<input name="symbol" required maxlength="12" placeholder="BTC" autocapitalize="characters"></label>'
    + '<button type="submit">Add to watchlist</button></form>'
    + items
    + '<form method="post" action="/reader/logout"><button type="submit">Sign out</button></form>'
    + '<p class="admin__note">The watchlist holds up to 20 symbols and is tied to this address. '
    + 'Email alerts are the next step and are not sent yet.</p>'));
}
