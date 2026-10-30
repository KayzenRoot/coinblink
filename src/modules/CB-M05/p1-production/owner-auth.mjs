// CB-M05-P1-OWNER-AUTH-001: production owner authentication.
//
// One owner, one primary passkey, revocable server-side sessions. The bootstrap
// ticket is minted out of band and stored only as an HMAC digest. No token,
// credential secret or session value is ever logged or rendered.
import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';

export const OWNER_COOKIE = '__Host-cb_owner';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;
export const CHALLENGE_TTL_SECONDS = 5 * 60;
export const BOOTSTRAP_TICKET_TTL_SECONDS = 15 * 60;

const HEX64 = /^[0-9a-f]{64}$/u;
const BASE64URL = /^[A-Za-z0-9_-]{16,512}$/u;
const JSON_LIMIT = 65_536;

const SECURITY_HEADERS = Object.freeze({
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'referrer-policy': 'no-referrer',
});

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...SECURITY_HEADERS, 'content-type': 'application/json; charset=utf-8', ...extra },
  });
}

export function denied(status = 404) {
  return new Response('Not found', { status, headers: { ...SECURITY_HEADERS, 'content-type': 'text/plain; charset=utf-8' } });
}

export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function hex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function randomHex(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
}

function keyBytes(secret) {
  return Uint8Array.from(secret.match(/../gu), (pair) => Number.parseInt(pair, 16));
}

export async function keyedDigest(secret, value) {
  if (!HEX64.test(secret)) throw new TypeError('session secret must be 64 hex characters');
  const key = await crypto.subtle.importKey('raw', keyBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(String(value)));
  return hex(new Uint8Array(signature));
}

