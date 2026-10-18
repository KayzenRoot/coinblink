// Local-only test CMS vertical slice. NOT imported by Astro, Workers or public routes.
// No cloud account, deployment binding, real Owner credentials or publishing.
import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { renderLocalCmsUi } from './local-cms-ui.mjs';

export const CMS_TEST_ORIGIN = 'https://owner.example.test';
export const CMS_TEST_RP_ID = 'owner.example.test';
const COOKIE_NAME = '__Host-cb_m05_local';
const BOOTSTRAP_TICKET_TTL_SECONDS = 900;
const BOOTSTRAP_CHALLENGE_TTL_SECONDS = 90;
const BOOTSTRAP_MAX_ACTIVE_CHALLENGES = 128;
const ENROLL_CHALLENGE_TTL_SECONDS = 90;
const ENROLL_MAX_ACTIVE_CHALLENGES = 3;
const RECOVERY_AUTH_TTL_SECONDS = 300;
const EMERGENCY_AUTH_TTL_SECONDS = 900;
const utf8 = new TextEncoder();
const DEFAULT_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
});

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...DEFAULT_HEADERS, ...extra } });
}
function denied(status = 403) { return json({ error: 'Access denied' }, status); }
class InvalidPayloadError extends Error {}
function hex(bytes) { return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join(''); }
function randomToken() { const b = new Uint8Array(32); crypto.getRandomValues(b); return hex(b); }
async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', utf8.encode(value))));
}
async function keyedDigest(secretHex, value) {
  const bytes = Uint8Array.from(secretHex.match(/.{2}/g), x => Number.parseInt(x, 16));
  const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8.encode(value))));
}
function fixedEquals(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (left.length !== 64 || right.length !== 64) return false;
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= left.codePointAt(i) ^ right.codePointAt(i);
  return difference === 0;
}
// WebAuthn clientDataJSON.challenge is base64url(opaque challenge bytes), not
// the hexadecimal transport value displayed in the local fixture request.
export function webauthnChallengeFromHex(challengeHex) {
  if (typeof challengeHex !== 'string' || !/^[0-9a-f]{64}$/.test(challengeHex)) {
    throw new TypeError('A valid 256-bit local challenge is required');
  }
  const parts = challengeHex.match(/.{2}/g);
  const binary = String.fromCodePoint(...parts.map(x => Number.parseInt(x, 16)));
  return btoa(binary).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_');
}
function ownerOrigin(request) {
  return new URL(request.url).origin === CMS_TEST_ORIGIN &&
    request.headers.get('origin') === CMS_TEST_ORIGIN &&
    request.headers.get('sec-fetch-site') === 'same-origin';
}
// Reads require same-site fetch metadata; the Origin header is validated only when the browser
// sends one, because same-origin GET fetches do not carry it.
function ownerReadOrigin(request) {
  if (new URL(request.url).origin !== CMS_TEST_ORIGIN) return false;
  if (request.headers.get('sec-fetch-site') !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  return origin === null || origin === CMS_TEST_ORIGIN;
}
function isJson(request) { return /^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''); }
async function payload(request, max = 65_536) {
  const length = Number(request.headers.get('content-length') || 0);
  if (!isJson(request) || !Number.isFinite(length) || length < 0 || length > max) throw new InvalidPayloadError('Invalid JSON content');
  // A forged or omitted Content-Length must never cause an unbounded body read.
  // Read/validate bytes incrementally before decoding a bounded JSON payload.
  const reader = request.body?.getReader();
  if (!reader) throw new InvalidPayloadError('Malformed JSON content');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let raw = '', received = 0;
  try {
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      if (!(chunk instanceof Uint8Array)) throw new InvalidPayloadError('Invalid JSON body stream');
      received += chunk.byteLength;
      if (received > max) throw new InvalidPayloadError('Oversized request');
      raw += decoder.decode(chunk, { stream: true });
    }
    raw += decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof InvalidPayloadError) throw error;
    throw new InvalidPayloadError('Malformed JSON content');
  } finally {
    reader.releaseLock();
  }
  let value;
  try { value = JSON.parse(raw); } catch { throw new InvalidPayloadError('Malformed JSON content'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InvalidPayloadError('Object required');
  return value;
}
function nowEpoch(now) { return Math.floor(now() / 1000); }
function validId(id) { return typeof id === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id); }
function validIdempotency(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value); }
function draftFields(value) {
  if (typeof value.title !== 'string' || value.title.trim().length < 8 || value.title.length > 140 ||
      typeof value.summary !== 'string' || value.summary.trim().length < 20 || value.summary.length > 400 ||
      typeof value.body !== 'string' || value.body.trim().length < 1 || value.body.length > 40_000 ||
      typeof value.sourceUrl !== 'string' || value.sourceUrl.length > 500 ||
      typeof value.authorLabel !== 'string' || value.authorLabel.length > 80) {
    throw new InvalidPayloadError('Draft fields invalid or out of bounds');
  }
  let url;
  try { url = new URL(value.sourceUrl); } catch { throw new InvalidPayloadError('Invalid source URL'); }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new InvalidPayloadError('HTTPS source required');
  return [value.title.trim(), value.summary.trim(), value.body, url.href, value.authorLabel.trim()];
}
async function session(request, db, secret, now) {
  const found = (request.headers.get('cookie') || '').split(';')
    .map(x => x.trim()).filter(x => x.startsWith(COOKIE_NAME + '='));
  if (found.length !== 1) return null;
  const raw = found[0].slice(COOKIE_NAME.length + 1);
  if (!/^[0-9a-f]{64}$/.test(raw)) return null;
  const sessionDigest = await keyedDigest(secret, raw);
  const record = await db.prepare(
    'SELECT s.session_digest,s.csrf_digest,s.credential_id,c.device_kind FROM cms_sessions s JOIN cms_credentials c ON s.credential_id=c.credential_id WHERE s.session_digest=? AND s.owner_id=1 AND s.revoked_at IS NULL AND s.expires_at>? AND c.revoked_at IS NULL'
  ).bind(sessionDigest, now).first();
  if (!record) return null;
  return { ...record, digest: sessionDigest };
}
async function authorizeMutation(request, db, secret, now) {
  if (!ownerOrigin(request) || !isJson(request)) return null;
  const current = await session(request, db, secret, now);
  if (!current) return null;
  const csrf = request.headers.get('x-cb-csrf') || '';
  if (!/^[0-9a-f]{64}$/.test(csrf)) return null;
  if (!fixedEquals(await keyedDigest(secret, csrf), current.csrf_digest)) return null;
  return current;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
const WORKSPACE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Type': 'text/html; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
};
function workspaceShell(title, body, nonce) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<meta name=\"robots\" content=\"noindex,nofollow,noarchive\"><title>" + escapeHtml(title) + '</title>' +
    '<style nonce="' + nonce + '">body{margin:0;background:#0d1815;color:#eaf3e8;font-family:system-ui,sans-serif;line-height:1.5}' +
    'main{max-width:980px;margin:auto;padding:24px 18px}h1{font-size:1.6rem}h2{font-size:1.15rem}' +
    'p,li{color:#cfe0d0}ul{padding-left:20px}footer{padding:20px 0;color:#9fb3a3}</style></head><body><main>' +
    body + '<footer>LOCAL TEST ONLY · synthetic Owner data · no publication capability.</footer></main></body></html>';
}
// Privileged server-rendered page: it exists to prove that a real HTML GET is denied without an
// authenticated Owner session and serves only synthetic data with a valid one.
// HTML pages are reached by navigation: same-origin links and direct navigation are allowed,
// cross-site is not, and a present Origin must be the synthetic one.
function ownerNavigation(request) {
  if (new URL(request.url).origin !== CMS_TEST_ORIGIN) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite !== 'same-origin' && fetchSite !== 'none') return false;
  const origin = request.headers.get('origin');
  return origin === null || origin === CMS_TEST_ORIGIN;
}

