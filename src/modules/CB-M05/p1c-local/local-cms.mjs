// Local-only test CMS vertical slice. NOT imported by Astro, Workers or public routes.
// No cloud account, deployment binding, real Owner credentials or publishing.
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { renderLocalCmsUi } from './local-cms-ui.mjs';

export const CMS_TEST_ORIGIN = 'https://owner.example.test';
export const CMS_TEST_RP_ID = 'owner.example.test';
const COOKIE_NAME = '__Host-cb_m05_local';
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
function hex(bytes) { return Array.from(bytes, n => n.toString(16).padStart(2, '0')).join(''); }
function randomToken() { const b = new Uint8Array(32); crypto.getRandomValues(b); return hex(b); }
async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', utf8.encode(value))));
}
async function keyedDigest(secretHex, value) {
  const bytes = Uint8Array.from(secretHex.match(/.{2}/g), x => parseInt(x, 16));
  const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8.encode(value))));
}
function fixedEquals(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (left.length !== 64 || right.length !== 64) return false;
  let difference = 0;
  for (let i = 0; i < 64; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
// WebAuthn clientDataJSON.challenge is base64url(opaque challenge bytes), not
// the hexadecimal transport value displayed in the local fixture request.
export function webauthnChallengeFromHex(challengeHex) {
  if (typeof challengeHex !== 'string' || !/^[0-9a-f]{64}$/.test(challengeHex)) {
    throw new TypeError('A valid 256-bit local challenge is required');
  }
  const parts = challengeHex.match(/.{2}/g);
  const binary = String.fromCharCode(...parts.map(x => Number.parseInt(x, 16)));
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
function ownerOrigin(request) {
  return new URL(request.url).origin === CMS_TEST_ORIGIN &&
    request.headers.get('origin') === CMS_TEST_ORIGIN &&
    request.headers.get('sec-fetch-site') === 'same-origin';
}
function isJson(request) { return /^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || ''); }
async function payload(request, max = 65_536) {
  const length = Number(request.headers.get('content-length') || 0);
  if (!isJson(request) || length > max) throw new Error('Invalid JSON content');
  const raw = await request.text();
  if (utf8.encode(raw).byteLength > max) throw new Error('Oversized request');
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Object required');
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
    throw new Error('Draft fields invalid or out of bounds');
  }
  const url = new URL(value.sourceUrl);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error('HTTPS source required');
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
    'SELECT s.session_digest,s.csrf_digest FROM cms_sessions s JOIN cms_credentials c ON s.credential_id=c.credential_id WHERE s.session_digest=? AND s.owner_id=1 AND s.revoked_at IS NULL AND s.expires_at>? AND c.revoked_at IS NULL'
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

export function createLocalCmsHandler({ now = Date.now } = {}) {
  return async function handleLocalCmsRequest(request, env) {
    // This hard gate prevents accidental production use even if a module is imported.
    if (env?.CB_M05_LOCAL_TEST_ONLY !== 'true' ||
        !env.CMS_D1_LOCAL || !/^[0-9a-f]{64}$/.test(env.CMS_TEST_HMAC_KEY || '') ||
        new URL(request.url).origin !== CMS_TEST_ORIGIN) return denied(404);
    const db = env.CMS_D1_LOCAL, secret = env.CMS_TEST_HMAC_KEY;
    const currentTime = nowEpoch(now);
    const route = new URL(request.url).pathname;
    const method = request.method;
    if (route === '/local/ui' && method === 'GET') {
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
    try {
      if (route === '/local/challenge' && method === 'POST') {
        if (!ownerOrigin(request)) return denied();
        const input = await payload(request, 4_096);
        if (typeof input.credentialId !== 'string' || input.credentialId.length > 256) return denied();
        const credential = await db.prepare(
          'SELECT credential_id FROM cms_credentials WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL'
        ).bind(input.credentialId).first();
        if (!credential) return denied();
        // Bound outstanding challenges per credential in one atomic D1 statement.
        // Expired, unused challenges are disposable and removed before applying quota.
        await db.prepare('DELETE FROM cms_challenges WHERE consumed_at IS NULL AND expires_at<=?')
          .bind(currentTime).run();
        const challenge = randomToken();
        const inserted = await db.prepare(
          `INSERT INTO cms_challenges (challenge_digest,credential_id,origin,rp_id,expires_at)
           SELECT ?,?,?,?,? WHERE
           (SELECT COUNT(*) FROM cms_challenges
             WHERE credential_id=? AND consumed_at IS NULL AND expires_at>?) < 3`
        ).bind(await digest(challenge), credential.credential_id, CMS_TEST_ORIGIN,
          CMS_TEST_RP_ID, currentTime + 90, credential.credential_id, currentTime).run();
        if (inserted.meta?.changes !== 1) return json({ error: 'Too many active challenges' }, 429);
        return json({ challenge, credentialId: credential.credential_id, rpId: CMS_TEST_RP_ID, userVerification: 'required' });
      }

      if (route === '/local/login' && method === 'POST') {
        if (!ownerOrigin(request)) return denied();
        const input = await payload(request);
        if (typeof input.challenge !== 'string' || !/^[0-9a-f]{64}$/.test(input.challenge) ||
            typeof input.credentialId !== 'string' || input.credentialId.length > 256 ||
            input.response?.id !== input.credentialId || input.response?.rawId !== input.credentialId) return denied();
        const challengeDigest = await digest(input.challenge);
        const record = await db.prepare(
          `SELECT c.credential_id,c.public_key,c.sign_count FROM cms_credentials c
             JOIN cms_challenges h ON h.credential_id=c.credential_id
             WHERE h.challenge_digest=? AND c.credential_id=? AND c.owner_id=1 AND c.revoked_at IS NULL
               AND h.consumed_at IS NULL AND h.expires_at>? AND h.origin=? AND h.rp_id=?`
        ).bind(challengeDigest, input.credentialId, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID).first();
        if (!record || !record.public_key || JSON.stringify(input.response).length > 60_000) return denied();
        let verified;
        try {
          verified = await verifyAuthenticationResponse({
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
        } catch { return denied(); }
        if (!verified?.verified) return denied();
        // Non-zero authenticator counters must advance monotonically. A zero-only
        // counter is allowed for passkeys that legitimately never increment it.
        const oldCount = Number(record.sign_count);
        const nextCount = verified.authenticationInfo?.newCounter;
        if (!Number.isSafeInteger(oldCount) || !Number.isSafeInteger(nextCount) ||
            oldCount < 0 || nextCount < 0 || nextCount > 4294967295 ||
            (oldCount > 0 && nextCount <= oldCount)) return denied();
        const token = randomToken(), csrf = randomToken(), marker = crypto.randomUUID();
        const tokenDigest = await keyedDigest(secret, token);
        const csrfDigest = await keyedDigest(secret, csrf);
        // A unique transaction marker binds all three steps. A concurrent or
        // counter-replayed assertion cannot mint a session with another request's
        // challenge/credential update. D1.batch rolls back on SQL errors.
        const results = await db.batch([
          db.prepare(
            `UPDATE cms_challenges SET consumed_at=?,consume_marker=?
               WHERE challenge_digest=? AND credential_id=? AND consumed_at IS NULL
                 AND expires_at>? AND origin=? AND rp_id=?
                 AND EXISTS (
                   SELECT 1 FROM cms_credentials c WHERE c.credential_id=?
                     AND c.owner_id=1 AND c.revoked_at IS NULL AND c.sign_count=?
                 )`
          ).bind(currentTime, marker, challengeDigest, input.credentialId, currentTime, CMS_TEST_ORIGIN, CMS_TEST_RP_ID, input.credentialId, oldCount),
          db.prepare(
            `UPDATE cms_credentials SET sign_count=?,last_auth_marker=?
               WHERE credential_id=? AND owner_id=1 AND revoked_at IS NULL
                 AND sign_count=? AND EXISTS (
                   SELECT 1 FROM cms_challenges h WHERE h.challenge_digest=?
                     AND h.credential_id=? AND h.consume_marker=? AND h.consumed_at=?
                 )`
          ).bind(nextCount, marker, input.credentialId, oldCount, challengeDigest, input.credentialId, marker, currentTime),
          db.prepare(
            `INSERT INTO cms_sessions(session_digest,csrf_digest,owner_id,issued_at,expires_at,challenge_digest,credential_id)
              SELECT ?,?,1,?,?,h.challenge_digest,h.credential_id
              FROM cms_challenges h JOIN cms_credentials c ON c.credential_id=h.credential_id
              WHERE h.challenge_digest=? AND h.credential_id=? AND h.consume_marker=?
                AND h.consumed_at=? AND c.last_auth_marker=? AND c.sign_count=?
                AND c.revoked_at IS NULL`
          ).bind(tokenDigest, csrfDigest, currentTime, currentTime + 1200,
            challengeDigest, input.credentialId, marker, currentTime, marker, nextCount),
        ]);
        if (results[0]?.meta?.changes !== 1 || results[1]?.meta?.changes !== 1 ||
            results[2]?.meta?.changes !== 1) return denied(409);
        return json({ authenticated: true, csrf, expiresInSeconds: 1200 }, 200, {
          'Set-Cookie': COOKIE_NAME + '=' + token + '; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=1200',
        });
      }

      if (route === '/local/logout' && method === 'POST') {
        const who = await authorizeMutation(request, db, secret, currentTime);
        if (!who) return denied();
        await db.prepare('UPDATE cms_sessions SET revoked_at=? WHERE session_digest=? AND revoked_at IS NULL')
          .bind(currentTime, who.digest).run();
        return json({ loggedOut: true }, 200, {
          'Set-Cookie': COOKIE_NAME + '=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0',
        });
      }

      if (route === '/local/articles' && method === 'GET') {
        const who = await session(request, db, secret, currentTime);
        if (!who) return denied(401);
        const rows = await db.prepare(
          'SELECT id,title,summary,source_url,author_label,status,revision,updated_at FROM cms_drafts WHERE owner_id=1 ORDER BY updated_at DESC LIMIT 100'
        ).all();
        return json({ drafts: rows.results });
      }

      if (route === '/local/articles' && method === 'POST') {
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

      const match = /^\/local\/articles\/([0-9a-f-]{36})(?:\/(revisions))?$/i.exec(route);
      if (match && validId(match[1]) && method === 'GET') {
        const who = await session(request, db, secret, currentTime);
        if (!who) return denied(401);
        if (match[2] === 'revisions') {
          const revisions = await db.prepare(
            'SELECT revision,title,summary,body,source_url,author_label,created_at FROM cms_draft_revisions WHERE draft_id=? AND actor_owner_id=1 ORDER BY revision DESC LIMIT 100'
          ).bind(match[1]).all();
          return json({ revisions: revisions.results });
        }
        const article = await db.prepare(
          'SELECT id,title,summary,body,source_url,author_label,status,revision FROM cms_drafts WHERE id=? AND owner_id=1'
        ).bind(match[1]).first();
        return article ? json({ draft: article }) : denied(404);
      }

      if (match && !match[2] && method === 'PATCH') {
        const who = await authorizeMutation(request, db, secret, currentTime);
        if (!who) return denied();
        const input = await payload(request);
        if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1 ||
            !validIdempotency(input.idempotencyKey)) return denied(400);
        const [title, summary, body, sourceUrl, authorLabel] = draftFields(input);
        // Stable secret-keyed marker enforces single use across revisions, not only CAS.
        const marker = await keyedDigest(secret, 'revision:' + input.idempotencyKey);
        const results = await db.batch([
          db.prepare(
            `UPDATE cms_drafts SET title=?,summary=?,body=?,source_url=?,author_label=?,
               revision=revision+1,write_marker=?,updated_at=?
               WHERE id=? AND owner_id=1 AND revision=? AND status='draft'`
          ).bind(title,summary,body,sourceUrl,authorLabel,marker,currentTime,match[1],input.expectedRevision),
          db.prepare(
            `INSERT INTO cms_draft_revisions (draft_id,revision,actor_owner_id,title,summary,body,source_url,author_label,write_marker,created_at)
               SELECT id,revision,1,title,summary,body,source_url,author_label,write_marker,updated_at
               FROM cms_drafts WHERE id=? AND write_marker=?`
          ).bind(match[1],marker),
        ]);
        if (results[0]?.meta?.changes !== 1 || results[1]?.meta?.changes !== 1) return denied(409);
        return json({ id: match[1], revision: input.expectedRevision + 1, status: 'draft' });
      }

      return denied(404);
    } catch (error) {
      // Do not leak SQL, credentials, or internal errors in an HTTP response.
      if (/UNIQUE constraint failed/i.test(String(error?.message || ''))) return denied(409);
      return json({ error: 'Local CMS internal failure' }, 500);
    }
  };
}