export function equalHex(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export function readConfig(env) {
  const db = env?.CMS_DB;
  const secret = env?.M05_SESSION_SECRET;
  const rpId = env?.M05_RP_ID;
  const origin = env?.M05_ORIGIN;
  const enabled = env?.M05_OWNER_ENABLED === 'true';
  if (!enabled || !db || typeof db.prepare !== 'function' || !HEX64.test(secret ?? '')
    || typeof rpId !== 'string' || rpId === '' || typeof origin !== 'string' || origin === '') return null;
  return Object.freeze({ db, secret, rpId, origin });
}

export async function ownerExists(db) {
  const row = await db.prepare('SELECT owner_id FROM cms_owner WHERE owner_id=1').first();
  return row?.owner_id === 1;
}

export async function readJson(request) {
  if (!/^application\/json(?:\s*;|$)/iu.test(request.headers.get('content-type') ?? '')) return null;
  const text = await request.text();
  if (text.length === 0 || text.length > JSON_LIMIT) return null;
  try {
    const value = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

export function sameOrigin(request, expectedOrigin) {
  const url = new URL(request.url);
  if (url.origin !== expectedOrigin) return false;
  if (request.method === 'GET' || request.method === 'HEAD') return true;
  const origin = request.headers.get('origin');
  return origin === expectedOrigin && request.headers.get('sec-fetch-site') === 'same-origin';
}

export function page(title, body, status = 200) {
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<meta name="robots" content="noindex, nofollow, noarchive">'
    + '<title>' + escapeHtml(title) + ' · CoinBlink</title>'
    + '<link rel="stylesheet" href="/admin.css"></head><body><main class="admin">'
    + '<p class="admin__tag">CB-M05 · OWNER ONLY · NO PUBLISHING</p>'
    + '<h1>' + escapeHtml(title) + '</h1>' + body + '</main>'
    + '<script type="module" src="/admin-auth.js"></script></body></html>';
  return new Response(html, {
    status,
    headers: { ...SECURITY_HEADERS, 'content-type': 'text/html; charset=utf-8' },
  });
}

export function loginPage() {
  return page('Owner sign in', '<p>Use the passkey registered for this deployment.</p>'
    + '<button type="button" id="owner-login">Sign in with passkey</button>'
    + '<p id="owner-status" role="status" aria-live="polite"></p>'
    + '<p class="admin__note"><a href="/admin/bootstrap">First-time setup</a></p>');
}

export function bootstrapPage() {
  return page('Register the owner passkey', '<p>Paste the one-time bootstrap ticket issued for this deployment. It expires in 15 minutes and works once.</p>'
    + '<form id="owner-bootstrap"><label>Bootstrap ticket<input id="owner-ticket" name="ticket" autocomplete="off" spellcheck="false" required></label>'
    + '<button type="submit">Register passkey</button></form>'
    + '<p id="owner-status" role="status" aria-live="polite"></p>'
    + '<p class="admin__note"><a href="/admin/login">Already registered? Sign in</a></p>');
}

export async function dashboardPage({ db, expiresAt }) {
  const row = await db.prepare('SELECT COUNT(*) AS drafts FROM cms_drafts WHERE owner_id=1').first();
  const drafts = Number(row?.drafts ?? 0);
  return page('Owner workspace', '<p>Authenticated as the single CoinBlink owner.</p>'
    + '<dl class="admin__facts"><dt>Drafts</dt><dd>' + drafts + '</dd>'
    + '<dt>Session expires</dt><dd>' + escapeHtml(new Date(expiresAt * 1000).toISOString()) + '</dd></dl>'
    + '<form method="post" action="/admin/logout"><button type="submit">Sign out</button></form>'
    + '<p class="admin__note">Read-only foundation. Publishing, billing and real customer data remain disabled.</p>');
}

async function registrationOptions({ db, config, ticket, now }) {
  if (!HEX64.test(ticket)) return null;
  if (await ownerExists(db)) return null;
  const ticketDigest = await keyedDigest(config.secret, ticket);
  await db.prepare('DELETE FROM cms_bootstrap_challenges WHERE consumed_at IS NULL AND expires_at<=?').bind(now).run();
  const challenge = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const inserted = await db.prepare(
    'INSERT INTO cms_bootstrap_challenges(challenge_digest,ticket_digest,origin,rp_id,expires_at) '
    + 'SELECT ?,?,?,?,? FROM cms_bootstrap_tickets t WHERE t.ticket_digest=? AND t.consumed_at IS NULL AND t.expires_at>? '
    + 'AND NOT EXISTS (SELECT 1 FROM cms_owner)',
  ).bind(await sha256(challenge), ticketDigest, config.origin, config.rpId, now + CHALLENGE_TTL_SECONDS, ticketDigest, now).run();
  if (inserted.meta?.changes !== 1) return null;
  return Object.freeze({
    challenge,
    rp: { id: config.rpId, name: 'CoinBlink' },
    user: { id: toBase64Url(new TextEncoder().encode('coinblink-owner')), name: 'owner', displayName: 'CoinBlink Owner' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    timeout: CHALLENGE_TTL_SECONDS * 1000,
    attestation: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
  });
}

export async function bootstrapChallenge({ db, config, ticket, now }) {
  const options = await registrationOptions({ db, config, ticket, now });
  return options === null ? json({ error: 'invalid_ticket' }, 403) : json(options);
}

export async function bootstrapClaim({ db, config, ticket, challenge, response, now }) {
  if (!HEX64.test(ticket) || !BASE64URL.test(challenge ?? '') || response === null || typeof response !== 'object') {
    return json({ error: 'invalid_request' }, 400);
  }
  if (await ownerExists(db)) return json({ error: 'owner_exists' }, 409);
  const ticketDigest = await keyedDigest(config.secret, ticket);
  const challengeDigest = await sha256(challenge);
  const pending = await db.prepare(
    'SELECT b.challenge_digest FROM cms_bootstrap_challenges b JOIN cms_bootstrap_tickets t ON t.ticket_digest=b.ticket_digest '
    + 'WHERE b.challenge_digest=? AND t.ticket_digest=? AND b.origin=? AND b.rp_id=? AND b.consumed_at IS NULL AND b.expires_at>? '
    + 'AND t.consumed_at IS NULL AND t.expires_at>? AND NOT EXISTS (SELECT 1 FROM cms_owner)',
  ).bind(challengeDigest, ticketDigest, config.origin, config.rpId, now, now).first();
  if (!pending) return json({ error: 'invalid_ticket' }, 403);
  let registration;
  try {
    registration = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpId,
      requireUserPresence: true,
      requireUserVerification: true,
    });
  } catch {
    return json({ error: 'registration_rejected' }, 403);
  }
  const credential = registration?.registrationInfo?.credential;
  if (registration?.verified !== true || !credential || credential.id !== response.id || response.rawId !== response.id) {
    return json({ error: 'registration_rejected' }, 403);
  }
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare('UPDATE cms_bootstrap_tickets SET consumed_at=?,consume_marker=? WHERE ticket_digest=? AND consumed_at IS NULL AND expires_at>? AND NOT EXISTS (SELECT 1 FROM cms_owner)')
      .bind(now, marker, ticketDigest, now),
    db.prepare('UPDATE cms_bootstrap_challenges SET consumed_at=? WHERE challenge_digest=? AND consumed_at IS NULL AND expires_at>? AND EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE ticket_digest=? AND consume_marker=?)')
      .bind(now, challengeDigest, now, ticketDigest, marker),
    db.prepare('INSERT INTO cms_owner(owner_id,created_at) SELECT 1,? WHERE EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE consume_marker=?)')
      .bind(now, marker),
    db.prepare("INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind) SELECT ?,1,?,?,'primary' WHERE EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE consume_marker=?)")
      .bind(credential.id, credential.publicKey, credential.counter, marker),
    db.prepare("INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at) SELECT ?,'owner_claimed','bootstrap-ticket',?,'primary',? WHERE EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE consume_marker=?)")
      .bind(crypto.randomUUID(), credential.id, now, marker),
  ]);
  if (results.some((result) => result?.meta?.changes !== 1)) return json({ error: 'claim_conflict' }, 409);
  return json({ owner: 1, claimed: true }, 201);
}