async function workspacePage(request, db, secret, currentTime) {
  const nonce = randomToken();
  const headers = {
    ...WORKSPACE_HEADERS,
    'Content-Security-Policy': "default-src 'none'; style-src 'nonce-" + nonce + "'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  };
  if (!ownerNavigation(request)) {
    return new Response(workspaceShell('Request rejected',
      '<h1>Request rejected</h1><p>This page only answers same-site requests on the synthetic origin.</p>', nonce),
    { status: 403, headers });
  }
  const who = await session(request, db, secret, currentTime);
  if (!who) {
    return new Response(workspaceShell('Sign in required',
      '<h1>Sign in required</h1><p>This local workspace page requires an authenticated local Owner session.</p>', nonce),
    { status: 401, headers });
  }
  const devices = (await db.prepare(
    'SELECT credential_id,device_kind,revoked_at FROM cms_credentials WHERE owner_id=1 ORDER BY device_kind,credential_id'
  ).all()).results;
  const drafts = (await db.prepare(
    'SELECT title,revision,status FROM cms_drafts WHERE owner_id=1 ORDER BY updated_at DESC LIMIT 20'
  ).all()).results;
  const auditCount = (await db.prepare('SELECT COUNT(*) AS n FROM cms_audit_events').first()).n;
  const deviceItems = devices.map(device =>
    '<li>' + escapeHtml(device.device_kind) + ' · ' + escapeHtml(device.credential_id.slice(0, 10)) + '… · ' +
    (device.revoked_at ? 'revoked' : 'active') + '</li>').join('');
  const draftItems = drafts.map(draft =>
    '<li>' + escapeHtml(draft.title) + ' · rev ' + escapeHtml(draft.revision) + ' · ' +
    escapeHtml(draft.status) + '</li>').join('');
  return new Response(workspaceShell('CoinBlink · Local Owner Workspace',
    '<h1>CoinBlink · Local Owner Workspace</h1>' +
    '<p>Authenticated synthetic Owner session. This page is rendered on the server.</p>' +
    '<h2>Devices</h2><ul id="workspace-devices">' + deviceItems + '</ul>' +
    '<h2>Drafts</h2><ul id="workspace-drafts">' + draftItems + '</ul>' +
    '<p>Audit events: ' + escapeHtml(auditCount) + '</p>', nonce),
  { status: 200, headers });
}

function localUiResponse() {
  const nonce = randomToken();
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "connect-src 'self'",
    "script-src 'nonce-" + nonce + "'",
    "style-src 'nonce-" + nonce + "'",
  ].join('; ');
  return new Response(renderLocalCmsUi(nonce), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

async function issueChallenge(request, db, currentTime) {
  if (!ownerOrigin(request)) return denied();
  const input = await payload(request, 4_096);
  if (typeof input.credentialId !== 'string' || input.credentialId.length > 256) return denied();
  const credential = await db.prepare(
    'SELECT credential_id FROM cms_credentials WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL'
  ).bind(input.credentialId).first();
  if (!credential) return denied();
  // Expired, unused challenges are removed before the per-credential quota check.
  await db.prepare('DELETE FROM cms_challenges WHERE consumed_at IS NULL AND expires_at<=?')
    .bind(currentTime).run();
  const challenge = randomToken();
  const inserted = await db.prepare(
    `INSERT INTO cms_challenges (challenge_digest,credential_id,origin,rp_id,purpose,expires_at)
     SELECT ?,?,?,?,'login',? WHERE
     (SELECT COUNT(*) FROM cms_challenges
       WHERE credential_id=? AND purpose='login' AND consumed_at IS NULL AND expires_at>?) < 3`
  ).bind(await digest(challenge), credential.credential_id, CMS_TEST_ORIGIN,
    CMS_TEST_RP_ID, currentTime + 90, credential.credential_id, currentTime).run();
  if (inserted.meta?.changes !== 1) return json({ error: 'Too many active challenges' }, 429);
  return json({ challenge, credentialId: credential.credential_id, rpId: CMS_TEST_RP_ID, userVerification: 'required' });
}

function validLoginInput(input) {
  return typeof input.challenge === 'string' && /^[0-9a-f]{64}$/.test(input.challenge) &&
    typeof input.credentialId === 'string' && input.credentialId.length <= 256 &&
    input.response?.id === input.credentialId && input.response?.rawId === input.credentialId;
}

async function findLoginCredential(db, input, currentTime) {
  const challengeDigest = await digest(input.challenge);
  const record = await db.prepare(
    `SELECT c.credential_id,c.public_key,c.sign_count FROM cms_credentials c
       JOIN cms_challenges h ON h.credential_id=c.credential_id
       WHERE h.challenge_digest=? AND c.credential_id=? AND c.owner_id=1 AND c.revoked_at IS NULL
         AND h.consumed_at IS NULL AND h.expires_at>? AND h.origin=? AND h.rp_id=? AND h.purpose='login'`
  ).bind(challengeDigest, input.credentialId, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID).first();
  return { challengeDigest, record };
}

async function verifyLoginAssertion(input, record) {
  try {
    return await verifyAuthenticationResponse({
      response: input.response,
      expectedChallenge: webauthnChallengeFromHex(input.challenge),
      expectedOrigin: CMS_TEST_ORIGIN,
      expectedRPID: CMS_TEST_RP_ID,
      requireUserVerification: true,
      credential: {
        id: record.credential_id,
        publicKey: new Uint8Array(record.public_key),
        counter: record.sign_count,
      },
    });
  } catch { return null; }
}

function validCounterAdvance(oldCount, nextCount) {
  return Number.isSafeInteger(oldCount) && Number.isSafeInteger(nextCount) &&
    oldCount >= 0 && nextCount >= 0 && nextCount <= 4294967295 &&
    (oldCount === 0 || nextCount > oldCount);
}

async function commitLogin(db, { challengeDigest, credentialId, oldCount, nextCount, currentTime, tokenDigest, csrfDigest }) {
  const marker = crypto.randomUUID();
  // These ordered statements atomically consume the challenge, advance the
  // authenticator counter, then create its session under the same marker.
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_challenges SET consumed_at=?,consume_marker=?
         WHERE challenge_digest=? AND credential_id=? AND consumed_at IS NULL
           AND expires_at>? AND origin=? AND rp_id=? AND purpose='login'
           AND EXISTS (
             SELECT 1 FROM cms_credentials c WHERE c.credential_id=?
               AND c.owner_id=1 AND c.revoked_at IS NULL AND c.sign_count=?
           )`
    ).bind(currentTime, marker, challengeDigest, credentialId, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID, credentialId, oldCount),
    db.prepare(
      `UPDATE cms_credentials SET sign_count=?,last_auth_marker=?
         WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL
           AND sign_count=? AND EXISTS (
             SELECT 1 FROM cms_challenges h WHERE h.challenge_digest=?
               AND h.credential_id=? AND h.consume_marker=? AND h.consumed_at=?
           )`
    ).bind(nextCount, marker, credentialId, oldCount, challengeDigest, credentialId, marker, currentTime),
    db.prepare(
      `INSERT INTO cms_sessions(session_digest,csrf_digest,owner_id,issued_at,expires_at,challenge_digest,credential_id)
        SELECT ?,?,1,?,?,h.challenge_digest,h.credential_id
        FROM cms_challenges h JOIN cms_credentials c ON c.credential_id=h.credential_id
        WHERE h.challenge_digest=? AND h.credential_id=? AND h.consume_marker=?
          AND h.consumed_at=? AND c.last_auth_marker=? AND c.sign_count=?
          AND c.revoked_at IS NULL`
    ).bind(tokenDigest, csrfDigest, currentTime, currentTime + 1200,
      challengeDigest, credentialId, marker, currentTime, marker, nextCount),
  ]);
  return results.length === 3 && results.every(result => result?.meta?.changes === 1);
}

async function login(request, db, secret, currentTime) {
  if (!ownerOrigin(request)) return denied();
  const input = await payload(request);
  if (!validLoginInput(input)) return denied();
  const { challengeDigest, record } = await findLoginCredential(db, input, currentTime);
  if (!record?.public_key || JSON.stringify(input.response).length > 60_000) return denied();
  const verified = await verifyLoginAssertion(input, record);
  if (!verified?.verified) return denied();
  const oldCount = Number(record.sign_count);
  const nextCount = verified.authenticationInfo?.newCounter;
  if (!validCounterAdvance(oldCount, nextCount)) return denied();
  const token = randomToken(), csrf = randomToken();
  const [tokenDigest, csrfDigest] = await Promise.all([
    keyedDigest(secret, token), keyedDigest(secret, csrf),
  ]);
  const committed = await commitLogin(db, {
    challengeDigest, credentialId: input.credentialId, oldCount, nextCount,
    currentTime, tokenDigest, csrfDigest,
  });
  if (!committed) return denied(409);
  return json({ authenticated: true, csrf, expiresInSeconds: 1200 }, 200, {
    'Set-Cookie': COOKIE_NAME + '=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=1200',
  });
}

async function logout(request, db, secret, currentTime) {
  const who = await authorizeMutation(request, db, secret, currentTime);
  if (!who) return denied();
  await db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE session_digest=? AND revoked_at IS NULL')
    .bind(currentTime, who.digest).run();
  return json({ loggedOut: true }, 200, {
    'Set-Cookie': COOKIE_NAME + '=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0',
  });
}

async function listDrafts(request, db, secret, currentTime) {
  if (!ownerReadOrigin(request)) return denied();
  const who = await session(request, db, secret, currentTime);
  if (!who) return denied(401);
  const rows = await db.prepare(
    'SELECT id,title,summary,source_url,author_label,status,revision,updated_at FROM cms_drafts WHERE owner_id=1 ORDER BY updated_at DESC LIMIT 100'
  ).all();
  return json({ drafts: rows.results });
}

async function createDraft(request, db, secret, currentTime) {
  const who = await authorizeMutation(request, db, secret, currentTime);
  if (!who) return denied();
  const input = await payload(request);
  if (!validIdempotency(input.idempotencyKey)) return denied(400);
  const [title, summary, body, sourceUrl, authorLabel] = draftFields(input);
  const id = crypto.randomUUID(), marker = crypto.randomUUID();
  const createKey = await keyedDigest(secret, 'create:' + input.idempotencyKey);
  const results = await db.batch([
    db.prepare(
      `INSERT INTO cms_drafts (id,owner_id,title,summary,body,source_url,author_label,status,revision,create_key_digest,write_marker,created_at,updated_at)
         VALUES (?,1,?,?,?,?,?,'draft',1,?,?,?,?)`
    ).bind(id,title,summary,body,sourceUrl,authorLabel,createKey,marker,currentTime,currentTime),
    db.prepare(
      `INSERT INTO cms_draft_revisions (draft_id,revision,actor_owner_id,title,summary,body,source_url,author_label,write_marker,created_at)
         SELECT id,revision,1,title,summary,body,source_url,author_label,write_marker,updated_at
         FROM cms_drafts WHERE id=? AND write_marker=?`
    ).bind(id,marker),
  ]);
  if (results[0]?.meta?.changes !== 1 || results[1]?.meta?.changes !== 1) return denied(409);
  return json({ id, revision: 1, status: 'draft' }, 201);
}

async function readDraft(request, db, secret, currentTime, id, revisionsOnly) {
  if (!ownerReadOrigin(request)) return denied();
  const who = await session(request, db, secret, currentTime);
  if (!who) return denied(401);
  if (revisionsOnly) {
    const revisions = await db.prepare(
      'SELECT revision,title,summary,body,source_url,author_label,created_at FROM cms_draft_revisions WHERE draft_id=? AND actor_owner_id=1 ORDER BY revision DESC LIMIT 100'
    ).bind(id).all();
    return json({ revisions: revisions.results });
  }
  const article = await db.prepare(
    'SELECT id,title,summary,body,source_url,author_label,status,revision FROM cms_drafts WHERE id=? AND owner_id=1'
  ).bind(id).first();
  return article ? json({ draft: article }) : denied(404);
}

async function updateDraft(request, db, secret, currentTime, id) {
  const who = await authorizeMutation(request, db, secret, currentTime);
  if (!who) return denied();
  const input = await payload(request);
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1 ||
      !validIdempotency(input.idempotencyKey)) return denied(400);
  const [title, summary, body, sourceUrl, authorLabel] = draftFields(input);
  const marker = await keyedDigest(secret, 'revision:' + input.idempotencyKey);
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_drafts SET title=?,summary=?,body=?,source_url=?,author_label=?,
         revision=revision+1,write_marker=?,updated_at=?
         WHERE id=? AND owner_id=1 AND revision=? AND status='draft'`
    ).bind(title,summary,body,sourceUrl,authorLabel,marker,currentTime,id,input.expectedRevision),
    db.prepare(
      `INSERT INTO cms_draft_revisions (draft_id,revision,actor_owner_id,title,summary,body,source_url,author_label,write_marker,created_at)
         SELECT id,revision,1,title,summary,body,source_url,author_label,write_marker,updated_at
         FROM cms_drafts WHERE id=? AND write_marker=?`
    ).bind(id,marker),
  ]);
  if (results[0]?.meta?.changes !== 1 || results[1]?.meta?.changes !== 1) return denied(409);
  return json({ id, revision: input.expectedRevision + 1, status: 'draft' });
}

