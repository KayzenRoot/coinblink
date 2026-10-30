// CB-M07-P1-TOKEN-CUSTODY-001: encrypted social token custody.
//
// Tokens are encrypted with AES-GCM using a key derived from the owner session
// secret. Only ciphertext, IVs, the public handle and the granted scopes are
// stored. Publishing is not implemented here.
import { escapeHtml, page } from '../CB-M05/p1-production/owner-auth.mjs';

const SECRET = /^[0-9a-f]{64}$/iu;
const PROVIDERS = new Set(['x']);
const STATE_TTL_SECONDS = 600;
const STATE = /^[A-Za-z0-9_-]{16,128}$/u;
const IV_BYTES = 12;

function hexToBytes(value) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function toBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function fromBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/u.test(value)) throw new TypeError('invalid base64url');
  const padded = value.replace(/-/gu, '+').replace(/_/gu, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function vaultKey(secret) {
  if (typeof secret !== 'string' || !SECRET.test(secret)) {
    throw new TypeError('vault secret must be 64 hex characters');
  }
  const material = await crypto.subtle.importKey('raw', hexToBytes(secret), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({
    name: 'HKDF',
    hash: 'SHA-256',
    salt: new TextEncoder().encode('coinblink-m07-vault'),
    info: new TextEncoder().encode('social-token-v1'),
  }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encryptToken({ secret, plaintext }) {
  if (typeof plaintext !== 'string' || plaintext === '') throw new TypeError('plaintext is required');
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await vaultKey(secret);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return Object.freeze({ ciphertext: toBase64Url(new Uint8Array(ciphertext)), iv: toBase64Url(iv) });
}

export async function decryptToken({ secret, ciphertext, iv }) {
  const key = await vaultKey(secret);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(iv) },
    key,
    fromBase64Url(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export async function stateDigest(state) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(state));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Bind an owner-initiated OAuth start to a one-use state digest. */
export async function createOauthState({ db, state, nowMs, ttl = STATE_TTL_SECONDS }) {
  if (typeof state !== 'string' || !STATE.test(state)) return false;
  const now = Math.floor(nowMs / 1000);
  try {
    const result = await db.prepare(
      'INSERT INTO cms_social_oauth_states(state_digest,owner_id,created_at,expires_at) VALUES (?,1,?,?)',
    ).bind(await stateDigest(state), now, now + ttl).run();
    return result?.meta?.changes === 1;
  } catch {
    return false;
  }
}

/** Atomically consume the state; a replay or expiry returns false. */
export async function consumeOauthState({ db, state, nowMs }) {
  if (typeof state !== 'string' || !STATE.test(state)) return false;
  const now = Math.floor(nowMs / 1000);
  try {
    const result = await db.prepare(
      'UPDATE cms_social_oauth_states SET consumed_at=? WHERE state_digest=? AND consumed_at IS NULL AND expires_at>?',
    ).bind(now, await stateDigest(state), now).run();
    return result?.meta?.changes === 1;
  } catch {
    return false;
  }
}

export async function storeSocialAccount({ db, secret, provider, account, token, nowMs }) {
  if (!PROVIDERS.has(provider)) return { status: 'invalid' };
  if (typeof account?.id !== 'string' || account.id === ''
    || typeof account?.username !== 'string' || account.username === '') return { status: 'invalid' };
  if (typeof token?.accessToken !== 'string' || token.accessToken === '') return { status: 'invalid' };
  let access;
  let refresh = null;
  try {
    access = await encryptToken({ secret, plaintext: token.accessToken });
    if (typeof token.refreshToken === 'string' && token.refreshToken !== '') {
      refresh = await encryptToken({ secret, plaintext: token.refreshToken });
    }
  } catch {
    return { status: 'unavailable' };
  }
  const now = Math.floor(nowMs / 1000);
  const expiresAt = Number.isFinite(token.expiresIn) ? now + Number(token.expiresIn) : null;
  try {
    const result = await db.prepare(
      'INSERT INTO cms_social_accounts(provider,account_id,owner_id,username,display_name,scopes,'
      + 'access_token_ciphertext,access_token_iv,refresh_token_ciphertext,refresh_token_iv,expires_at,created_at,updated_at) '
      + 'VALUES (?,?,1,?,?,?,?,?,?,?,?,?,?) '
      + 'ON CONFLICT(provider,account_id) DO UPDATE SET username=excluded.username,'
      + 'display_name=excluded.display_name,scopes=excluded.scopes,'
      + 'access_token_ciphertext=excluded.access_token_ciphertext,access_token_iv=excluded.access_token_iv,'
      + 'refresh_token_ciphertext=excluded.refresh_token_ciphertext,refresh_token_iv=excluded.refresh_token_iv,'
      + 'expires_at=excluded.expires_at,updated_at=excluded.updated_at',
    ).bind(
      provider, account.id, account.username, account.name ?? '', token.scope ?? '',
      access.ciphertext, access.iv, refresh?.ciphertext ?? null, refresh?.iv ?? null,
      expiresAt, now, now,
    ).run();
    return result?.meta?.changes === 1 ? { status: 'stored' } : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function listSocialAccounts(db) {
  const result = await db.prepare(
    'SELECT provider,account_id AS accountId,username,display_name AS displayName,scopes,'
    + 'expires_at AS expiresAt,updated_at AS updatedAt FROM cms_social_accounts WHERE owner_id=1 ORDER BY provider',
  ).all();
  return result?.results ?? [];
}

export async function revokeSocialAccount({ db, provider, accountId }) {
  if (!PROVIDERS.has(provider) || typeof accountId !== 'string' || accountId === '') return { status: 'invalid' };
  const result = await db.prepare('DELETE FROM cms_social_accounts WHERE provider=? AND account_id=? AND owner_id=1')
    .bind(provider, accountId).run();
  return result?.meta?.changes === 1 ? { status: 'revoked' } : { status: 'missing' };
}

function csrfField(csrf) {
  return '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
}

export function socialPage({ accounts, csrf }) {
  const items = accounts.map((account) => '<li><strong>@' + escapeHtml(account.username) + '</strong>'
    + ' <span class="admin__note">· ' + escapeHtml(account.provider) + ' · '
    + escapeHtml(account.scopes || 'no scopes reported') + '</span>'
    + '<form method="post" action="/admin/social/revoke">' + csrfField(csrf)
    + '<input type="hidden" name="provider" value="' + escapeHtml(account.provider) + '">'
    + '<input type="hidden" name="accountId" value="' + escapeHtml(account.accountId) + '">'
    + '<button type="submit">Disconnect</button></form></li>').join('');
  return page('Social accounts', '<p><a href="/admin">Owner workspace</a> · <a href="/admin/drafts">Drafts</a>'
    + ' · <a href="/admin/research">Research desk</a> · <a href="/admin/security">Security and audit</a></p>'
    + (accounts.length === 0 ? '<p>No social account is connected.</p>'
      : '<ul class="admin__drafts">' + items + '</ul>')
    + '<p><a class="admin__button" href="/api/oauth/x/start">Connect X</a></p>'
    + '<p class="admin__note">Tokens are encrypted with AES-GCM at rest. Publishing is disabled: '
    + 'connecting an account does not post anything until a separate approval flow exists.</p>'
    + '<form method="post" action="/admin/logout">' + csrfField(csrf) + '<button type="submit">Sign out</button></form>');
}