export async function loginChallenge({ db, config, now }) {
  const credential = await db.prepare("SELECT credential_id FROM cms_credentials WHERE owner_id=1 AND device_kind='primary' AND revoked_at IS NULL").first();
  if (!credential) return json({ error: 'no_owner' }, 404);
  await db.prepare('DELETE FROM cms_challenges WHERE consumed_at IS NULL AND expires_at<=?').bind(now).run();
  const challenge = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const inserted = await db.prepare(
    "INSERT INTO cms_challenges(challenge_digest,credential_id,origin,rp_id,purpose,expires_at) SELECT ?,?,?,?,'login',? "
    + 'WHERE (SELECT COUNT(*) FROM cms_challenges WHERE credential_id=? AND purpose=\'login\' AND consumed_at IS NULL AND expires_at>?) < 3',
  ).bind(await sha256(challenge), credential.credential_id, config.origin, config.rpId, now + CHALLENGE_TTL_SECONDS, credential.credential_id, now).run();
  if (inserted.meta?.changes !== 1) return json({ error: 'too_many_challenges' }, 429);
  return json({
    challenge,
    rpId: config.rpId,
    allowCredentials: [{ id: credential.credential_id, type: 'public-key' }],
    userVerification: 'required',
    timeout: CHALLENGE_TTL_SECONDS * 1000,
  });
}

function asBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return new Uint8Array(value);
  return null;
}