// The first Owner exists only after an out-of-band, one-use ticket is consumed in the
// same atomic batch that inserts cms_owner=1 and the primary credential.
const validHex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

export async function issueBootstrapTicket(db, secret, currentTime) {
  const ticket = randomToken();
  await db.prepare('INSERT INTO cms_bootstrap_tickets(ticket_digest,expires_at) VALUES (?,?)')
    .bind(await keyedDigest(secret, ticket), currentTime + BOOTSTRAP_TICKET_TTL_SECONDS).run();
  return ticket;
}

async function bootstrapChallenge(request, db, secret, currentTime) {
  if (!ownerOrigin(request)) return denied();
  const input = await payload(request, 4_096);
  if (!validHex64(input.ticket)) return denied();
  const ticketDigest = await keyedDigest(secret, input.ticket);
  await db.prepare('DELETE FROM cms_bootstrap_challenges WHERE consumed_at IS NULL AND expires_at<=?')
    .bind(currentTime).run();
  const challenge = randomToken();
  const inserted = await db.prepare(
    `INSERT INTO cms_bootstrap_challenges (challenge_digest,ticket_digest,origin,rp_id,expires_at)
     SELECT ?,t.ticket_digest,?,?,? FROM cms_bootstrap_tickets t
     WHERE t.ticket_digest=? AND t.consumed_at IS NULL AND t.expires_at>?
       AND NOT EXISTS (SELECT 1 FROM cms_owner)
       AND (SELECT COUNT(*) FROM cms_bootstrap_challenges b
             WHERE b.ticket_digest=t.ticket_digest AND b.consumed_at IS NULL AND b.expires_at>?) < ?`
  ).bind(await digest(challenge), CMS_TEST_ORIGIN, CMS_TEST_RP_ID,
    currentTime + BOOTSTRAP_CHALLENGE_TTL_SECONDS, ticketDigest, currentTime, currentTime,
    BOOTSTRAP_MAX_ACTIVE_CHALLENGES).run();
  if (inserted.meta?.changes !== 1) return denied();
  return json({ challenge, rpId: CMS_TEST_RP_ID, userVerification: 'required' });
}

async function verifyBootstrapRegistration(response, challenge) {
  try {
    const outcome = await verifyRegistrationResponse({
      response,
      expectedChallenge: webauthnChallengeFromHex(challenge),
      expectedOrigin: CMS_TEST_ORIGIN,
      expectedRPID: CMS_TEST_RP_ID,
      requireUserPresence: true,
      requireUserVerification: true,
    });
    const credential = outcome.registrationInfo?.credential;
    if (!outcome.verified || !credential || credential.id !== response.id || response.rawId !== response.id) return null;
    return { credentialId: credential.id, publicKey: credential.publicKey, counter: credential.counter };
  } catch { return null; }
}

async function bootstrapClaim(request, db, secret, currentTime) {
  if (!ownerOrigin(request)) return denied();
  const input = await payload(request);
  if (!validHex64(input.ticket) || !validHex64(input.challenge) ||
      !input.response || typeof input.response !== 'object') return denied();
  const ticketDigest = await keyedDigest(secret, input.ticket);
  const challengeDigest = await digest(input.challenge);
  const pending = await db.prepare(
    `SELECT b.challenge_digest FROM cms_bootstrap_challenges b
       JOIN cms_bootstrap_tickets t ON t.ticket_digest=b.ticket_digest
       WHERE b.challenge_digest=? AND t.ticket_digest=? AND b.origin=? AND b.rp_id=?
         AND b.consumed_at IS NULL AND b.expires_at>? AND t.consumed_at IS NULL AND t.expires_at>?
         AND NOT EXISTS (SELECT 1 FROM cms_owner)`
  ).bind(challengeDigest, ticketDigest, CMS_TEST_ORIGIN, CMS_TEST_RP_ID, currentTime, currentTime).first();
  if (!pending) return denied();
  const registration = await verifyBootstrapRegistration(input.response, input.challenge);
  if (!registration) return denied();
  const marker = crypto.randomUUID();
  // A losing contender changes no rows: every write is conditioned on the marker
  // that only the single ticket consumer holds. A distinct-ticket race is stopped
  // by the cms_owner primary key, which rolls back the whole batch.
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_bootstrap_tickets SET consumed_at=?,consume_marker=?
         WHERE ticket_digest=? AND consumed_at IS NULL AND expires_at>? AND NOT EXISTS (SELECT 1 FROM cms_owner)`
    ).bind(currentTime, marker, ticketDigest, currentTime),
    db.prepare(
      `UPDATE cms_bootstrap_challenges SET consumed_at=?
         WHERE challenge_digest=? AND consumed_at IS NULL AND expires_at>? AND EXISTS (
           SELECT 1 FROM cms_bootstrap_tickets t
            WHERE t.ticket_digest=cms_bootstrap_challenges.ticket_digest AND t.consume_marker=?)`
    ).bind(currentTime, challengeDigest, currentTime, marker),
    db.prepare(
      `INSERT INTO cms_owner(owner_id,created_at)
         SELECT 1,? WHERE EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE consume_marker=?)`
    ).bind(currentTime, marker),
    db.prepare(
      `INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind)
         SELECT ?,1,?,?,'primary' WHERE EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE consume_marker=?)`
    ).bind(registration.credentialId, registration.publicKey, registration.counter, marker),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
         SELECT ?, 'owner_claimed', 'operator-ticket', ?, 'primary', ? WHERE EXISTS (SELECT 1 FROM cms_bootstrap_tickets WHERE consume_marker=?)`
    ).bind(crypto.randomUUID(), registration.credentialId, currentTime, marker),
  ]);
  if (results.some(result => result?.meta?.changes !== 1)) return denied(409);
  return json({ owner: 1, deviceKind: 'primary', claimed: true }, 201);
}