export async function login({ db, config, credentialId, challenge, response, now }) {
  if (!BASE64URL.test(credentialId ?? '') || !BASE64URL.test(challenge ?? '') || response === null || typeof response !== 'object') {
    return json({ error: 'invalid_request' }, 400);
  }
  if (response.id !== credentialId || response.rawId !== credentialId) return json({ error: 'invalid_request' }, 400);
  const challengeDigest = await sha256(challenge);
  const record = await db.prepare(
    "SELECT c.credential_id,c.public_key,c.sign_count FROM cms_credentials c JOIN cms_challenges h ON h.credential_id=c.credential_id "
    + "WHERE h.challenge_digest=? AND c.credential_id=? AND c.owner_id=1 AND c.revoked_at IS NULL AND h.consumed_at IS NULL "
    + "AND h.expires_at>? AND h.origin=? AND h.rp_id=? AND h.purpose='login'",
  ).bind(challengeDigest, credentialId, now, config.origin, config.rpId).first();
  const publicKey = asBytes(record?.public_key);
  if (!publicKey || !Number.isSafeInteger(record?.sign_count)) return json({ error: 'login_rejected' }, 403);
  let verified;
  try {
    verified = await verifyAuthenticationResponse({
      response,
      credential: { id: record.credential_id, publicKey, counter: record.sign_count },
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpId,
      requireUserPresence: true,
      requireUserVerification: true,
    });
  } catch {
    return json({ error: 'login_rejected' }, 403);
  }
  const nextCounter = verified?.authenticationInfo?.newCounter;
  if (verified?.verified !== true || !Number.isSafeInteger(nextCounter) || nextCounter < record.sign_count) {
    return json({ error: 'login_rejected' }, 403);
  }
  const token = randomHex();
  const tokenDigest = await keyedDigest(config.secret, token);
  const csrf = randomHex();
  const csrfDigest = await keyedDigest(config.secret, csrf);
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare("UPDATE cms_challenges SET consumed_at=?,consume_marker=? WHERE challenge_digest=? AND credential_id=? AND consumed_at IS NULL AND expires_at>? AND origin=? AND rp_id=? AND purpose='login' AND EXISTS (SELECT 1 FROM cms_credentials c WHERE c.credential_id=? AND c.owner_id=1 AND c.revoked_at IS NULL AND c.sign_count=?)")
      .bind(now, marker, challengeDigest, credentialId, now, config.origin, config.rpId, credentialId, record.sign_count),
    db.prepare('UPDATE cms_credentials SET sign_count=?,last_auth_marker=? WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL AND sign_count=? AND EXISTS (SELECT 1 FROM cms_challenges h WHERE h.challenge_digest=? AND h.credential_id=? AND h.consume_marker=?)')
      .bind(nextCounter, marker, credentialId, record.sign_count, challengeDigest, credentialId, marker),
    db.prepare('INSERT INTO cms_sessions(session_digest,csrf_digest,owner_id,issued_at,expires_at,challenge_digest,credential_id) SELECT ?,?,1,?,?,h.challenge_digest,h.credential_id FROM cms_challenges h JOIN cms_credentials c ON c.credential_id=h.credential_id WHERE h.challenge_digest=? AND h.credential_id=? AND h.consume_marker=? AND c.last_auth_marker=? AND c.sign_count=? AND c.revoked_at IS NULL')
      .bind(tokenDigest, csrfDigest, now, now + SESSION_TTL_SECONDS, challengeDigest, credentialId, marker, marker, nextCounter),
  ]);
  if (results.some((result) => result?.meta?.changes !== 1)) return json({ error: 'login_conflict' }, 409);
  return json({ authenticated: true, csrf, expiresInSeconds: SESSION_TTL_SECONDS }, 200, {
    'set-cookie': OWNER_COOKIE + '=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=' + SESSION_TTL_SECONDS,
  });
}

export async function authorize(request, { db, secret, now }) {
  const cookies = (request.headers.get('cookie') ?? '').split(';').map((value) => value.trim())
    .filter((value) => value.startsWith(OWNER_COOKIE + '='));
  if (cookies.length !== 1) return null;
  const token = cookies[0].slice(OWNER_COOKIE.length + 1);
  if (!HEX64.test(token)) return null;
  const digest = await keyedDigest(secret, token);
  const row = await db.prepare(
    'SELECT s.owner_id,s.expires_at,s.credential_id FROM cms_sessions s JOIN cms_credentials c ON c.credential_id=s.credential_id '
    + 'WHERE s.session_digest=? AND s.owner_id=1 AND s.revoked_at IS NULL AND s.expires_at>? AND c.revoked_at IS NULL',
  ).bind(digest, now).first();
  return row?.owner_id === 1 ? Object.freeze({ ownerId: 1, expiresAt: row.expires_at, credentialId: row.credential_id }) : null;
}

export async function logout(request, { db, secret, now }) {
  const cookies = (request.headers.get('cookie') ?? '').split(';').map((value) => value.trim())
    .filter((value) => value.startsWith(OWNER_COOKIE + '='));
  if (cookies.length === 1) {
    const token = cookies[0].slice(OWNER_COOKIE.length + 1);
    if (HEX64.test(token)) {
      const digest = await keyedDigest(secret, token);
      await db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE session_digest=? AND revoked_at IS NULL').bind(now, digest).run();
    }
  }
  return new Response(null, {
    status: 303,
    headers: {
      ...SECURITY_HEADERS,
      location: '/admin/login',
      'set-cookie': OWNER_COOKIE + '=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0',
    },
  });
}