// --- Part B · post-bootstrap devices: enrollment, recovery authorization, revocation, emergency ---

async function enrollChallenge(request, db, secret, currentTime) {
  const authorized = await authorizeMutation(request, db, secret, currentTime);
  if (!authorized) return denied();
  const input = await payload(request, 4_096);
  if (input.kind !== 'primary' && input.kind !== 'recovery') return denied(400);
  await db.prepare('DELETE FROM cms_enroll_challenges WHERE consumed_at IS NULL AND expires_at<=?')
    .bind(currentTime).run();
  const challenge = randomToken();
  const inserted = await db.prepare(
    `INSERT INTO cms_enroll_challenges
       (challenge_digest,credential_kind,origin,rp_id,expires_at,requires_recovery,session_digest,issuer_credential_id)
     SELECT ?,?,?,?, ?,
       CASE WHEN ?='primary' AND NOT EXISTS (
         SELECT 1 FROM cms_credentials WHERE owner_id=1 AND device_kind='primary' AND revoked_at IS NULL
       ) THEN 1 ELSE 0 END, ?, ?
     WHERE (SELECT COUNT(*) FROM cms_enroll_challenges
       WHERE credential_kind=? AND consumed_at IS NULL AND expires_at>?) < ?`
  ).bind(await digest(challenge), input.kind, CMS_TEST_ORIGIN, CMS_TEST_RP_ID,
    currentTime + ENROLL_CHALLENGE_TTL_SECONDS, input.kind, authorized.digest, authorized.credential_id,
    input.kind, currentTime, ENROLL_MAX_ACTIVE_CHALLENGES).run();
  if (inserted.meta?.changes !== 1) return json({ error: 'Too many active enrollment challenges' }, 429);
  return json({ challenge, kind: input.kind, rpId: CMS_TEST_RP_ID, userVerification: 'required' });
}

// One atomic batch decides enrollment. A primary credential is only replaced without an
// additional recovery authorization when another active primary already exists; otherwise a
// one-use rotate-primary authorization must be consumed in the same transaction.
async function enrollClaim(request, db, secret, currentTime) {
  const authorized = await authorizeMutation(request, db, secret, currentTime);
  if (!authorized) return denied();
  const input = await payload(request);
  if (!validHex64(input.challenge) || !input.response || typeof input.response !== 'object') return denied();
  const challengeDigest = await digest(input.challenge);
  const pending = await db.prepare(
    `SELECT credential_kind,requires_recovery FROM cms_enroll_challenges
      WHERE challenge_digest=? AND consumed_at IS NULL AND expires_at>? AND origin=? AND rp_id=?
        AND session_digest=? AND issuer_credential_id=?`
  ).bind(challengeDigest, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID,
    authorized.digest, authorized.credential_id).first();
  if (!pending) return denied();
  const registration = await verifyBootstrapRegistration(input.response, input.challenge);
  if (!registration) return denied();
  const kind = pending.credential_kind;
  // Deny before any write when a primary must be replaced without an active primary and no
  // recovery authorization exists. Races are still resolved by the conditional batch below.
  if (kind === 'primary') {
    const activePrimary = await db.prepare(
      `SELECT credential_id FROM cms_credentials WHERE owner_id=1 AND device_kind='primary' AND revoked_at IS NULL`
    ).first();
    if (pending.requires_recovery && activePrimary) return denied(409);
    if (pending.requires_recovery) {
      const authorization = await db.prepare(
        `SELECT auth_id FROM cms_recovery_authorizations
          WHERE kind='rotate-primary' AND credential_id=? AND session_digest=?
            AND used_at IS NULL AND expires_at>? LIMIT 1`
      ).bind(authorized.credential_id, authorized.digest, currentTime).first();
      if (!authorization) return denied();
    } else if (!activePrimary) {
      return denied(409);
    }
  }
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_enroll_challenges SET consumed_at=?,consume_marker=?
        WHERE challenge_digest=? AND consumed_at IS NULL AND expires_at>? AND origin=? AND rp_id=?
          AND credential_kind=? AND session_digest=? AND issuer_credential_id=?
          AND (
            credential_kind='recovery'
            OR (credential_kind='primary' AND requires_recovery=0
              AND EXISTS (SELECT 1 FROM cms_credentials c
                WHERE c.owner_id=1 AND c.device_kind='primary' AND c.revoked_at IS NULL))
            OR (credential_kind='primary' AND requires_recovery=1
              AND NOT EXISTS (SELECT 1 FROM cms_credentials c
                WHERE c.owner_id=1 AND c.device_kind='primary' AND c.revoked_at IS NULL)
              AND EXISTS (SELECT 1 FROM cms_recovery_authorizations a
                WHERE a.kind='rotate-primary' AND a.credential_id=? AND a.session_digest=?
                  AND a.used_at IS NULL AND a.expires_at>?))
          )`
    ).bind(currentTime, marker, challengeDigest, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID,
      kind, authorized.digest, authorized.credential_id, authorized.credential_id, authorized.digest, currentTime),
    db.prepare(
      `UPDATE cms_recovery_authorizations SET used_at=?,use_marker=?
        WHERE auth_id=(
          SELECT auth_id FROM cms_recovery_authorizations
           WHERE used_at IS NULL AND expires_at>? AND kind='rotate-primary'
             AND credential_id=? AND session_digest=? ORDER BY issued_at LIMIT 1)
          AND EXISTS (SELECT 1 FROM cms_enroll_challenges e
            WHERE e.consume_marker=? AND e.credential_kind='primary' AND e.requires_recovery=1
              AND e.session_digest=? AND e.issuer_credential_id=?)
          AND NOT EXISTS (SELECT 1 FROM cms_credentials c
                WHERE c.owner_id=1 AND c.device_kind='primary' AND c.revoked_at IS NULL)`
    ).bind(currentTime, marker, currentTime, authorized.credential_id, authorized.digest,
      marker, authorized.digest, authorized.credential_id),
    db.prepare(
      `UPDATE cms_credentials SET revoked_at=?,last_auth_marker=?
        WHERE owner_id=1 AND device_kind=? AND revoked_at IS NULL
          AND EXISTS (SELECT 1 FROM cms_enroll_challenges e
            WHERE e.consume_marker=? AND e.requires_recovery=0)`
    ).bind(currentTime, marker, kind, marker),
    db.prepare(
      `UPDATE cms_sessions SET revoked_at=?
        WHERE revoked_at IS NULL
          AND credential_id IN (SELECT credential_id FROM cms_credentials WHERE last_auth_marker=?)`
    ).bind(currentTime, marker),
    db.prepare(
      `INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind)
        SELECT ?,1,?,?,? WHERE EXISTS (SELECT 1 FROM cms_enroll_challenges e WHERE e.consume_marker=?)
          AND (?='recovery'
            OR (EXISTS (SELECT 1 FROM cms_enroll_challenges e
                  WHERE e.consume_marker=? AND e.requires_recovery=0)
                AND EXISTS (SELECT 1 FROM cms_credentials c WHERE c.last_auth_marker=?))
            OR (EXISTS (SELECT 1 FROM cms_enroll_challenges e
                  WHERE e.consume_marker=? AND e.requires_recovery=1)
                AND EXISTS (SELECT 1 FROM cms_recovery_authorizations a WHERE a.use_marker=?)
                AND NOT EXISTS (SELECT 1 FROM cms_credentials c
                  WHERE c.owner_id=1 AND c.device_kind='primary' AND c.revoked_at IS NULL)))`
    ).bind(registration.credentialId, registration.publicKey, registration.counter, kind, marker,
      kind, marker, marker, marker, marker),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
        SELECT ?, 'device_enrolled', 'owner', ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cms_enroll_challenges e WHERE e.consume_marker=?)
          AND EXISTS (SELECT 1 FROM cms_credentials c WHERE c.credential_id=? AND c.revoked_at IS NULL)`
    ).bind(crypto.randomUUID(), registration.credentialId, kind, currentTime, marker, registration.credentialId),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
        SELECT ?, 'recovery_used', 'owner', ?, ?, ?
        WHERE EXISTS (SELECT 1 FROM cms_recovery_authorizations a WHERE a.use_marker=?)
          AND EXISTS (SELECT 1 FROM cms_credentials c WHERE c.credential_id=? AND c.revoked_at IS NULL)`
    ).bind(crypto.randomUUID(), registration.credentialId, kind, currentTime, marker, registration.credentialId),
  ]);
  if (results[0]?.meta?.changes !== 1 || results[4]?.meta?.changes !== 1) return denied(409);
  return json({
    credentialId: registration.credentialId,
    deviceKind: kind,
    replaced: results[2]?.meta?.changes === 1,
    usedRecoveryAuthorization: results[1]?.meta?.changes === 1,
  }, 201);
}

// A fresh user-verified assertion from the recovery credential in the current session is the
// additional proof required to replace a lost primary device.
async function recoveryChallenge(request, db, secret, currentTime) {
  const authorized = await authorizeMutation(request, db, secret, currentTime);
  if (!authorized) return denied();
  if (authorized.device_kind !== 'recovery') {
    return json({ error: 'Recovery authorization requires the recovery device' }, 403);
  }
  await db.prepare('DELETE FROM cms_challenges WHERE consumed_at IS NULL AND expires_at<=?')
    .bind(currentTime).run();
  const challenge = randomToken();
  const inserted = await db.prepare(
    `INSERT INTO cms_challenges (challenge_digest,credential_id,origin,rp_id,purpose,expires_at)
     SELECT ?,?,?,?,'recovery',? WHERE
       EXISTS (SELECT 1 FROM cms_credentials c WHERE c.credential_id=? AND c.owner_id=1
                 AND c.device_kind='recovery' AND c.revoked_at IS NULL)
       AND (SELECT COUNT(*) FROM cms_challenges
              WHERE credential_id=? AND purpose='recovery' AND consumed_at IS NULL AND expires_at>?) < 3`
  ).bind(await digest(challenge), authorized.credential_id, CMS_TEST_ORIGIN, CMS_TEST_RP_ID,
    currentTime + 90, authorized.credential_id, authorized.credential_id, currentTime).run();
  if (inserted.meta?.changes !== 1) return json({ error: 'Too many active recovery challenges' }, 429);
  return json({ challenge, credentialId: authorized.credential_id, rpId: CMS_TEST_RP_ID, userVerification: 'required' });
}

async function recoveryComplete(request, db, secret, currentTime) {
  const authorized = await authorizeMutation(request, db, secret, currentTime);
  if (!authorized) return denied();
  if (authorized.device_kind !== 'recovery') {
    return json({ error: 'Recovery authorization requires the recovery device' }, 403);
  }
  const input = await payload(request);
  if (!validLoginInput(input) || input.credentialId !== authorized.credential_id) return denied();
  const challengeDigest = await digest(input.challenge);
  const record = await db.prepare(
    `SELECT c.credential_id,c.public_key,c.sign_count FROM cms_credentials c
       JOIN cms_challenges h ON h.credential_id=c.credential_id
       WHERE h.challenge_digest=? AND c.credential_id=? AND c.owner_id=1 AND c.revoked_at IS NULL
         AND h.consumed_at IS NULL AND h.expires_at>? AND h.origin=? AND h.rp_id=? AND h.purpose='recovery'`
  ).bind(challengeDigest, input.credentialId, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID).first();
  if (!record) return denied();
  const verified = await verifyLoginAssertion(input, record);
  if (!verified?.verified) return denied();
  const oldCount = Number(record.sign_count);
  const nextCount = verified.authenticationInfo?.newCounter;
  if (!validCounterAdvance(oldCount, nextCount)) return denied();
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_challenges SET consumed_at=?,consume_marker=?
        WHERE challenge_digest=? AND credential_id=? AND purpose='recovery' AND consumed_at IS NULL AND expires_at>?`
    ).bind(currentTime, marker, challengeDigest, record.credential_id, currentTime),
    db.prepare(
      `UPDATE cms_credentials SET sign_count=?,last_auth_marker=?
        WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL AND sign_count=?
          AND EXISTS (SELECT 1 FROM cms_challenges h WHERE h.challenge_digest=? AND h.consume_marker=?)`
    ).bind(nextCount, marker, record.credential_id, oldCount, challengeDigest, marker),
    db.prepare(
      `INSERT INTO cms_recovery_authorizations(auth_id,kind,credential_id,session_digest,issued_at,expires_at)
        SELECT ?, 'rotate-primary', ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM cms_challenges h WHERE h.consume_marker=?)`
    ).bind(randomToken().slice(0, 32), record.credential_id, authorized.digest, currentTime,
      currentTime + RECOVERY_AUTH_TTL_SECONDS, marker),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
        SELECT ?, 'recovery_authorized', 'owner', ?, 'recovery', ? WHERE EXISTS (SELECT 1 FROM cms_challenges h WHERE h.consume_marker=?)`
    ).bind(crypto.randomUUID(), record.credential_id, currentTime, marker),
  ]);
  if (results.some(result => result?.meta?.changes !== 1)) return denied(409);
  return json({ authorized: true, kind: 'rotate-primary', expiresInSeconds: RECOVERY_AUTH_TTL_SECONDS });
}

async function listCredentials(request, db, secret, currentTime) {
  const who = await session(request, db, secret, currentTime);
  if (!who) return denied(401);
  if (!ownerReadOrigin(request)) return denied();
  const rows = await db.prepare(
    'SELECT credential_id,device_kind,sign_count,revoked_at FROM cms_credentials WHERE owner_id=1 ORDER BY device_kind,credential_id'
  ).all();
  return json({ credentials: rows.results });
}

async function revokeCredential(request, db, secret, currentTime) {
  const authorized = await authorizeMutation(request, db, secret, currentTime);
  if (!authorized) return denied();
  const input = await payload(request, 4_096);
  if (typeof input.credentialId !== 'string' || input.credentialId.length > 256) return denied(400);
  if (input.credentialId === authorized.credential_id) {
    return json({ error: 'The credential that authorizes this request cannot revoke itself' }, 403);
  }
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_credentials SET revoked_at=?,last_auth_marker=?
        WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL`
    ).bind(currentTime, marker, input.credentialId),
    db.prepare(
      `UPDATE cms_sessions SET revoked_at=?
        WHERE revoked_at IS NULL AND credential_id=?
          AND EXISTS (SELECT 1 FROM cms_credentials c WHERE c.last_auth_marker=?)`
    ).bind(currentTime, input.credentialId, marker),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
        SELECT ?, 'device_revoked', 'owner', ?, (SELECT device_kind FROM cms_credentials WHERE credential_id=?), ?
          WHERE EXISTS (SELECT 1 FROM cms_credentials c WHERE c.last_auth_marker=?)`
    ).bind(crypto.randomUUID(), input.credentialId, input.credentialId, currentTime, marker),
  ]);
  if (results[0]?.meta?.changes !== 1) return denied(409);
  return json({ credentialId: input.credentialId, revoked: true });
}

// Offline operator flow for the total-loss case: one-use, expiring, digest-at-rest token that
// also serves as the WebAuthn challenge. A fresh user-verified registration is still required.
export async function issueEmergencyAuthorization(db, secret, currentTime) {
  const token = randomToken();
  await db.prepare('INSERT INTO cms_emergency_authorizations(token_digest,expires_at) VALUES (?,?)')
    .bind(await keyedDigest(secret, token), currentTime + EMERGENCY_AUTH_TTL_SECONDS).run();
  return token;
}

async function emergencyClaim(request, db, secret, currentTime) {
  if (!ownerOrigin(request)) return denied();
  const input = await payload(request);
  if (!validHex64(input.token) || !input.response || typeof input.response !== 'object') return denied();
  const tokenDigest = await keyedDigest(secret, input.token);
  // Deny invalid, spent and expired tokens before any write; races stay guarded by the batch.
  const usableAuthorization = await db.prepare(
    `SELECT token_digest FROM cms_emergency_authorizations
      WHERE token_digest=? AND used_at IS NULL AND expires_at>?
        AND EXISTS (SELECT 1 FROM cms_owner)`
  ).bind(tokenDigest, currentTime).first();
  if (!usableAuthorization) return denied();
  const registration = await verifyBootstrapRegistration(input.response, input.token);
  if (!registration) return denied();
  const marker = crypto.randomUUID();
  const results = await db.batch([
    db.prepare(
      `UPDATE cms_emergency_authorizations SET used_at=?,use_marker=?
        WHERE token_digest=? AND used_at IS NULL AND expires_at>?
          AND EXISTS (SELECT 1 FROM cms_owner)`
    ).bind(currentTime, marker, tokenDigest, currentTime),
    db.prepare(
      `UPDATE cms_credentials SET revoked_at=?
        WHERE revoked_at IS NULL AND EXISTS (SELECT 1 FROM cms_emergency_authorizations a WHERE a.use_marker=?)`
    ).bind(currentTime, marker),
    db.prepare(
      `UPDATE cms_sessions SET revoked_at=?
        WHERE revoked_at IS NULL AND EXISTS (SELECT 1 FROM cms_emergency_authorizations a WHERE a.use_marker=?)`
    ).bind(currentTime, marker),
    db.prepare(
      `INSERT INTO cms_credentials(credential_id,owner_id,public_key,sign_count,device_kind)
        SELECT ?,1,?,?,'primary' WHERE EXISTS (SELECT 1 FROM cms_emergency_authorizations a WHERE a.use_marker=?)`
    ).bind(registration.credentialId, registration.publicKey, registration.counter, marker),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
        SELECT ?, 'emergency_used', 'operator-emergency-token', ?, 'primary', ?
          WHERE EXISTS (SELECT 1 FROM cms_emergency_authorizations a WHERE a.use_marker=?)`
    ).bind(crypto.randomUUID(), registration.credentialId, currentTime, marker),
    db.prepare(
      `INSERT INTO cms_audit_events(event_id,event,actor,subject,device_kind,created_at)
        SELECT ?, 'device_enrolled', 'owner-emergency', ?, 'primary', ?
          WHERE EXISTS (SELECT 1 FROM cms_emergency_authorizations a WHERE a.use_marker=?)`
    ).bind(crypto.randomUUID(), registration.credentialId, currentTime, marker),
  ]);
  if (results[0]?.meta?.changes !== 1 || results[3]?.meta?.changes !== 1) return denied(409);
  return json({ owner: 1, deviceKind: 'primary', emergency: true }, 201);
}

const LOCAL_FIXED_ROUTES = new Map([
  ['GET /local/ui', () => localUiResponse()],
  ['GET /local/workspace', ({ request, db, secret, currentTime }) => workspacePage(request, db, secret, currentTime)],
  ['POST /local/bootstrap/challenge', ({ request, db, secret, currentTime }) => bootstrapChallenge(request, db, secret, currentTime)],
  ['POST /local/bootstrap/claim', ({ request, db, secret, currentTime }) => bootstrapClaim(request, db, secret, currentTime)],
  ['POST /local/enroll/challenge', ({ request, db, secret, currentTime }) => enrollChallenge(request, db, secret, currentTime)],
  ['POST /local/enroll/claim', ({ request, db, secret, currentTime }) => enrollClaim(request, db, secret, currentTime)],
  ['POST /local/recovery/challenge', ({ request, db, secret, currentTime }) => recoveryChallenge(request, db, secret, currentTime)],
  ['POST /local/recovery/complete', ({ request, db, secret, currentTime }) => recoveryComplete(request, db, secret, currentTime)],
  ['GET /local/credentials', ({ request, db, secret, currentTime }) => listCredentials(request, db, secret, currentTime)],
  ['POST /local/credentials/revoke', ({ request, db, secret, currentTime }) => revokeCredential(request, db, secret, currentTime)],
  ['POST /local/emergency/claim', ({ request, db, secret, currentTime }) => emergencyClaim(request, db, secret, currentTime)],
  ['POST /local/bootstrap/challenge', ({ request, db, secret, currentTime }) => bootstrapChallenge(request, db, secret, currentTime)],
  ['POST /local/bootstrap/claim', ({ request, db, secret, currentTime }) => bootstrapClaim(request, db, secret, currentTime)],
  ['POST /local/challenge', ({ request, db, currentTime }) => issueChallenge(request, db, currentTime)],
  ['POST /local/login', ({ request, db, secret, currentTime }) => login(request, db, secret, currentTime)],
  ['POST /local/logout', ({ request, db, secret, currentTime }) => logout(request, db, secret, currentTime)],
  ['GET /local/articles', ({ request, db, secret, currentTime }) => listDrafts(request, db, secret, currentTime)],
  ['POST /local/articles', ({ request, db, secret, currentTime }) => createDraft(request, db, secret, currentTime)],
]);

async function dispatchArticleRequest(request, db, secret, currentTime, route, method) {
  const match = /^\/local\/articles\/([0-9a-f-]{36})(?:\/(revisions))?$/i.exec(route);
  if (!match || !validId(match[1])) return null;
  if (method === 'GET') {
    return readDraft(request, db, secret, currentTime, match[1], match[2] === 'revisions');
  }
  if (method === 'PATCH' && !match[2]) {
    return updateDraft(request, db, secret, currentTime, match[1]);
  }
  return null;
}

// Every known fixture path advertises its allowed methods; unexpected verbs are refused with 405
// (never 404 for an existing protected path, and never a write).
const LOCAL_ALLOWED_METHODS = (() => {
  const allowed = new Map();
  for (const key of LOCAL_FIXED_ROUTES.keys()) {
    const separator = key.indexOf(' ');
    const method = key.slice(0, separator), route = key.slice(separator + 1);
    if (!allowed.has(route)) allowed.set(route, new Set());
    allowed.get(route).add(method);
  }
  return allowed;
})();
const ARTICLE_ROUTE_PATTERN = /^\/local\/articles\/[0-9a-f-]{36}(?:\/revisions)?$/i;

function methodNotAllowed(request) {
  const route = new URL(request.url).pathname;
  const allowed = LOCAL_ALLOWED_METHODS.get(route);
  if (allowed) return json({ error: 'Method not allowed' }, 405, { Allow: [...allowed].sort((left, right) => left.localeCompare(right)).join(', ') });
  if (ARTICLE_ROUTE_PATTERN.test(route)) {
    return json({ error: 'Method not allowed' }, 405, { Allow: route.endsWith('/revisions') ? 'GET' : 'GET, PATCH' });
  }
  return null;
}

async function dispatchLocalRequest(request, db, secret, currentTime) {
  const route = new URL(request.url).pathname;
  const method = request.method;
  const context = { request, db, secret, currentTime };
  const fixedHandler = LOCAL_FIXED_ROUTES.get(method + ' ' + route);
  if (fixedHandler) return fixedHandler(context);
  const articleResponse = await dispatchArticleRequest(request, db, secret, currentTime, route, method);
  if (articleResponse) return articleResponse;
  return methodNotAllowed(request) ?? denied(404);
}

function handleLocalError(error) {
  // Do not leak SQL, credentials, or internal errors in an HTTP response.
  if (error instanceof InvalidPayloadError) return json({ error: 'Invalid request' }, 400);
  if (/UNIQUE constraint failed/i.test(String(error?.message || ''))) return denied(409);
  return json({ error: 'Local CMS internal failure' }, 500);
}

export function createLocalCmsHandler({ now = Date.now } = {}) {
  return async function handleLocalCmsRequest(request, env) {
    // This hard gate prevents accidental production use even if a module is imported.
    if (env?.CB_M05_LOCAL_TEST_ONLY !== 'true' || !env.CMS_D1_LOCAL ||
        !/^[0-9a-f]{64}$/.test(env.CMS_TEST_HMAC_KEY || '') ||
        new URL(request.url).origin !== CMS_TEST_ORIGIN) return denied(404);
    try {
      return await dispatchLocalRequest(
        request, env.CMS_D1_LOCAL, env.CMS_TEST_HMAC_KEY, nowEpoch(now),
      );
    } catch (error) {
      return handleLocalError(error);
    }
  };
}
